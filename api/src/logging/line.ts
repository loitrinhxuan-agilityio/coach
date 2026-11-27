import type { ErrorCode } from '../errors/types.js'

type RequestLogFields = {
  request_id: string
  operation: string
  principal_kind: string
  key_id?: string
  duration_ms: number
  outcome: 'ok' | ErrorCode
}

// The one line every request emits. In a public repository this is where a credential or a
// personal detail is most likely to escape, so the line is built from a fixed list: each of the
// six fields is named here and nothing else is read. Never spread `fields`, never serialise it
// whole, never loop over its keys; a caller that later passes an extra property carrying a Key
// must find that nothing reads it. `key_id` is the Key's internal UUID, not a credential, and is
// how a request is traced. A request that failed before a Key was found has none, so it is null
// rather than absent and the line always has the same six fields.
export function logRequest(fields: RequestLogFields): void {
  const line = {
    request_id: fields.request_id,
    operation: fields.operation,
    principal_kind: fields.principal_kind,
    key_id: fields.key_id ?? null,
    duration_ms: fields.duration_ms,
    outcome: fields.outcome,
  }
  process.stdout.write(`${JSON.stringify(line)}\n`)
}
