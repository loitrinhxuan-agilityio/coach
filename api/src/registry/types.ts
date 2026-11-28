import type { ErrorCode } from '../errors/types.js'

// Who a request acts as. Not the same thing as the Principal object the dispatcher builds, which
// carries a kind plus the Key's identity.
export type PrincipalKind = 'agent' | 'lifter'

// A minimal description of a value's shape. Both surfaces read the same object, so there is
// nothing to keep in step; a validation library can consume it later without changing the entry.
export type Schema =
  | { type: 'string'; enum?: readonly string[] }
  | { type: 'array'; items: Schema }
  | { type: 'object'; properties: Record<string, Schema>; required: readonly string[] }

export type OperationEntry = {
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  principals: PrincipalKind[]
  input: Schema
  output: Schema
  errors: ErrorCode[]
  summary: string
  // Set on a write that a retry must not repeat (S4). A read leaves it unset.
  idempotent?: boolean
}
