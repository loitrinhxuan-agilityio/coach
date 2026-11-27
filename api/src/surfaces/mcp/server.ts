import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import type { Principal } from '../../auth/authenticate.js'
import { authenticate } from '../../auth/authenticate.js'
import { assertMayCall } from '../../auth/capability.js'
import { errorBody, statusFor } from '../../errors/catalogue.js'
import type { ErrorBody, ErrorCode } from '../../errors/types.js'
import { OperationError } from '../../errors/types.js'
import { logRequest } from '../../logging/line.js'
import { runWithRequestId } from '../../logging/request-context.js'
import type { Operation } from '../../operations/index.js'
import { implementations } from '../../operations/index.js'
import { registry } from '../../registry/index.js'
import type { OperationEntry } from '../../registry/types.js'
import type { Repository } from '../../repository/types.js'
import {
  failure,
  implementationFor,
  jsonResponse,
  NO_OPERATION,
  NO_PRINCIPAL,
  requestIdFor,
} from '../shared.js'

// The protocol revision this server speaks, and the tripwire for the day it changes. 2025-11-25 is
// the newest revision Anthropic's clients are documented to follow. The newer specification drops
// the GET stream and protocol sessions; this server already has neither, so it sits inside both:
// POST only, JSON replies only, no session id.
const PROTOCOL_REVISION = '2025-11-25'

const MCP_PATH = '/mcp'

type Message = { id: string | number | undefined; method: string; params: unknown }

const isJsonObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// The body is JSON-RPC 2.0, one message per request: the revision above has no batches. Anything
// else is the caller's fault and is `invalid_request`, never a stack trace.
function parseMessage(event: APIGatewayProxyEventV2): Message {
  const text = event.isBase64Encoded
    ? Buffer.from(event.body ?? '', 'base64').toString('utf8')
    : (event.body ?? '')
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new OperationError('invalid_request')
  }
  if (!isJsonObject(value) || value.jsonrpc !== '2.0' || typeof value.method !== 'string') {
    throw new OperationError('invalid_request')
  }
  const { id, method, params } = value
  if (id !== undefined && typeof id !== 'string' && typeof id !== 'number') {
    throw new OperationError('invalid_request')
  }
  return { id, method, params }
}

// A tool is its entry. The description is the entry's summary and both schemas are the entry's own
// objects, passed through untouched: nothing here may describe an operation (ADR 0004).
function toolFor(entry: OperationEntry) {
  return {
    name: entry.name,
    description: entry.summary,
    inputSchema: entry.input,
    outputSchema: entry.output,
  }
}

const rpc = (id: string | number, result: unknown) => ({ jsonrpc: '2.0' as const, id, result })

// The tool a `tools/call` names, which may be nothing a client could have been told about.
function toolName(message: Message): string | undefined {
  if (message.method !== 'tools/call' || !isJsonObject(message.params)) return undefined
  return typeof message.params.name === 'string' ? message.params.name : undefined
}

export function createMcpHandler(options: {
  repo: Repository
  entries?: readonly OperationEntry[]
  operations?: Record<string, Operation>
}): (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyStructuredResultV2> {
  const { repo, entries = registry, operations = implementations } = options

  // Built by walking the entries, exactly as the HTTP routes are, and refused at startup for the
  // same reason: an entry with nothing behind it must not be listed as a tool.
  const tools = new Map(
    entries.map((entry) => [entry.name, { entry, run: implementationFor(operations, entry) }]),
  )

  const handle = async (
    event: APIGatewayProxyEventV2,
  ): Promise<APIGatewayProxyStructuredResultV2> => {
    const started = performance.now()
    const requestId = requestIdFor(event)
    let operation = NO_OPERATION
    let principal: Principal | undefined
    let outcome: 'ok' | ErrorCode = 'ok'
    let response: APIGatewayProxyStructuredResultV2

    try {
      if (event.rawPath !== MCP_PATH) throw new OperationError('not_found')
      if (event.requestContext.http.method !== 'POST') {
        // No GET stream and no session to delete, so the only method is POST. R8 has no code for
        // a wrong method, so the line carries the nearest: the caller asked for something this
        // endpoint does not do.
        outcome = 'invalid_request'
        response = { statusCode: 405, headers: { allow: 'POST' } }
      } else {
        const message = parseMessage(event)
        // Named before anyone is asked who they are, so a call that carries an id and is refused
        // is logged against the tool it was for, as the HTTP surface logs it against the route.
        // A message with no id is a notification, whatever its method: nobody expects a result
        // and no tool is run, whether it is then refused (401) or acknowledged (202). So it never
        // names a tool in the log line; a refused notification does not record which tool it
        // named, and that is the cost of the line never claiming an operation it did not act on.
        const called = toolName(message)
        if (called !== undefined && message.id !== undefined && tools.has(called)) {
          operation = called
        }

        principal = await authenticate(event.headers, repo)

        if (message.id === undefined) {
          // A notification (the client's "initialized"), now that its sender is known, is
          // acknowledged and never answered. One that is refused above gets the 401 instead.
          response = { statusCode: 202 }
        } else if (message.method === 'initialize') {
          // Always answers this revision, whatever the client asked for. Deliberate: one revision
          // is the decision, so there is no negotiation. The risk is a client SDK that does not
          // know this revision and disconnects on seeing it.
          response = jsonResponse(
            200,
            rpc(message.id, {
              protocolVersion: PROTOCOL_REVISION,
              capabilities: { tools: {} },
              serverInfo: { name: 'ai-lift-coach', version: '0.0.0' },
            }),
          )
        } else if (message.method === 'tools/list') {
          response = jsonResponse(
            200,
            rpc(message.id, { tools: [...tools.values()].map(({ entry }) => toolFor(entry)) }),
          )
        } else if (message.method === 'tools/call') {
          if (called === undefined) throw new OperationError('invalid_request')
          const id = message.id
          try {
            const tool = tools.get(called)
            if (tool === undefined) throw new OperationError('not_found')
            assertMayCall(tool.entry, principal)
            // The call's `arguments` are not read and the operation is given none. That is safe only
            // while no input schema has a property; server.test.ts fails ("no registry entry takes
            // input") when one does, and this call must then change.
            const output = await tool.run({ repo, principal })
            response = jsonResponse(
              200,
              rpc(id, {
                content: [{ type: 'text', text: JSON.stringify(output) }],
                structuredContent: output,
              }),
            )
          } catch (error) {
            const { code, field } = failure(error)
            outcome = code
            const body: ErrorBody = errorBody(code, requestId, field)
            response = jsonResponse(
              200,
              rpc(id, { content: [{ type: 'text', text: JSON.stringify(body) }], isError: true }),
            )
          }
        } else {
          throw new OperationError('invalid_request')
        }
      }
    } catch (error) {
      const { code, field } = failure(error)
      outcome = code
      const body: ErrorBody = errorBody(code, requestId, field)
      response = jsonResponse(statusFor(code), body)
    }

    logRequest({
      request_id: requestId,
      operation,
      principal_kind: principal?.kind ?? NO_PRINCIPAL,
      key_id: principal?.key_id,
      duration_ms: Math.round(performance.now() - started),
      outcome,
    })
    return response
  }

  // Entered once, here, so the database layer can name the request in its own log lines.
  return (event) => runWithRequestId(requestIdFor(event), () => handle(event))
}
