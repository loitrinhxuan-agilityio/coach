import type { APIGatewayProxyEventV2 } from 'aws-lambda'
import { captureStdout } from './db/fakes.test-helper.js'

const out = captureStdout()

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

const unauthenticated = (path: string, method: string): APIGatewayProxyEventV2 =>
  ({
    rawPath: path,
    headers: {},
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    requestContext: { requestId: 'gateway-request-0002', http: { method } },
  }) as unknown as APIGatewayProxyEventV2

function setSettings() {
  vi.stubEnv('DSQL_ENDPOINT', 'fake-cluster.dsql.invalid')
  vi.stubEnv('AWS_REGION', 'fake-region-1')
  vi.stubEnv('DSQL_DB_ROLE', 'fake-role')
}

describe('the wiring module', () => {
  test('exports a bound handler and a bound mcpHandler', async () => {
    setSettings()
    const wired = await import('./handlers.js')
    expect(Object.keys(wired).sort()).toEqual(['handler', 'mcpHandler'])

    // Neither reaches the database to refuse a request that carries no Key, so no connection is
    // attempted here, and both are the real surfaces and not stubs.
    const http = await wired.handler(unauthenticated('/api/account', 'GET'))
    expect(http.statusCode).toBe(401)
    expect(JSON.parse(String(http.body)).error.code).toBe('key_missing')

    const mcp = await wired.mcpHandler(unauthenticated('/mcp', 'POST'))
    expect(mcp.statusCode).toBe(401)
    expect(out.lines()).toHaveLength(2)
  })

  test('refuses to load when the deployment did not say where the database is', async () => {
    vi.stubEnv('DSQL_ENDPOINT', '')
    vi.stubEnv('AWS_REGION', 'fake-region-1')
    vi.stubEnv('DSQL_DB_ROLE', 'fake-role')
    await expect(import('./handlers.js')).rejects.toThrow('DSQL_ENDPOINT is not set')
  })

  test.each(['AWS_REGION', 'DSQL_DB_ROLE'])('refuses to load without %s', async (name) => {
    setSettings()
    vi.stubEnv(name, '')
    await expect(import('./handlers.js')).rejects.toThrow(`${name} is not set`)
  })
})
