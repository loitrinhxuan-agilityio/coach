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
