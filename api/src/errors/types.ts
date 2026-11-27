export type ErrorCode =
  | 'key_missing'
  | 'key_unknown'
  | 'lifter_only'
  | 'invalid_request'
  | 'not_found'
  | 'internal'

export class OperationError extends Error {
  code: ErrorCode
  field?: string

  constructor(code: ErrorCode, field?: string) {
    super(code)
    this.name = 'OperationError'
    this.code = code
    this.field = field
  }
}

// The one shape every failure takes on the wire (R8). Named here so a surface can type what it
// renders without importing the catalogue that builds it.
export type ErrorBody = {
  error: {
    code: ErrorCode
    fix: string
    field: string | null
    request_id: string
  }
}
