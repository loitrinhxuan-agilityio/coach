import { randomUUID } from 'node:crypto'
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import type { Principal } from '../../auth/authenticate.js'
import { authenticate } from '../../auth/authenticate.js'
import { assertMayCall } from '../../auth/capability.js'
import { errorBody, statusFor } from '../../errors/catalogue.js'
import type { ErrorBody, ErrorCode } from '../../errors/types.js'
import { OperationError } from '../../errors/types.js'
import { logRequest } from '../../logging/line.js'
import { getAccount } from '../../operations/get-account.js'
import { registry } from '../../registry/index.js'
import type { OperationEntry } from '../../registry/types.js'
import type { Repository } from '../../repository/types.js'

type Operation = (ctx: { repo: Repository; principal: Principal }) => Promise<unknown>

// The code behind each registry entry, by name. The registry says what an operation is; this says
// what runs. Routing never reads it: a route exists because an entry does.
const implementations: Record<string, Operation> = { get_account: getAccount }

// What a request that matched no route is logged as, and what a request is logged as before a
// Key has been found. Neither is a value an entry or a principal can have.
const NO_OPERATION = 'unknown'
const NO_PRINCIPAL = 'none'

const routeKey = (method: string, path: string): string => `${method} ${path}`

// ADR 0004: the routes are built by walking the registry, not written by hand. Adding an entry
// adds a route with no change here.
export function buildRouteTable(
  entries: readonly OperationEntry[],
): ReadonlyMap<string, OperationEntry> {
  return new Map(entries.map((entry) => [routeKey(entry.method, entry.path), entry]))
}

function respond(statusCode: number, body: unknown): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }
}

// The one place a failure becomes a response, so no other code composes a message. Anything that
// is not an OperationError is a fault in the product, and says nothing about itself to the caller.
function failure(error: unknown): { code: ErrorCode; field?: string } {
  return error instanceof OperationError
    ? { code: error.code, field: error.field }
    : { code: 'internal' }
}

export function createHandler(options: {
  repo: Repository
  entries?: readonly OperationEntry[]
  operations?: Record<string, Operation>
}): (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyStructuredResultV2> {
  const { repo, entries = registry, operations = implementations } = options
  const routes = buildRouteTable(entries)

  return async (event) => {
    const started = performance.now()
    // The gateway's id, or a generated one. Never a client header: the log line passes this field
    // through, so anything the client chose could carry a credential into it.
    const requestId = event.requestContext.requestId || randomUUID()

    let operation = NO_OPERATION
    let principal: Principal | undefined
    let response: APIGatewayProxyStructuredResultV2
    let outcome: 'ok' | ErrorCode = 'ok'

    try {
      // A path or method no entry declares is not_found, before anyone is asked who they are.
      const entry = routes.get(routeKey(event.requestContext.http.method, event.rawPath))
      if (entry === undefined) throw new OperationError('not_found')
      operation = entry.name

      principal = await authenticate(event.headers, repo)
      assertMayCall(entry, principal)

      const run = operations[entry.name]
      if (run === undefined) throw new OperationError('internal')
      response = respond(200, await run({ repo, principal }))
    } catch (error) {
      const { code, field } = failure(error)
      outcome = code
      const body: ErrorBody = errorBody(code, requestId, field)
      response = respond(statusFor(code), body)
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
}

// Until the Aurora DSQL repository is wired in (Task 11, deployed by Task 12) there is nothing real
// to read a Key from. Every call to this one fails, which the boundary reports as `internal`, so
// an entry point built before that wiring exists answers honestly instead of letting anyone in.
const unwired: Repository = {
  findKeyByHash: () => Promise.reject(new Error('no repository is wired')),
  findKeyByName: () => Promise.reject(new Error('no repository is wired')),
  insertKey: () => Promise.reject(new Error('no repository is wired')),
  getSettings: () => Promise.reject(new Error('no repository is wired')),
}

export const handler = createHandler({ repo: unwired })
