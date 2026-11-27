import { createHash } from 'node:crypto'
import { OperationError } from '../errors/types.js'
import type { PrincipalKind } from '../registry/types.js'
import type { Repository } from '../repository/types.js'

// Who a request acts as. Authentication produces this; the capability check consumes it.
export type Principal = { kind: PrincipalKind; key_id: string; agent_name: string }

// Header names are case-insensitive (RFC 7230), and the caller may not have normalised them.
function headerValue(
  headers: Record<string, string | undefined>,
  name: string,
): string | undefined {
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === name && value !== undefined) return value
  }
  return undefined
}

// A well-formed credential is the scheme `Bearer` (case-insensitive, RFC 7235), whitespace, and one
// run of non-whitespace characters. Anything else is not a Bearer credential at all.
function bearerCredential(value: string | undefined): string | null {
  const match = /^bearer[ \t]+(\S+)$/i.exec((value ?? '').trim())
  return match?.[1] ?? null
}

// The Key is 256 bits of randomness, not a password, so a plain sha256 with no salt is enough and
// a slow hash would only slow every call. Hex, to match what the repository stores.
const sha256Hex = (credential: string): string =>
  createHash('sha256').update(credential).digest('hex')

// Answers one question only: who is this? Whether they may make the call is assertMayCall's job.
// `key_missing` means no well-formed Bearer credential came with the request; `key_unknown` means
// one did, and it matched no stored hash. The only principal here is an Agent: nothing in this
// change can verify a Lifter's sign-in, so a JWT is just a credential that matches no Key.
export async function authenticate(
  headers: Record<string, string | undefined>,
  repo: Repository,
): Promise<Principal> {
  const credential = bearerCredential(headerValue(headers, 'authorization'))
  if (credential === null) throw new OperationError('key_missing')

  const key = await repo.findKeyByHash(sha256Hex(credential))
  if (key === null) throw new OperationError('key_unknown')

  return { kind: 'agent', key_id: key.id, agent_name: key.name }
}
