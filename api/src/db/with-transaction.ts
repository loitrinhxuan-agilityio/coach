import { logRetry } from '../logging/retry.js'
import type { Client, Connector } from './connection.js'
import { discardConnection, getConnection } from './connection.js'
import { codeOf, isConcurrencyFailure, isConnectionFailure } from './errors.js'

// R13 and P7. This is the only place a database error is retried. A handler never catches one: a
// handler that does is a review finding, because it would hide the failure from the code that
// knows whether trying again is safe.
//
// Three retries of a conflict, so four tries in all, with a wait between them that doubles and
// carries jitter. DSQL's conflicts surface at commit, so a whole transaction is what is retried.
// R13 says the helper "retries three times": three retries after the first try.
export const MAX_RETRIES = 3
export const BASE_DELAY_MS = 50

type Options = {
  connector: Connector
  sleep?: (ms: number) => Promise<void>
  random?: () => number
}

// Between half the ceiling and the whole of it, so a retry never fires at once and two callers that
// conflicted are unlikely to conflict again together. The ceiling doubles with each attempt.
export function backoffDelay(attempt: number, random: () => number): number {
  const ceiling = BASE_DELAY_MS * 2 ** (attempt - 1)
  return Math.round(ceiling * (0.5 + 0.5 * random()))
}

const sleepFor = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export function createTransactionRunner({
  connector,
  sleep = sleepFor,
  random = Math.random,
}: Options) {
  // `fn` may run more than once, on more than one connection, so it must do nothing outside the
  // transaction it is given. Its result is returned only once the transaction has committed.
  return async function withTransaction<T>(fn: (client: Client) => Promise<T>): Promise<T> {
    let attempt = 1
    let reconnected = false
    while (true) {
      const client = await connector.getConnection()
      let committing = false
      try {
        await client.query('BEGIN')
        const result = await fn(client)
        committing = true
        await client.query('COMMIT')
        return result
      } catch (error) {
        // The transaction is over either way. If it cannot be rolled back the connection cannot be
        // trusted, so it is dropped and the next caller gets a new one.
        try {
          await client.query('ROLLBACK')
        } catch {
          await connector.discardConnection(client)
        }

        if (isConcurrencyFailure(error) && attempt <= MAX_RETRIES) {
          const delay = backoffDelay(attempt, random)
          logRetry({ reason: 'concurrency', attempt, delay_ms: delay, error_code: codeOf(error) })
          attempt += 1
          await sleep(delay)
          continue
        }

        // One reconnect, for the connection a frozen container woke up holding after the server
        // dropped it (R14). Not once COMMIT has been sent: a connection that dies then may or may
        // not have committed, and running the transaction again could write it twice.
        if (isConnectionFailure(error) && !committing && !reconnected) {
          reconnected = true
          await connector.discardConnection(client)
          logRetry({ reason: 'connection', attempt, delay_ms: 0, error_code: codeOf(error) })
          continue
        }

        throw error
      }
    }
  }
}

export const withTransaction = createTransactionRunner({
  connector: { getConnection, discardConnection },
})
