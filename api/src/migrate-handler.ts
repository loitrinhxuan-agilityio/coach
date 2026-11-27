import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createConnector, dsqlDeps, readDsqlSettings } from './db/connection.js'
import { type Migration, runMigrations } from './db/migrate.js'
import { createTransactionRunner } from './db/with-transaction.js'

// The Lambda behind the stack's migration custom resource (R12, P2). CloudFormation calls it on
// Create and Update and waits for the answer to be PUT to the URL in the event. It is not a
// framework-managed resource: this function answers CloudFormation itself, so the stack holds no
// helper function that nothing here controls (and so no log group with no retention).
//
// THE RULE THAT SHAPES THIS FILE: every path answers CloudFormation. A migration that fails and
// says nothing leaves the stack update hanging for an hour. So nothing is read, nor any database
// reached, outside the try below, and a timeout is answered before the platform's own.

export type ResourceEvent = {
  RequestType: 'Create' | 'Update' | 'Delete'
  ResponseURL: string
  StackId: string
  RequestId: string
  LogicalResourceId: string
  PhysicalResourceId?: string
}

export type ResourceContext = { getRemainingTimeInMillis(): number }

type Answer = {
  Status: 'SUCCESS' | 'FAILED'
  Reason: string
  PhysicalResourceId: string
  StackId: string
  RequestId: string
  LogicalResourceId: string
  Data: Record<string, string>
}

export type Deps = {
  // Applies whatever has not been applied. Returns the names it applied.
  migrate(): Promise<string[]>
  respond(url: string, answer: Answer): Promise<void>
}

// Answers must go out before the Lambda's own timeout ends the invocation unanswered.
export const TIMEOUT_MARGIN_MS = 10_000
const PHYSICAL_ID = 'migrations'
// CloudFormation refuses a Reason longer than this.
const MAX_REASON = 1000

const reasonOf = (error: unknown): string =>
  (error instanceof Error ? `${error.name}: ${error.message}` : 'unknown failure').slice(
    0,
    MAX_REASON,
  )

export function createMigrationHandler({ migrate, respond }: Deps) {
  return async (event: ResourceEvent, context: ResourceContext): Promise<void> => {
    const answer = (
      status: Answer['Status'],
      reason: string,
      data: Answer['Data'] = {},
    ): Answer => ({
      Status: status,
      Reason: reason,
      PhysicalResourceId: event.PhysicalResourceId ?? PHYSICAL_ID,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
      Data: data,
    })

    let result: Answer
    // Forward-only: deleting the resource must never touch the data, so Delete does nothing.
    if (event.RequestType === 'Delete') {
      result = answer('SUCCESS', 'Nothing is dropped: migrations are forward-only.')
    } else {
      let timer: NodeJS.Timeout | undefined
      try {
        const budget = Math.max(context.getRemainingTimeInMillis() - TIMEOUT_MARGIN_MS, 0)
        const timeout = new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('ran out of time before the migrations finished')),
            budget,
          )
        })
        const applied = await Promise.race([migrate(), timeout])
        result = answer('SUCCESS', 'Migrations are up to date.', { applied: applied.join(',') })
      } catch (error) {
        console.log(JSON.stringify({ event: 'migration_failed', reason: reasonOf(error) }))
        result = answer('FAILED', reasonOf(error))
      } finally {
        clearTimeout(timer)
      }
    }
    await respond(event.ResponseURL, result)
  }
}

// The migration files travel inside the function's own bundle, in a `migrations` directory beside
// the code (the stack copies them there). Read in order of name, so 0002 follows 0001.
export async function readMigrations(directory: string): Promise<Migration[]> {
  const names = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort()
  if (names.length === 0) {
    // A runner with nothing to run must not report that the database is up to date.
    throw new Error(`no .sql files in ${directory}`)
  }
  return Promise.all(
    names.map(async (name) => ({
      name: name.slice(0, -'.sql'.length),
      sql: await readFile(join(directory, name), 'utf8'),
    })),
  )
}

// CloudFormation hands out a pre-signed URL that wants no Content-Type, so the header is sent empty.
export async function putResponse(url: string, answer: Answer): Promise<void> {
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'content-type': '' },
    body: JSON.stringify(answer),
  })
  if (!response.ok) throw new Error(`CloudFormation did not accept the answer (${response.status})`)
}

// The migrations run as the database's `admin` role: they create tables, which no other role may.
// The settings are read when the handler runs, not when it loads, so a missing one is reported to
// CloudFormation and not left to hang the stack.
export const handler = createMigrationHandler({
  respond: putResponse,
  migrate: async () => {
    const root = process.env.LAMBDA_TASK_ROOT
    if (!root) throw new Error('LAMBDA_TASK_ROOT is not set')
    const migrations = await readMigrations(join(root, 'migrations'))
    const connector = createConnector(() => dsqlDeps(readDsqlSettings()))
    const transact = createTransactionRunner({ connector })
    const outcome = await runMigrations(migrations, transact, (line) =>
      console.log(JSON.stringify(line)),
    )
    return outcome.applied
  },
})
