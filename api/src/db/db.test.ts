import { AUTH_TOKEN_MAX_AGE_MS, createConnector } from './connection.js'
import { codeOf, isConcurrencyFailure, isConnectionFailure } from './errors.js'
import {
  captureStdout,
  concurrencyConflict,
  dbError,
  droppedConnection,
  type FakeClient,
  fakeDriver,
  ok,
  type Script,
  settled,
} from './fakes.test-helper.js'
import { backoffDelay, createTransactionRunner, MAX_ATTEMPTS } from './with-transaction.js'

const TEN_MINUTES = 600_000

const out = captureStdout()

describe('the connection', () => {
  test('nothing connects, or reads the environment, until the first request', () => {
    const makeDeps = vi.fn(() => fakeDriver().deps)
    createConnector(makeDeps)
    expect(makeDeps).not.toHaveBeenCalled()
  })

  test('the deps are built once, however many connections follow', async () => {
    const driver = fakeDriver()
    const makeDeps = vi.fn(() => driver.deps)
    const { getConnection } = createConnector(makeDeps)
    await getConnection(() => 0)
    await getConnection(() => TEN_MINUTES + 1)
    await getConnection(() => 2 * TEN_MINUTES + 2)
    expect(driver.clients).toHaveLength(3)
    expect(makeDeps).toHaveBeenCalledTimes(1)
  })

  test('a connection is reused while it is fresh', async () => {
    const driver = fakeDriver()
    const { getConnection } = createConnector(() => driver.deps)
    const first = await getConnection(() => 0)
    const second = await getConnection(() => 1000)
    expect(second).toBe(first)
    expect(driver.mints).toHaveLength(1)
  })

  test('an auth token older than ten minutes is re-minted, and exactly ten minutes is not', async () => {
    expect(AUTH_TOKEN_MAX_AGE_MS).toBe(TEN_MINUTES)
    const driver = fakeDriver()
    const { getConnection } = createConnector(() => driver.deps)

    const first = await getConnection(() => 0)
    expect(await getConnection(() => TEN_MINUTES)).toBe(first)
    expect(driver.mints).toHaveLength(1)

    const second = await getConnection(() => TEN_MINUTES + 1)
    expect(second).not.toBe(first)
    // The new connection was opened with the new auth token, and the old one was closed.
    expect(driver.connectedWith).toEqual(['fake-auth-token-1', 'fake-auth-token-2'])
    expect(driver.clients[0]?.ended).toBe(true)
    expect(driver.clients[1]?.ended).toBe(false)
  })

  test('the age is counted from when the auth token was minted, not from the last use', async () => {
    const driver = fakeDriver()
    const { getConnection } = createConnector(() => driver.deps)
    await getConnection(() => 0)
    // Used every nine minutes, so it is never idle, and is still replaced at ten.
    await getConnection(() => 9 * 60_000)
    expect(driver.mints).toHaveLength(1)
    await getConnection(() => 18 * 60_000)
    expect(driver.mints).toHaveLength(2)
  })

  test('requests that arrive together share one connection', async () => {
    const driver = fakeDriver()
    const { getConnection } = createConnector(() => driver.deps)
    const [a, b, c] = await Promise.all([getConnection(), getConnection(), getConnection()])
    expect(a).toBe(b)
    expect(b).toBe(c)
    expect(driver.clients).toHaveLength(1)
  })

  test('a stale connection found by requests that arrive together is replaced once', async () => {
    const driver = fakeDriver()
    const { getConnection } = createConnector(() => driver.deps)
    await getConnection(() => 0)
    const [a, b] = await Promise.all([
      getConnection(() => TEN_MINUTES + 1),
      getConnection(() => TEN_MINUTES + 1),
    ])
    expect(a).toBe(b)
    expect(driver.clients).toHaveLength(2)
  })

  test('a connect that failed is not remembered', async () => {
    let attempts = 0
    const driver = fakeDriver()
    const { getConnection } = createConnector(() => ({
      ...driver.deps,
      connect: async (authToken) => {
        attempts += 1
        if (attempts === 1) throw new Error('cannot connect')
        return driver.deps.connect(authToken)
      },
    }))
    await expect(getConnection()).rejects.toThrow('cannot connect')
    await expect(getConnection()).resolves.toBeDefined()
    expect(attempts).toBe(2)
  })

  test.each(['error', 'end'] as const)(
    'a connection that emits %s is replaced before it is used again',
    async (event) => {
      const driver = fakeDriver()
      const { getConnection } = createConnector(() => driver.deps)
      const first = await getConnection(() => 0)
      driver.clients[0]?.emit(event)
      const second = await getConnection(() => 1000)
      expect(second).not.toBe(first)
      expect(driver.clients[0]?.ended).toBe(true)
    },
  )

  test('discarding a connection closes it and the next request gets a new one', async () => {
    const driver = fakeDriver()
    const { getConnection, discardConnection } = createConnector(() => driver.deps)
    const first = await getConnection(() => 0)
    await discardConnection(first)
    expect(driver.clients[0]?.ended).toBe(true)
    expect(await getConnection(() => 1)).not.toBe(first)
  })

  test('discarding an old connection leaves the one that replaced it alone', async () => {
    const driver = fakeDriver()
    const { getConnection, discardConnection } = createConnector(() => driver.deps)
    const old = await getConnection(() => 0)
    const replacement = await getConnection(() => TEN_MINUTES + 1)
    await discardConnection(old)
    expect(driver.clients[1]?.ended).toBe(false)
    expect(await getConnection(() => TEN_MINUTES + 2)).toBe(replacement)
  })

  test('a connection that will not close does not fail the request that replaces it', async () => {
    const driver = fakeDriver()
    const { getConnection } = createConnector(() => driver.deps)
    await getConnection(() => 0)
    const first = driver.clients[0] as FakeClient
    first.end = async () => {
      throw new Error('socket already closed')
    }
    await expect(getConnection(() => TEN_MINUTES + 1)).resolves.toBeDefined()
  })
})

// A runner over a fake driver, with no real waiting and a jitter the test chooses.
function runnerOver(scriptFor: (n: number) => Script, random = () => 1) {
  const driver = fakeDriver(scriptFor)
  const connector = createConnector(() => driver.deps)
  const sleeps: number[] = []
  const withTransaction = createTransactionRunner({
    connector,
    sleep: async (ms) => {
      sleeps.push(ms)
    },
    random,
  })
  return { withTransaction, driver, sleeps }
}

// Fails COMMIT with `error` for the first `times` commits, on whichever connection.
function failingCommit(error: () => Error, times = Number.POSITIVE_INFINITY): Script {
  let commits = 0
  return (sql) => {
    if (sql === 'COMMIT' && ++commits <= times) throw error()
    return { rows: [] }
  }
}

describe('withTransaction', () => {
  test('runs the function between BEGIN and COMMIT and returns what it returned', async () => {
    const { withTransaction, driver } = runnerOver(() => (sql) => ({ rows: [{ sql }] }))
    const result = await withTransaction(async (client) => {
      await client.query('SELECT 1')
      return 'done'
    })
    expect(result).toBe('done')
    expect(driver.clients[0]?.statements).toEqual(['BEGIN', 'SELECT 1', 'COMMIT'])
  })

  describe('a concurrency failure', () => {
    test('is tried three times in all, then the failure surfaces unchanged', async () => {
      expect(MAX_ATTEMPTS).toBe(3)
      const { withTransaction, driver } = runnerOver(() => failingCommit(concurrencyConflict))
      let runs = 0
      const failure = await withTransaction(async () => {
        runs += 1
      }).catch((error) => error)
      expect(runs).toBe(3)
      expect(codeOf(failure)).toBe('40001')
      // The same connection throughout: a conflict is no reason to reconnect.
      expect(driver.clients).toHaveLength(1)
    })

    test('succeeds when a later attempt does', async () => {
      const { withTransaction } = runnerOver(() => failingCommit(concurrencyConflict, 2))
      let runs = 0
      const result = await withTransaction(async () => ++runs)
      expect(result).toBe(3)
    })

    test('is retried when it is raised by a statement and not only by COMMIT', async () => {
      let statements = 0
      const { withTransaction } = runnerOver(() => (sql) => {
        if (sql === 'UPDATE x' && ++statements === 1) throw concurrencyConflict()
        return { rows: [] }
      })
      await withTransaction(async (client) => {
        await client.query('UPDATE x')
      })
      expect(statements).toBe(2)
    })

    test('rolls back before each retry', async () => {
      const { withTransaction, driver } = runnerOver(() => failingCommit(concurrencyConflict, 1))
      await withTransaction(async () => undefined)
      expect(driver.clients[0]?.statements).toEqual([
        'BEGIN',
        'COMMIT',
        'ROLLBACK',
        'BEGIN',
        'COMMIT',
      ])
    })

    test('waits longer each time, and the wait carries the jitter', async () => {
      const top = runnerOver(
        () => failingCommit(concurrencyConflict),
        () => 1,
      )
      await top.withTransaction(async () => undefined).catch(() => undefined)
      expect(top.sleeps).toEqual([50, 100])

      const bottom = runnerOver(
        () => failingCommit(concurrencyConflict),
        () => 0,
      )
      await bottom.withTransaction(async () => undefined).catch(() => undefined)
      expect(bottom.sleeps).toEqual([25, 50])

      const middle = runnerOver(
        () => failingCommit(concurrencyConflict),
        () => 0.5,
      )
      await middle.withTransaction(async () => undefined).catch(() => undefined)
      expect(middle.sleeps).toEqual([38, 75])
    })

    test('is not waited for after the last attempt', async () => {
      const { withTransaction, sleeps } = runnerOver(() => failingCommit(concurrencyConflict))
      await withTransaction(async () => undefined).catch(() => undefined)
      expect(sleeps).toHaveLength(MAX_ATTEMPTS - 1)
    })

    test('writes one line per retry, with the reason, the attempt, the wait and the code', async () => {
      const { withTransaction } = runnerOver(() => failingCommit(concurrencyConflict))
      await settled(withTransaction(async () => undefined))
      const lines = out.lines()
      expect(lines).toEqual([
        { event: 'db_retry', reason: 'concurrency', attempt: 1, delay_ms: 50, error_code: '40001' },
        {
          event: 'db_retry',
          reason: 'concurrency',
          attempt: 2,
          delay_ms: 100,
          error_code: '40001',
        },
      ])
    })

    test('a retry line says nothing of the error but its code', async () => {
      const leaky = () =>
        dbError({
          code: '40001',
          message: 'leaky-message-marker',
          constraint: 'leaky-constraint-marker',
        })
      const { withTransaction } = runnerOver(() => failingCommit(leaky))
      await settled(withTransaction(async () => undefined))
      const lines = out.lines()
      expect(lines).toHaveLength(2)
      const written = JSON.stringify(lines)
      expect(written).not.toContain('leaky-message-marker')
      expect(written).not.toContain('leaky-constraint-marker')
      for (const line of lines) {
        expect(Object.keys(line as object).sort()).toEqual([
          'attempt',
          'delay_ms',
          'error_code',
          'event',
          'reason',
        ])
      }
    })
  })

  describe('an error that is not a concurrency failure', () => {
    const errors: [string, () => unknown][] = [
      ['a unique violation', () => dbError({ code: '23505', constraint: 'keys_name_key' })],
      ['a syntax error', () => dbError({ code: '42601' })],
      ['a missing table', () => dbError({ code: '42P01' })],
      ['a deadlock, which DSQL does not have', () => dbError({ code: '40P01' })],
      ['an error with no code', () => new Error('something else')],
      ['a thrown string', () => 'not even an Error'],
    ]

    test.each(errors)('%s is run once and not retried', async (_name, make) => {
      const { withTransaction, driver, sleeps } = runnerOver(() => ok)
      let runs = 0
      const thrown = make()
      await expect(
        withTransaction(async () => {
          runs += 1
          throw thrown
        }),
      ).rejects.toBe(thrown)
      expect(runs).toBe(1)
      expect(sleeps).toEqual([])
      expect(out.lines()).toEqual([])
      expect(driver.clients).toHaveLength(1)
      expect(driver.clients[0]?.statements).toEqual(['BEGIN', 'ROLLBACK'])
    })

    test.each(errors)('%s at COMMIT is not retried either', async (_name, make) => {
      const { withTransaction } = runnerOver(() => (sql) => {
        if (sql === 'COMMIT') throw make()
        return { rows: [] }
      })
      let runs = 0
      await withTransaction(async () => {
        runs += 1
      }).catch(() => undefined)
      expect(runs).toBe(1)
    })

    test('the original error surfaces when the rollback fails too', async () => {
      const { withTransaction, driver } = runnerOver(() => (sql) => {
        if (sql === 'ROLLBACK') throw new Error('rollback failed')
        return { rows: [] }
      })
      const original = new Error('the real problem')
      await expect(
        withTransaction(async () => {
          throw original
        }),
      ).rejects.toBe(original)
      // A connection that could not roll back cannot be trusted, so it was dropped.
      expect(driver.clients[0]?.ended).toBe(true)
    })
  })

  describe('a dead connection', () => {
    test('is replaced once and the request then succeeds', async () => {
      const { withTransaction, driver } = runnerOver((n) =>
        n === 0
          ? (sql) => {
              if (sql === 'BEGIN') throw droppedConnection()
              return { rows: [] }
            }
          : () => ({ rows: [] }),
      )
      await withTransaction(async () => 'served')
      const lines = out.lines()
      expect(driver.clients).toHaveLength(2)
      expect(driver.clients[0]?.ended).toBe(true)
      expect(driver.clients[1]?.statements).toEqual(['BEGIN', 'COMMIT'])
      expect(lines).toEqual([
        { event: 'db_retry', reason: 'connection', attempt: 1, delay_ms: 0, error_code: null },
      ])
    })

    test('is replaced once, then the error surfaces', async () => {
      const dead: Script = (sql) => {
        if (sql === 'BEGIN') throw droppedConnection()
        return { rows: [] }
      }
      const { withTransaction, driver } = runnerOver(() => dead)
      let runs = 0
      const thrown = await withTransaction(async () => {
        runs += 1
      }).catch((error) => error)
      expect(thrown).toBeInstanceOf(Error)
      expect(thrown.message).toBe('Connection terminated unexpectedly')
      expect(driver.clients).toHaveLength(2)
      expect(runs).toBe(0)
    })

    test('is found by a statement inside the function as well as by BEGIN', async () => {
      const { withTransaction, driver } = runnerOver((n) => (sql) => {
        if (n === 0 && sql === 'SELECT 1') throw droppedConnection()
        return { rows: [] }
      })
      let runs = 0
      await withTransaction(async (client) => {
        runs += 1
        await client.query('SELECT 1')
      })
      expect(runs).toBe(2)
      expect(driver.clients).toHaveLength(2)
    })

    test('is not replaced a second time, by a request or by a conflict', async () => {
      // Connection 0 is dead; connection 1 is alive but dies at its first statement too.
      const dead: Script = (sql) => {
        if (sql === 'SELECT 1') throw droppedConnection()
        return { rows: [] }
      }
      const { withTransaction, driver } = runnerOver(() => dead)
      await withTransaction(async (client) => void (await client.query('SELECT 1'))).catch(
        () => undefined,
      )
      expect(driver.clients).toHaveLength(2)
    })

    test('does not use up the attempts a conflict is allowed', async () => {
      const { withTransaction } = runnerOver((n) =>
        n === 0
          ? (sql) => {
              if (sql === 'BEGIN') throw droppedConnection()
              return { rows: [] }
            }
          : failingCommit(concurrencyConflict),
      )
      let runs = 0
      await withTransaction(async () => {
        runs += 1
      }).catch(() => undefined)
      // BEGIN never reached the function on the dead connection; then three tries at the conflict.
      expect(runs).toBe(MAX_ATTEMPTS)
    })

    test('is not retried once COMMIT has been sent, because the commit may have happened', async () => {
      const { withTransaction, driver } = runnerOver(() => failingCommit(droppedConnection))
      let runs = 0
      await expect(
        withTransaction(async () => {
          runs += 1
        }),
      ).rejects.toThrow('Connection terminated unexpectedly')
      expect(runs).toBe(1)
      expect(driver.clients).toHaveLength(1)
      expect(out.lines()).toEqual([])
    })
  })
})

describe('what counts as which failure', () => {
  test('only SQLSTATE 40001 is a concurrency failure', () => {
    expect(isConcurrencyFailure(dbError({ code: '40001' }))).toBe(true)
    for (const code of ['40P01', '23505', '42601', '08006', '40000', '4000', '400011', undefined]) {
      expect(isConcurrencyFailure(dbError({ code }))).toBe(false)
    }
    expect(isConcurrencyFailure(new Error('40001'))).toBe(false)
    expect(isConcurrencyFailure(null)).toBe(false)
    expect(isConcurrencyFailure('40001')).toBe(false)
  })

  test('a socket error, a connection-class SQLSTATE and the driver’s own messages are connection failures', () => {
    for (const code of ['ECONNRESET', 'EPIPE', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTCONN']) {
      expect(isConnectionFailure(Object.assign(new Error('x'), { code }))).toBe(true)
    }
    for (const code of ['08000', '08003', '08006', '57P01', '57P02', '57P03']) {
      expect(isConnectionFailure(dbError({ code }))).toBe(true)
    }
    for (const message of [
      'Connection terminated unexpectedly',
      'Connection terminated',
      'Client has encountered a connection error and is not queryable',
      'Client was closed and is not queryable',
    ]) {
      expect(isConnectionFailure(new Error(message))).toBe(true)
    }
  })

  test('a failed statement is not a connection failure', () => {
    for (const code of ['23505', '42601', '42P01', '40001', '57014', '0A000', 'EACCES']) {
      expect(isConnectionFailure(Object.assign(new Error('a statement failed'), { code }))).toBe(
        false,
      )
    }
    expect(isConnectionFailure(new Error('no connection string given'))).toBe(false)
    expect(isConnectionFailure(null)).toBe(false)
    expect(isConnectionFailure(undefined)).toBe(false)
  })

  test('the wait is the ceiling times a factor between a half and one', () => {
    expect(backoffDelay(1, () => 0)).toBe(25)
    expect(backoffDelay(1, () => 1)).toBe(50)
    expect(backoffDelay(2, () => 0)).toBe(50)
    expect(backoffDelay(2, () => 1)).toBe(100)
    expect(backoffDelay(3, () => 1)).toBe(200)
  })
})
