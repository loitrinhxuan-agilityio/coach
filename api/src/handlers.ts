import { readDsqlSettings } from './db/connection.js'
import { dsqlRepository } from './repository/dsql.js'
import { createHandler } from './surfaces/http/router.js'
import { createMcpHandler } from './surfaces/mcp/server.js'

// The one place the product is joined to its database, and what the stack points its Lambdas at.
// The surfaces are built from a Repository and never import one, so an export that was not wired to
// a real repository would answer every call with a plausible 500; this module is where that is
// ruled out.
//
// Read at load so a deployment that forgot a setting stops the container during initialisation,
// where the platform reports it, and does not answer `internal` to every request, where nothing
// says why.
readDsqlSettings()

const repo = dsqlRepository()

export const handler = createHandler({ repo })
export const mcpHandler = createMcpHandler({ repo })
