import { OperationError } from '../errors/types.js'
import type { OperationEntry } from '../registry/types.js'
import type { Principal } from './authenticate.js'

// Answers the other question: may this principal make this call? Default deny, so a principal
// kind the entry does not name is refused, and a new kind is refused until an entry opts it in.
export function assertMayCall(entry: OperationEntry, principal: Principal): void {
  if (!entry.principals.includes(principal.kind)) throw new OperationError('lifter_only')
}
