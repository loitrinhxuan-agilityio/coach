import type { Client } from './connection.js'

// The migration runner's logic. It owes each migration file three things that the SQL cannot say
// for itself, and the header of api/migrations/0001_init.sql lists them from the Aurora DSQL
// documentation (read 2026-11-27):
//   1. every statement in its own transaction, so DDL and DML never share one;
//   2. a wait on every index build, then a check that the index is valid, before the file counts as
//      applied, because CREATE INDEX ASYNC returns at once and builds in the background;
//   3. the `migrations` row, inserted by the runner once the whole file has run.
//
// NOT YET TRIED AGAINST A REAL CLUSTER. Two things below are taken from the documentation and not
// seen to work: that `CREATE INDEX ASYNC` answers with a row whose `job_id` column is the job, and
// that `SELECT sys.wait_for_job(<job id>)` is the way to wait on it. The validity check does not
// depend on either: it reads pg_index, so an index that is not valid stops the migration whatever
// the wait did. Change 9017 is the first time any of it meets DSQL.

export type Migration = { name: string; sql: string }

// Runs `fn` as one transaction. In production this is withTransaction, so a statement that loses an
// optimistic-concurrency conflict is retried in the one place that does it.
export type Transact = <T>(fn: (client: Client) => Promise<T>) => Promise<T>

export class MigrationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MigrationError'
  }
}

// Splits a file into its statements: on each `;` that is outside a comment, a string, a quoted name
// and a dollar-quoted string. Comments are dropped and the rest is kept as written, so a string that
// holds a `;` or a `--` reaches the server whole. Refuses SQL it cannot read to the end, because a
// runner that sent half a statement would be worse than one that stopped.
export function splitStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let i = 0
  const n = sql.length

  const take = (text: string) => {
    current += text
  }
  const endStatement = () => {
    const trimmed = current.trim()
    if (trimmed !== '') statements.push(trimmed)
    current = ''
  }

  while (i < n) {
    const char = sql.charAt(i)
    const next = sql.charAt(i + 1)

    if (char === '-' && next === '-') {
      while (i < n && sql.charAt(i) !== '\n') i++
      take(' ')
      continue
    }

    if (char === '/' && next === '*') {
      // PostgreSQL block comments nest.
      let depth = 1
      i += 2
      while (i < n && depth > 0) {
        if (sql.charAt(i) === '/' && sql.charAt(i + 1) === '*') {
          depth++
          i += 2
        } else if (sql.charAt(i) === '*' && sql.charAt(i + 1) === '/') {
          depth--
          i += 2
        } else {
          i++
        }
      }
      if (depth > 0) throw new MigrationError('a block comment is never closed')
      take(' ')
      continue
    }

    if (char === "'" || char === '"') {
      // Only an E'...' string treats a backslash as an escape.
      const escapes = char === "'" && /(^|[^A-Za-z0-9_$])[eE]$/.test(current)
      const start = i
      i++
      let closed = false
      while (i < n) {
        if (escapes && sql.charAt(i) === '\\') {
          i += 2
        } else if (sql.charAt(i) === char && sql.charAt(i + 1) === char) {
          i += 2
        } else if (sql.charAt(i) === char) {
          i++
          closed = true
          break
        } else {
          i++
        }
      }
      if (!closed) {
        throw new MigrationError(
          char === "'" ? 'a string is never closed' : 'a quoted name is never closed',
        )
      }
      take(sql.slice(start, i))
      continue
    }

    if (char === '$' && !/[A-Za-z0-9_$]$/.test(current)) {
      const opener = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i))
      if (opener) {
        const close = sql.indexOf(opener[0], i + opener[0].length)
        if (close === -1) throw new MigrationError('a dollar-quoted string is never closed')
        const end = close + opener[0].length
        take(sql.slice(i, end))
        i = end
        continue
      }
    }

    if (char === ';') {
      endStatement()
      i++
      continue
    }

    take(char)
    i++
  }
  endStatement()
  return statements
}

const CREATE_INDEX = /^create\s+(unique\s+)?index\b/i
const INDEX_NAME =
  /^create\s+(?:unique\s+)?index\s+(?:async\s+)?(?:if\s+not\s+exists\s+)?("(?:[^"]|"")+"|[A-Za-z_][A-Za-z0-9_$]*)\s+on\b/i

// The name of the index a statement creates, or null when it creates none. A CREATE INDEX whose name
// cannot be read is refused: a statement whose index is never checked is the failure this runner
// exists to prevent.
export function indexNameOf(statement: string): string | null {
  if (!CREATE_INDEX.test(statement)) return null
  const named = INDEX_NAME.exec(statement)?.[1]
  // `CREATE INDEX ASYNC ON t (a)` names no index, and its generated name cannot be checked. It reads
  // here as an index called "async", which nobody means.
  if (named === undefined || named.toLowerCase() === 'async') {
    throw new MigrationError(`cannot read the index name in: ${statement.slice(0, 80)}`)
  }
  // The catalogue stores an unquoted name in lower case and a quoted one as written.
  return named.startsWith('"') ? named.slice(1, -1).replaceAll('""', '"') : named.toLowerCase()
}

async function appliedNames(transact: Transact): Promise<Set<string>> {
  // The table is made by 0001 itself, so before that file has run there is nothing to ask.
  const present = await transact((client) =>
    client.query(
      `SELECT 1 AS present FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'migrations'`,
    ),
  )
  if (present.rows.length === 0) return new Set()
  const applied = await transact((client) =>
    client.query<{ name: string }>('SELECT name FROM migrations'),
  )
  return new Set(applied.rows.map((row) => row.name))
}

// Waits for a build to finish if the statement said which job it started, then insists the index is
// valid. A failed build leaves its index behind as INVALID, and IF NOT EXISTS would skip over it on
// the next run, so a failed job stops the migration here rather than being retried past. The check
// runs even when there was no job to wait on: an index that already existed, and is invalid, is
// exactly that case.
async function settleIndex(
  transact: Transact,
  index: string,
  jobId: string | undefined,
): Promise<void> {
  if (jobId !== undefined) {
    await transact((client) => client.query('SELECT sys.wait_for_job($1)', [jobId]))
  }
  const { rows } = await transact((client) =>
    client.query<{ indisvalid: boolean }>(
      `SELECT i.indisvalid FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid
       WHERE c.relname = $1`,
      [index],
    ),
  )
  if (rows.length !== 1 || rows[0]?.indisvalid !== true) {
    throw new MigrationError(
      `index ${index} is not valid after its build, so its constraint is not enforced; ` +
        'the migration was stopped and is not marked as applied',
    )
  }
}

export type MigrationOutcome = { applied: string[]; skipped: string[] }

// Applies, in the order given, each migration that the `migrations` table does not list. A file that
// fails part-way is not marked applied, and every statement in it is safe to run again.
export async function runMigrations(
  migrations: readonly Migration[],
  transact: Transact,
  log: (event: Record<string, unknown>) => void = () => undefined,
): Promise<MigrationOutcome> {
  const done = await appliedNames(transact)
  const outcome: MigrationOutcome = { applied: [], skipped: [] }

  for (const migration of migrations) {
    if (done.has(migration.name)) {
      outcome.skipped.push(migration.name)
      continue
    }

    const statements = splitStatements(migration.sql)
    if (statements.length === 0) {
      throw new MigrationError(`${migration.name} holds no statements`)
    }

    for (const statement of statements) {
      const index = indexNameOf(statement)
      const { rows } = await transact((client) => client.query<{ job_id?: unknown }>(statement))
      if (index !== null) {
        const job = rows[0]?.job_id
        await settleIndex(transact, index, typeof job === 'string' ? job : undefined)
        log({ event: 'migration_index_valid', migration: migration.name, index })
      }
    }

    // Only now, with all of the file run, and in a transaction of its own.
    await transact((client) =>
      client.query('INSERT INTO migrations (name) VALUES ($1)', [migration.name]),
    )
    outcome.applied.push(migration.name)
    log({ event: 'migration_applied', migration: migration.name })
  }
  return outcome
}
