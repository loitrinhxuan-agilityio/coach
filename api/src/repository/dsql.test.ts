import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'
import { type Client, type ConnectorDeps, createConnector } from '../db/connection.js'
import {
  captureStdout,
  dbError,
  droppedConnection,
  fakeDriver,
  type Script,
} from '../db/fakes.test-helper.js'
import { createTransactionRunner } from '../db/with-transaction.js'
import { createHandler } from '../surfaces/http/router.js'
import { createMcpHandler } from '../surfaces/mcp/server.js'
import { repositoryContract } from './contract.test-helper.js'
import { dsqlRepository, KEY_HASH_INDEX, KEY_NAME_INDEX } from './dsql.js'

const out = captureStdout()

// ---------------------------------------------------------------------------------------------
// Against a real PostgreSQL engine (PGlite, in process), with the real migration.
//
// READ THIS BEFORE TRUSTING THE GREEN. This proves the repository's SQL is valid PostgreSQL against
// the committed schema, and that the contract holds on a real engine. It does NOT prove Aurora DSQL
// accepts any of it. They are different engines: the migration will not even load here as written,
// because `CREATE UNIQUE INDEX ASYNC` is DSQL-only, and the one edit below strips it. DSQL's
// optimistic concurrency, its error shapes (is `constraint` set on a unique violation?), its TLS and
// its auth are all untested. Change 9017 is the first time any of that is.
//
// Why an engine and not a scripted fake: a fake that dispatches on SQL strings answers whatever it
// is shown, so it would pass a misspelt column. Here an engine that checks the SQL runs it.
// ---------------------------------------------------------------------------------------------
const migration = readFileSync(new URL('../../migrations/0001_init.sql', import.meta.url), 'utf8')
const engine = new PGlite()

beforeAll(async () => {
  await engine.waitReady
  await engine.exec(migration.replace(/INDEX ASYNC/g, 'INDEX'))
})

afterAll(async () => {
  await engine.close()
})

const engineDeps: ConnectorDeps = {
  mintAuthToken: async () => 'fake-auth-token',
  // Each repository starts with no Keys, which is what the contract requires, and keeps the one
  // settings row the migration seeded.
  connect: async () => {
    await engine.exec('DELETE FROM keys')
    const client: Client = {
      query: async (sql, params) => ({
        rows: (await engine.query(sql, params ? [...params] : undefined)).rows as never[],
      }),
      end: async () => undefined,
      on: () => client,
    }
    return client
  },
}

const makeEngineRepo = () =>
  dsqlRepository(createTransactionRunner({ connector: createConnector(() => engineDeps) }))

// The settings row is written out here, not read back from the database, so a default that
// happened to equal it could not hide a missing row.
repositoryContract(makeEngineRepo, {
  settings: { time_zone: 'Asia/Ho_Chi_Minh', display_unit: 'kg' },
})

describe('the repository against a real engine', () => {
  test('the index names this file keys on are the ones the migration created', async () => {
    const { rows } = await engine.query<{ indexname: string }>(
      "SELECT indexname FROM pg_indexes WHERE tablename = 'keys' ORDER BY indexname",
    )
    expect(rows.map((row) => row.indexname)).toEqual(
      expect.arrayContaining([KEY_HASH_INDEX, KEY_NAME_INDEX]),
    )
    expect(KEY_HASH_INDEX).toBe('keys_key_sha256_key')
    expect(KEY_NAME_INDEX).toBe('keys_name_key')
  })

  test('a name that is taken is refused with an error that names the name and not the hash', async () => {
    const repo = makeEngineRepo()
    await repo.insertKey({ name: 'taken-agent', key_sha256: 'fake-sha256-first' })
    const failure = await repo
      .insertKey({ name: 'taken-agent', key_sha256: 'fake-sha256-second' })
      .catch((error) => error)
    expect(failure).toBeInstanceOf(Error)
    expect(failure.message).toBe('a Key named taken-agent already exists')
    expect(failure.message).not.toContain('fake-sha256')
    // The driver's own error, whose detail quotes the value it rejected, is not what comes out.
    expect(failure).not.toHaveProperty('detail')
    expect(failure).not.toHaveProperty('code')
  })

  test('a hash that is taken is refused with an error that does not quote it', async () => {
    const repo = makeEngineRepo()
    await repo.insertKey({ name: 'first-agent', key_sha256: 'fake-sha256-taken' })
    const failure = await repo
      .insertKey({ name: 'second-agent', key_sha256: 'fake-sha256-taken' })
      .catch((error) => error)
    expect(failure.message).toBe('a Key with this hash already exists')
    expect(failure).not.toHaveProperty('detail')
  })

  test('a value that looks like SQL is stored and found as a value', async () => {
    const repo = makeEngineRepo()
    const hostile = "x'); DROP TABLE keys; --"
    await repo.insertKey({ name: hostile, key_sha256: hostile })
    expect((await repo.findKeyByHash(hostile))?.name).toBe(hostile)
    expect((await repo.findKeyByName(hostile))?.name).toBe(hostile)
  })

  test('a refused insert leaves the connection usable', async () => {
    const repo = makeEngineRepo()
    await repo.insertKey({ name: 'only-agent', key_sha256: 'fake-sha256-only' })
    await repo.insertKey({ name: 'only-agent', key_sha256: 'fake-sha256-other' }).catch(() => {})
    // Had the failed transaction not been rolled back, the engine would refuse everything after it.
    await repo.insertKey({ name: 'next-agent', key_sha256: 'fake-sha256-next' })
    expect((await repo.findKeyByName('next-agent'))?.name).toBe('next-agent')
  })
})

// ---------------------------------------------------------------------------------------------
// Against a scripted driver, for what a real engine will not produce on request.
// ---------------------------------------------------------------------------------------------
function repoOver(script: Script) {
  const driver = fakeDriver(() => script)
  const withTransaction = createTransactionRunner({
    connector: createConnector(() => driver.deps),
    sleep: async () => undefined,
  })
  return { repo: dsqlRepository(withTransaction), driver }
}

const ROW = { id: '00000000-0000-4000-8000-000000000001', name: 'scripted-agent' }

describe('the repository against a scripted driver', () => {
  test('a lookup returns the id and the name and nothing else the database sent', async () => {
    const { repo } = repoOver(() => ({ rows: [{ ...ROW, key_sha256: 'fake-sha256-leak' }] }))
    expect(await repo.findKeyByHash('fake-sha256-a')).toStrictEqual(ROW)
    expect(await repo.findKeyByName('scripted-agent')).toStrictEqual(ROW)
  })

  test('a lookup asks the database for the id and the name and not for the hash', async () => {
    const asked: string[] = []
    const { repo } = repoOver((sql) => {
      asked.push(sql)
      return { rows: [] }
    })
    await repo.findKeyByHash('fake-sha256-a')
    await repo.findKeyByName('nobody')
    const selects = asked.filter((sql) => sql.startsWith('SELECT'))
    expect(selects).toHaveLength(2)
    for (const sql of selects) expect(sql).toMatch(/^SELECT id, name FROM keys WHERE /)
  })

  test('a lookup that matches nothing is null', async () => {
    const { repo } = repoOver(() => ({ rows: [] }))
    expect(await repo.findKeyByHash('fake-sha256-a')).toBeNull()
    expect(await repo.findKeyByName('nobody')).toBeNull()
  })

  test('every value travels as a bound parameter and none is written into the SQL', async () => {
    const seen: { sql: string; params: readonly unknown[] | undefined }[] = []
    const { repo } = repoOver((sql, params) => {
      seen.push({ sql, params })
      return { rows: [] }
    })
    await repo.findKeyByHash('marker-hash')
    await repo.findKeyByName('marker-name')
    await repo.insertKey({ name: 'marker-name', key_sha256: 'marker-hash' })
    const statements = seen.filter(({ sql }) => !['BEGIN', 'COMMIT'].includes(sql))
    expect(statements).toHaveLength(3)
    for (const { sql } of statements) expect(sql).not.toMatch(/marker/)
    expect(statements.map(({ params }) => params)).toEqual([
      ['marker-hash'],
      ['marker-name'],
      ['marker-hash', 'marker-name'],
    ])
  })

  test('a violation of an index this file does not know is passed on as it came', async () => {
    const unknown = dbError({ code: '23505', constraint: 'some_other_key' })
    const { repo } = repoOver((sql) => {
      if (sql.startsWith('INSERT')) throw unknown
      return { rows: [] }
    })
    await expect(repo.insertKey({ name: 'a', key_sha256: 'b' })).rejects.toBe(unknown)
  })

  test('a violation with no constraint named is passed on as it came', async () => {
    const unnamed = dbError({ code: '23505' })
    const { repo } = repoOver((sql) => {
      if (sql.startsWith('INSERT')) throw unnamed
      return { rows: [] }
    })
    await expect(repo.insertKey({ name: 'a', key_sha256: 'b' })).rejects.toBe(unnamed)
  })

  test.each([
    [KEY_NAME_INDEX, 'a Key named wanted-name already exists'],
    [KEY_HASH_INDEX, 'a Key with this hash already exists'],
  ])('a violation of %s found at COMMIT is translated as well', async (constraint, message) => {
    const { repo } = repoOver((sql) => {
      if (sql === 'COMMIT') throw dbError({ code: '23505', constraint })
      return { rows: [] }
    })
    await expect(repo.insertKey({ name: 'wanted-name', key_sha256: 'b' })).rejects.toThrow(message)
  })

  test('a violation is not retried', async () => {
    const { repo, driver } = repoOver((sql) => {
      if (sql.startsWith('INSERT')) throw dbError({ code: '23505', constraint: KEY_NAME_INDEX })
      return { rows: [] }
    })
    await repo.insertKey({ name: 'a', key_sha256: 'b' }).catch(() => undefined)
    expect(driver.clients[0]?.statements.filter((sql) => sql.startsWith('INSERT'))).toHaveLength(1)
  })

  test('getSettings is null when there is no row, and is not defaulted', async () => {
    const { repo } = repoOver(() => ({ rows: [] }))
    expect(await repo.getSettings()).toBeNull()
  })

  test('getSettings returns the one row, field by field', async () => {
    const { repo } = repoOver(() => ({
      rows: [{ time_zone: 'Etc/UTC', display_unit: 'kg', cognito_sub: 'fake-sub' }],
    }))
    expect(await repo.getSettings()).toStrictEqual({ time_zone: 'Etc/UTC', display_unit: 'kg' })
  })

  test('getSettings refuses to choose between two rows', async () => {
    const { repo } = repoOver(() => ({
      rows: [
        { time_zone: 'Etc/UTC', display_unit: 'kg' },
        { time_zone: 'Asia/Ho_Chi_Minh', display_unit: 'kg' },
      ],
    }))
    await expect(repo.getSettings()).rejects.toThrow('settings holds more than one row')
  })

  test('a conflict at COMMIT is retried by the repository and the caller sees success', async () => {
    let commits = 0
    const { repo } = repoOver((sql) => {
      if (sql === 'COMMIT' && ++commits === 1) throw dbError({ code: '40001' })
      return { rows: [ROW] }
    })
    expect(await repo.findKeyByName('scripted-agent')).toStrictEqual(ROW)
    expect(commits).toBe(2)
  })
})

// ---------------------------------------------------------------------------------------------
// Behind the surface: what a caller, and a person reading the logs, actually get.
// ---------------------------------------------------------------------------------------------
const FAKE_KEY = 'abc'
const FAKE_KEY_SHA256 = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'

// `null` is a gateway that sent no id; a default parameter would turn `undefined` into the usual one.
const accountEvent = (requestId: string | null = 'gateway-request-0001'): APIGatewayProxyEventV2 =>
  ({
    rawPath: '/api/account',
    headers: { authorization: `Bearer ${FAKE_KEY}` },
    requestContext: { requestId: requestId ?? undefined, http: { method: 'GET' } },
  }) as unknown as APIGatewayProxyEventV2

const toolsListEvent = (requestId: string): APIGatewayProxyEventV2 =>
  ({
    rawPath: '/mcp',
    headers: { authorization: `Bearer ${FAKE_KEY}` },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    requestContext: { requestId, http: { method: 'POST' } },
  }) as unknown as APIGatewayProxyEventV2

describe('a database fault, seen from outside', () => {
  test('two settings rows answer internal, as no settings row does', async () => {
    const { repo } = repoOver((sql) =>
      sql.includes('FROM keys')
        ? { rows: [ROW] }
        : sql.includes('FROM settings')
          ? {
              rows: [
                { time_zone: 'Etc/UTC', display_unit: 'kg' },
                { time_zone: 'Asia/Ho_Chi_Minh', display_unit: 'kg' },
              ],
            }
          : { rows: [] },
    )
    const response = await createHandler({ repo })(accountEvent())
    expect(response.statusCode).toBe(500)
    expect(JSON.parse(String(response.body)).error.code).toBe('internal')
  })

  test('an outage answers internal, and the log shows only that it happened and for how long', async () => {
    const down = (sql: string) => {
      if (sql === 'BEGIN') throw Object.assign(droppedConnection(), { code: 'ECONNRESET' })
      return { rows: [] }
    }
    const { repo } = repoOver(down)
    const response = await createHandler({ repo })(accountEvent())

    expect(response.statusCode).toBe(500)
    expect(JSON.parse(String(response.body)).error.code).toBe('internal')

    // Everything a diagnostician has: one retry line, which names the request, then the six-field
    // request line.
    const [retry, request, ...rest] = out.lines() as Record<string, unknown>[]
    expect(rest).toEqual([])
    expect(retry).toEqual({
      event: 'db_retry',
      request_id: 'gateway-request-0001',
      reason: 'connection',
      attempt: 1,
      delay_ms: 0,
      error_code: 'ECONNRESET',
    })
    expect(Object.keys(request ?? {}).sort()).toEqual([
      'duration_ms',
      'key_id',
      'operation',
      'outcome',
      'principal_kind',
      'request_id',
    ])
    expect(request).toMatchObject({ outcome: 'internal', key_id: null, operation: 'get_account' })
    // The line has no room for the cause: not the SQLSTATE of a final failure, not the message.
    expect(JSON.stringify(out.lines())).not.toContain('Connection terminated')
  })

  test('a Key that authenticates is served settings from the database', async () => {
    const { repo } = repoOver((sql, params) => {
      if (sql.includes('FROM keys')) return { rows: params?.[0] === FAKE_KEY_SHA256 ? [ROW] : [] }
      if (sql.includes('FROM settings')) {
        return { rows: [{ time_zone: 'Etc/UTC', display_unit: 'kg' }] }
      }
      return { rows: [] }
    })
    const response = await createHandler({ repo })(accountEvent())
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(String(response.body))).toStrictEqual({
      agent: { name: 'scripted-agent' },
      settings: { time_zone: 'Etc/UTC', display_unit: 'kg' },
      standing_notes: [],
    })
  })
})

// A retry line is useful only if it can be tied to the request that caused it.
describe('a retry line names its request', () => {
  const dropsOnBegin = (sql: string): { rows: object[] } => {
    if (sql === 'BEGIN') throw Object.assign(droppedConnection(), { code: 'ECONNRESET' })
    return { rows: [] }
  }
  const lines = () => out.lines() as Record<string, unknown>[]

  test('on the HTTP surface, with the gateway id', async () => {
    await createHandler({ repo: repoOver(dropsOnBegin).repo })(accountEvent('http-request-id'))
    const [retry, request] = lines()
    expect(retry?.request_id).toBe('http-request-id')
    expect(request?.request_id).toBe('http-request-id')
  })

  test('on the MCP surface, with the gateway id', async () => {
    await createMcpHandler({ repo: repoOver(dropsOnBegin).repo })(toolsListEvent('mcp-request-id'))
    const [retry, request] = lines()
    expect(retry?.event).toBe('db_retry')
    expect(retry?.request_id).toBe('mcp-request-id')
    expect(request?.request_id).toBe('mcp-request-id')
  })

  test('with the generated id when the gateway sent none, the same one the request line has', async () => {
    await createHandler({ repo: repoOver(dropsOnBegin).repo })(accountEvent(null))
    const [retry, request] = lines()
    expect(retry?.request_id).toEqual(expect.any(String))
    expect(retry?.request_id).not.toBe('')
    expect(retry?.request_id).not.toBe('gateway-request-0001')
    expect(retry?.request_id).toBe(request?.request_id)
  })

  test('each of two requests in flight at once names itself and not the other', async () => {
    // A pause before the failure lets the two requests interleave.
    const slowDrop = async (sql: string): Promise<{ rows: object[] }> => {
      await new Promise((resolve) => setTimeout(resolve, 5))
      return dropsOnBegin(sql)
    }
    const a = createHandler({ repo: repoOver(slowDrop).repo })
    const b = createMcpHandler({ repo: repoOver(slowDrop).repo })
    await Promise.all([a(accountEvent('request-a')), b(toolsListEvent('request-b'))])

    const retries = lines().filter((line) => line.event === 'db_retry')
    const requests = lines().filter((line) => line.event === undefined)
    expect(retries.map((line) => line.request_id).sort()).toEqual(['request-a', 'request-b'])
    expect(requests.map((line) => line.request_id).sort()).toEqual(['request-a', 'request-b'])
  })

  test('a request that has finished leaves nothing behind for the next retry outside one', async () => {
    await createHandler({ repo: repoOver(dropsOnBegin).repo })(accountEvent('finished-request'))
    const outside = repoOver(dropsOnBegin).repo
    await outside.getSettings().catch(() => undefined)
    const last = lines()
      .filter((line) => line.event === 'db_retry')
      .at(-1)
    expect(last?.request_id).toBeNull()
  })
})
