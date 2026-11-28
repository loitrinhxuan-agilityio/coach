// The real wiring: the settings read from the environment, the real signer's call and the real
// driver's constructor, with the driver and the signer replaced by spies. It proves this module
// hands them the right arguments, which a fake driver behind createConnector cannot, because that
// fake is what replaces this code. It does not prove DSQL accepts them.
const mocks = vi.hoisted(() => ({
  clients: [] as { config: Record<string, unknown>; connect: ReturnType<typeof vi.fn> }[],
  signers: [] as { config: Record<string, unknown> }[],
  admin: vi.fn(),
  plain: vi.fn(),
  query: vi.fn(),
  end: vi.fn(),
  on: vi.fn(),
  connectError: undefined as Error | undefined,
}))

vi.mock('pg', () => ({
  default: {
    Client: class {
      config: Record<string, unknown>
      connect = vi.fn(async () => {
        if (mocks.connectError) throw mocks.connectError
      })
      query = mocks.query
      end = mocks.end
      on = mocks.on
      constructor(config: Record<string, unknown>) {
        this.config = config
        mocks.clients.push(this)
      }
    },
  },
}))

vi.mock('@aws-sdk/dsql-signer', () => ({
  DsqlSigner: class {
    constructor(config: Record<string, unknown>) {
      mocks.signers.push({ config })
    }
    getDbConnectAdminAuthToken = mocks.admin
    getDbConnectAuthToken = mocks.plain
  },
}))

import { dsqlDeps, getConnection, readDsqlSettings } from './connection.js'
import { ConnectionLostError } from './errors.js'

const SETTINGS = {
  host: 'fake-cluster.dsql.invalid',
  region: 'fake-region-1',
}

beforeEach(() => {
  mocks.clients.length = 0
  mocks.signers.length = 0
  mocks.admin.mockReset().mockResolvedValue('fake-admin-auth-token')
  mocks.plain.mockReset().mockResolvedValue('fake-plain-auth-token')
  mocks.query.mockReset()
  mocks.end.mockReset()
  mocks.on.mockReset()
  mocks.connectError = undefined
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('the settings', () => {
  const env = {
    DSQL_ENDPOINT: SETTINGS.host,
    AWS_REGION: SETTINGS.region,
    DSQL_DB_ROLE: 'fake-role',
  }

  test('are read from the three variables', () => {
    expect(readDsqlSettings(env)).toEqual({ ...SETTINGS, role: 'fake-role' })
  })

  test.each(Object.keys(env))('a missing %s is named, and its value is not', (name) => {
    const without = { ...env, [name]: undefined }
    expect(() => readDsqlSettings(without)).toThrow(`${name} is not set`)
  })

  test('an empty value is a missing one', () => {
    expect(() => readDsqlSettings({ ...env, DSQL_ENDPOINT: '' })).toThrow(
      'DSQL_ENDPOINT is not set',
    )
  })
})

describe('the real driver and signer', () => {
  test('the admin role connects with the admin auth token as its password, over TLS', async () => {
    const deps = dsqlDeps({ ...SETTINGS, role: 'admin' })
    const authToken = await deps.mintAuthToken()
    expect(authToken).toBe('fake-admin-auth-token')
    expect(mocks.plain).not.toHaveBeenCalled()
    expect(mocks.signers[0]?.config).toEqual({ hostname: SETTINGS.host, region: SETTINGS.region })

    await deps.connect(authToken)
    const [client] = mocks.clients
    expect(client?.config).toEqual({
      host: SETTINGS.host,
      port: 5432,
      database: 'postgres',
      user: 'admin',
      password: 'fake-admin-auth-token',
      ssl: { rejectUnauthorized: true },
      connectionTimeoutMillis: 5000,
      query_timeout: 5000,
    })
    expect(client?.connect).toHaveBeenCalledTimes(1)
  })

  test('any other role connects with the ordinary auth token', async () => {
    const deps = dsqlDeps({ ...SETTINGS, role: 'fake-app-role' })
    expect(await deps.mintAuthToken()).toBe('fake-plain-auth-token')
    expect(mocks.admin).not.toHaveBeenCalled()
    await deps.connect('fake-plain-auth-token')
    expect(mocks.clients[0]?.config).toMatchObject({
      user: 'fake-app-role',
      password: 'fake-plain-auth-token',
    })
  })

  test('the client it hands back passes statements, parameters, end and events through', async () => {
    mocks.query.mockResolvedValue({ rows: [{ a: 1 }], rowCount: 1, fields: [] })
    const client = await dsqlDeps({ ...SETTINGS, role: 'admin' }).connect('fake-admin-auth-token')

    expect(await client.query('SELECT $1', ['x'])).toEqual({ rows: [{ a: 1 }] })
    expect(mocks.query).toHaveBeenCalledWith('SELECT $1', ['x'])
    await client.query('BEGIN')
    expect(mocks.query).toHaveBeenLastCalledWith('BEGIN', undefined)

    const listener = () => undefined
    client.on('error', listener)
    expect(mocks.on).toHaveBeenCalledWith('error', listener)
    await client.end()
    expect(mocks.end).toHaveBeenCalledTimes(1)
  })

  test('statement_timeout is not sent, because nobody has shown DSQL accepts it at startup', async () => {
    await dsqlDeps({ ...SETTINGS, role: 'admin' }).connect('fake-admin-auth-token')
    expect(mocks.clients[0]?.config).not.toHaveProperty('statement_timeout')
    expect(mocks.clients[0]?.config.query_timeout).toBe(5000)
  })

  test("the driver's own coded-less errors from a query become ConnectionLostError", async () => {
    const client = await dsqlDeps({ ...SETTINGS, role: 'admin' }).connect('x')
    for (const message of ['Connection terminated unexpectedly', 'Query read timeout']) {
      mocks.query.mockRejectedValueOnce(new Error(message))
      const failure = await client.query('SELECT 1').catch((error) => error)
      expect(failure).toBeInstanceOf(ConnectionLostError)
      expect(failure.message).toBe(message)
    }
  })

  test('any other error from a query passes through as the same object', async () => {
    const client = await dsqlDeps({ ...SETTINGS, role: 'admin' }).connect('x')
    const database = Object.assign(new Error('Connection terminated unexpectedly'), {
      code: '42601',
    })
    const plain = new Error('something else')
    mocks.query.mockRejectedValueOnce(database).mockRejectedValueOnce(plain)
    await expect(client.query('SELECT 1')).rejects.toBe(database)
    await expect(client.query('SELECT 1')).rejects.toBe(plain)
  })

  test('a connect that fails is the error the caller sees', async () => {
    mocks.connectError = new Error('connect failed')
    await expect(dsqlDeps({ ...SETTINGS, role: 'admin' }).connect('x')).rejects.toBe(
      mocks.connectError,
    )
  })
})

describe('the module-scope connection', () => {
  test('is made from the environment at the first request, and not before', async () => {
    // Loading the module above touched nothing.
    expect(mocks.signers).toHaveLength(0)
    expect(mocks.clients).toHaveLength(0)

    await expect(getConnection()).rejects.toThrow('DSQL_ENDPOINT is not set')

    vi.stubEnv('DSQL_ENDPOINT', SETTINGS.host)
    vi.stubEnv('AWS_REGION', SETTINGS.region)
    vi.stubEnv('DSQL_DB_ROLE', 'admin')
    const first = await getConnection(() => 0)
    expect(mocks.clients).toHaveLength(1)
    expect(mocks.clients[0]?.config).toMatchObject({ host: SETTINGS.host, user: 'admin' })

    // And it is one connection per container.
    expect(await getConnection(() => 1000)).toBe(first)
    expect(mocks.clients).toHaveLength(1)
  })
})
