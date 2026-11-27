import { logRequest } from './line.js'

type Fields = Parameters<typeof logRequest>[0]

const base: Fields = {
  request_id: 'req-0001',
  operation: 'get_account',
  principal_kind: 'agent',
  key_id: '00000000-0000-4000-8000-000000000001',
  duration_ms: 12,
  outcome: 'ok',
}

// Calls logRequest with stdout captured, and returns everything it wrote. Stdout is restored
// whether or not the call throws.
function capture(fields: unknown): string {
  const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
  try {
    logRequest(fields as Fields)
    return write.mock.calls.map((call) => String(call[0])).join('')
  } finally {
    write.mockRestore()
  }
}

const SIX = ['duration_ms', 'key_id', 'operation', 'outcome', 'principal_kind', 'request_id']

test('emits one JSON line with exactly the six fields', () => {
  const out = capture(base)

  // One line: a single newline, and it is the last character.
  expect(out.split('\n')).toHaveLength(2)
  expect(out.endsWith('\n')).toBe(true)

  const line = JSON.parse(out.slice(0, -1))
  expect(Object.keys(line).sort()).toEqual(SIX)
  expect(line).toEqual(base)
})

test('a request with no Key still emits all six fields', () => {
  const { key_id: _omitted, ...withoutKey } = base
  const line = JSON.parse(capture({ ...withoutKey, outcome: 'key_missing' }))

  expect(Object.keys(line).sort()).toEqual(SIX)
  expect(line.key_id).toBeNull()
  expect(line.outcome).toBe('key_missing')
})

test('a Key, a hash, a cognito_sub, an email and a body never appear', () => {
  const secrets = {
    key: 'alc_live_FAKEKEYFAKEKEYFAKEKEYFAKEKEY0000',
    key_hash: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    cognito_sub: '11111111-2222-4333-8444-555555555555',
    email: 'lifter@example.invalid',
    request_body: '{"note":"fake request body"}',
    response_body: '{"settings":"fake response body"}',
  }
  // Carried in adjacent properties, the way a careless caller would hand over a whole context.
  const out = capture({ ...base, ...secrets })

  for (const value of Object.values(secrets)) {
    expect(out).not.toContain(value)
  }
  expect(JSON.parse(out)).toEqual(base)
})

test('an 8 KB Authorization value never reaches the line', () => {
  const huge = `Bearer alc_live_${'A'.repeat(8 * 1024)}`
  const out = capture({ ...base, authorization: huge, headers: { Authorization: huge } })

  expect(out).not.toContain('AAAAAAAA')
  expect(out).not.toContain('Bearer')
  expect(out.length).toBeLessThan(512)
  expect(JSON.parse(out)).toEqual(base)
})
