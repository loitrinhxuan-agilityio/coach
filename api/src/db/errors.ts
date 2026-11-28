// What a database error is, read from the two fields the driver sets. Nothing here reads a message
// except for the two the driver raises itself, which have no code.

function field(error: unknown, name: string): unknown {
  return typeof error === 'object' && error !== null
    ? (error as Record<string, unknown>)[name]
    : undefined
}

// The SQLSTATE of a database error, or the operating system's name for a socket error. Both arrive
// in `code`.
export function codeOf(error: unknown): string | null {
  const code = field(error, 'code')
  return typeof code === 'string' ? code : null
}

// The name of the constraint or unique index a violation names.
export function constraintOf(error: unknown): string | null {
  const constraint = field(error, 'constraint')
  return typeof constraint === 'string' ? constraint : null
}

// SQLSTATE 40001. Aurora DSQL reports an optimistic-concurrency conflict as a serialization failure
// with OC000 (a data conflict) or OC001 (the schema changed) in the message. The AWS documentation
// says so (read 2026-11-27), and says the conflict surfaces at commit. This is the only condition
// withTransaction retries on its own account: a constraint violation, a syntax error or a missing
// table would fail identically on every attempt.
export const CONCURRENCY_CODE = '40001'

export function isConcurrencyFailure(error: unknown): boolean {
  return codeOf(error) === CONCURRENCY_CODE
}

// The connection, not the statement, failed. Three signals count, and only these:
//   - a socket error, by the operating system's name for it;
//   - SQLSTATE class 08 (connection exception) and 57P01-57P03 (the server shutting down);
//   - a ConnectionLostError, which is what asTransportFailure makes of the driver's own coded-less
//     errors, below.
// Nothing is decided from a message here, so an error that a function raises for its own reasons,
// whatever words it uses, cannot be mistaken for a lost connection.
const SOCKET_CODES = new Set(['ECONNRESET', 'EPIPE', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTCONN'])
const SERVER_SHUTDOWN_CODES = new Set(['57P01', '57P02', '57P03'])
const CONNECTION_EXCEPTION = /^08[0-9A-Z]{3}$/

export const CONNECTION_LOST = 'connection_lost'

export class ConnectionLostError extends Error {
  readonly code = CONNECTION_LOST
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ConnectionLostError'
  }
}

// What the log may say about a connection failure: a code from the lists above, or null for an
// error that is not one. Never a code taken as it came, so nothing unvetted reaches a log line.
export function connectionCode(error: unknown): string | null {
  if (error instanceof ConnectionLostError) return CONNECTION_LOST
  const code = codeOf(error)
  if (code === null) return null
  if (
    SOCKET_CODES.has(code) ||
    SERVER_SHUTDOWN_CODES.has(code) ||
    CONNECTION_EXCEPTION.test(code)
  ) {
    return code
  }
  return null
}

export const isConnectionFailure = (error: unknown): boolean => connectionCode(error) !== null

// pg raises these itself, with no code, when the connection under a query is gone or the query
// outlived query_timeout (the strings are those in node_modules/pg/lib/client.js). They are matched
// exactly, and only here, on what the driver's own `query` threw, so this cannot see an error raised
// by a function that merely ran a query. An error that has a code is a database's, never converted.
const DRIVER_TRANSPORT_MESSAGES = new Set([
  'Connection terminated unexpectedly',
  'Connection terminated',
  'Client has encountered a connection error and is not queryable',
  'Client was closed and is not queryable',
  'Query read timeout',
])

export function asTransportFailure(error: unknown): unknown {
  if (
    error instanceof Error &&
    codeOf(error) === null &&
    DRIVER_TRANSPORT_MESSAGES.has(error.message)
  ) {
    return new ConnectionLostError(error.message, { cause: error })
  }
  return error
}
