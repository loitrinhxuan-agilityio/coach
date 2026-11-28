import type { Principal } from '../auth/authenticate.js'
import { authenticate } from '../auth/authenticate.js'
import { OperationError } from '../errors/types.js'
import { memoryRepository } from '../repository/memory.js'
import type { Repository } from '../repository/types.js'
import { getAccount } from './get-account.js'

// Obviously fake. The hash is written out in full (sha256 of FAKE_KEY) so the test does not lean
// on the implementation to say what the right hash is.
const FAKE_KEY = 'fake-key-for-get-account-tests'
const FAKE_KEY_SHA256 = 'cdd8e3c513426ab810b88d245342656f09550a7c7fc2293032a96d2c8100241d'
const OTHER_KEY_SHA256 = '0000000000000000000000000000000000000000000000000000000000000001'

const SETTINGS = { time_zone: 'Asia/Ho_Chi_Minh', display_unit: 'kg' } as const

// Two Keys, so the tests can tell "the Key that called" from "a Key that exists".
const seededRepo = (): Repository =>
  memoryRepository({
    keys: [
      { name: 'Claude Desktop', key_sha256: FAKE_KEY_SHA256 },
      { name: 'Other Agent', key_sha256: OTHER_KEY_SHA256 },
    ],
    settings: SETTINGS,
  })

// The principal the way a request produces it: through authenticate, not hand-built.
const callerOf = (repo: Repository): Promise<Principal> =>
  authenticate({ authorization: `Bearer ${FAKE_KEY}` }, repo)

// Every property name at every depth, so a forbidden field cannot hide in a nested object.
function keyNames(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(keyNames)
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([name, inner]) => [name, ...keyNames(inner)])
  }
  return []
}

describe('get_account', () => {
  test('returns the body the spec fixes', async () => {
    const repo = seededRepo()
    const body = await getAccount({ repo, principal: await callerOf(repo) })
    expect(body).toStrictEqual({
      agent: { name: 'Claude Desktop' },
      settings: { time_zone: 'Asia/Ho_Chi_Minh', display_unit: 'kg' },
      standing_notes: [],
    })
  })

  test('agent.name is the name of the Key that called', async () => {
    const repo = seededRepo()
    const principal = await callerOf(repo)
    expect((await getAccount({ repo, principal })).agent.name).toBe('Claude Desktop')

    // The same function for a different caller answers with that caller's name, so the name is
    // read from the principal and not fixed or looked up some other way.
    const other: Principal = { kind: 'agent', key_id: 'any', agent_name: 'Another Name' }
    expect((await getAccount({ repo, principal: other })).agent.name).toBe('Another Name')
  })

  test('standing_notes is present and is an empty array', async () => {
    const repo = seededRepo()
    const body = await getAccount({ repo, principal: await callerOf(repo) })
    expect('standing_notes' in body).toBe(true)
    expect(Array.isArray(body.standing_notes)).toBe(true)
    expect(body.standing_notes).toHaveLength(0)
    // Present survives serialisation too: undefined would be dropped, null would not be [].
    expect(JSON.parse(JSON.stringify(body)).standing_notes).toStrictEqual([])
  })

  test('the body contains none of the four forbidden fields', async () => {
    const repo = seededRepo()
    const principal = await callerOf(repo)
    const body = await getAccount({ repo, principal })
    const serialised = JSON.stringify(body)

    // By name, at every depth: cognito_sub, key, hash, keys.
    const names = keyNames(JSON.parse(serialised))
    for (const forbidden of ['cognito_sub', 'key', 'hash', 'keys']) {
      expect(names, `field "${forbidden}"`).not.toContain(forbidden)
    }

    // By value, so a field that carries one of these under a name we did not think of is still
    // caught: the Key string, its hash, and anything that says another Key exists.
    expect(serialised).not.toContain(FAKE_KEY)
    expect(serialised).not.toContain(FAKE_KEY_SHA256)
    expect(serialised).not.toContain(principal.key_id)
    expect(serialised).not.toContain('Other Agent')
    expect(serialised).not.toContain(OTHER_KEY_SHA256)
  })

  test('only the two settings fields are forwarded, whatever else the row carries', async () => {
    // A future Aurora DSQL row may carry columns this operation never chose to expose. The memory
    // repository hands back every property it was seeded with, so this stands in for that row.
    const repo = memoryRepository({
      keys: [{ name: 'Claude Desktop', key_sha256: FAKE_KEY_SHA256 }],
      settings: { ...SETTINGS, cognito_sub: 'fake-sub', extra_column: 'fake-extra' } as never,
    })
    expect(await repo.getSettings()).toHaveProperty('cognito_sub', 'fake-sub')
    const body = await getAccount({ repo, principal: await callerOf(repo) })

    expect(body.settings).toStrictEqual({ time_zone: 'Asia/Ho_Chi_Minh', display_unit: 'kg' })
    const serialised = JSON.stringify(body)
    expect(serialised).not.toContain('fake-sub')
    expect(serialised).not.toContain('fake-extra')
    expect(keyNames(body)).not.toContain('cognito_sub')
  })

  test('a missing settings row raises internal, never a default', async () => {
    const repo = memoryRepository({
      keys: [{ name: 'Claude Desktop', key_sha256: FAKE_KEY_SHA256 }],
      // no settings row: the repository answers null
    })
    expect(await repo.getSettings()).toBeNull()
    const principal = await callerOf(repo)

    const error = await getAccount({ repo, principal }).then(
      () => null,
      (thrown: unknown) => thrown,
    )
    expect(error).toBeInstanceOf(OperationError)
    expect((error as OperationError).code).toBe('internal')
  })
})
