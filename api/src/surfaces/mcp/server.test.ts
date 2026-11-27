import type { APIGatewayProxyEventV2 } from 'aws-lambda'
import type { ErrorBody } from '../../errors/types.js'
import { OperationError } from '../../errors/types.js'
import { getAccount } from '../../operations/get-account.js'
import { registry } from '../../registry/index.js'
import type { OperationEntry } from '../../registry/types.js'
import { memoryRepository } from '../../repository/memory.js'
import type { Repository } from '../../repository/types.js'
import { buildRouteTable, createHandler } from '../http/router.js'
import { createMcpHandler } from './server.js'

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
const AUTHED = { authorization: `Bearer ${FAKE_KEY}` }

type EventOptions = {
  method?: string
  path?: string
  headers?: Record<string, string | undefined>
  requestId?: string | undefined
  // The raw request body, exactly as it arrives. Undefined models a request with none.
  body?: string | undefined
  isBase64Encoded?: boolean
}

// The few fields of an API Gateway v2 event this surface reads. `requestId: undefined` models an
// invocation with no gateway id, which is what the fallback is for.
function eventFor(options: EventOptions = {}): APIGatewayProxyEventV2 {
  const { method = 'POST', path = '/mcp', headers = AUTHED, isBase64Encoded = false } = options
  const requestId = 'requestId' in options ? options.requestId : GATEWAY_ID
  return {
    version: '2.0',
    routeKey: '$default',
    rawPath: path,
    rawQueryString: '',
    headers,
    body: options.body,
    isBase64Encoded,
    requestContext: { http: { method, path }, requestId },
  } as unknown as APIGatewayProxyEventV2
}

const rpcBody = (message: Record<string, unknown>): string =>
  JSON.stringify({ jsonrpc: '2.0', ...message })

const listEvent = (options: EventOptions = {}) =>
  eventFor({ body: rpcBody({ id: 1, method: 'tools/list' }), ...options })

const callEvent = (name: string, options: EventOptions = {}) =>
  eventFor({ body: rpcBody({ id: 7, method: 'tools/call', params: { name } }), ...options })

type Reply = {
  statusCode: number
  // The parsed body, or undefined when the response carries none.
  // biome-ignore lint/suspicious/noExplicitAny: a test reads whatever shape it is asserting on
  body: any
  raw: string | undefined
  headers: Record<string, unknown>
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
      body?: string
      headers?: Record<string, unknown>
    }
    const out = write.mock.calls.map((args) => String(args[0])).join('')
    return {
      statusCode: result.statusCode,
      body: result.body ? JSON.parse(result.body) : undefined,
      raw: result.body,
      headers: result.headers ?? {},
      lines: out
        .split('\n')
        .filter((line) => line !== '')
        .map((line) => JSON.parse(line)),
    }
  } finally {
    write.mockRestore()
  }
}

// What a tool call that failed carries: the R8 body, as the text of the one content item.
function toolError(reply: Reply): ErrorBody {
  expect(reply.statusCode).toBe(200)
  expect(reply.body.result.isError).toBe(true)
  expect(reply.body.result.content).toHaveLength(1)
  expect(reply.body.result.content[0].type).toBe('text')
  expect(reply.body.result).not.toHaveProperty('structuredContent')
  return JSON.parse(reply.body.result.content[0].text)
}

const lifterOnly: OperationEntry = {
  ...(registry[0] as OperationEntry),
  name: 'lifter_thing',
  path: '/api/lifter-thing',
  principals: ['lifter'],
}

// A second entry that differs from the first in every field a surface reads, so a surface that
// copied the first entry, or hard-coded it, cannot agree with it by accident.
const distinct: OperationEntry = {
  name: 'get_distinct',
  method: 'GET',
  path: '/api/distinct',
  principals: ['agent'],
  input: {
    type: 'object',
    properties: { day: { type: 'string' } },
    required: ['day'],
  },
  output: {
    type: 'object',
    properties: { tags: { type: 'array', items: { type: 'string' } } },
    required: ['tags'],
  },
  errors: ['key_missing', 'key_unknown', 'internal'],
  summary: 'A fixture entry that exists only in this test.',
}

describe('R4: both surfaces are derived from the one registry entry', () => {
  // The registry as shipped, and the registry with entries no surface file has ever heard of.
  const registries: [string, readonly OperationEntry[]][] = [
    ['the shipped registry', registry],
    ['a registry with a second entry', [...registry, distinct]],
    ['a registry with two more entries', [...registry, distinct, lifterOnly]],
  ]
  const operations = {
    get_account: getAccount,
    get_distinct: async () => ({}),
    lifter_thing: async () => ({}),
  }

  test.each(registries)(
    'MCP tool list and HTTP route table agree on name, input and output: %s',
    async (_name, entries) => {
      const table = buildRouteTable(entries)
      const reply = await call(
        createMcpHandler({ repo: seededRepo(), entries, operations }),
        listEvent(),
      )
      const tools = reply.body.result.tools as {
        name: string
        description: string
        inputSchema: unknown
        outputSchema: unknown
      }[]

      // Same set: nothing on one surface that the other lacks, in either direction.
      expect(tools.map((tool) => tool.name).sort()).toEqual(
        [...table.values()].map((entry) => entry.name).sort(),
      )
      expect(tools).toHaveLength(entries.length)

      for (const entry of entries) {
        const tool = tools.find((candidate) => candidate.name === entry.name)
        const route = table.get(`${entry.method} ${entry.path}`)
        // Each is checked against the registry's entry as well as against the other, so
        // agreeing with each other is not enough: both must agree with the one source.
        expect(route).toBe(entry)
        expect(tool?.inputSchema).toStrictEqual(entry.input)
        expect(tool?.inputSchema).toStrictEqual(route?.input)
        expect(tool?.outputSchema).toStrictEqual(entry.output)
        expect(tool?.outputSchema).toStrictEqual(route?.output)
        expect(tool?.description).toBe(entry.summary)
      }
    },
  )

  test('the entries are told apart, so the comparison above has something to detect', () => {
    expect(distinct.input).not.toStrictEqual(registry[0]?.input)
    expect(distinct.output).not.toStrictEqual(registry[0]?.output)
    expect(distinct.summary).not.toBe(registry[0]?.summary)
  })

  test('a call returns the same body over both surfaces', async () => {
    const repo = seededRepo()
    const http = await call(
      createHandler({ repo }),
      eventFor({ method: 'GET', path: '/api/account' }),
    )
    const mcp = await call(createMcpHandler({ repo }), callEvent('get_account'))
    expect(http.statusCode).toBe(200)
    expect(mcp.body.result.structuredContent).toStrictEqual(http.body)
    expect(JSON.parse(mcp.body.result.content[0].text)).toStrictEqual(http.body)
  })

  // Failures are worded in one place. The same fault, raised on the same call, is the same object
  // on both surfaces, so a surface that composed its own message would be caught here.
  const faults: [string, OperationEntry, () => Promise<unknown>][] = [
    ['lifter_only', lifterOnly, async () => ({})],
    [
      'internal',
      registry[0] as OperationEntry,
      async () => {
        throw new Error('secret detail')
      },
    ],
    [
      'invalid_request',
      registry[0] as OperationEntry,
      async () => {
        throw new OperationError('invalid_request', 'day')
      },
    ],
  ]
  test.each(faults)('the %s body is the same object on both surfaces', async (code, entry, run) => {
    const repo = seededRepo()
    const options = { repo, entries: [entry], operations: { [entry.name]: run } }
    const http = await call(
      createHandler(options),
      eventFor({ method: entry.method, path: entry.path }),
    )
    const mcp = await call(createMcpHandler(options), callEvent(entry.name))
    expect((http.body as ErrorBody).error.code).toBe(code)
    expect(toolError(mcp)).toStrictEqual(http.body)
  })

  test('an authentication failure is the same status and the same object on both surfaces', async () => {
    for (const headers of [{}, { authorization: 'Bearer nope' }]) {
      const http = await call(
        createHandler({ repo: seededRepo() }),
        eventFor({ method: 'GET', path: '/api/account', headers }),
      )
      const mcp = await call(
        createMcpHandler({ repo: seededRepo() }),
        callEvent('get_account', { headers }),
      )
      expect(http.statusCode).toBe(401)
      expect(mcp.statusCode).toBe(http.statusCode)
      expect(mcp.body).toStrictEqual(http.body)
    }
  })
})

describe('initialize', () => {
  const initialize = () =>
    eventFor({
      body: rpcBody({
        id: 'init-1',
        method: 'initialize',
        params: {
          protocolVersion: '2025-11-25',
          capabilities: {},
          clientInfo: { name: 'fixture', version: '0' },
        },
      }),
    })

  test('reports protocol revision 2025-11-25', async () => {
    const reply = await call(createMcpHandler({ repo: seededRepo() }), initialize())
    expect(reply.statusCode).toBe(200)
    expect(reply.headers['content-type']).toBe('application/json')
    expect(reply.body.jsonrpc).toBe('2.0')
    expect(reply.body.id).toBe('init-1')
    // The literal, not an imported constant: this is the tripwire for the day the revision moves.
    expect(reply.body.result.protocolVersion).toBe('2025-11-25')
  })

  test('declares tools and nothing else, and names no session', async () => {
    const reply = await call(createMcpHandler({ repo: seededRepo() }), initialize())
    expect(reply.body.result.capabilities).toStrictEqual({ tools: {} })
    expect(reply.body.result.serverInfo.name).toBe('ai-lift-coach')
    expect(Object.keys(reply.headers).map((name) => name.toLowerCase())).not.toContain(
      'mcp-session-id',
    )
  })

  test('the client announcing it is initialised is acknowledged with 202 and no body', async () => {
    const reply = await call(
      createMcpHandler({ repo: seededRepo() }),
      eventFor({ body: rpcBody({ method: 'notifications/initialized' }) }),
    )
    expect(reply.statusCode).toBe(202)
    expect(reply.raw).toBeUndefined()
  })
})

describe('tools/list', () => {
  test('is derived from the registry: one tool, named get_account', async () => {
    const reply = await call(createMcpHandler({ repo: seededRepo() }), listEvent())
    expect(reply.statusCode).toBe(200)
    expect(reply.headers['content-type']).toBe('application/json')
    expect(reply.body.id).toBe(1)
    const tools = reply.body.result.tools as { name: string }[]
    expect(tools.map((tool) => tool.name)).toEqual(['get_account'])
    expect(tools).toHaveLength(registry.length)
  })

  test('an entry added to the registry becomes a tool, callable, with no further code', async () => {
    const handle = createMcpHandler({
      repo: seededRepo(),
      entries: [...registry, distinct],
      operations: { get_account: getAccount, get_distinct: async () => ({ tags: ['a'] }) },
    })
    const listed = await call(handle, listEvent())
    expect(listed.body.result.tools.map((tool: { name: string }) => tool.name)).toEqual([
      'get_account',
      'get_distinct',
    ])
    const called = await call(handle, callEvent('get_distinct'))
    expect(called.body.result.structuredContent).toStrictEqual({ tags: ['a'] })
  })

  test('an entry taken out of the registry stops being a tool and stops being callable', async () => {
    const handle = createMcpHandler({ repo: seededRepo(), entries: [] })
    const listed = await call(handle, listEvent())
    expect(listed.body.result.tools).toEqual([])
    expect(toolError(await call(handle, callEvent('get_account'))).error.code).toBe('not_found')
  })

  test('an entry with no implementation stops the handler being built', () => {
    expect(() => createMcpHandler({ repo: seededRepo(), operations: {} })).toThrow(
      /get_account has no implementation/,
    )
  })
})

describe('tools/call', () => {
  test('get_account with a valid Key returns the R2 body', async () => {
    const reply = await call(createMcpHandler({ repo: seededRepo() }), callEvent('get_account'))
    expect(reply.statusCode).toBe(200)
    expect(reply.headers['content-type']).toBe('application/json')
    expect(reply.body.id).toBe(7)
    expect(reply.body.result).not.toHaveProperty('isError')
    const account = {
      agent: { name: 'Claude Desktop' },
      settings: { time_zone: 'Asia/Ho_Chi_Minh', display_unit: 'kg' },
      standing_notes: [],
    }
    expect(reply.body.result.structuredContent).toStrictEqual(account)
    expect(reply.body.result.content).toHaveLength(1)
    expect(reply.body.result.content[0].type).toBe('text')
    expect(JSON.parse(reply.body.result.content[0].text)).toStrictEqual(account)
  })

  test('an unknown tool name returns not_found, not a crash, and runs nothing', async () => {
    let ran = false
    const handle = createMcpHandler({
      repo: seededRepo(),
      operations: {
        get_account: async () => {
          ran = true
          return {}
        },
      },
    })
    const { error } = toolError(await call(handle, callEvent('get_nothing')))
    expect(error.code).toBe('not_found')
    expect(error.fix).toBe('Ask the product what exists before acting on it.')
    expect(ran).toBe(false)
  })

  test('a principal an entry does not name gets lifter_only, and the operation never runs', async () => {
    let ran = false
    const handle = createMcpHandler({
      repo: seededRepo(),
      entries: [lifterOnly],
      operations: {
        lifter_thing: async () => {
          ran = true
          return { ran: true }
        },
      },
    })
    const reply = await call(handle, callEvent('lifter_thing'))
    expect(toolError(reply).error.code).toBe('lifter_only')
    expect(ran).toBe(false)
    expect(reply.raw).not.toContain('"ran"')
  })

  test('a failure that is not an OperationError becomes internal and says nothing about itself', async () => {
    const handle = createMcpHandler({
      repo: seededRepo(),
      operations: {
        get_account: async () => {
          throw new Error('connection string postgres://FAKE-SECRET-HOST/db refused')
        },
      },
    })
    const reply = await call(handle, callEvent('get_account'))
    expect(toolError(reply).error.code).toBe('internal')
    expect(reply.raw).not.toContain('FAKE-SECRET-HOST')
  })

  test('an OperationError is rendered through the catalogue, with its field', async () => {
    const handle = createMcpHandler({
      repo: seededRepo(),
      operations: {
        get_account: async () => {
          throw new OperationError('invalid_request', 'weight_kg')
        },
      },
    })
    const { error } = toolError(await call(handle, callEvent('get_account')))
    expect(error.code).toBe('invalid_request')
    expect(error.field).toBe('weight_kg')
    expect(error.request_id).toBe(GATEWAY_ID)
  })

  test('the error is the R8 body: exactly four fields, in the catalogue order', async () => {
    const { error } = toolError(
      await call(createMcpHandler({ repo: seededRepo() }), callEvent('get_nothing')),
    )
    expect(Object.keys(error)).toEqual(['code', 'fix', 'field', 'request_id'])
    expect(error.field).toBeNull()
  })
})

describe('the Key', () => {
  const messages: [string, () => APIGatewayProxyEventV2][] = [
    ['initialize', () => eventFor({ body: rpcBody({ id: 1, method: 'initialize' }) })],
    ['tools/list', () => listEvent()],
    ['tools/call', () => callEvent('get_account')],
    ['a notification', () => eventFor({ body: rpcBody({ method: 'notifications/initialized' }) })],
  ]
  // Each message is sent with the credentials swapped, so one that skips the Key check is caught
  // by its own row.
  const withHeaders = (build: () => APIGatewayProxyEventV2, headers: Record<string, string>) => ({
    ...build(),
    headers,
  })

  test.each(messages)('no Key gets 401 and the key_missing body: %s', async (_name, build) => {
    const reply = await call(createMcpHandler({ repo: seededRepo() }), withHeaders(build, {}))
    expect(reply.statusCode).toBe(401)
    expect(reply.headers['content-type']).toBe('application/json')
    const { error } = reply.body as ErrorBody
    expect(error.code).toBe('key_missing')
    expect(error.fix).toBe('Send the Key in an `Authorization: Bearer` header on every call.')
    expect(error.request_id).toBe(GATEWAY_ID)
  })

  test.each(messages)(
    'a Key that matches nothing gets 401 key_unknown: %s',
    async (_name, build) => {
      const reply = await call(
        createMcpHandler({ repo: seededRepo() }),
        withHeaders(build, { authorization: 'Bearer not-a-known-key' }),
      )
      expect(reply.statusCode).toBe(401)
      expect((reply.body as ErrorBody).error.code).toBe('key_unknown')
    },
  )

  test('two Authorization values the gateway comma-joined are refused as malformed', async () => {
    const reply = await call(
      createMcpHandler({ repo: seededRepo() }),
      callEvent('get_account', {
        headers: { authorization: `Bearer ${FAKE_KEY}, Bearer ${FAKE_KEY}` },
      }),
    )
    expect(reply.statusCode).toBe(401)
    expect((reply.body as ErrorBody).error.code).toBe('key_missing')
  })

  test('a refused call never reaches the operation', async () => {
    let ran = false
    const handle = createMcpHandler({
      repo: seededRepo(),
      operations: {
        get_account: async () => {
          ran = true
          return {}
        },
      },
    })
    await call(handle, callEvent('get_account', { headers: {} }))
    expect(ran).toBe(false)
  })
})

describe('R15: POST only, JSON only', () => {
  test.each(['GET', 'DELETE', 'PUT', 'PATCH'])(
    '%s /mcp returns 405 and runs nothing',
    async (method) => {
      let ran = false
      const handle = createMcpHandler({
        repo: seededRepo(),
        operations: {
          get_account: async () => {
            ran = true
            return {}
          },
        },
      })
      // Sent with a valid Key and a valid body, so only the method can be what is refused.
      const reply = await call(handle, callEvent('get_account', { method }))
      expect(reply.statusCode).toBe(405)
      expect(reply.headers.allow).toBe('POST')
      expect(ran).toBe(false)
      expect(reply.raw).toBeUndefined()
    },
  )

  test('GET is refused without asking for a Key, and opens no stream', async () => {
    const reply = await call(
      createMcpHandler({ repo: seededRepo() }),
      eventFor({ method: 'GET', headers: { accept: 'text/event-stream' } }),
    )
    expect(reply.statusCode).toBe(405)
    expect(JSON.stringify(reply.headers)).not.toContain('event-stream')
  })

  test('every response that has a body is JSON, never a stream', async () => {
    const handle = createMcpHandler({ repo: seededRepo() })
    const events = [
      listEvent(),
      callEvent('get_account'),
      callEvent('get_nothing'),
      listEvent({ headers: {} }),
      eventFor({ body: 'not json' }),
      listEvent({ path: '/nope' }),
    ]
    for (const event of events) {
      const reply = await call(handle, event)
      expect(reply.headers['content-type']).toBe('application/json')
    }
  })

  test('a path other than /mcp is not_found', async () => {
    const reply = await call(createMcpHandler({ repo: seededRepo() }), listEvent({ path: '/nope' }))
    expect(reply.statusCode).toBe(404)
    expect((reply.body as ErrorBody).error.code).toBe('not_found')
  })
})

describe('input the body can carry', () => {
  const validCall = { id: 1, method: 'tools/call', params: { name: 'get_account' } }
  const bad: [string, string | undefined][] = [
    ['no body at all', undefined],
    ['an empty body', ''],
    ['text that is not JSON', 'this is not json'],
    ['truncated JSON', '{"jsonrpc":"2.0","id":1,"method":'],
    ['JSON that is not an object', '42'],
    ['a JSON-RPC batch', JSON.stringify([{ jsonrpc: '2.0', ...validCall }])],
    ['the wrong JSON-RPC version', JSON.stringify({ ...validCall, jsonrpc: '1.0' })],
    ['no JSON-RPC version', JSON.stringify(validCall)],
    ['no method', rpcBody({ id: 1 })],
    ['a method that is not a string', rpcBody({ id: 1, method: 5 })],
    ['an id that is an object', rpcBody({ ...validCall, id: { a: 1 } })],
    ['a tool call with no params', rpcBody({ id: 1, method: 'tools/call' })],
    ['a tool call with no tool name', rpcBody({ id: 1, method: 'tools/call', params: {} })],
    [
      'a tool name that is not a string',
      rpcBody({ id: 1, method: 'tools/call', params: { name: 3 } }),
    ],
    ['a method this server does not serve', rpcBody({ id: 1, method: 'resources/list' })],
  ]

  test.each(bad)('%s returns the R8 invalid_request body', async (_name, body) => {
    const reply = await call(createMcpHandler({ repo: seededRepo() }), eventFor({ body }))
    expect(reply.statusCode).toBe(400)
    expect(reply.headers['content-type']).toBe('application/json')
    expect(reply.body).toStrictEqual({
      error: {
        code: 'invalid_request',
        fix: "Check the named field against the operation's schema and send the call again.",
        field: null,
        request_id: GATEWAY_ID,
      },
    })
    // Not a stack trace, and nothing the parser said about the input.
    expect(reply.raw).not.toMatch(/SyntaxError|Unexpected|at \S+ \(|node_modules/)
  })

  test('a malformed body is refused before the Key is looked at', async () => {
    const reply = await call(
      createMcpHandler({ repo: seededRepo() }),
      eventFor({ body: 'not json', headers: {} }),
    )
    expect((reply.body as ErrorBody).error.code).toBe('invalid_request')
  })

  test('a base64 body is decoded before it is parsed', async () => {
    const body = Buffer.from(rpcBody({ id: 9, method: 'tools/list' })).toString('base64')
    const reply = await call(
      createMcpHandler({ repo: seededRepo() }),
      eventFor({ body, isBase64Encoded: true }),
    )
    expect(reply.statusCode).toBe(200)
    expect(reply.body.id).toBe(9)
  })

  test('arguments the operation does not take are not handed to it', async () => {
    const seen: unknown[] = []
    const handle = createMcpHandler({
      repo: seededRepo(),
      operations: {
        get_account: async (ctx) => {
          seen.push(Object.keys(ctx).sort())
          return {}
        },
      },
    })
    const reply = await call(
      handle,
      eventFor({
        body: rpcBody({
          id: 1,
          method: 'tools/call',
          params: { name: 'get_account', arguments: { anything: 'goes' } },
        }),
      }),
    )
    expect(reply.statusCode).toBe(200)
    expect(seen).toEqual([['principal', 'repo']])
  })
})

describe('request_id', () => {
  test('every error response carries the gateway id, in the body and in the log line', async () => {
    const handle = createMcpHandler({ repo: seededRepo() })
    const refused = await call(handle, callEvent('get_account', { headers: {} }))
    expect((refused.body as ErrorBody).error.request_id).toBe(GATEWAY_ID)
    const unknownTool = await call(handle, callEvent('get_nothing'))
    expect(toolError(unknownTool).error.request_id).toBe(GATEWAY_ID)
    expect(unknownTool.lines[0]?.request_id).toBe(GATEWAY_ID)
  })

  test('with no gateway id, a generated UUID is used, and it matches the log line', async () => {
    const reply = await call(
      createMcpHandler({ repo: seededRepo() }),
      callEvent('get_account', { headers: {}, requestId: undefined }),
    )
    const { error } = reply.body as ErrorBody
    expect(error.request_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
    expect(reply.lines).toHaveLength(1)
    expect(reply.lines[0]?.request_id).toBe(error.request_id)
  })

  test('two requests with no gateway id get different ids', async () => {
    const handle = createMcpHandler({ repo: seededRepo() })
    const ids = new Set<string>()
    for (let i = 0; i < 2; i++) {
      const reply = await call(
        handle,
        callEvent('get_account', { headers: {}, requestId: undefined }),
      )
      ids.add((reply.body as ErrorBody).error.request_id)
    }
    expect(ids.size).toBe(2)
  })

  test('a client-supplied request id header is never used, in the body or in the log', async () => {
    // A value a client could use to smuggle a credential into the log line. It holds nothing
    // JSON.stringify escapes, so a leak would be a literal substring and this can fail.
    const smuggled = 'alc_live_FAKEKEYFAKEKEYFAKEKEYFAKEKEY0000'
    const reply = await call(
      createMcpHandler({ repo: seededRepo() }),
      callEvent('get_account', {
        headers: {
          ...AUTHED,
          'x-request-id': smuggled,
          'X-Amzn-Trace-Id': smuggled,
          'request-id': smuggled,
        },
        requestId: undefined,
      }),
    )
    expect(reply.raw).not.toContain(smuggled)
    expect(JSON.stringify(reply.lines)).not.toContain(smuggled)
    expect(reply.lines).toHaveLength(1)
  })
})

describe('the log line', () => {
  const SIX = ['duration_ms', 'key_id', 'operation', 'outcome', 'principal_kind', 'request_id']

  type Case = [
    string,
    () => APIGatewayProxyEventV2,
    { outcome: string; operation: string; principal: string },
  ]
  // Every way a request can end. A path that forgot to log, or logged twice, fails its own row.
  const cases: Case[] = [
    [
      'initialize',
      () => eventFor({ body: rpcBody({ id: 1, method: 'initialize' }) }),
      { outcome: 'ok', operation: 'unknown', principal: 'agent' },
    ],
    ['tools/list', () => listEvent(), { outcome: 'ok', operation: 'unknown', principal: 'agent' }],
    [
      'a notification',
      () => eventFor({ body: rpcBody({ method: 'notifications/initialized' }) }),
      { outcome: 'ok', operation: 'unknown', principal: 'agent' },
    ],
    [
      'a successful tool call',
      () => callEvent('get_account'),
      { outcome: 'ok', operation: 'get_account', principal: 'agent' },
    ],
    [
      'a tool call with no Key',
      () => callEvent('get_account', { headers: {} }),
      { outcome: 'key_missing', operation: 'get_account', principal: 'none' },
    ],
    [
      'a tool call with an unknown Key',
      () => callEvent('get_account', { headers: { authorization: 'Bearer nope' } }),
      { outcome: 'key_unknown', operation: 'get_account', principal: 'none' },
    ],
    [
      'tools/list with no Key',
      () => listEvent({ headers: {} }),
      { outcome: 'key_missing', operation: 'unknown', principal: 'none' },
    ],
    [
      'an unknown tool',
      () => callEvent('get_nothing'),
      { outcome: 'not_found', operation: 'unknown', principal: 'agent' },
    ],
    [
      'an unknown tool with no Key',
      () => callEvent('get_nothing', { headers: {} }),
      { outcome: 'key_missing', operation: 'unknown', principal: 'none' },
    ],
    [
      'a malformed body',
      () => eventFor({ body: 'not json' }),
      { outcome: 'invalid_request', operation: 'unknown', principal: 'none' },
    ],
    [
      'a method the server does not serve',
      () => eventFor({ body: rpcBody({ id: 1, method: 'resources/list' }) }),
      { outcome: 'invalid_request', operation: 'unknown', principal: 'agent' },
    ],
    [
      'GET',
      () => eventFor({ method: 'GET' }),
      { outcome: 'invalid_request', operation: 'unknown', principal: 'none' },
    ],
    [
      'DELETE',
      () => eventFor({ method: 'DELETE' }),
      { outcome: 'invalid_request', operation: 'unknown', principal: 'none' },
    ],
    [
      'another path',
      () => listEvent({ path: '/nope' }),
      { outcome: 'not_found', operation: 'unknown', principal: 'none' },
    ],
  ]

  test.each(cases)('one line is emitted per request: %s', async (_name, build, expected) => {
    const { lines } = await call(createMcpHandler({ repo: seededRepo() }), build())
    expect(lines).toHaveLength(1)
    const line = lines[0] as Record<string, unknown>
    expect(Object.keys(line).sort()).toEqual(SIX)
    expect(line.outcome).toBe(expected.outcome)
    expect(line.operation).toBe(expected.operation)
    expect(line.principal_kind).toBe(expected.principal)
    expect(line.request_id).toBe(GATEWAY_ID)
    expect(typeof line.duration_ms).toBe('number')
  })

  test('an operation that throws is logged once, as internal, against its tool', async () => {
    const handle = createMcpHandler({
      repo: seededRepo(),
      operations: {
        get_account: async () => {
          throw new Error('boom')
        },
      },
    })
    const { lines } = await call(handle, callEvent('get_account'))
    expect(lines).toHaveLength(1)
    expect(lines[0]?.outcome).toBe('internal')
    expect(lines[0]?.operation).toBe('get_account')
    expect(lines[0]?.principal_kind).toBe('agent')
  })

  test('a refusal after the Key was found still names the Key and the principal kind', async () => {
    const repo = seededRepo()
    const handle = createMcpHandler({
      repo,
      entries: [lifterOnly],
      operations: { lifter_thing: async () => ({}) },
    })
    const { lines } = await call(handle, callEvent('lifter_thing'))
    expect(lines).toHaveLength(1)
    expect(lines[0]?.outcome).toBe('lifter_only')
    expect(lines[0]?.operation).toBe('lifter_thing')
    expect(lines[0]?.principal_kind).toBe('agent')
    expect(lines[0]?.key_id).toBe((await repo.findKeyByHash(FAKE_KEY_SHA256))?.id)
  })

  test('a success names the Key by id, and nothing from the request', async () => {
    const repo = seededRepo()
    const smuggled = 'FAKE-ARGUMENT-VALUE-9f3a'
    const event = eventFor({
      body: rpcBody({
        id: 1,
        method: 'tools/call',
        params: { name: 'get_account', arguments: { note: smuggled } },
      }),
    })
    const { lines } = await call(createMcpHandler({ repo }), event)
    expect(lines[0]?.key_id).toBe((await repo.findKeyByHash(FAKE_KEY_SHA256))?.id)
    const written = JSON.stringify(lines)
    expect(written).not.toContain(FAKE_KEY_SHA256)
    expect(written).not.toContain('Bearer')
    expect(written).not.toContain(smuggled)
    expect(written).not.toContain('Claude Desktop')
  })

  test('a line before a Key was found has no key id', async () => {
    const { lines } = await call(
      createMcpHandler({ repo: seededRepo() }),
      callEvent('get_account', { headers: {} }),
    )
    expect(lines[0]?.key_id).toBeNull()
  })
})
