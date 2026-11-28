// The rules and the reader behind tools/check-dsql-sql.mjs, the command that runs them:
//   node tools/check-dsql-sql.mjs <migrations directory>
// This file only exports. It has no entry point to get wrong, so how the command is reached (a
// symlink, a relative path) cannot stop it running.
//
// There is no local Aurora DSQL, so this cannot prove that a file is accepted. It is a list of
// constructs that are known to be rejected, or that this project does not allow, matched against the
// SQL. It will miss something: a construct nobody listed passes. The first deploy against a real
// cluster (change 9017) is where a migration is actually tried.
//
// What it does promise: it reads the SQL as SQL, not as text. Comments and the insides of strings are
// removed first, so a construct that is only mentioned is left alone, and one that is split across
// lines or by a comment is still found. A file it cannot read to the end, or that has no statements,
// fails, because a check that checked nothing must not look like a pass.
//
// What it deliberately does not cover, so the gaps are known rather than discovered:
//   - UPDATE. A data migration may legitimately update rows; the seed in 0001 is an INSERT.
//   - CREATE EXTENSION and views, which it has no evidence either way about.
//   - Column types the documentation says cannot be indexed (json, jsonb, bytea, interval, timetz)
//     when they are used as a key or in an index.
//   - A CACHE on a GENERATED ... AS column, and ALTER TABLE ... ADD CHECK or FOREIGN KEY without NOT VALID,
//     which the documentation requires.
//   - An index literally named "async": it would be read as the ASYNC keyword.
//   - Anything not listed in RULES below. A rule exists only for what someone thought of.
//
// Every rule has a tier, and the tier says where the rule comes from:
//   documented  the Aurora DSQL documentation says the construct is not accepted or must be written
//               another way (read 2026-11-27, and the project's own notes in docs/product/decision-log.md)
//   inferred    the documentation does not list the construct at all, so it cannot be confirmed as
//               accepted; the message says so
//   policy      Aurora DSQL accepts it; a migration here must be forward-only, so it is refused
//   blind       the guard cannot see inside the construct, so it refuses to guess

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Each regex runs against one statement after sanitize(): lower-case is not assumed, whitespace is a
// single space, comments are gone and string contents are empty.
// A pattern is anything with a test(statement) method: a RegExp, or an object for the few rules that
// need a comparison a regex cannot make.
function rule(id, tier, pattern, why) {
  return { id, tier, pattern, why }
}

// True for a CREATE SEQUENCE that states no CACHE, or one that is neither 1 nor at least 65536.
function sequenceCacheIsInvalid(statement) {
  if (!/\bcreate sequence\b/i.test(statement)) return false
  const stated = /\bcache (\d[\d_]*)\b/i.exec(statement)
  if (!stated) return true
  const value = Number(stated[1].replaceAll('_', ''))
  return !(value === 1 || value >= 65536)
}

export const RULES = [
  rule(
    'create-index-without-async',
    'documented',
    /\bcreate (unique )?index\b(?! async\b)/i,
    'Aurora DSQL builds every index asynchronously and requires the ASYNC keyword: CREATE [UNIQUE] INDEX ASYNC.',
  ),
  rule(
    'create-trigger',
    'documented',
    /\bcreate (or replace )?(constraint )?trigger\b/i,
    'Aurora DSQL does not support triggers; the documentation points to logic in the application instead.',
  ),
  rule(
    'truncate',
    'documented',
    /\btruncate\b/i,
    'Aurora DSQL does not support TRUNCATE; the documentation says to use DELETE FROM, which a forward-only migration does not do either.',
  ),
  rule(
    'temporary-table',
    'documented',
    /\bcreate (global |local )?temp(orary)?\b/i,
    'Aurora DSQL does not support temporary tables.',
  ),
  rule(
    'sequence-cache',
    'documented',
    { test: sequenceCacheIsInvalid },
    'Aurora DSQL requires CREATE SEQUENCE to state CACHE explicitly, with a value of 1 or at least 65536.',
  ),
  rule(
    'alter-column-type',
    'documented',
    /\balter table\b.*\balter (column )?\S+ (set data )?type\b/i,
    'Aurora DSQL does not support changing a column type with ALTER TABLE.',
  ),
  rule(
    'set-not-null',
    'documented',
    /\balter table\b.*\balter (column )?\S+ set not null\b/i,
    'Aurora DSQL does not support ALTER COLUMN ... SET NOT NULL; only DROP NOT NULL exists.',
  ),
  rule(
    'add-primary-key',
    'documented',
    /\balter table\b.*\badd (constraint \S+ )?primary key\b/i,
    'Aurora DSQL does not allow a primary key to be added after a table is created.',
  ),
  rule(
    'serial',
    'inferred',
    /\b(smallserial|bigserial|serial[248]?)\b/i,
    'UNVERIFIED. The documentation (CREATE TABLE, data types, sequences, read 2026-11-27) never lists SERIAL, and it documents sequences, and the integer columns built on them, only with an explicit CACHE. This guard refuses SERIAL because it cannot confirm it is accepted; Keys here are UUIDs, so nothing needs it. If SERIAL is later confirmed, remove this rule.',
  ),
  rule(
    'drop',
    'policy',
    /\bdrop\b/i,
    'Migrations are forward-only. DROP also cancels a running index build on Aurora DSQL.',
  ),
  rule(
    'delete-from',
    'policy',
    /\bdelete from\b/i,
    'Migrations are forward-only and destroy nothing.',
  ),
  rule(
    'rename',
    'policy',
    /\brename\b/i,
    'Migrations are forward-only, and a rename breaks every query written against the old name just as a drop does.',
  ),
  rule(
    'procedural-body',
    'blind',
    /^(do|call)\b|\bcreate (or replace )?(function|procedure)\b/i,
    'The guard cannot read inside a DO block, a function or a procedure, so it cannot say what that body runs.',
  ),
]

// Reads SQL the way the server does, as far as these rules need. Returns { text } with comments
// replaced by a space, the contents of strings and quoted names emptied, and whitespace collapsed;
// or { error } when the text ends inside a comment, string or quoted name. { opaque: true } marks a
// dollar-quoted string, whose contents are emptied but which the caller should refuse.
export function sanitize(sql) {
  let out = ''
  let opaque = false
  let i = 0
  const n = sql.length

  while (i < n) {
    const char = sql[i]
    const next = sql[i + 1]

    if (char === '-' && next === '-') {
      while (i < n && sql[i] !== '\n') i++
      out += ' '
      continue
    }

    if (char === '/' && next === '*') {
      // PostgreSQL block comments nest.
      let depth = 1
      i += 2
      while (i < n && depth > 0) {
        if (sql[i] === '/' && sql[i + 1] === '*') {
          depth++
          i += 2
        } else if (sql[i] === '*' && sql[i + 1] === '/') {
          depth--
          i += 2
        } else {
          i++
        }
      }
      if (depth > 0) return { error: 'a block comment is never closed' }
      out += ' '
      continue
    }

    if (char === "'" || char === '"') {
      // Only an E'...' string treats a backslash as an escape. In a plain string a backslash is just
      // a character, so '\' is a complete string; reading it as an escape would swallow the quote
      // and hide whatever follows.
      const escapes = char === "'" && /(^|[^A-Za-z0-9_$])[eE]$/.test(out)
      i++
      let closed = false
      while (i < n) {
        if (escapes && sql[i] === '\\') {
          i += 2
        } else if (sql[i] === char && sql[i + 1] === char) {
          i += 2
        } else if (sql[i] === char) {
          i++
          closed = true
          break
        } else {
          i++
        }
      }
      if (!closed) {
        return {
          error: char === "'" ? 'a string is never closed' : 'a quoted name is never closed',
        }
      }
      out += char + char
      continue
    }

    if (char === '$' && !/[A-Za-z0-9_$]$/.test(out)) {
      const opener = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i))
      if (opener) {
        const close = sql.indexOf(opener[0], i + opener[0].length)
        if (close === -1) return { error: 'a dollar-quoted string is never closed' }
        opaque = true
        i = close + opener[0].length
        out += "''"
        continue
      }
    }

    out += char
    i++
  }

  return { text: out.replace(/\s+/g, ' ').trim(), opaque }
}

function finding(file, rule, tier, why, statement) {
  return { file, rule, tier, why, statement: statement.slice(0, 160) }
}

// Returns a list of findings; an empty list means nothing on the list was found, not that the SQL is
// accepted.
export function checkSql(sql, file = '<sql>') {
  const read = sanitize(sql)
  if (read.error) {
    return [
      finding(
        file,
        'unparseable',
        'blind',
        `The SQL cannot be read to the end (${read.error}), so nothing after that point was checked.`,
        '',
      ),
    ]
  }

  const statements = read.text
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement !== '')

  if (statements.length === 0) {
    return [
      finding(
        file,
        'empty',
        'blind',
        'The file holds no statements, so there was nothing to check.',
        '',
      ),
    ]
  }

  const findings = []
  if (read.opaque) {
    findings.push(
      finding(
        file,
        'dollar-quoted',
        'blind',
        'A dollar-quoted string hides its contents from this guard, so whatever it holds was not checked.',
        read.text,
      ),
    )
  }
  for (const statement of statements) {
    for (const candidate of RULES) {
      if (candidate.pattern.test(statement)) {
        findings.push(finding(file, candidate.id, candidate.tier, candidate.why, statement))
      }
    }
  }
  return findings
}

// Reads every .sql file under a directory, however deep. Returns { files, findings, problems }: a
// problem is something that stopped the check from being a check at all.
export function checkDirectory(directory) {
  let entries
  try {
    if (!statSync(directory).isDirectory()) throw new Error('not a directory')
    entries = readdirSync(directory, { recursive: true })
  } catch (error) {
    return { files: 0, findings: [], problems: [`cannot read ${directory}: ${error.message}`] }
  }

  const sqlFiles = entries
    .map(String)
    .filter((entry) => /\.sql$/i.test(entry))
    .sort()
    .map((entry) => join(directory, entry))
    .filter((path) => statSync(path).isFile())

  if (sqlFiles.length === 0) {
    return {
      files: 0,
      findings: [],
      problems: [`no .sql files under ${directory}; nothing was checked`],
    }
  }

  const findings = []
  const problems = []
  for (const path of sqlFiles) {
    try {
      findings.push(...checkSql(readFileSync(path, 'utf8'), path))
    } catch (error) {
      problems.push(`cannot read ${path}: ${error.message}`)
    }
  }
  return { files: sqlFiles.length, findings, problems }
}
