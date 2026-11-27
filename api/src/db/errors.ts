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

// Aurora DSQL reports an optimistic-concurrency conflict as a serialization failure, SQLSTATE 40001,
// with OC000 (a data conflict) or OC001 (the schema changed) in the message. The AWS documentation
// says so (read 2026-11-27), and says the conflict surfaces at commit. This is the only condition
// withTransaction retries on its own account: a constraint violation, a syntax error or a missing
// table would fail identically on every attempt.
export function isConcurrencyFailure(error: unknown): boolean {
  return codeOf(error) === '40001'
}

// The connection, not the statement, failed: the server dropped it, or the socket was reset. The
// first group is what a socket reports, the second is SQLSTATE class 08 (connection exception) and
// 57P01-57P03 (the server shutting down), the third is what pg itself raises, with no code, when a
// connection it holds has already gone (the messages are those in node_modules/pg/lib/client.js).
const SOCKET_CODES = new Set(['ECONNRESET', 'EPIPE', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTCONN'])
const SERVER_SHUTDOWN_CODES = new Set(['57P01', '57P02', '57P03'])
const DRIVER_MESSAGE = /connection terminated|not queryable/i

export function isConnectionFailure(error: unknown): boolean {
  const code = codeOf(error)
  if (code !== null) {
    if (SOCKET_CODES.has(code) || SERVER_SHUTDOWN_CODES.has(code) || code.startsWith('08')) {
      return true
    }
  }
  const message = field(error, 'message')
  return typeof message === 'string' && DRIVER_MESSAGE.test(message)
}
