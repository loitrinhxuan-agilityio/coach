// What a Repository says when a Key cannot be stored because one already exists. Both
// implementations import these, so the wording cannot drift between them. The in-memory repository
// throws them for its own checks; the Aurora DSQL one throws them for a unique violation. Neither
// carries the hash, which a database's own error would quote.
export const keyNameTaken = (name: string): string => `a Key named ${name} already exists`
export const KEY_HASH_TAKEN = 'a Key with this hash already exists'
