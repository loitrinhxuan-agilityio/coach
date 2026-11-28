import { dsqlRepository } from '../api/src/repository/dsql.js'
import { mintKey } from './mint-key-core.js'

// The file the Owner runs, after change 9017 has created a cluster:
//
//   DSQL_ENDPOINT=<cluster endpoint> AWS_REGION=<region> DSQL_DB_ROLE=admin \
//     npx tsx scripts/mint-key.ts <name>
//
// Two failures leave the name taken, and Phase 1 has no way to delete a Key, so each needs a new name:
//   - "may have been stored": the database may have committed the row and said nothing (a timeout
//     after COMMIT). If a retry says a Key of that name already exists, it does.
//   - "stored but could not be printed": the row is certainly there and its Key was never shown, so
//     it is lost.
// A failure that says "no Key was made" stored nothing, and the same name can be tried again.
//
// with AWS credentials for the account the cluster is in. `admin` is the role that can write to
// `keys`; whether it is the right one to run this as is 9017's to confirm. The logic is in
// mint-key-core.ts. This file only joins it to the database, and it always runs: there is no check
// for being the entry point, because a check that decided wrongly would end in a silent exit 0
// with no Key made.

const code = await mintKey(process.argv.slice(2), {
  // Nothing opens a connection until the name has been accepted, so a missing database setting is
  // reported by the first query as a failed mint (the setting's name, never its value), after any
  // mistake in the arguments has been.
  repo: dsqlRepository(),
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
})

// The database connection stays open and would hold the process, so it is ended explicitly, but not
// before the output is out: a write to a pipe can still be queued when exit is called.
process.stdout.write('', () => process.stderr.write('', () => process.exit(code)))
