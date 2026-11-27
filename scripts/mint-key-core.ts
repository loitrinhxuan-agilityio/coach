import { createHash, randomBytes } from 'node:crypto'
import { keyNameTaken } from '../api/src/repository/errors.js'
import type { Repository } from '../api/src/repository/types.js'

// R18. The only way a Key comes into existence in Phase 1 (ADR 0003). The logic is here and the
// wiring to a real database is in mint-key.ts, so that a test can run all of this against the
// in-memory repository, and so that the file the Owner runs has no "am I the entry point?" check
// that could quietly decide not to run.
//
// What this file may never do is let the Key go anywhere but the one write to `stdout` at the end.
// It imports nothing that can reach a file, a process or the network, and a test holds it to that.

const KEY_PREFIX = 'alc_live_'

// 32 bytes is 256 bits, so the Key is not a password: a plain sha256 with no salt is enough, and a
// slow hash would only slow every request. The prefix is there so a secret scanner can recognise it.
const generateKey = (): string => `${KEY_PREFIX}${randomBytes(32).toString('base64url')}`

// Hex, of the whole Key string, to match what authenticate looks up.
const sha256Hex = (text: string): string => createHash('sha256').update(text).digest('hex')

export type MintDeps = {
  repo: Repository
  stdout(text: string): void
  stderr(text: string): void
}

const USAGE =
  'usage: mint-key <name>   (the Agent the Key is for; one word or phrase, no spaces at either end)'

// Why a name is refused, or null. A reason never repeats the name, because the commonest mistake is
// a Key passed where a name goes, and echoing it would print the Key a second time.
function refuse(args: readonly string[]): string | null {
  if (args.length !== 1) return USAGE
  const name = args[0] ?? ''
  if (name === '' || name !== name.trim()) return USAGE
  // A line break would let a name forge a line of this script's own output.
  if (/\p{Cc}/u.test(name)) return `${USAGE}\nthe name must not contain control characters`
  if (name.includes(KEY_PREFIX)) return `${USAGE}\nthe name must not look like a Key`
  return null
}

const reasonOf = (error: unknown): string =>
  error instanceof Error ? error.message : 'an unknown error'

// Returns the process's exit code: 0 a Key was made and printed, 1 none was, 2 the arguments were
// wrong. It does not throw. A Key is generated only once the name is known to be free, written to
// the database as its hash alone, and printed only after that write has succeeded, so a failure at
// any step leaves no Key on screen that the database does not know.
export async function mintKey(args: readonly string[], deps: MintDeps): Promise<number> {
  const refusal = refuse(args)
  if (refusal !== null) {
    deps.stderr(`${refusal}\n`)
    return 2
  }
  const name = args[0] as string

  try {
    // A check then a write is a race, and the database's unique index on name is what closes it;
    // the rejection below is the real guard, and this read only gives the common case a clean answer.
    if ((await deps.repo.findKeyByName(name)) !== null) {
      deps.stderr(`${keyNameTaken(name)}; no Key was made\n`)
      return 1
    }

    const key = generateKey()
    await deps.repo.insertKey({ name, key_sha256: sha256Hex(key) })

    deps.stdout(
      `${key}\n` +
        `This Key for ${name} cannot be shown again. Only its sha256 is stored. ` +
        'If it is lost, mint another under a new name.\n',
    )
    return 0
  } catch (error) {
    // A duplicate caught here is the race; anything else is a failed connection or write. Neither
    // names the Key, which has not been printed and never reached the repository except as a hash.
    deps.stderr(`no Key was made: ${reasonOf(error)}\n`)
    return 1
  }
}
