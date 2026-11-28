import { randomUUID } from 'node:crypto'
import { KEY_HASH_TAKEN, keyNameTaken } from './errors.js'
import type { KeyRow, Repository, SettingsRow } from './types.js'

type StoredKey = KeyRow & { key_sha256: string }

export type Seed = {
  keys: { name: string; key_sha256: string }[]
  settings: SettingsRow | null
}

// A working implementation of Repository, not a mock: it stores what it is given and answers from
// what it holds, so a test describes behaviour and never the order of calls. It proves the shape of
// the seam and nothing about Aurora DSQL.
export function memoryRepository(seed: Partial<Seed> = {}): Repository {
  const keys: StoredKey[] = []
  const settings = seed.settings ?? null

  const insert = ({ name, key_sha256 }: { name: string; key_sha256: string }): void => {
    if (keys.some((key) => key.name === name)) {
      throw new Error(keyNameTaken(name))
    }
    if (keys.some((key) => key.key_sha256 === key_sha256)) {
      throw new Error(KEY_HASH_TAKEN)
    }
    keys.push({ id: randomUUID(), name, key_sha256 })
  }

  for (const row of seed.keys ?? []) insert(row)

  // Hand back a fresh object holding only the KeyRow fields, never the stored one.
  const present = (key: StoredKey | undefined): KeyRow | null =>
    key ? { id: key.id, name: key.name } : null

  return {
    async findKeyByHash(hash) {
      return present(keys.find((key) => key.key_sha256 === hash))
    },
    async findKeyByName(name) {
      return present(keys.find((key) => key.name === name))
    },
    async insertKey(row) {
      insert(row)
    },
    async getSettings() {
      return settings ? { ...settings } : null
    },
  }
}
