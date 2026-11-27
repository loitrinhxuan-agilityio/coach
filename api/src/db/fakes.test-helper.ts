import pg from 'pg'
import type { Client, ConnectorDeps } from './connection.js'

// A scripted stand-in for the driver. It answers whatever its script says and keeps what it was
// asked, so a test can say "the first connection is dead" or "COMMIT fails once" and then count.
// It proves the lifecycle logic and nothing about Aurora DSQL.

export type Answer = { rows: object[] }
export type Script = (
  sql: string,
  params: readonly unknown[] | undefined,
) => Answer | Promise<Answer>

export const ok: Script = () => ({ rows: [] })

export class FakeClient implements Client {
  statements: string[] = []
  ended = false
  private listeners: Record<'error' | 'end', (() => void)[]> = { error: [], end: [] }

  constructor(private script: Script) {}

  async query<Row extends object>(sql: string, params?: readonly unknown[]) {
    this.statements.push(sql)
    return (await this.script(sql, params)) as { rows: Row[] }
  }

  async end(): Promise<void> {
    this.ended = true
  }

  on(event: 'error' | 'end', listener: () => void): this {
    this.listeners[event].push(listener)
    return this
  }

  emit(event: 'error' | 'end'): void {
    for (const listener of this.listeners[event]) listener()
  }
}

// `scriptFor(n)` is the script of the nth connection, counting from 0.
export function fakeDriver(scriptFor: (n: number) => Script = () => ok) {
  const clients: FakeClient[] = []
  const mints: string[] = []
  const connectedWith: string[] = []
  const deps: ConnectorDeps = {
    mintAuthToken: async () => {
      const authToken = `fake-auth-token-${mints.length + 1}`
      mints.push(authToken)
      return authToken
    },
    connect: async (authToken) => {
      connectedWith.push(authToken)
      const client = new FakeClient(scriptFor(clients.length))
      clients.push(client)
      return client
    },
  }
  return { deps, clients, mints, connectedWith }
}

// A database error as the driver raises it: the driver's own class, with the fields it sets.
export function dbError(fields: { code?: string; constraint?: string; message?: string }): Error {
  return Object.assign(new pg.DatabaseError(fields.message ?? 'database error', 0, 'error'), fields)
}

export const concurrencyConflict = () =>
  dbError({ code: '40001', message: 'change conflicts with another transaction (OC000)' })

export const droppedConnection = () => new Error('Connection terminated unexpectedly')

// Keeps retry and request lines out of the test run's output, and lets a test read them. Call it
// once at the top of a test file. The spy is restored after every test.
export function captureStdout(): { lines: () => unknown[] } {
  let write: { mock: { calls: unknown[][] } } = { mock: { calls: [] } }
  beforeEach(() => {
    write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })
  return {
    // Everything written since the test began, as parsed lines.
    lines: () =>
      write.mock.calls
        .map((call) => String(call[0]))
        .join('')
        .split('\n')
        .filter((line) => line !== '')
        .map((line) => JSON.parse(line)),
  }
}

// Waits for a promise and discards how it ended, for a call whose failure the test expects and
// does not need to examine.
export const settled = (promise: Promise<unknown>): Promise<void> =>
  promise.then(
    () => undefined,
    () => undefined,
  )
