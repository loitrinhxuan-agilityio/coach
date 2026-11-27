import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { createServer, type IncomingMessage } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { captureStdout } from './db/fakes.test-helper.js'
import {
  createMigrationHandler,
  type Deps,
  type ResourceEvent,
  readMigrations,
  TIMEOUT_MARGIN_MS,
} from './migrate-handler.js'

captureStdout()

const event = (
  type: ResourceEvent['RequestType'],
  url = 'https://example.invalid/answer',
): ResourceEvent => ({
  RequestType: type,
  ResponseURL: url,
  StackId: 'fake-stack-id',
  RequestId: 'fake-request-id',
  LogicalResourceId: 'Migrations',
})

const plenty = { getRemainingTimeInMillis: () => 600_000 }

function build(migrate: Deps['migrate']) {
  const answers: Parameters<Deps['respond']>[] = []
  const handler = createMigrationHandler({
    migrate,
    respond: async (url, answer) => {
      answers.push([url, answer])
    },
  })
  return { handler, answers }
}

describe('answering CloudFormation', () => {
  test.each(['Create', 'Update'] as const)(
    '%s runs the migrations and answers SUCCESS',
    async (type) => {
      const migrate = vi.fn(async () => ['0001_init'])
      const { handler, answers } = build(migrate)
      await handler(event(type), plenty)
      expect(migrate).toHaveBeenCalledOnce()
      expect(answers).toHaveLength(1)
      const [url, answer] = answers[0] as Parameters<Deps['respond']>
      expect(url).toBe('https://example.invalid/answer')
      expect(answer).toMatchObject({
        Status: 'SUCCESS',
        StackId: 'fake-stack-id',
        RequestId: 'fake-request-id',
        LogicalResourceId: 'Migrations',
        PhysicalResourceId: 'migrations',
        Data: { applied: '0001_init' },
      })
    },
  )

  test('Delete touches nothing: forward-only means the data outlives the stack resource', async () => {
    const migrate = vi.fn(async () => [])
    const { handler, answers } = build(migrate)
    await handler({ ...event('Delete'), PhysicalResourceId: 'migrations' }, plenty)
    expect(migrate).not.toHaveBeenCalled()
    expect(answers[0]?.[1].Status).toBe('SUCCESS')
  })

  test('the physical id CloudFormation already knows is kept on Update', async () => {
    const { handler, answers } = build(async () => [])
    await handler({ ...event('Update'), PhysicalResourceId: 'earlier-id' }, plenty)
    expect(answers[0]?.[1].PhysicalResourceId).toBe('earlier-id')
  })

  test('a failure is answered FAILED with its reason, and does not throw', async () => {
    const { handler, answers } = build(async () => {
      throw new Error('index keys_name_key is not valid')
    })
    await expect(handler(event('Create'), plenty)).resolves.toBeUndefined()
    expect(answers).toHaveLength(1)
    expect(answers[0]?.[1]).toMatchObject({
      Status: 'FAILED',
      Reason: 'Error: index keys_name_key is not valid',
    })
  })

  test('a reason longer than CloudFormation accepts is cut', async () => {
    const { handler, answers } = build(async () => {
      throw new Error('x'.repeat(5000))
    })
    await handler(event('Create'), plenty)
    expect(answers[0]?.[1].Reason).toHaveLength(1000)
  })

  test('a thrown non-Error is still answered', async () => {
    const { handler, answers } = build(async () => {
      throw 'a string'
    })
    await handler(event('Create'), plenty)
    expect(answers[0]?.[1]).toMatchObject({ Status: 'FAILED', Reason: 'unknown failure' })
  })

  test('a migration that never finishes is answered before the Lambda runs out of time', async () => {
    const { handler, answers } = build(() => new Promise<string[]>(() => undefined))
    await handler(event('Create'), { getRemainingTimeInMillis: () => TIMEOUT_MARGIN_MS + 20 })
    expect(answers[0]?.[1]).toMatchObject({ Status: 'FAILED' })
    expect(answers[0]?.[1].Reason).toContain('ran out of time')
  })

  test('the timer is cleared when the migrations finish, so it cannot answer a second time', async () => {
    vi.useFakeTimers()
    try {
      const { handler, answers } = build(async () => [])
      await handler(event('Create'), { getRemainingTimeInMillis: () => TIMEOUT_MARGIN_MS + 50 })
      expect(vi.getTimerCount()).toBe(0)
      await vi.advanceTimersByTimeAsync(1000)
      expect(answers).toHaveLength(1)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('readMigrations', () => {
  const directory = () => mkdtempSync(join(tmpdir(), 'migrations-'))

  test('reads every .sql file in order of name, naming each without its extension', async () => {
    const dir = directory()
    writeFileSync(join(dir, '0002_b.sql'), 'SELECT 2')
    writeFileSync(join(dir, '0001_a.sql'), 'SELECT 1')
    writeFileSync(join(dir, 'README.md'), 'not sql')
    expect(await readMigrations(dir)).toEqual([
      { name: '0001_a', sql: 'SELECT 1' },
      { name: '0002_b', sql: 'SELECT 2' },
    ])
  })

  test('a directory with no migrations is an error, not an up-to-date database', async () => {
    const dir = directory()
    writeFileSync(join(dir, 'README.md'), 'not sql')
    await expect(readMigrations(dir)).rejects.toThrow('no .sql files')
  })
})

// The exported handler, with the real response writer, against a local server standing in for
// the pre-signed URL CloudFormation hands out. No database is reached: the settings are missing, and
// that is the point. The failure must still be told to CloudFormation.
describe('the deployed handler', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  async function call(type: ResourceEvent['RequestType']) {
    const received: { method?: string; headers: IncomingMessage['headers']; body: string }[] = []
    const server = createServer((request, response) => {
      let body = ''
      request.on('data', (chunk) => {
        body += chunk
      })
      request.on('end', () => {
        received.push({ method: request.method, headers: request.headers, body })
        response.end()
      })
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const { port } = server.address() as AddressInfo
    try {
      const { handler } = await import('./migrate-handler.js')
      await handler(event(type, `http://127.0.0.1:${port}/answer?signature=fake`), plenty)
    } finally {
      await new Promise((resolve) => server.close(resolve))
    }
    return received
  }

  function taskRoot() {
    const dir = mkdtempSync(join(tmpdir(), 'task-root-'))
    mkdirSync(join(dir, 'migrations'))
    writeFileSync(join(dir, 'migrations', '0001_x.sql'), 'SELECT 1')
    vi.stubEnv('LAMBDA_TASK_ROOT', dir)
  }

  test('a missing DSQL_DB_ROLE is reported to CloudFormation by name, and no other setting is echoed', async () => {
    taskRoot()
    vi.stubEnv('DSQL_ENDPOINT', 'sentinel-endpoint.dsql.invalid')
    vi.stubEnv('AWS_REGION', 'sentinel-region-1')
    vi.stubEnv('DSQL_DB_ROLE', '')
    const received = await call('Create')
    expect(received).toHaveLength(1)
    expect(received[0]?.method).toBe('PUT')
    // The pre-signed URL wants no Content-Type.
    expect(received[0]?.headers['content-type']).toBe('')
    const answer = JSON.parse(received[0]?.body ?? '{}')
    expect(answer.Status).toBe('FAILED')
    expect(answer.Reason).toContain('DSQL_DB_ROLE is not set')
    // The name is what the error carries, never a value of anything it read.
    expect(answer.Reason).not.toContain('sentinel')
  })

  test('a missing DSQL_ENDPOINT is reported by name, and the role it was given is not echoed', async () => {
    taskRoot()
    vi.stubEnv('DSQL_ENDPOINT', '')
    vi.stubEnv('AWS_REGION', 'sentinel-region-1')
    vi.stubEnv('DSQL_DB_ROLE', 'sentinel-role')
    const answer = JSON.parse((await call('Create'))[0]?.body ?? '{}')
    expect(answer.Status).toBe('FAILED')
    expect(answer.Reason).toContain('DSQL_ENDPOINT is not set')
    expect(answer.Reason).not.toContain('sentinel')
  })

  test('a missing task root is reported too', async () => {
    vi.stubEnv('LAMBDA_TASK_ROOT', '')
    const received = await call('Update')
    expect(JSON.parse(received[0]?.body ?? '{}').Reason).toContain('LAMBDA_TASK_ROOT is not set')
  })

  test('Delete is answered SUCCESS without any setting at all', async () => {
    vi.stubEnv('LAMBDA_TASK_ROOT', '')
    const received = await call('Delete')
    expect(JSON.parse(received[0]?.body ?? '{}').Status).toBe('SUCCESS')
  })
})
