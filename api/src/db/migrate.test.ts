import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { type Client, type ConnectorDeps, createConnector } from './connection.js'
import { fakeDriver, type Script } from './fakes.test-helper.js'
import {
  indexNameOf,
  MigrationError,
  runMigrations,
  splitStatements,
  type Transact,
} from './migrate.js'
import { createTransactionRunner } from './with-transaction.js'

const init = readFileSync(new URL('../../migrations/0001_init.sql', import.meta.url), 'utf8')

describe('splitStatements', () => {
  test('splits the real migration into its six statements, comments gone', () => {
    const statements = splitStatements(init)
    expect(statements).toHaveLength(6)
    expect(statements.map((s) => s.split(/\s+/).slice(0, 3).join(' '))).toEqual([
      'CREATE TABLE IF',
      'CREATE UNIQUE INDEX',
      'CREATE UNIQUE INDEX',
      'CREATE TABLE IF',
      'INSERT INTO settings',
      'CREATE TABLE IF',
    ])
    expect(statements.join('\n')).not.toContain('--')
  })

  test('a semicolon inside a string, a quoted name, a comment or a dollar quote does not split', () => {
    expect(splitStatements("SELECT 'a;b'; SELECT 2")).toEqual(["SELECT 'a;b'", 'SELECT 2'])
    expect(splitStatements('SELECT "a;b" FROM t; SELECT 2')).toEqual([
      'SELECT "a;b" FROM t',
      'SELECT 2',
    ])
    expect(splitStatements('SELECT 1 -- ; not a split\n; SELECT 2')).toEqual([
      'SELECT 1',
      'SELECT 2',
    ])
    expect(splitStatements('SELECT 1 /* ; /* nested ; */ ; */; SELECT 2')).toEqual([
      'SELECT 1',
      'SELECT 2',
    ])
    expect(splitStatements('SELECT $q$a;b$q$; SELECT 2')).toEqual(['SELECT $q$a;b$q$', 'SELECT 2'])
  })

  test('a string that holds a comment marker reaches the server whole', () => {
    expect(splitStatements("SELECT '-- not a comment'")).toEqual(["SELECT '-- not a comment'"])
  })

  test('a backslash escapes only inside an E string', () => {
    expect(splitStatements("SELECT E'a\\';b'; SELECT 2")).toEqual(["SELECT E'a\\';b'", 'SELECT 2'])
    expect(splitStatements("SELECT '\\'; SELECT 2")).toEqual(["SELECT '\\'", 'SELECT 2'])
  })

  test.each([
    ["SELECT 'open", 'a string is never closed'],
    ['SELECT "open', 'a quoted name is never closed'],
    ['SELECT 1 /* open', 'a block comment is never closed'],
    ['SELECT $a$ open', 'a dollar-quoted string is never closed'],
  ])('refuses SQL it cannot read to the end: %s', (sql, why) => {
    expect(() => splitStatements(sql)).toThrow(why)
  })

  test('nothing but comments and semicolons is no statements', () => {
    expect(splitStatements('-- only a comment\n;;')).toEqual([])
  })
})

describe('indexNameOf', () => {
  test.each([
    ['CREATE UNIQUE INDEX ASYNC IF NOT EXISTS keys_name_key ON keys (name)', 'keys_name_key'],
    ['create index async idx_a on t (a)', 'idx_a'],
    ['CREATE INDEX ASYNC "Mixed Case" ON t (a)', 'Mixed Case'],
    ['CREATE INDEX ASYNC UPPER_NAME ON t (a)', 'upper_name'],
  ])('%s', (statement, name) => {
    expect(indexNameOf(statement)).toBe(name)
  })

  test('a statement that creates no index has no index name', () => {
    expect(indexNameOf('CREATE TABLE keys (id uuid)')).toBeNull()
    expect(indexNameOf("INSERT INTO t VALUES ('create index x on y')")).toBeNull()
  })

  test('a CREATE INDEX whose name cannot be read is refused, not skipped', () => {
    expect(() => indexNameOf('CREATE INDEX ASYNC ON t (a)')).toThrow(MigrationError)
  })
})

// ---------------------------------------------------------------------------------------------
// The three obligations, against a scripted connection that keeps everything it was sent.
// ---------------------------------------------------------------------------------------------

type World = {
  applied?: string[] // undefined: the migrations table does not exist yet
  jobFor?: (statement: string) => string | undefined
  valid?: (index: string) => boolean
  failOn?: RegExp
}

function harness(world: World = {}) {
  const sent: string[] = []
  const script: Script = (sql, params) => {
    sent.push(params ? `${sql} [${params.join(',')}]` : sql)
    if (world.failOn?.test(sql)) throw new Error('boom')
    if (/information_schema\.tables/.test(sql)) {
      return { rows: world.applied === undefined ? [] : [{ present: 1 }] }
    }
    if (/SELECT name FROM migrations/.test(sql)) {
      return { rows: (world.applied ?? []).map((name) => ({ name })) }
    }
    if (/CREATE (UNIQUE )?INDEX/i.test(sql)) {
      const job = (world.jobFor ?? (() => 'job-1'))(sql)
      return { rows: job === undefined ? [] : [{ job_id: job }] }
    }
    if (/pg_index/.test(sql)) {
      const index = String(params?.[0])
      return { rows: [{ indisvalid: (world.valid ?? (() => true))(index) }] }
    }
    return { rows: [] }
  }
  const driver = fakeDriver(() => script)
  const transact = createTransactionRunner({ connector: createConnector(() => driver.deps) })
  return { sent, transact }
}

const TWO_INDEXES = `
  CREATE TABLE t (a int PRIMARY KEY, b int);
  CREATE UNIQUE INDEX ASYNC IF NOT EXISTS t_a_key ON t (a);
  CREATE UNIQUE INDEX ASYNC IF NOT EXISTS t_b_key ON t (b);
  INSERT INTO t VALUES (1, 2);
`
const migration = { name: '0001_test', sql: TWO_INDEXES }

describe('obligation 1: every statement in its own transaction', () => {
  test('each statement of the file sits alone between BEGIN and COMMIT', async () => {
    const { sent, transact } = harness()
    await runMigrations([migration], transact)

    // Walk the transcript: a transaction opens, holds exactly one statement, and closes.
    const bodies: string[][] = []
    let open: string[] | null = null
    for (const line of sent) {
      if (line === 'BEGIN') {
        expect(open).toBeNull()
        open = []
      } else if (line === 'COMMIT') {
        expect(open).not.toBeNull()
        bodies.push(open as string[])
        open = null
      } else {
        expect(open).not.toBeNull() // nothing runs outside a transaction
        ;(open as string[]).push(line)
      }
    }
    expect(open).toBeNull()
    for (const body of bodies) expect(body).toHaveLength(1)

    // And every statement of the file is among them, one each, none merged.
    const ran = bodies.map((body) => body[0] as string)
    for (const statement of splitStatements(TWO_INDEXES)) expect(ran).toContain(statement)
  })

  test('a DDL statement and the seed INSERT never share a transaction', async () => {
    const { sent, transact } = harness()
    await runMigrations([migration], transact)
    const at = (needle: RegExp) => sent.findIndex((line) => needle.test(line))
    expect(sent[at(/^INSERT INTO t /) - 1]).toBe('BEGIN')
    expect(sent[at(/^INSERT INTO t /) + 1]).toBe('COMMIT')
  })
})

describe('obligation 2: wait for every index, then check it is valid', () => {
  test('each index is created, then waited on, then checked, in that order, before the next statement', async () => {
    const { sent, transact } = harness({
      jobFor: (s) => (s.includes('t_a_key') ? 'job-a' : 'job-b'),
    })
    await runMigrations([migration], transact)
    const steps = sent.filter((line) => !['BEGIN', 'COMMIT'].includes(line))
    const sequence = steps
      .filter((line) => /CREATE|wait_for_job|pg_index|INSERT INTO/.test(line))
      .map((line) => {
        if (/t_a_key ON/.test(line)) return 'create a'
        if (/t_b_key ON/.test(line)) return 'create b'
        if (/wait_for_job/.test(line)) return `wait ${/\[(.*)\]/.exec(line)?.[1]}`
        if (/pg_index/.test(line)) return `valid ${/\[(.*)\]/.exec(line)?.[1]}`
        if (/CREATE TABLE/.test(line)) return 'table'
        return 'insert'
      })
    expect(sequence).toEqual([
      'table',
      'create a',
      'wait job-a',
      'valid t_a_key',
      'create b',
      'wait job-b',
      'valid t_b_key',
      'insert', // the seed row
      'insert', // the migrations row
    ])
  })

  test('the wait is made with the job the statement returned, never a made-up one', async () => {
    const { sent, transact } = harness({ jobFor: () => 'job-xyz' })
    await runMigrations([migration], transact)
    expect(sent).toContain('SELECT sys.wait_for_job($1) [job-xyz]')
  })

  test('an index that is not valid after its wait stops the migration, which is then not applied', async () => {
    const { sent, transact } = harness({ valid: (index) => index !== 't_b_key' })
    await expect(runMigrations([migration], transact)).rejects.toThrow(/index t_b_key is not valid/)
    expect(sent.some((line) => /INSERT INTO migrations/.test(line))).toBe(false)
    // and nothing after the failed index ran
    expect(sent.some((line) => /^INSERT INTO t /.test(line))).toBe(false)
  })

  test('an index that already exists and is invalid is not retried past', async () => {
    // IF NOT EXISTS skips the build, so the statement returns no job. The check still runs.
    const { sent, transact } = harness({ jobFor: () => undefined, valid: () => false })
    await expect(runMigrations([migration], transact)).rejects.toThrow(/is not valid/)
    expect(sent.some((line) => /wait_for_job/.test(line))).toBe(false)
  })

  test('with no job to wait on, a valid index passes without a wait', async () => {
    const { sent, transact } = harness({ jobFor: () => undefined })
    await expect(runMigrations([migration], transact)).resolves.toMatchObject({
      applied: ['0001_test'],
    })
    expect(sent.some((line) => /wait_for_job/.test(line))).toBe(false)
    expect(sent.some((line) => /pg_index/.test(line))).toBe(true)
  })

  test('an index the catalogue does not list at all is not valid either', async () => {
    const script: Script = (sql) => {
      if (/information_schema/.test(sql)) return { rows: [] }
      if (/pg_index/.test(sql)) return { rows: [] }
      return { rows: [] }
    }
    const driver = fakeDriver(() => script)
    const transact = createTransactionRunner({ connector: createConnector(() => driver.deps) })
    await expect(runMigrations([migration], transact)).rejects.toThrow(/is not valid/)
  })
})

describe('obligation 3: the runner inserts the migrations row, after the whole file', () => {
  test('the row is inserted last, by the runner, with the file name', async () => {
    const { sent, transact } = harness()
    const outcome = await runMigrations([migration], transact)
    expect(outcome).toEqual({ applied: ['0001_test'], skipped: [] })
    const inserts = sent.filter((line) => /INSERT INTO migrations/.test(line))
    expect(inserts).toEqual(['INSERT INTO migrations (name) VALUES ($1) [0001_test]'])
    const lastWork = sent.filter((line) => !['BEGIN', 'COMMIT'].includes(line)).at(-1)
    expect(lastWork).toBe(inserts[0])
  })

  test('a file that fails part-way is not marked applied', async () => {
    const { sent, transact } = harness({ failOn: /^INSERT INTO t /i })
    await expect(runMigrations([migration], transact)).rejects.toThrow('boom')
    expect(sent.some((line) => /INSERT INTO migrations/.test(line))).toBe(false)
  })

  test('a migration the table already lists is skipped, and none of its SQL runs', async () => {
    const { sent, transact } = harness({ applied: ['0001_test'] })
    const outcome = await runMigrations([migration], transact)
    expect(outcome).toEqual({ applied: [], skipped: ['0001_test'] })
    expect(sent.some((line) => /CREATE|INSERT/.test(line))).toBe(false)
  })

  test('before the first migration the table does not exist, and that is not an error', async () => {
    const { sent, transact } = harness({ applied: undefined })
    await runMigrations([migration], transact)
    expect(sent.some((line) => /SELECT name FROM migrations/.test(line))).toBe(false)
  })

  test('only the unapplied ones run, in the order given', async () => {
    const { sent, transact } = harness({ applied: ['0001_a'] })
    const outcome = await runMigrations(
      [
        { name: '0001_a', sql: 'CREATE TABLE a (x int)' },
        { name: '0002_b', sql: 'CREATE TABLE b (x int)' },
        { name: '0003_c', sql: 'CREATE TABLE c (x int)' },
      ],
      transact,
    )
    expect(outcome).toEqual({ applied: ['0002_b', '0003_c'], skipped: ['0001_a'] })
    const created = sent.filter((line) => /^CREATE TABLE/.test(line))
    expect(created).toEqual(['CREATE TABLE b (x int)', 'CREATE TABLE c (x int)'])
  })

  test('a file with no statements is refused, not reported as applied', async () => {
    const { transact } = harness()
    await expect(
      runMigrations([{ name: '0001_empty', sql: '-- nothing\n' }], transact),
    ).rejects.toThrow('holds no statements')
  })
})

// ---------------------------------------------------------------------------------------------
// The real 0001_init.sql through the runner, on a real PostgreSQL engine (PGlite).
//
// This proves the runner and the file fit together: the real statements, split by the real splitter,
// each in a real transaction, leave the real tables and one migrations row, and a second run changes
// nothing. It does NOT prove Aurora DSQL does the same. PGlite has no CREATE INDEX ASYNC and no
// sys.wait_for_job, so the one wrapper below strips ASYNC and answers the wait itself; that wrapper
// is the whole distance between this test and a cluster, and change 9017 is the first to cross it.
// ---------------------------------------------------------------------------------------------
describe('the real migration on a real engine', () => {
  const engine = new PGlite()
  const waits: string[] = []

  const engineDeps: ConnectorDeps = {
    mintAuthToken: async () => 'fake-auth-token',
    connect: async () => {
      const client: Client = {
        query: async (sql, params) => {
          if (/sys\.wait_for_job/.test(sql)) {
            waits.push(String(params?.[0]))
            return { rows: [] as never[] }
          }
          const isIndex = /^\s*CREATE (UNIQUE )?INDEX ASYNC/i.test(sql)
          const result = await engine.query(
            sql.replace(/INDEX ASYNC/i, 'INDEX'),
            params ? [...params] : undefined,
          )
          const rows = isIndex ? [{ job_id: `job-${waits.length + 1}` }] : result.rows
          return { rows: rows as never[] }
        },
        end: async () => undefined,
        on: () => client,
      }
      return client
    },
  }
  const transact: Transact = createTransactionRunner({
    connector: createConnector(() => engineDeps),
  })

  beforeAll(() => engine.waitReady)
  afterAll(() => engine.close())

  test('applies 0001, waits on both indexes, and a second run changes nothing', async () => {
    const first = await runMigrations([{ name: '0001_init', sql: init }], transact)
    expect(first).toEqual({ applied: ['0001_init'], skipped: [] })
    expect(waits).toHaveLength(2)

    const names = await engine.query<{ name: string }>('SELECT name FROM migrations')
    expect(names.rows).toEqual([{ name: '0001_init' }])
    const valid = await engine.query<{ relname: string; indisvalid: boolean }>(
      `SELECT c.relname, i.indisvalid FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid
       WHERE c.relname IN ('keys_name_key', 'keys_key_sha256_key') ORDER BY 1`,
    )
    expect(valid.rows).toEqual([
      { relname: 'keys_key_sha256_key', indisvalid: true },
      { relname: 'keys_name_key', indisvalid: true },
    ])

    const second = await runMigrations([{ name: '0001_init', sql: init }], transact)
    expect(second).toEqual({ applied: [], skipped: ['0001_init'] })
    const settings = await engine.query('SELECT * FROM settings')
    expect(settings.rows).toHaveLength(1)
  })

  test('an index an earlier run left INVALID stops the next run, whichever way it is reached', async () => {
    await engine.exec('DELETE FROM migrations')
    await engine.exec(
      `UPDATE pg_index SET indisvalid = false
       WHERE indexrelid = (SELECT oid FROM pg_class WHERE relname = 'keys_name_key')`,
    )
    await expect(runMigrations([{ name: '0001_init', sql: init }], transact)).rejects.toThrow(
      /index keys_name_key is not valid/,
    )
    const names = await engine.query('SELECT name FROM migrations')
    expect(names.rows).toEqual([])
  })
})
