import { OperationError } from '../errors/types.js'
import { entryByName } from '../registry/index.js'
import type { OperationEntry } from '../registry/types.js'
import { memoryRepository } from '../repository/memory.js'
import type { Principal } from './authenticate.js'
import { authenticate } from './authenticate.js'
import { assertMayCall } from './capability.js'

// An obviously fake Key, and its sha256 written out in full so the test does not lean on the
// implementation to say what the right hash is. sha256 of the three bytes "abc" is a published
// test vector.
const FAKE_KEY = 'abc'
const FAKE_KEY_SHA256 = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'

const seededRepo = () =>
  memoryRepository({ keys: [{ name: 'fake-agent', key_sha256: FAKE_KEY_SHA256 }] })

async function codeOf(attempt: Promise<unknown>): Promise<string> {
  try {
    await attempt
  } catch (error) {
    if (error instanceof OperationError) return error.code
    throw error
  }
  throw new Error('expected an OperationError, but the call succeeded')
}

describe('authenticate: who is this request?', () => {
  test('no Authorization header -> key_missing', async () => {
    expect(await codeOf(authenticate({}, seededRepo()))).toBe('key_missing')
    expect(await codeOf(authenticate({ authorization: undefined }, seededRepo()))).toBe(
      'key_missing',
    )
    expect(await codeOf(authenticate({ authorization: '' }, seededRepo()))).toBe('key_missing')
  })

  test('lower-case "authorization: bearer <key>" is accepted', async () => {
    const repo = seededRepo()
    for (const headers of [
      { authorization: `bearer ${FAKE_KEY}` },
      { Authorization: `Bearer ${FAKE_KEY}` },
      { AUTHORIZATION: `BEARER ${FAKE_KEY}` },
    ]) {
      expect((await authenticate(headers, repo)).agent_name).toBe('fake-agent')
    }
  })

  test('"Basic abc" -> key_missing', async () => {
    expect(await codeOf(authenticate({ Authorization: 'Basic abc' }, seededRepo()))).toBe(
      'key_missing',
    )
  })

  test('a bare key with no scheme -> key_missing', async () => {
    expect(await codeOf(authenticate({ Authorization: FAKE_KEY }, seededRepo()))).toBe(
      'key_missing',
    )
    expect(await codeOf(authenticate({ Authorization: 'Bearer' }, seededRepo()))).toBe(
      'key_missing',
    )
    expect(await codeOf(authenticate({ Authorization: 'Bearer ' }, seededRepo()))).toBe(
      'key_missing',
    )
  })

  test('whitespace inside the credential is malformed -> key_missing, not a lookup of part of it', async () => {
    // RFC 7235 token68 has no internal whitespace. Reading "Bearer abc extra" as the Key "abc"
    // would authenticate a request that never presented a well-formed credential.
    expect(
      await codeOf(authenticate({ Authorization: `Bearer ${FAKE_KEY} extra` }, seededRepo())),
    ).toBe('key_missing')
    expect(await codeOf(authenticate({ Authorization: 'Bearer a b' }, seededRepo()))).toBe(
      'key_missing',
    )
  })

  test('a Bearer value matching no stored hash -> key_unknown', async () => {
    expect(
      await codeOf(authenticate({ Authorization: 'Bearer not-a-stored-key' }, seededRepo())),
    ).toBe('key_unknown')
  })

  test('an 8 KB Authorization value -> key_unknown, no throw', async () => {
    const huge = `Bearer ${'a'.repeat(8 * 1024)}`
    expect(await codeOf(authenticate({ Authorization: huge }, seededRepo()))).toBe('key_unknown')
  })

  test('a valid Key yields a principal carrying key_id and agent_name', async () => {
    const repo = seededRepo()
    const principal = await authenticate({ Authorization: `Bearer ${FAKE_KEY}` }, repo)
    const stored = await repo.findKeyByName('fake-agent')
    expect(principal).toEqual({
      kind: 'agent',
      key_id: stored?.id,
      agent_name: 'fake-agent',
    })
  })

  test('neither refusal carries the presented credential in its message or its serialised form', async () => {
    const presented = 'fake-presented-credential-must-not-leak'
    const repo = seededRepo()
    const refusals: unknown[] = []
    for (const headers of [
      { Authorization: `Bearer ${presented}` }, // key_unknown
      { Authorization: `Basic ${presented}` }, // key_missing
      { Authorization: `${presented}` }, // key_missing
    ]) {
      try {
        await authenticate(headers, repo)
      } catch (error) {
        refusals.push(error)
      }
    }
    expect(refusals).toHaveLength(3)
    expect(refusals.map((error) => (error as OperationError).code).sort()).toEqual([
      'key_missing',
      'key_missing',
      'key_unknown',
    ])
    for (const error of refusals) {
      expect((error as OperationError).message).not.toContain(presented)
      expect(JSON.stringify(error)).not.toContain(presented)
      expect(String((error as OperationError).stack)).not.toContain(presented)
    }
  })

  test('a Cognito-shaped JWT -> key_unknown', async () => {
    // Three base64url segments, none of them real. There is no lifter verifier in this change, so
    // a JWT is simply a Key that matches nothing.
    const jwt = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJmYWtlLWxpZnRlciJ9.ZmFrZS1zaWduYXR1cmU'
    expect(await codeOf(authenticate({ Authorization: `Bearer ${jwt}` }, seededRepo()))).toBe(
      'key_unknown',
    )
  })
})

describe('assertMayCall: may this principal make this call?', () => {
  const agent: Principal = { kind: 'agent', key_id: 'fake-key-id', agent_name: 'fake-agent' }

  // A test-only fixture. The registry holds exactly one entry, so this one lives here.
  const lifterOnlyEntry: OperationEntry = {
    name: 'fixture_lifter_only',
    method: 'POST',
    path: '/api/fixture',
    principals: ['lifter'],
    input: { type: 'object', properties: {}, required: [] },
    output: { type: 'object', properties: {}, required: [] },
    errors: ['key_missing', 'key_unknown', 'lifter_only', 'internal'],
    summary: 'A fixture only the Lifter may call.',
  }

  const entryFor = (principals: OperationEntry['principals']): OperationEntry => ({
    ...lifterOnlyEntry,
    principals,
  })
  const lifter: Principal = { kind: 'lifter', key_id: 'fake-key-id', agent_name: 'fake-lifter' }

  test('an entry without "agent" in principals -> lifter_only', () => {
    expect(() => assertMayCall(lifterOnlyEntry, agent)).toThrowError(
      expect.objectContaining({ name: 'OperationError', code: 'lifter_only' }),
    )
  })

  test('an entry with empty principals refuses everyone (default deny)', () => {
    for (const principal of [agent, lifter]) {
      expect(() => assertMayCall(entryFor([]), principal)).toThrowError(
        expect.objectContaining({ code: 'lifter_only' }),
      )
    }
  })

  test('an entry listing "agent" lets an agent through', () => {
    const entry = entryByName('get_account')
    if (!entry) throw new Error('get_account is missing from the registry')
    expect(() => assertMayCall(entry, agent)).not.toThrow()
  })

  test('an entry listing "lifter" admits a lifter principal', () => {
    expect(() => assertMayCall(lifterOnlyEntry, lifter)).not.toThrow()
  })
})
