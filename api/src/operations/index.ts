import type { Principal } from '../auth/authenticate.js'
import type { Repository } from '../repository/types.js'
import { getAccount } from './get-account.js'

// What every operation is given and what it hands back. The surfaces own everything around it:
// who is calling, how the result travels, how a failure is worded.
export type Operation = (ctx: { repo: Repository; principal: Principal }) => Promise<unknown>

// The code behind each registry entry, by the entry's name. The registry says what an operation is;
// this says what runs. Neither surface owns it: HTTP and MCP both read it. A name here with no
// registry entry, or a registry entry with no name here, fails `index.test.ts`.
export const implementations: Record<string, Operation> = { get_account: getAccount }
