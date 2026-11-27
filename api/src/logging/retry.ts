// The line withTransaction writes when it tries again (R13). It is not the request line: that one
// is fixed at six fields (R16) and is written once per request by the surfaces. This one is written
// by the database layer, which knows nothing about the request, so it carries no request_id.
//
// Like the request line it is built from a fixed list, so that a database error carrying a value
// (a unique violation names the hash it rejected) cannot reach the log through it. `error_code` is
// the SQLSTATE or the operating system's error name and nothing else of the error: never its
// message, never its detail.
type RetryLogFields = {
  reason: 'concurrency' | 'connection'
  attempt: number
  delay_ms: number
  error_code: string | null
}

export function logRetry(fields: RetryLogFields): void {
  const line = {
    event: 'db_retry',
    reason: fields.reason,
    attempt: fields.attempt,
    delay_ms: fields.delay_ms,
    error_code: fields.error_code,
  }
  process.stdout.write(`${JSON.stringify(line)}\n`)
}
