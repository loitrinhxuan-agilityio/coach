import type { Principal } from '../auth/authenticate.js'
import { OperationError } from '../errors/types.js'
import type { Repository } from '../repository/types.js'

// What an Agent reads at the start of every conversation: who it is acting as, and the Lifter's
// settings. Four things never appear here: the Lifter's sign-in identity, the Key string, its hash,
// and any hint that other Keys exist.
export type AccountBody = {
  agent: { name: string }
  settings: { time_zone: string; display_unit: 'kg' }
  standing_notes: []
}

// The body is built field by field rather than spread from what the repository returned, so a
// column added to the settings row later cannot reach an Agent without someone choosing it.
export async function getAccount(ctx: {
  repo: Repository
  principal: Principal
}): Promise<AccountBody> {
  const settings = await ctx.repo.getSettings()
  // No settings row means a broken deployment. A default would hide that, so say so instead.
  if (settings === null) throw new OperationError('internal')

  return {
    agent: { name: ctx.principal.agent_name },
    settings: { time_zone: settings.time_zone, display_unit: settings.display_unit },
    // Always empty in Phase 1, and present rather than omitted: an absent field would teach every
    // Agent it is optional, which stops being true when the stories that write standing notes land.
    standing_notes: [],
  }
}
