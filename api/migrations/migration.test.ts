import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// The schema is asserted by reading the SQL, because there is no local Aurora DSQL to run it against.
// That makes the reader the thing to distrust, so each reader below is also shown, in the last
// describe, to see a change made to the SQL: a reader that returned the same answer for any input
// would pass every test above it.

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../..')
const sql = readFileSync(resolve(here, '0001_init.sql'), 'utf8')

// ---- a small reader for the few statement shapes the migration uses ----------------------------

function withoutComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ')
}

function statementsOf(text: string): string[] {
  return withoutComments(text)
    .split(';')
    .map((statement) => statement.replace(/\s+/g, ' ').trim())
    .filter((statement) => statement !== '')
}

// Splits on commas that are not inside brackets or quotes.
function splitTopLevel(text: string): string[] {
  const parts: string[] = []
  let depth = 0
  let quoted = false
  let current = ''
  for (const char of text) {
    if (char === "'") quoted = !quoted
    if (!quoted && char === '(') depth++
    if (!quoted && char === ')') depth--
    if (!quoted && depth === 0 && char === ',') {
      parts.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  if (current.trim() !== '') parts.push(current.trim())
  return parts
}

interface Column {
  name: string
  definition: string
}

const CONSTRAINT_START = /^(constraint|primary|unique|check|foreign|exclude)\b/i

function tableBody(text: string, table: string): string | undefined {
  const pattern = new RegExp(`^create table (?:if not exists )?${table} \\((.*)\\)$`, 'i')
  for (const statement of statementsOf(text)) {
    const match = pattern.exec(statement)
    if (match?.[1] !== undefined) return match[1]
  }
  return undefined
}

function columnsOf(text: string, table: string): Column[] {
  const body = tableBody(text, table)
  if (body === undefined) return []
  return splitTopLevel(body)
    .filter((item) => !CONSTRAINT_START.test(item))
    .map((item) => {
      const [name = '', ...rest] = item.split(' ')
      return { name, definition: rest.join(' ') }
    })
}

function tableConstraintsOf(text: string, table: string): string[] {
  const body = tableBody(text, table)
  if (body === undefined) return []
  return splitTopLevel(body).filter((item) => CONSTRAINT_START.test(item))
}

// Each entry is the column list one unique index or constraint covers.
function uniqueColumnSets(text: string, table: string): string[][] {
  const sets: string[][] = []
  const listOf = (columns: string): string[] =>
    splitTopLevel(columns).map((column) => column.trim().toLowerCase())
  for (const statement of statementsOf(text)) {
    const index = new RegExp(
      `^create unique index (?:async )?(?:if not exists )?\\S+ on ${table} \\(([^)]*)\\)`,
      'i',
    ).exec(statement)
    if (index?.[1] !== undefined) sets.push(listOf(index[1]))
  }
  for (const column of columnsOf(text, table)) {
    if (/\bunique\b/i.test(column.definition)) sets.push([column.name.toLowerCase()])
  }
  for (const constraint of tableConstraintsOf(text, table)) {
    const match = /^unique\b[^(]*\(([^)]*)\)/i.exec(constraint)
    if (match?.[1] !== undefined) sets.push(listOf(match[1]))
  }
  return sets
}

function isPrimaryKey(text: string, table: string, column: string): boolean {
  const own = columnsOf(text, table).find((candidate) => candidate.name === column)
  if (own !== undefined && /\bprimary key\b/i.test(own.definition)) return true
  return tableConstraintsOf(text, table).some((constraint) =>
    new RegExp(`^primary key \\(\\s*${column}\\s*\\)`, 'i').test(constraint),
  )
}

interface Seed {
  columns: string[]
  values: string[]
  guarded: boolean
}

// INSERT INTO <table> (cols) SELECT v, v, v WHERE NOT EXISTS (SELECT 1 FROM <table>)
// or INSERT INTO <table> (cols) VALUES (v, v, v)
function seedsOf(text: string, table: string): Seed[] {
  const seeds: Seed[] = []
  for (const statement of statementsOf(text)) {
    const head = new RegExp(`^insert into ${table} \\(([^)]*)\\) (.*)$`, 'i').exec(statement)
    if (head?.[1] === undefined || head[2] === undefined) continue
    const columns = splitTopLevel(head[1]).map((column) => column.toLowerCase())
    const rest = head[2]
    const select = /^select (.*?)(?: where not exists \(select 1 from (\w+)\))?$/i.exec(rest)
    const values = /^values \((.*)\)$/i.exec(rest)
    if (values?.[1] !== undefined) {
      seeds.push({ columns, values: splitTopLevel(values[1]), guarded: false })
    } else if (select?.[1] !== undefined) {
      seeds.push({
        columns,
        values: splitTopLevel(select[1]),
        guarded: select[2]?.toLowerCase() === table,
      })
    }
  }
  return seeds
}

const names = (columns: Column[]): string[] => columns.map((column) => column.name)

// ---- R9: Keys are stored only as hashes -----------------------------------------------------

describe('keys', () => {
  test('has exactly: id, key_sha256, name, created_at', () => {
    expect(names(columnsOf(sql, 'keys')).sort()).toEqual(['created_at', 'id', 'key_sha256', 'name'])
  })

  test('id is a uuid primary key', () => {
    const id = columnsOf(sql, 'keys').find((column) => column.name === 'id')
    expect(id?.definition).toMatch(/^uuid\b/i)
    expect(isPrimaryKey(sql, 'keys', 'id')).toBe(true)
  })

  test('key_sha256, name and created_at are all required', () => {
    // A unique column that allows NULL admits any number of NULLs, so uniqueness would not hold.
    for (const wanted of ['key_sha256', 'name', 'created_at']) {
      const column = columnsOf(sql, 'keys').find((candidate) => candidate.name === wanted)
      expect(column?.definition, `keys.${wanted}`).toMatch(/\bnot null\b/i)
    }
  })

  test('no column in any table stores a Key in plain text', () => {
    const everyColumn = ['keys', 'settings', 'migrations'].flatMap((table) =>
      names(columnsOf(sql, table)).map((column) => `${table}.${column}`),
    )
    // The one column that mentions a key is the hash.
    expect(everyColumn.filter((column) => /key/i.test(column.split('.')[1] ?? ''))).toEqual([
      'keys.key_sha256',
    ])
    expect(
      everyColumn.filter((column) => /secret|plain|raw|credential|password|value/i.test(column)),
    ).toEqual([])
  })

  test('has no last_used_at and no revoked_at, here or in any other table', () => {
    for (const table of ['keys', 'settings', 'migrations']) {
      const columns = names(columnsOf(sql, table))
      expect(columns).not.toContain('last_used_at')
      expect(columns).not.toContain('revoked_at')
    }
  })

  // ---- R10: lookup is one indexed read; and the ruling that makes names unique ----------------

  test('key_sha256 carries a unique index, on that column alone', () => {
    expect(uniqueColumnSets(sql, 'keys')).toContainEqual(['key_sha256'])
  })

  test('name carries a unique index too, on that column alone', () => {
    // Without it two concurrent mints of one name both commit on Aurora DSQL: the transactions write
    // different new rows, so snapshot isolation sees no conflict and a retry cannot help.
    expect(uniqueColumnSets(sql, 'keys')).toContainEqual(['name'])
  })

  test('every index is built ASYNC, because Aurora DSQL builds no other kind', () => {
    const indexes = statementsOf(sql).filter((statement) =>
      /^create (unique )?index\b/i.test(statement),
    )
    expect(indexes.length).toBeGreaterThanOrEqual(2)
    for (const statement of indexes) expect(statement).toMatch(/^create (unique )?index async\b/i)
  })
})

// ---- R11: the settings row exists from the first migration ------------------------------------

describe('settings', () => {
  test('has exactly: cognito_sub, time_zone, display_unit', () => {
    expect(names(columnsOf(sql, 'settings')).sort()).toEqual([
      'cognito_sub',
      'display_unit',
      'time_zone',
    ])
  })

  test('cognito_sub allows NULL, or the seeded row could not be written', () => {
    const column = columnsOf(sql, 'settings').find((candidate) => candidate.name === 'cognito_sub')
    expect(column?.definition).toMatch(/^text\b/i)
    expect(column?.definition).not.toMatch(/not null|primary key/i)
  })

  test('time_zone and display_unit are required, and display_unit can only ever be kg', () => {
    const byName = new Map(
      columnsOf(sql, 'settings').map((column) => [column.name, column.definition]),
    )
    expect(byName.get('time_zone')).toMatch(/\bnot null\b/i)
    expect(byName.get('display_unit')).toMatch(/\bnot null\b/i)
    expect(byName.get('display_unit')).toMatch(/\bcheck \(\s*display_unit = 'kg'\s*\)/i)
  })

  test('seeds one row: cognito_sub NULL, kg, Asia/Ho_Chi_Minh', () => {
    const seeds = seedsOf(sql, 'settings')
    expect(seeds).toHaveLength(1)
    const [seed] = seeds
    const row = Object.fromEntries(seed?.columns.map((column, i) => [column, seed.values[i]]) ?? [])
    expect(row).toEqual({
      cognito_sub: 'NULL',
      time_zone: "'Asia/Ho_Chi_Minh'",
      display_unit: "'kg'",
    })
  })

  test('the seed is guarded, so running the migration twice still leaves one row', () => {
    expect(seedsOf(sql, 'settings')[0]?.guarded).toBe(true)
  })
})

describe('migrations', () => {
  test('has exactly: name, applied_at, with name as its primary key', () => {
    expect(names(columnsOf(sql, 'migrations')).sort()).toEqual(['applied_at', 'name'])
    expect(isPrimaryKey(sql, 'migrations', 'name')).toBe(true)
  })

  test('the migration does not add itself to migrations: the runner does that, after the file has run', () => {
    expect(seedsOf(sql, 'migrations')).toEqual([])
  })
})

// ---- R12: forward-only, and accepted by the guard -------------------------------------------

describe('the migration as a whole', () => {
  test('creates exactly keys, settings and migrations', () => {
    const created = statementsOf(sql)
      .map((statement) => /^create table (?:if not exists )?(\w+)/i.exec(statement)?.[1])
      .filter((table) => table !== undefined)
    expect(created.sort()).toEqual(['keys', 'migrations', 'settings'])
  })

  test('is forward-only: nothing in it drops, truncates, deletes or renames', () => {
    const live = withoutComments(sql)
    for (const word of ['drop', 'truncate', 'delete', 'rename']) {
      expect(live, word).not.toMatch(new RegExp(`\\b${word}\\b`, 'i'))
    }
  })

  test('every table is created IF NOT EXISTS, so a re-run after a partial run is safe', () => {
    for (const statement of statementsOf(sql).filter((s) => /^create table\b/i.test(s))) {
      expect(statement).toMatch(/^create table if not exists\b/i)
    }
  })

  test('node tools/check-dsql-sql.mjs api/migrations accepts it, from the repository root', () => {
    const result = spawnSync(process.execPath, ['tools/check-dsql-sql.mjs', 'api/migrations'], {
      cwd: repoRoot,
      encoding: 'utf8',
    })
    expect(result.stderr).toBe('')
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(/0 findings/)
  })
})

// ---- the readers above, shown to notice a change ----------------------------------------------

describe('the readers see a change made to the SQL', () => {
  const base = `
    CREATE TABLE IF NOT EXISTS keys (id uuid PRIMARY KEY, key_sha256 text NOT NULL, name text NOT NULL);
    CREATE UNIQUE INDEX ASYNC IF NOT EXISTS keys_k ON keys (key_sha256);
    CREATE TABLE IF NOT EXISTS settings (cognito_sub text, time_zone text NOT NULL);
    INSERT INTO settings (cognito_sub, time_zone) SELECT NULL, 'UTC' WHERE NOT EXISTS (SELECT 1 FROM settings);
  `

  test('the baseline reads as expected, so the changes below are the cause of any difference', () => {
    expect(names(columnsOf(base, 'keys'))).toEqual(['id', 'key_sha256', 'name'])
    expect(uniqueColumnSets(base, 'keys')).toEqual([['key_sha256']])
    expect(isPrimaryKey(base, 'keys', 'id')).toBe(true)
    expect(seedsOf(base, 'settings')).toEqual([
      { columns: ['cognito_sub', 'time_zone'], values: ['NULL', "'UTC'"], guarded: true },
    ])
  })

  test('an added column is seen', () => {
    const changed = base.replace(
      'name text NOT NULL',
      'name text NOT NULL, last_used_at timestamptz',
    )
    expect(names(columnsOf(changed, 'keys'))).toEqual(['id', 'key_sha256', 'name', 'last_used_at'])
  })

  test('a column added after a table-level constraint is seen as well', () => {
    const changed = base.replace(
      'name text NOT NULL)',
      'name text NOT NULL, UNIQUE (name), key_plain text)',
    )
    expect(names(columnsOf(changed, 'keys'))).toContain('key_plain')
    expect(uniqueColumnSets(changed, 'keys')).toContainEqual(['name'])
  })

  test('a removed column is seen', () => {
    const changed = base.replace('key_sha256 text NOT NULL, ', '')
    expect(names(columnsOf(changed, 'keys'))).toEqual(['id', 'name'])
  })

  test('a unique index over two columns is not mistaken for one over key_sha256', () => {
    const changed = base.replace('ON keys (key_sha256)', 'ON keys (key_sha256, name)')
    expect(uniqueColumnSets(changed, 'keys')).toEqual([['key_sha256', 'name']])
    expect(uniqueColumnSets(changed, 'keys')).not.toContainEqual(['key_sha256'])
  })

  test('a plain (non-unique) index is not counted as unique', () => {
    const changed = base.replace('CREATE UNIQUE INDEX', 'CREATE INDEX')
    expect(uniqueColumnSets(changed, 'keys')).toEqual([])
  })

  test('an inline UNIQUE on a column is counted', () => {
    const changed = base.replace('name text NOT NULL)', 'name text NOT NULL UNIQUE)')
    expect(uniqueColumnSets(changed, 'keys')).toContainEqual(['name'])
  })

  test('a lost primary key is seen', () => {
    expect(isPrimaryKey(base.replace('id uuid PRIMARY KEY', 'id uuid'), 'keys', 'id')).toBe(false)
  })

  test('a changed or unguarded seed is seen', () => {
    expect(seedsOf(base.replace("'UTC'", "'Etc/UTC'"), 'settings')[0]?.values).toEqual([
      'NULL',
      "'Etc/UTC'",
    ])
    expect(seedsOf(base.replace('SELECT NULL', "SELECT 'sub-1'"), 'settings')[0]?.values[0]).toBe(
      "'sub-1'",
    )
    const unguarded = base.replace(' WHERE NOT EXISTS (SELECT 1 FROM settings)', '')
    expect(seedsOf(unguarded, 'settings')[0]?.guarded).toBe(false)
  })

  test('a second seed is seen', () => {
    const twice = `${base}\nINSERT INTO settings (cognito_sub, time_zone) VALUES (NULL, 'UTC');`
    expect(seedsOf(twice, 'settings')).toHaveLength(2)
  })

  test('a table that is not there reads as empty, so a missing table cannot pass an "exactly" test', () => {
    expect(columnsOf(base, 'nowhere')).toEqual([])
    expect(columnsOf('', 'keys')).toEqual([])
  })

  test('commented-out SQL is not read as SQL', () => {
    const changed = `-- ALTER nothing; CREATE TABLE ghost (a int);\n/* CREATE TABLE ghost2 (a int); */\n${base}`
    expect(columnsOf(changed, 'ghost')).toEqual([])
    expect(columnsOf(changed, 'ghost2')).toEqual([])
  })
})
