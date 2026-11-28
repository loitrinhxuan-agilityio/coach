import pg from 'pg'
import type { Client, ConnectorDeps } from './connection.js'
import { ConnectionLostError } from './errors.js'

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

  // A close that neither resolves nor rejects: the socket the server dropped, which pg's end()
  // waits on for ever. `ended` is still set, because end() was called. This is not a close that
  // fails, which is a different fixture; see rejectsOnClose.
  hangOnClose(): this {
    this.end = () => {
      this.ended = true
      return new Promise<void>(() => {})
    }
    return this
  }

  // A close that fails at once.
  rejectsOnClose(): this {
    this.end = async () => {
      this.ended = true
      throw new Error('socket already closed')
    }
    return this
  }

  on(event: 'error' | 'end', listener: () => void): this {
    this.listeners[event].push(listener)
    return this
  }

  emit(event: 'error' | 'end'): void {
    for (const listener of this.listeners[event]) listener()
  }
}

// `scriptFor(n)` is the script of the nth connection, counting from 0. `closeHangs` makes every
// connection's close hang, for the one case a test must not be able to pass by luck.
export function fakeDriver(
  scriptFor: (n: number) => Script = () => ok,
  { closeHangs = false }: { closeHangs?: boolean } = {},
) {
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
      if (closeHangs) client.hangOnClose()
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

// What the real client's adapter makes of pg's "Connection terminated unexpectedly".
export const droppedConnection = () => new ConnectionLostError('Connection terminated unexpectedly')

// A socket error, which carries the operating system's name for it.
export const socketReset = () => Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' })

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

// Settles with the promise's outcome, or rejects after `ms` if it has not settled by then. A test
// of "this must not wait for that" uses it so that a stall fails at once, and with a name, rather
// than as the runner's generic timeout.
export function within<T>(promise: Promise<T>, ms = 250): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  const stalled = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`stalled: still waiting after ${ms} ms`)), ms)
  })
  return Promise.race([promise, stalled]).finally(() => clearTimeout(timer))
}

// Waits for a promise and discards how it ended, for a call whose failure the test expects and
// does not need to examine.
export const settled = (promise: Promise<unknown>): Promise<void> =>
  promise.then(
    () => undefined,
    () => undefined,
  )
