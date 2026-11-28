// A Key as the rest of the product sees it. It deliberately carries no hash: the hash is how a
// Key is looked up, and nothing past the lookup has a use for it.
export type KeyRow = { id: string; name: string }

export type SettingsRow = { time_zone: string; display_unit: 'kg' }

// The seam between the product's logic and Aurora DSQL. Absence is `null`; turning absence into an
// error is the operation's job, so this layer never throws an OperationError.
export interface Repository {
  findKeyByHash(hash: string): Promise<KeyRow | null>
  findKeyByName(name: string): Promise<KeyRow | null>
  // Rejects when a Key with this name, or this hash, already exists, and stores nothing.
  insertKey(row: { name: string; key_sha256: string }): Promise<void>
  // `null` when there is no settings row. That means a broken deployment, so it is never defaulted.
  getSettings(): Promise<SettingsRow | null>
}
