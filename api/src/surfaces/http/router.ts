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

export function createHandler(options: {
  repo: Repository
  entries?: readonly OperationEntry[]
  operations?: Record<string, Operation>
}): (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyStructuredResultV2> {
  const { repo, entries = registry, operations = implementations } = options
  const routes = new Map(
    [...buildRouteTable(entries)].map(
      ([key, entry]) => [key, { entry, run: implementationFor(operations, entry) }] as const,
    ),
  )

  const handle = async (
    event: APIGatewayProxyEventV2,
    requestId: string,
  ): Promise<APIGatewayProxyStructuredResultV2> => {
    const started = performance.now()

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

      response = jsonResponse(200, await run({ repo, principal }))
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

  // The id is read from the event once, here, and handed to both the request line and the database
  // layer's retry lines (through the request context), so the two cannot name different requests and
  // an id already in the context, from some outer request, is never consulted. `async` so that a
  // malformed event rejects, as it always did, and does not throw before a promise exists.
  return async (event) => {
    const requestId = requestIdFor(event)
    return runWithRequestId(requestId, () => handle(event, requestId))
  }
}
