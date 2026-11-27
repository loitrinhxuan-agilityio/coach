import { randomUUID } from 'node:crypto'
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import type { ErrorCode } from '../errors/types.js'
import { OperationError } from '../errors/types.js'
import { currentRequestId } from '../logging/request-context.js'
import type { Operation } from '../operations/index.js'
import type { OperationEntry } from '../registry/types.js'

// What a request that matched no operation is logged as, and what a request is logged as before a
// Key has been found. Neither is a value an entry or a principal can have. Both surfaces log with
// these, so a line from one can be set beside a line from the other.
export const NO_OPERATION = 'unknown'
export const NO_PRINCIPAL = 'none'

// The gateway's id, or a generated one. Never a client header: the log line passes this field
// through, so anything the client chose could carry a credential into it. Once a surface has entered
// the request (runWithRequestId) this returns that id, so a generated one is generated once and the
// request line and the database layer's retry lines name the same request.
export function requestIdFor(event: APIGatewayProxyEventV2): string {
  return currentRequestId() ?? (event.requestContext.requestId || randomUUID())
}

export function jsonResponse(statusCode: number, body: unknown): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }
}

// The one place a failure becomes a code, so no other code composes a message. Anything that is not
// an OperationError is a fault in the product, and says nothing about itself to the caller.
export function failure(error: unknown): { code: ErrorCode; field?: string } {
  return error instanceof OperationError
    ? { code: error.code, field: error.field }
    : { code: 'internal' }
}

// Every entry is paired with its implementation when a surface is built, so a missing one stops the
// process at startup, where it cannot be deployed past, rather than answering 500 to every call.
export function implementationFor(
  operations: Record<string, Operation>,
  entry: OperationEntry,
): Operation {
  const run = operations[entry.name]
  if (run === undefined) throw new Error(`registry entry ${entry.name} has no implementation`)
  return run
}
