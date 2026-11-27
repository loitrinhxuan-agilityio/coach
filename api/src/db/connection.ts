import { DsqlSigner } from '@aws-sdk/dsql-signer'
import pg from 'pg'

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

// "Token" here is AWS's own word for the SigV4 credential it mints for a database connection. It is
// not a Key, and nothing in this file touches a Key.
//
// R14: the ten minutes. A connection is opened with a freshly minted auth token, and after ten
// minutes it is replaced by one opened with another. The auth token is good for 15 minutes by
// default and the connection for 60, so replacing at ten keeps both well inside their limits.
export const AUTH_TOKEN_MAX_AGE_MS = 10 * 60 * 1000

export type ConnectorDeps = {
  // Mints the SigV4 auth token that `connect` presents as the database password.
  mintAuthToken(): Promise<string>
  connect(authToken: string): Promise<Client>
}

type Held = { client: Client; mintedAt: number; dead: boolean }
type Slot = { held: Promise<Held> }

export type Connector = {
  getConnection(now?: () => number): Promise<Client>
  // Forgets this client and closes it, for the caller that has found it unusable. Does nothing to a
  // newer connection that has replaced it.
  discardConnection(client: Client): Promise<void>
}

// Ending a connection already known to be unusable can fail in any number of ways, and none of them
// is anything to act on. This is the one place in the database layer that deliberately drops an
// error, and it drops this one only.
async function closeQuietly(client: Client): Promise<void> {
  try {
    await client.end()
  } catch {
    // The connection is being thrown away; there is nothing left to report to.
  }
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
    // the old connection is closing finds the new one and does not open a third.
    const slot: Slot = { held: open(now) }
    current = slot
    // A connection that failed to open must not be remembered, or every later request would be
    // handed the same failure. The caller below still sees the rejection.
    slot.held.catch(() => {
      if (current === slot) current = null
    })
    if (stale) await closeQuietly(stale)
    return (await slot.held).client
  }

  const discardConnection = async (client: Client): Promise<void> => {
    const slot = current
    if (slot) {
      const held = await slot.held.catch(() => null)
      if (held?.client === client && current === slot) current = null
    }
    await closeQuietly(client)
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
        connectionTimeoutMillis: 5000,
      })
      await client.connect()
      return {
        query: async (sql, params) => {
          const result = await client.query(sql, params ? [...params] : undefined)
          return { rows: result.rows }
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
