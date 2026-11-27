import { randomUUID } from 'node:crypto'
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import type { Principal } from '../../auth/authenticate.js'
import { authenticate } from '../../auth/authenticate.js'
import { assertMayCall } from '../../auth/capability.js'
import { errorBody, statusFor } from '../../errors/catalogue.js'
import type { ErrorBody, ErrorCode } from '../../errors/types.js'
import { OperationError } from '../../errors/types.js'
import { logRequest } from '../../logging/line.js'
import type { Operation } from '../../operations/index.js'
import { implementations } from '../../operations/index.js'
import { registry } from '../../registry/index.js'
import type { OperationEntry } from '../../registry/types.js'
import type { Repository } from '../../repository/types.js'

// What a request that matched no route is logged as, and what a request is logged as before a
// Key has been found. Neither is a value an entry or a principal can have.
const NO_OPERATION = 'unknown'
const NO_PRINCIPAL = 'none'

const routeKey = (method: string, path: string): string => `${method} ${path}`

// ADR 0004: the routes are built by walking the registry, not written by hand, so this file names
// no path. A route is served only once an implementation of the entry's name exists in
// operations/index.ts: createHandler refuses to be built without one, and operations/index.test.ts
// asserts the registry and the implementations list the same names.
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
  // Every entry is paired with its implementation now, so a missing one stops the process at
  // startup, where it cannot be deployed past, rather than answering 500 to every call.
  const routes = new Map(
    [...buildRouteTable(entries)].map(([key, entry]) => {
      const run = operations[entry.name]
      if (run === undefined) throw new Error(`registry entry ${entry.name} has no implementation`)
      return [key, { entry, run }] as const
    }),
  )

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
      const route = routes.get(routeKey(event.requestContext.http.method, event.rawPath))
      if (route === undefined) throw new OperationError('not_found')
      const { entry, run } = route
      operation = entry.name

      principal = await authenticate(event.headers, repo)
      assertMayCall(entry, principal)

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
