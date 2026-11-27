import type { APIGatewayProxyEventV2 } from 'aws-lambda'
import { statusFor } from '../../errors/catalogue.js'
import type { ErrorBody } from '../../errors/types.js'
import { OperationError } from '../../errors/types.js'
import { getAccount } from '../../operations/get-account.js'
import { registry } from '../../registry/index.js'
import type { OperationEntry } from '../../registry/types.js'
import { memoryRepository } from '../../repository/memory.js'
import type { Repository } from '../../repository/types.js'
import { buildRouteTable, createHandler } from './router.js'

// Obviously fake. The hash is written out in full (sha256 of "abc", a published test vector) so
// the test does not lean on the implementation to say what the right hash is.
const FAKE_KEY = 'abc'
const FAKE_KEY_SHA256 = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'

const SETTINGS = { time_zone: 'Asia/Ho_Chi_Minh', display_unit: 'kg' } as const

const seededRepo = (): Repository =>
  memoryRepository({
    keys: [{ name: 'Claude Desktop', key_sha256: FAKE_KEY_SHA256 }],
    settings: SETTINGS,
  })

const GATEWAY_ID = 'gateway-request-0001'

type EventOptions = {
  method?: string
  path?: string
  headers?: Record<string, string | undefined>
  requestId?: string | undefined
}

// The few fields of an API Gateway v2 event this router reads. `requestId: undefined` models an
// invocation with no gateway id, which is what the fallback is for.
function eventFor(options: EventOptions = {}): APIGatewayProxyEventV2 {
  const {
    method = 'GET',
    path = '/api/account',
    headers = { authorization: `Bearer ${FAKE_KEY}` },
  } = options
  const requestId = 'requestId' in options ? options.requestId : GATEWAY_ID
  return {
    version: '2.0',
    routeKey: '$default',
    rawPath: path,
    rawQueryString: '',
    headers,
    requestContext: { http: { method, path }, requestId },
    isBase64Encoded: false,
  } as unknown as APIGatewayProxyEventV2
}

type Reply = {
  statusCode: number
  body: unknown
  raw: string
  contentType: string | undefined
  // Every log line the request wrote, parsed.
  lines: Record<string, unknown>[]
}

// Sends one event through a handler with stdout captured, so test output stays pristine and the
// log lines the request wrote come back beside the response. Stdout is restored whether or not
// the handler throws.
async function call(
  handle: (event: APIGatewayProxyEventV2) => Promise<unknown>,
  event: APIGatewayProxyEventV2,
): Promise<Reply> {
  const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
  try {
    const result = (await handle(event)) as {
      statusCode: number
      body: string
      headers?: Record<string, string>
    }
    const out = write.mock.calls.map((args) => String(args[0])).join('')
    return {
      statusCode: result.statusCode,
      body: JSON.parse(result.body),
      raw: result.body,
      contentType: result.headers?.['content-type'],
      lines: out
        .split('\n')
        .filter((line) => line !== '')
        .map((line) => JSON.parse(line)),
    }
  } finally {
    write.mockRestore()
  }
}

describe('the route table', () => {
  test('is built from the registry: one route per entry, keyed by method and path', () => {
    const table = buildRouteTable(registry)
    expect([...table.keys()].sort()).toEqual(
      registry.map((entry) => `${entry.method} ${entry.path}`).sort(),
    )
    // Today that is exactly one route.
    expect([...table.keys()]).toEqual(['GET /api/account'])
    expect(table.get('GET /api/account')).toBe(registry[0])
  })

  test('a second registry entry becomes a second route with no further router code', async () => {
    const second: OperationEntry = {
      ...(registry[0] as OperationEntry),
      name: 'get_ping',
      path: '/api/ping',
      summary: 'A fixture entry that exists only in this test.',
    }
    const entries = [...registry, second]
    expect([...buildRouteTable(entries).keys()].sort()).toEqual([
      'GET /api/account',
      'GET /api/ping',
    ])

    const handle = createHandler({
      repo: seededRepo(),
      entries,
      operations: { get_account: getAccount, get_ping: async () => ({ pong: true }) },
    })
    // The second route is served although no line of router.ts mentions /api/ping.
    const ping = await call(handle, eventFor({ path: '/api/ping' }))
    expect(ping.statusCode).toBe(200)
    expect(ping.body).toEqual({ pong: true })
    // And the first still is.
    expect((await call(handle, eventFor())).statusCode).toBe(200)
  })

  test('a route taken out of the registry stops being served', async () => {
    const handle = createHandler({ repo: seededRepo(), entries: [] })
    const reply = await call(handle, eventFor())
    expect(reply.statusCode).toBe(404)
    expect((reply.body as ErrorBody).error.code).toBe('not_found')
  })

  test('an entry with no implementation answers internal, not a crash', async () => {
    const handle = createHandler({ repo: seededRepo(), operations: {} })
    const reply = await call(handle, eventFor())
    expect(reply.statusCode).toBe(500)
    expect((reply.body as ErrorBody).error.code).toBe('internal')
  })
})

describe('the HTTP surface', () => {
  test('a valid Key gets 200 and the R2 body', async () => {
    const reply = await call(createHandler({ repo: seededRepo() }), eventFor())
    expect(reply.statusCode).toBe(200)
    expect(reply.contentType).toBe('application/json')
    expect(reply.body).toStrictEqual({
      agent: { name: 'Claude Desktop' },
      settings: { time_zone: 'Asia/Ho_Chi_Minh', display_unit: 'kg' },
      standing_notes: [],
    })
  })

  test('no Key gets 401 and the key_missing body', async () => {
    const reply = await call(createHandler({ repo: seededRepo() }), eventFor({ headers: {} }))
    expect(reply.statusCode).toBe(401)
    expect(reply.contentType).toBe('application/json')
    const { error } = reply.body as ErrorBody
    expect(error.code).toBe('key_missing')
    expect(error.fix).toBe('Send the Key in an `Authorization: Bearer` header on every call.')
    expect(error.field).toBeNull()
  })

  test('a Key that matches nothing gets 401 and the key_unknown body', async () => {
    const reply = await call(
      createHandler({ repo: seededRepo() }),
      eventFor({ headers: { authorization: 'Bearer not-a-known-key' } }),
    )
    expect(reply.statusCode).toBe(401)
    expect((reply.body as ErrorBody).error.code).toBe('key_unknown')
  })

  test('two Authorization values the gateway comma-joined are refused as malformed', async () => {
    const reply = await call(
      createHandler({ repo: seededRepo() }),
      eventFor({ headers: { authorization: `Bearer ${FAKE_KEY}, Bearer ${FAKE_KEY}` } }),
    )
    expect(reply.statusCode).toBe(401)
    expect((reply.body as ErrorBody).error.code).toBe('key_missing')
  })

  test('a principal an entry does not name gets 403 lifter_only', async () => {
    const lifterOnly: OperationEntry = {
      ...(registry[0] as OperationEntry),
      name: 'lifter_thing',
      path: '/api/lifter-thing',
      principals: ['lifter'],
    }
    const handle = createHandler({
      repo: seededRepo(),
      entries: [lifterOnly],
      operations: { lifter_thing: async () => ({ ran: true }) },
    })
    const reply = await call(handle, eventFor({ path: '/api/lifter-thing' }))
    expect(reply.statusCode).toBe(403)
    expect((reply.body as ErrorBody).error.code).toBe('lifter_only')
    expect(reply.raw).not.toContain('ran')
  })

  test('an unknown path gets 404 and the not_found body', async () => {
    const reply = await call(createHandler({ repo: seededRepo() }), eventFor({ path: '/api/nope' }))
    expect(reply.statusCode).toBe(404)
    const { error } = reply.body as ErrorBody
    expect(error.code).toBe('not_found')
    expect(error.fix).toBe('Ask the product what exists before acting on it.')
  })

  test('a known path with another method is not_found too, and never reaches the operation', async () => {
    let ran = false
    const handle = createHandler({
      repo: seededRepo(),
      operations: {
        get_account: async () => {
          ran = true
          return {}
        },
      },
    })
    const reply = await call(handle, eventFor({ method: 'POST' }))
    expect(reply.statusCode).toBe(404)
    expect((reply.body as ErrorBody).error.code).toBe('not_found')
    expect(ran).toBe(false)
  })

  test('an unknown path is answered without looking at the Key', async () => {
    const reply = await call(
      createHandler({ repo: seededRepo() }),
      eventFor({ path: '/api/nope', headers: {} }),
    )
    expect(reply.statusCode).toBe(404)
  })

  test('an operation failure that is not an OperationError becomes internal with no message', async () => {
    const handle = createHandler({
      repo: seededRepo(),
      operations: {
        get_account: async () => {
          throw new Error('connection string postgres://FAKE-SECRET-HOST/db refused')
        },
      },
    })
    const reply = await call(handle, eventFor())
    expect(reply.statusCode).toBe(500)
    expect((reply.body as ErrorBody).error.code).toBe('internal')
    expect(reply.raw).not.toContain('FAKE-SECRET-HOST')
  })

  test('an OperationError an operation throws is rendered through the catalogue', async () => {
    const handle = createHandler({
      repo: seededRepo(),
      operations: {
        get_account: async () => {
          throw new OperationError('invalid_request', 'weight_kg')
        },
      },
    })
    const reply = await call(handle, eventFor())
    expect(reply.statusCode).toBe(statusFor('invalid_request'))
    const { error } = reply.body as ErrorBody
    expect(error.code).toBe('invalid_request')
    expect(error.field).toBe('weight_kg')
  })
})

describe('request_id', () => {
  const failures: [string, EventOptions, string][] = [
    ['no Key', { headers: {} }, 'key_missing'],
    ['an unknown Key', { headers: { authorization: 'Bearer nope' } }, 'key_unknown'],
    ['an unknown path', { path: '/api/nope' }, 'not_found'],
  ]

  test.each(failures)(
    'every error response carries a request_id: %s',
    async (_name, options, code) => {
      const reply = await call(createHandler({ repo: seededRepo() }), eventFor(options))
      const { error } = reply.body as ErrorBody
      expect(error.code).toBe(code)
      expect(error.request_id).toBe(GATEWAY_ID)
    },
  )

  test('with no gateway id, a generated UUID is used, and it matches the log line', async () => {
    const reply = await call(
      createHandler({ repo: seededRepo() }),
      eventFor({ headers: {}, requestId: undefined }),
    )
    const { error } = reply.body as ErrorBody
    expect(error.request_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
    expect(reply.lines).toHaveLength(1)
    expect(reply.lines[0]?.request_id).toBe(error.request_id)
  })

  test('two requests with no gateway id get different ids', async () => {
    const handle = createHandler({ repo: seededRepo() })
    const ids = new Set<string>()
    for (let i = 0; i < 2; i++) {
      const reply = await call(handle, eventFor({ headers: {}, requestId: undefined }))
      ids.add((reply.body as ErrorBody).error.request_id)
    }
    expect(ids.size).toBe(2)
  })

  test('a client-supplied request id header is never used, in the body or in the log', async () => {
    // A value a client could use to smuggle a credential into the log line. It holds nothing
    // JSON.stringify escapes, so a leak would be a literal substring and these can fail.
    const smuggled = 'alc_live_FAKEKEYFAKEKEYFAKEKEYFAKEKEY0000'
    const reply = await call(
      createHandler({ repo: seededRepo() }),
      eventFor({
        headers: { 'x-request-id': smuggled, 'X-Amzn-Trace-Id': smuggled, 'request-id': smuggled },
        requestId: undefined,
      }),
    )
    expect(reply.raw).not.toContain(smuggled)
    expect(JSON.stringify(reply.lines)).not.toContain(smuggled)
  })
})

describe('the log line', () => {
  const SIX = ['duration_ms', 'key_id', 'operation', 'outcome', 'principal_kind', 'request_id']

  type Case = [string, EventOptions, { outcome: string; operation: string; principal: string }]
  const cases: Case[] = [
    ['success', {}, { outcome: 'ok', operation: 'get_account', principal: 'agent' }],
    [
      'no Key',
      { headers: {} },
      { outcome: 'key_missing', operation: 'get_account', principal: 'none' },
    ],
    [
      'unknown Key',
      { headers: { authorization: 'Bearer nope' } },
      { outcome: 'key_unknown', operation: 'get_account', principal: 'none' },
    ],
    [
      'unknown path',
      { path: '/api/nope' },
      { outcome: 'not_found', operation: 'unknown', principal: 'none' },
    ],
    [
      'wrong method',
      { method: 'DELETE' },
      { outcome: 'not_found', operation: 'unknown', principal: 'none' },
    ],
  ]

  test.each(cases)('one line is emitted per request: %s', async (_name, options, expected) => {
    const handle = createHandler({ repo: seededRepo() })
    const { lines } = await call(handle, eventFor(options))
    expect(lines).toHaveLength(1)
    const line = lines[0] as Record<string, unknown>
    expect(Object.keys(line).sort()).toEqual(SIX)
    expect(line.outcome).toBe(expected.outcome)
    expect(line.operation).toBe(expected.operation)
    expect(line.principal_kind).toBe(expected.principal)
    expect(line.request_id).toBe(GATEWAY_ID)
    expect(typeof line.duration_ms).toBe('number')
  })

  test('a success names the Key that called, by id, and nothing from the request', async () => {
    const repo = seededRepo()
    const { lines } = await call(createHandler({ repo }), eventFor())
    const key = await repo.findKeyByHash(FAKE_KEY_SHA256)
    expect(lines[0]?.key_id).toBe(key?.id)
    expect(JSON.stringify(lines)).not.toContain(FAKE_KEY_SHA256)
    expect(JSON.stringify(lines)).not.toContain('Bearer')
  })

  test('a failure after the Key was found still names the Key and the principal kind', async () => {
    const lifterOnly: OperationEntry = {
      ...(registry[0] as OperationEntry),
      name: 'lifter_thing',
      path: '/api/lifter-thing',
      principals: ['lifter'],
    }
    const repo = seededRepo()
    const handle = createHandler({
      repo,
      entries: [lifterOnly],
      operations: { lifter_thing: async () => ({}) },
    })
    const { lines } = await call(handle, eventFor({ path: '/api/lifter-thing' }))
    expect(lines).toHaveLength(1)
    expect(lines[0]?.outcome).toBe('lifter_only')
    expect(lines[0]?.operation).toBe('lifter_thing')
    expect(lines[0]?.principal_kind).toBe('agent')
    expect(lines[0]?.key_id).toBe((await repo.findKeyByHash(FAKE_KEY_SHA256))?.id)
  })

  test('an unexpected failure is logged once, as internal', async () => {
    const handle = createHandler({
      repo: seededRepo(),
      operations: {
        get_account: async () => {
          throw new Error('boom')
        },
      },
    })
    const { lines } = await call(handle, eventFor())
    expect(lines).toHaveLength(1)
    expect(lines[0]?.outcome).toBe('internal')
  })
})
