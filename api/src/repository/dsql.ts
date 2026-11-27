import { constraintOf } from '../db/errors.js'
import { withTransaction } from '../db/with-transaction.js'
import type { KeyRow, Repository, SettingsRow } from './types.js'

// The names the migration gave the two unique indexes (migrations/0001_init.sql). A unique violation
// is told apart by these and by nothing else.
export const KEY_HASH_INDEX = 'keys_key_sha256_key'
export const KEY_NAME_INDEX = 'keys_name_key'

// Only id and name are selected, so the hash cannot come back out of a lookup (Repository's rule),
// and each row is rebuilt field by field so a column added later does not leak through either.
const KEY_BY_HASH = 'SELECT id, name FROM keys WHERE key_sha256 = $1'
const KEY_BY_NAME = 'SELECT id, name FROM keys WHERE name = $1'
const INSERT_KEY = 'INSERT INTO keys (key_sha256, name) VALUES ($1, $2)'
const SETTINGS = 'SELECT time_zone, display_unit FROM settings'

const keyRow = (row: KeyRow | undefined): KeyRow | null =>
  row ? { id: row.id, name: row.name } : null

// Turns a unique violation into the error the in-memory repository throws, so the two agree and so
// the one the driver raised, whose detail names the hash it rejected, goes no further. Anything else
// is returned as it came, and nothing is swallowed.
function duplicateKey(error: unknown, name: string): unknown {
  switch (constraintOf(error)) {
    case KEY_NAME_INDEX:
      return new Error(`a Key named ${name} already exists`)
    case KEY_HASH_INDEX:
      return new Error('a Key with this hash already exists')
    default:
      return error
  }
}

// `run` is withTransaction. It is a parameter only so a test can supply one over a fake driver.
export function dsqlRepository(run: typeof withTransaction = withTransaction): Repository {
  return {
    findKeyByHash: (hash) =>
      run(async (client) => keyRow((await client.query<KeyRow>(KEY_BY_HASH, [hash])).rows[0])),

    findKeyByName: (name) =>
      run(async (client) => keyRow((await client.query<KeyRow>(KEY_BY_NAME, [name])).rows[0])),

    // Aurora DSQL may report the violation at COMMIT, which is outside the function given to `run`,
    // so the translation wraps the whole call.
    async insertKey({ name, key_sha256 }) {
      try {
        await run(async (client) => {
          await client.query(INSERT_KEY, [key_sha256, name])
        })
      } catch (error) {
        throw duplicateKey(error, name)
      }
    },

    // No row is null and is never defaulted. More than one row is a broken deployment too (settings
    // has no primary key, so two concurrent seeds could both commit), and picking one of them would
    // serve whichever the database happened to return first, so it throws. The surface answers
    // `internal` either way.
    getSettings: () =>
      run(async (client) => {
        const { rows } = await client.query<SettingsRow>(SETTINGS)
        if (rows.length > 1) throw new Error('settings holds more than one row')
        const row = rows[0]
        return row ? { time_zone: row.time_zone, display_unit: row.display_unit } : null
      }),
  }
}
