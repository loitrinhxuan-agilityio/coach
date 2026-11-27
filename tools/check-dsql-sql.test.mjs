// A guard is worth exactly what it catches, so every test here either feeds the checker a construct
// it must reject, or feeds it a near-miss it must leave alone. A checker that accepted everything
// would pass the happy path perfectly; the REJECTED table below is what stops that.
//
// Each rejected construct is appended to the real 0001_init.sql, so the test also proves the checker
// reads past the statements before it and does not stop at the first clean one.
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkDirectory, checkSql, RULES } from './check-dsql-sql.mjs'

const script = fileURLToPath(new URL('./check-dsql-sql.mjs', import.meta.url))
const migrationsDir = fileURLToPath(new URL('../api/migrations', import.meta.url))
const baseline = readFileSync(join(migrationsDir, '0001_init.sql'), 'utf8')

const rulesOf = (sql) => checkSql(sql).map((finding) => finding.rule)
const appended = (construct) => `${baseline}\n${construct}\n`

// rule id, then a construct that rule must reject. One row per rule, plus the structural ones.
const REJECTED = [
  // Documented as not accepted by Aurora DSQL.
  ['create-index-without-async', 'CREATE INDEX keys_created_at_idx ON keys (created_at);'],
  ['create-index-without-async', 'CREATE UNIQUE INDEX keys_name_idx ON keys (name);'],
  ['create-index-without-async', 'CREATE INDEX CONCURRENTLY keys_x ON keys (name);'],
  ['create-trigger', 'CREATE TRIGGER t BEFORE INSERT ON keys FOR EACH ROW EXECUTE FUNCTION f();'],
  ['truncate', 'TRUNCATE keys;'],
  ['temporary-table', 'CREATE TEMP TABLE scratch (a int);'],
  ['temporary-table', 'CREATE TEMPORARY TABLE scratch (a int);'],
  ['sequence-without-cache', 'CREATE SEQUENCE seq START 1;'],
  ['alter-column-type', 'ALTER TABLE keys ALTER COLUMN name TYPE varchar(10);'],
  ['alter-column-type', 'ALTER TABLE keys ALTER COLUMN name SET DATA TYPE varchar(10);'],
  ['set-not-null', 'ALTER TABLE settings ALTER COLUMN cognito_sub SET NOT NULL;'],
  ['add-primary-key', 'ALTER TABLE settings ADD PRIMARY KEY (time_zone);'],
  ['add-primary-key', 'ALTER TABLE settings ADD CONSTRAINT pk PRIMARY KEY (time_zone);'],
  // Inferred from a documented rule, not listed by the documentation itself.
  ['serial', 'CREATE TABLE a (n SERIAL PRIMARY KEY);'],
  ['serial', 'CREATE TABLE a (n bigserial PRIMARY KEY);'],
  ['serial', 'CREATE TABLE a (n smallserial PRIMARY KEY);'],
  ['serial', 'CREATE TABLE a (n serial8 PRIMARY KEY);'],
  // This project's own rules: forward-only, and foreign keys held back.
  ['drop', 'DROP TABLE keys;'],
  ['drop', 'DROP INDEX keys_name_key;'],
  ['drop', 'ALTER TABLE keys DROP COLUMN name;'],
  ['delete-from', 'DELETE FROM settings;'],
  ['foreign-key', 'CREATE TABLE a (k uuid, FOREIGN KEY (k) REFERENCES keys (id));'],
  // The column-constraint form never writes the words FOREIGN KEY.
  ['foreign-key', 'CREATE TABLE a (k uuid REFERENCES keys (id));'],
  ['foreign-key', 'ALTER TABLE keys ADD COLUMN k uuid REFERENCES keys (id);'],
  // The checker cannot read inside these, so it refuses them.
  ['procedural-body', "DO $$ BEGIN EXECUTE 'DROP TABLE keys'; END $$;"],
  ['procedural-body', "DO 'BEGIN PERFORM 1; END';"],
  ['procedural-body', 'CALL cleanup();'],
  ['procedural-body', 'CREATE FUNCTION f() RETURNS int LANGUAGE SQL AS $$ SELECT 1 $$;'],
  ['procedural-body', "CREATE OR REPLACE PROCEDURE p() LANGUAGE SQL AS 'SELECT 1';"],
  ['dollar-quoted', 'INSERT INTO settings (time_zone) VALUES ($$ DROP TABLE keys $$);'],
  // The file cannot be read to the end, so nothing after the break was checked.
  ['unparseable', "INSERT INTO settings (time_zone) VALUES ('never closed);"],
  ['unparseable', '/* never closed'],
  ['unparseable', 'SELECT "never closed;'],
  ['unparseable', 'SELECT $tag$ never closed;'],
]

describe('every construct the checker is meant to reject is rejected', () => {
  test.each(REJECTED)('%s: %s', (rule, construct) => {
    expect(rulesOf(appended(construct))).toContain(rule)
  })

  test('the real migration is clean, so the cases above are what triggered the finding', () => {
    expect(checkSql(baseline)).toEqual([])
  })

  test('every rule has at least one rejected case (adding a rule without a test fails here)', () => {
    const tested = new Set(REJECTED.map(([rule]) => rule))
    const structural = ['unparseable', 'dollar-quoted', 'empty']
    for (const id of [...RULES.map((rule) => rule.id), ...structural]) {
      if (id === 'empty') continue // covered by its own test below
      expect(tested, `no rejected case for rule ${id}`).toContain(id)
    }
  })

  test('every rule id in a rejected case names a rule that exists', () => {
    const known = new Set([
      ...RULES.map((rule) => rule.id),
      'unparseable',
      'dollar-quoted',
      'empty',
    ])
    for (const [rule] of REJECTED) expect(known, `unknown rule ${rule}`).toContain(rule)
  })

  test('a rule fires on its own construct and not on the others (rejecting everything is not a pass)', () => {
    // 'drop' must not claim a TRUNCATE, 'truncate' must not claim a DROP: each finding names the
    // construct that caused it. If every rule fired on every statement this would fail.
    expect(rulesOf('TRUNCATE keys;')).toEqual(['truncate'])
    expect(rulesOf('DROP TABLE keys;')).toEqual(['drop'])
    expect(
      rulesOf('CREATE TRIGGER t BEFORE INSERT ON keys FOR EACH ROW EXECUTE FUNCTION f();'),
    ).toEqual(['create-trigger'])
  })
})

describe('the same constructs are rejected however they are written', () => {
  test.each([
    [
      'a comment between the words',
      'CREATE TABLE a (k uuid, FOREIGN/**/KEY (k) REFERENCES keys (id));',
      'foreign-key',
    ],
    [
      'a newline and a tab between the words',
      'CREATE\n\tTRIGGER t BEFORE INSERT ON keys EXECUTE FUNCTION f();',
      'create-trigger',
    ],
    [
      'mixed case',
      'cReAtE tRiGgEr t BEFORE INSERT ON keys EXECUTE FUNCTION f();',
      'create-trigger',
    ],
    ['a line comment ending the statement', 'DROP TABLE keys -- tidy up', 'drop'],
    ['no spaces around the semicolon', 'SELECT 1;DROP TABLE keys;SELECT 2', 'drop'],
    ['a quoted identifier beside the keyword', 'DROP TABLE "keys";', 'drop'],
  ])('%s', (_name, construct, rule) => {
    expect(rulesOf(construct)).toContain(rule)
  })

  test('the word ASYNC inside a comment does not make an index asynchronous', () => {
    expect(rulesOf('CREATE INDEX /* ASYNC */ k ON keys (name);')).toContain(
      'create-index-without-async',
    )
    expect(rulesOf('CREATE INDEX -- ASYNC\n k ON keys (name);')).toContain(
      'create-index-without-async',
    )
  })

  test('the word ASYNC inside a string does not make an index asynchronous either', () => {
    expect(rulesOf("CREATE INDEX k ON keys (name) WHERE name = 'ASYNC';")).toContain(
      'create-index-without-async',
    )
  })

  test('a plain string ends at its second quote, so a backslash hides nothing after it', () => {
    // standard_conforming_strings is on by default: '\' is a complete string. If the checker treated
    // the backslash as an escape it would read past the quote and miss the DROP that follows.
    const sql = "INSERT INTO settings (time_zone) VALUES ('\\'); DROP TABLE keys; --')"
    expect(rulesOf(sql)).toContain('drop')
  })

  test('a block comment ends at its own close, so it hides nothing after it', () => {
    expect(rulesOf('/* a */ DROP TABLE keys')).toContain('drop')
    // Nested comments: the first close ends only the inner one.
    expect(rulesOf('/* a /* b */ c */ DROP TABLE keys')).toContain('drop')
  })

  test('constructs after a clean first statement in the same file are still found', () => {
    expect(rulesOf('SELECT 1; SELECT 2; SELECT 3; TRUNCATE keys;')).toEqual(['truncate'])
  })
})

describe('a construct that is only mentioned, not used, is left alone', () => {
  test.each([
    ['a line comment', '-- CREATE TRIGGER, DROP TABLE and FOREIGN KEY are named here\nSELECT 1;'],
    ['a block comment', '/* TRUNCATE keys; DROP TABLE keys; */ SELECT 1;'],
    ['a nested block comment', '/* a /* b */ DROP TABLE keys; */ SELECT 1;'],
    [
      'a string literal',
      "INSERT INTO settings (time_zone) VALUES ('DROP TABLE keys; CREATE TRIGGER');",
    ],
    [
      'a string with a doubled quote',
      "INSERT INTO settings (time_zone) VALUES ('it''s; DROP TABLE keys');",
    ],
    ['an escape string', "INSERT INTO settings (time_zone) VALUES (E'it\\'s; DROP TABLE keys');"],
    ['a quoted identifier', 'SELECT "drop" FROM keys;'],
    ['a column named for the word', 'ALTER TABLE keys ADD COLUMN truncated_at timestamptz;'],
    [
      'a name that contains a keyword',
      'CREATE TABLE dropdown_choices (serial_no text, deleted_at timestamptz, references_count int);',
    ],
  ])('%s', (_name, sql) => {
    expect(checkSql(sql)).toEqual([])
  })

  test.each([
    'CREATE INDEX ASYNC keys_created_at_idx ON keys (created_at);',
    'CREATE UNIQUE INDEX ASYNC keys_name_key ON keys (name);',
    'CREATE UNIQUE INDEX ASYNC IF NOT EXISTS keys_name_key ON keys (name);',
    'create unique index async if not exists keys_name_key on keys (name);',
    'CREATE SEQUENCE seq CACHE 65536;',
    'CREATE SEQUENCE seq CACHE 1 START 1;',
    'CREATE TABLE a (k uuid PRIMARY KEY, n text UNIQUE, c int CHECK (c > 0));',
    'ALTER TABLE keys ADD COLUMN note text;',
    'INSERT INTO settings (time_zone) SELECT $1 WHERE NOT EXISTS (SELECT 1 FROM settings);',
  ])('%s', (sql) => {
    expect(checkSql(sql)).toEqual([])
  })
})

describe('a file that was not really checked is not a pass', () => {
  test.each([
    ['an empty file', ''],
    ['only whitespace', '  \n\t\n'],
    ['only comments', '-- nothing here\n/* nor here */\n'],
    ['only semicolons', ';;;'],
  ])('%s', (_name, sql) => {
    expect(rulesOf(sql)).toEqual(['empty'])
  })
})

describe('findings say which rule, which tier, and which statement', () => {
  test('a finding carries enough to act on', () => {
    const [finding] = checkSql('DROP TABLE keys;', 'api/migrations/0002_x.sql')
    expect(finding).toMatchObject({
      file: 'api/migrations/0002_x.sql',
      rule: 'drop',
      tier: 'policy',
      statement: 'DROP TABLE keys',
    })
    expect(finding.why.length).toBeGreaterThan(20)
  })

  test('the foreign key rule says it is this project holding the line, not Aurora DSQL', () => {
    const [finding] = checkSql('CREATE TABLE a (k uuid REFERENCES keys (id));')
    expect(finding.tier).toBe('policy')
    expect(finding.why).toMatch(/supports foreign keys/i)
  })

  test('every rule has a tier from the known set and a reason', () => {
    for (const rule of RULES) {
      expect(['documented', 'inferred', 'policy', 'blind']).toContain(rule.tier)
      expect(rule.why.length).toBeGreaterThan(20)
    }
  })
})

describe('the directory check', () => {
  const scratch = () => mkdtempSync(join(tmpdir(), 'dsql-check-'))

  test('a directory of clean files has no findings and counts the files it read', () => {
    const dir = scratch()
    writeFileSync(join(dir, '0001_a.sql'), 'SELECT 1;')
    writeFileSync(join(dir, '0002_b.sql'), 'SELECT 2;')
    expect(checkDirectory(dir)).toMatchObject({ files: 2, findings: [], problems: [] })
  })

  test('a bad second file is found even though the first is clean', () => {
    const dir = scratch()
    writeFileSync(join(dir, '0001_a.sql'), 'SELECT 1;')
    writeFileSync(join(dir, '0002_b.sql'), 'TRUNCATE keys;')
    const { findings } = checkDirectory(dir)
    expect(findings.map((finding) => [finding.rule, finding.file.endsWith('0002_b.sql')])).toEqual([
      ['truncate', true],
    ])
  })

  test('a bad file in a subdirectory is found', () => {
    const dir = scratch()
    mkdirSync(join(dir, 'later'))
    writeFileSync(join(dir, 'later', '0003_c.sql'), 'DROP TABLE keys;')
    expect(checkDirectory(dir).findings.map((finding) => finding.rule)).toEqual(['drop'])
  })

  test('the extension is matched without regard to case', () => {
    const dir = scratch()
    writeFileSync(join(dir, '0001_a.SQL'), 'DROP TABLE keys;')
    expect(checkDirectory(dir).findings.map((finding) => finding.rule)).toEqual(['drop'])
  })

  test('files that are not SQL are not read', () => {
    const dir = scratch()
    writeFileSync(join(dir, '0001_a.sql'), 'SELECT 1;')
    writeFileSync(join(dir, 'notes.md'), 'DROP TABLE keys;')
    expect(checkDirectory(dir)).toMatchObject({ files: 1, findings: [] })
  })

  test('a directory with no SQL in it is a problem, not a pass', () => {
    const dir = scratch()
    writeFileSync(join(dir, 'readme.md'), 'nothing')
    expect(checkDirectory(dir).problems).toEqual([expect.stringMatching(/no \.sql files/)])
  })

  test('a directory that does not exist is a problem, not a pass', () => {
    expect(checkDirectory(join(scratch(), 'missing')).problems).toEqual([
      expect.stringMatching(/cannot read/),
    ])
  })
})

describe('the command line', () => {
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' })
  const scratch = (files) => {
    const dir = mkdtempSync(join(tmpdir(), 'dsql-check-'))
    for (const [name, sql] of Object.entries(files)) writeFileSync(join(dir, name), sql)
    return dir
  }

  test('exits 0 on the real migrations directory and says how many files it read', () => {
    const result = run(migrationsDir)
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(/1 migration file checked, 0 findings/)
  })

  test('exits non-zero on a rejected construct and names the rule, the tier and the file', () => {
    const dir = scratch({
      '0001_bad.sql': 'CREATE TRIGGER t BEFORE INSERT ON keys EXECUTE FUNCTION f();',
    })
    const result = run(dir)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('create-trigger')
    expect(result.stderr).toContain('documented')
    expect(result.stderr).toContain('0001_bad.sql')
  })

  test.each([
    ['a FOREIGN KEY', 'CREATE TABLE a (k uuid, FOREIGN KEY (k) REFERENCES keys (id));'],
    ['a SERIAL', 'CREATE TABLE a (n SERIAL PRIMARY KEY);'],
    ['a CREATE TRIGGER', 'CREATE TRIGGER t BEFORE INSERT ON keys EXECUTE FUNCTION f();'],
    ['a DROP', 'DROP TABLE keys;'],
    ['a non-ASYNC index', 'CREATE UNIQUE INDEX k ON keys (name);'],
  ])('exits non-zero on %s', (_name, sql) => {
    expect(run(scratch({ '0001_x.sql': sql })).status).toBe(1)
  })

  test('exits non-zero on an empty directory, a missing directory and an unreadable file', () => {
    expect(run(scratch({})).status).toBe(1)
    expect(run(join(scratch({}), 'missing')).status).toBe(1)
    expect(run(scratch({ '0001_x.sql': "SELECT 'open" })).status).toBe(1)
  })

  test('exits 2 and prints usage with no argument or more than one', () => {
    const none = run()
    expect(none.status).toBe(2)
    expect(none.stderr).toMatch(/usage/i)
    expect(run('a', 'b').status).toBe(2)
  })

  test('reports every finding, not just the first', () => {
    const result = run(scratch({ '0001_x.sql': 'DROP TABLE keys; TRUNCATE keys;' }))
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('drop')
    expect(result.stderr).toContain('truncate')
  })
})
