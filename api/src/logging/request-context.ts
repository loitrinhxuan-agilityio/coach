import { AsyncLocalStorage } from 'node:async_hooks'

// The id of the request being served, kept where the database layer can read it without a parameter
// threaded through every call between the surface and the repository. A surface enters it once, at
// the top of a request, and everything that request awaits sees that id and no other: two requests
// in flight at once each see their own. Outside a request there is none.
const requests = new AsyncLocalStorage<string>()

export const currentRequestId = (): string | null => requests.getStore() ?? null

export const runWithRequestId = <T>(requestId: string, run: () => T): T =>
  requests.run(requestId, run)
