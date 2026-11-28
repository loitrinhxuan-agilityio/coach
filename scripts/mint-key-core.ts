import { createHash, randomBytes } from 'node:crypto'
import { KEY_HASH_TAKEN, keyNameTaken } from '../api/src/repository/errors.js'
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

// The sentence for every failure whose outcome is not known. A database that timed out after COMMIT
// has stored the row and said nothing, so "it failed" may be false, and the one thing the Owner can
// act on is the name: it may now be taken, and a retry that says it already exists means exactly that.
const outcomeUnknown = (name: string, reason: string): string =>
  `the Key for ${name} may have been stored, and no Key was shown (${reason}). ` +
  `The name ${name} may now be taken: if a retry says a Key with it already exists, ` +
  'it does, and a new name is needed.'

// SQLSTATE insufficient_privilege. A write the database refused for want of permission stored nothing.
// The likeliest cause is a DSQL_DB_ROLE that may not write `keys`, which is the failure the Owner is
// most likely to meet the first time this runs, and each time it would otherwise burn a name for
// nothing. Read from the code the driver sets, never from the message.
const INSUFFICIENT_PRIVILEGE = '42501'

// A rejection that says for certain that this mint stored nothing: the database saying one of the two
// unique indexes already holds the value (the row that exists is not this mint's: it is another
// mint's, or the leftover of an earlier run of this script whose outcome was not known), or a
// permission refusal.
const storedNothing = (error: unknown, name: string): boolean =>
  error instanceof Error &&
  (error.message === keyNameTaken(name) ||
    error.message === KEY_HASH_TAKEN ||
    (error as { code?: unknown }).code === INSUFFICIENT_PRIVILEGE)

// Returns the process's exit code: 0 a Key was made and printed, 1 it was not, 2 the arguments were
// wrong. It does not throw. A Key is generated only once the name is known to be free, written to
// the database as its hash alone, and printed only after that write has succeeded, so a failure at
// any step leaves no Key on screen that the database does not know.
//
// What each exit 1 says is what is known. Before the write, or a rejection naming a duplicate or a
// refused permission, no row of this mint exists and the message says "no Key was made". A failed write of any other kind
// may or may not have committed, and a failed print has certainly committed, so those two say so and
// say what to do about the name.
export async function mintKey(args: readonly string[], deps: MintDeps): Promise<number> {
  const refusal = refuse(args)
  if (refusal !== null) {
    deps.stderr(`${refusal}\n`)
    return 2
  }
  const name = args[0] as string

  // A check then a write is a race, and the database's unique index on name is what closes it; the
  // rejection below is the real guard, and this read only gives the common case a clean answer.
  try {
    if ((await deps.repo.findKeyByName(name)) !== null) {
      deps.stderr(`${keyNameTaken(name)}; no Key was made\n`)
      return 1
    }
  } catch (error) {
    deps.stderr(`no Key was made: ${reasonOf(error)}\n`)
    return 1
  }

  let key: string
  try {
    key = generateKey()
  } catch (error) {
    deps.stderr(`no Key was made: ${reasonOf(error)}\n`)
    return 1
  }
  try {
    await deps.repo.insertKey({ name, key_sha256: sha256Hex(key) })
  } catch (error) {
    // Neither branch names the Key, which has not been printed and reached the repository only as a
    // hash.
    deps.stderr(
      storedNothing(error, name)
        ? `no Key was made: ${reasonOf(error)}\n`
        : `${outcomeUnknown(name, reasonOf(error))}\n`,
    )
    return 1
  }

  try {
    deps.stdout(
      `${key}\n` +
        `This Key for ${name} cannot be shown again. Only its sha256 is stored. ` +
        'If it is lost, mint another under a new name.\n',
    )
  } catch (error) {
    deps.stderr(
      `the Key for ${name} was stored but could not be printed (${reasonOf(error)}), so it is lost. ` +
        `The name ${name} is taken: mint another Key under a new name.\n`,
    )
    return 1
  }
  return 0
}
