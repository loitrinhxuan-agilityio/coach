import { DsqlSigner } from '@aws-sdk/dsql-signer'
import pg from 'pg'
import { asTransportFailure } from './errors.js'

// The part of a database client this product uses. A narrow type, not pg's own, so that a test can
// stand in a fake and so that nothing here can reach for a method this layer does not manage.
export interface Client {
  query<Row extends object = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: Row[] }>
  end(): Promise<void>
  on(event: 'error' | 'end', listener: () => void): unknown
}

// WHY ONE CONNECTION IS SAFE. A Lambda container serves one request at a time, so one client at
// module scope is never asked to run two transactions at once. That sentence is the whole
// justification: pg would interleave two transactions on one client, and each would see the other's
// statements. Nothing here guards against it, so this design must not be used where a runtime
// serves requests concurrently in one process.
//
// "Token" here is AWS's own word for the SigV4 credential it mints for a database connection. It is
// not a Key, and nothing in this file touches a Key.
//
// R14: the ten minutes. A connection is opened with a freshly minted auth token, and after ten
// minutes it is replaced by one opened with another. The auth token is good for 15 minutes by
// default and the connection for 60, so replacing at ten keeps both well inside their limits.
export const AUTH_TOKEN_MAX_AGE_MS = 10 * 60 * 1000

// How long one statement may take before the driver gives up on it. connectionTimeoutMillis bounds
// only the connect, and a half-open socket on a thawed container would otherwise hold a request
// until the Lambda times out, with the reconnect never reached. PROVISIONAL: ADR 0005 and R15 name a
// 30-second API Gateway ceiling, and 5 s is chosen to fit under it, not measured.
//
// THE BOUND, PER TRANSACTION AND PER REQUEST. One transaction that meets one stuck connection costs,
// before it surfaces, a timed-out statement, its rollback (also a statement), a connect, the first
// statement on the new connection and that one's rollback: five waits of 5 s, 25 s. (Closing the
// stuck connection is not a wait: nothing awaits it, see closeQuietly.) A connection already known
// dead from the driver's events is replaced inside getConnection first, which adds one more connect,
// 30 s in the worst order. A conflict is reported by a connection that answers, so it costs only
// its waits, 350 ms at most in all. Four tries at 5 s is NOT the bound: the timeout is per
// statement, and a try runs several.
// And 25 s is the bound of ONE TRANSACTION, not of a request. A request runs more than one:
// get_account is two (authenticate, then the account), each with its own withTransaction and so its
// own single reconnect. A request that finds one stuck connection pays the 25 s once, because the
// first transaction replaces it and the second reuses the replacement; that fits under the 29 s
// Lambda timeout with about 4 s for the work itself. A request whose replacement is stuck too can
// pay it twice, about 50 s, and then the Lambda timeout, not this number, is what ends it. So 29 s
// is a backstop chosen to sit under the gateway's 30, and it is NOT derived from this arithmetic.
// Change 9017 revises QUERY_TIMEOUT_MS and CONNECT_TIMEOUT_MS against measured latency, and has to
// decide whether a request that cannot be answered in 29 s should be given a shorter wait here.
//
// statement_timeout is deliberately not set. pg sends it in the startup message, and nobody has
// shown Aurora DSQL accepts it there; if it did not, every connection would fail. 9017 can try it.
export const QUERY_TIMEOUT_MS = 5000
export const CONNECT_TIMEOUT_MS = 5000

export type ConnectorDeps = {
  // Mints the SigV4 auth token that `connect` presents as the database password.
  mintAuthToken(): Promise<string>
  connect(authToken: string): Promise<Client>
}

type Held = { client: Client; mintedAt: number; dead: boolean }
type Slot = { held: Promise<Held> }

export type Connector = {
  getConnection(now?: () => number): Promise<Client>
  // Forgets this client and starts closing it, for the caller that has found it unusable. Does not
  // wait for the close to finish: see closeQuietly. Does nothing to a newer connection that has
  // replaced it.
  discardConnection(client: Client): Promise<void>
}

// Ending a connection already known to be unusable can fail in any number of ways, and none of them
// is anything to act on. This is the one place in the database layer that deliberately drops an
// error, and it drops this one only.
//
// NOBODY AWAITS THIS. `pg`'s end() sends Terminate and waits for the socket to close, with no
// timeout of its own, and the connection being closed is one the server may already have dropped
// (R14's thawed container): its end() may neither resolve nor reject. Awaiting it would stall the
// very request the replacement was opened for. So it is started and left to finish or not; it never
// rejects, so leaving it unawaited leaks no unhandled rejection.
function closeQuietly(client: Client): void {
  void (async () => {
    try {
      await client.end()
    } catch {
      // The connection is being thrown away; there is nothing left to report to.
    }
  })()
}

// One connection per container (R14). `makeDeps` runs on the first connection, not at import, so
// loading this module never needs the environment and never touches the network.
export function createConnector(makeDeps: () => ConnectorDeps): Connector {
  let deps: ConnectorDeps | undefined
  let current: Slot | null = null

  const open = async (now: () => number): Promise<Held> => {
    deps ??= makeDeps()
    const mintedAt = now()
    const client = await deps.connect(await deps.mintAuthToken())
    const held: Held = { client, mintedAt, dead: false }
    // pg raises an unhandled 'error' event, which ends the process, when an idle connection is
    // dropped. So a listener is not optional, and the same event is how a dead connection is known
    // before a statement is wasted on it.
    const markDead = () => {
      held.dead = true
    }
    client.on('error', markDead)
    client.on('end', markDead)
    return held
  }

  const getConnection = async (now: () => number = Date.now): Promise<Client> => {
    const seen = current
    let stale: Client | null = null
    if (seen) {
      const held = await seen.held
      if (!held.dead && now() - held.mintedAt <= AUTH_TOKEN_MAX_AGE_MS) return held.client
      // Another caller may already have replaced it while this one waited.
      if (current !== seen) return getConnection(now)
      stale = held.client
    }
    // The replacement is stored before anything else is awaited, so a caller that arrives while
    // the replacement is opening finds it and does not open a third.
    const slot: Slot = { held: open(now) }
    current = slot
    // A connection that failed to open must not be remembered, or every later request would be
    // handed the same failure. The caller below still sees the rejection.
    slot.held.catch(() => {
      if (current === slot) current = null
    })
    if (stale) closeQuietly(stale)
    return (await slot.held).client
  }

  const discardConnection = async (client: Client): Promise<void> => {
    const slot = current
    if (slot) {
      const held = await slot.held.catch(() => null)
      if (held?.client === client && current === slot) current = null
    }
    closeQuietly(client)
  }

  return { getConnection, discardConnection }
}

// What the deployment must tell this module. Names only in the error, never a value.
export type DsqlSettings = { host: string; region: string; role: string }

export function readDsqlSettings(
  env: Record<string, string | undefined> = process.env,
): DsqlSettings {
  const need = (name: string): string => {
    const value = env[name]
    if (!value) throw new Error(`${name} is not set`)
    return value
  }
  return { host: need('DSQL_ENDPOINT'), region: need('AWS_REGION'), role: need('DSQL_DB_ROLE') }
}

// The real driver and the real signer. The `admin` role takes the admin auth token and any other
// role takes the ordinary one; which IAM action the Lambda's role is then allowed (`dsql:DbConnectAdmin`
// or `dsql:DbConnect`) is the stack's to grant. DSQL requires TLS, and its one database is `postgres`.
export function dsqlDeps({ host, region, role }: DsqlSettings): ConnectorDeps {
  const signer = new DsqlSigner({ hostname: host, region })
  return {
    mintAuthToken: () =>
      role === 'admin' ? signer.getDbConnectAdminAuthToken() : signer.getDbConnectAuthToken(),
    connect: async (authToken) => {
      const client = new pg.Client({
        host,
        port: 5432,
        database: 'postgres',
        user: role,
        password: authToken,
        ssl: { rejectUnauthorized: true },
        // Without a bound a connect that never answers holds the request until the Lambda times out,
        // which is indistinguishable from an outage.
        connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
        query_timeout: QUERY_TIMEOUT_MS,
      })
      await client.connect()
      return {
        // Where the driver's own errors, which carry no code, are told apart from a function's: only
        // what `client.query` itself throws passes through asTransportFailure.
        query: async (sql, params) => {
          try {
            const result = await client.query(sql, params ? [...params] : undefined)
            return { rows: result.rows }
          } catch (error) {
            throw asTransportFailure(error)
          }
        },
        end: () => client.end(),
        on: (event, listener) => client.on(event, listener),
      }
    },
  }
}

const container = createConnector(() => dsqlDeps(readDsqlSettings()))

export const getConnection = (now?: () => number): Promise<Client> => container.getConnection(now)
export const discardConnection = container.discardConnection
