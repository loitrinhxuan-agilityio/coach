---
status: proposed
---

# Operations are defined once in a registry, and every agent-facing surface is generated from it

AI Lift Coach has its own API in its own shapes (D-013), about 25 operations in Phase 1. Each one is
defined once in an internal **operation registry** — path, method, principals (ADR 0003), input and
output schema, errors, idempotency and the prose an Agent needs — and every external surface is
generated from it: the HTTP routes, the MCP tool list, the OpenAPI document, the Agent guide, and
later the docs site and the 30-operation Custom-GPT subset (D-006). No surface is maintained by hand.

## Why

- **The surfaces that name operations are the ones that drift, and they are coming.** The Agent guide
  as merged by change 0198 names no operation at all: requirement R11 forbids it, a grep enforces it,
  and the plan calls "call `get_next_set`" a fabricated contract. So the guide has no drift problem
  today, and this ADR does not claim otherwise — Phase 1 solved it by avoidance. What cannot be solved
  that way is everything that must name operations: the guide's own Part B, which 0198 ships
  explicitly marked unwritten, and the docs site with its per-operation reference (D-006). Generation
  is what lets those name operations safely instead of being hand-kept.
- **Two Phase 1 surfaces already have to agree.** The MCP tool list and the HTTP routes expose the
  same ~25 operations to the same Key (ADR 0001), and nothing but discipline keeps them in step.
  That drift is live in Phase 1, is invisible in tests, and shows up only as an Agent calling
  something that is not there.
- **The project already accepts the one-source principle for the guide.** The merged guide states it
  is "served two ways and is the same text both times: as this page, and as the instructions of the
  MCP server you connect to", and `GLOSSARY.md` defines the Agent guide as both. One definition,
  several renderings is therefore the established pattern here, not a new idea; this ADR extends it
  from the guide to the operations.
- **The PRD already calls for this.** Module 14 is an "operation registry" (D-013). This ADR commits
  to it being the *source* of the surfaces rather than a catalogue beside them.
- **One approved contract instead of five drifting ones.** D-013 requires the Owner to approve the
  Phase 1 contracts before implementation. A registry makes that one reviewable artifact; hand-written
  REST, MCP, OpenAPI and guide make it four, approved once and drifting after.
- **The later surfaces are projections, and they are already committed.** D-006 puts the docs site,
  the per-operation reference and the Custom-GPT subset in later phases. Each is a filter over the
  same definitions. Hand-writing them multiplies the Phase 1 work by the number of surfaces.
- **It is where validation, errors and idempotency belong.** Item 4 of
  `development-preparation.md` asks for contracts "with validation, errors and idempotency".
  Declared once per operation, every operation gets them; declared per handler, the one that forgets
  is the one that logs a set twice.

## Considered options

- **Hand-written REST, with an MCP server wrapping it.** The obvious path, and rejected. It makes the
  MCP tool list a second contract that has to be kept in step by discipline, and the Agent guide a
  third. Drift between them is the likeliest Phase 1 defect and the hardest to test for.
- **An OpenAPI document as the source of truth.** Rejected. OpenAPI cannot carry MCP tool
  descriptions or the guide's prose, so it would become one more generated output while the prose went
  back to being hand-written. It is an output here, not the source.
- **Keep every prose surface free of operation names, as change 0198 already does.** This is the
  cheapest answer and it is the one in force. It holds for the guide's Part A and should stay. It
  cannot extend to Part B or the docs site, because a per-operation reference *is* a list of operation
  names, so it defers the problem rather than solving it. Nothing here asks 0198 to change.
- **One registry, every surface generated (chosen).** Costs a generator, and puts an unusual piece of
  machinery in a small codebase.

## Consequences

- The Owner approves the registry's ~25 entries once. Contract tests run against the registry, so a
  surface that no longer matches it fails rather than drifting.
- **Open, and the Owner's to settle: the generator is not in Phase 1's 50 stories** (D-010). Either it
  is added to Phase 1, or Phase 1 hand-writes the HTTP routes and the MCP tool list and the registry
  arrives before the second surface. This ADR cannot be approved without that answer, because it
  changes Phase 1 scope.
- A capability missing from the registry is missing everywhere, which is the point, and also means the
  registry is a single point of failure for the build.
- The 30-operation Custom-GPT subset becomes a filter expression, not a second document.

## Evidence

ShredPace serves exactly this topology. Observed at `shredpace.com` on 2026-11-25:

- `GET /api/openapi.json` — one OpenAPI 3.1.0 document, 70 paths, 109 operations, single security
  scheme `apiKey` in header `X-Api-Key`, server `https://shredpace.com/api`.
- `GET /api/openapi.json?for=gpt` — **the same path and the same document re-projected** to 22 paths
  and 30 operations. One source, two renderings, selected by a query parameter.
- `GET /mcp` — an MCP server on the same origin taking the same key, with
  `/.well-known/oauth-protected-resource/mcp` and `/.well-known/oauth-authorization-server`
  advertising OAuth 2.1 (PKCE `S256`, dynamic registration, scope `mcp`).
- `GET /api/skill.md` — the agent guide served by the API itself, key-gated; `GET /llms.txt` — a
  13.2 KB agent entry point listing every operation's reference page, each available as Markdown.
- Contract rules stated in `docs/errors.md`: a unique `clientRef` on anything that creates makes a
  retry return the first result with `duplicate: true`; `400` carries `issues[{path, message}]`;
  `409` for concurrent writes; `422 too_many_rows`; 60 requests a minute per key.

Two notes on what this is and is not. The `?for=gpt` projection, served from one path, is **observed**
— it is what makes "one source, several surfaces" more than a guess. That there is an internal
registry behind it is **inference**: no such thing was observed, and a hand-maintained pair of
documents would look the same from outside. And the observation that its GPT subset is 30 operations
matches D-006's "Custom-GPT subset (30 operations)" exactly, which confirms the earlier research
rather than adding anything.

Under D-026 none of this justifies the decision; the reasons above are the project's own, and D-013
already bars copying ShredPace's shapes. Its 109 operations are not a target: Phase 1 has about 25.
The research folder is untracked (D-040), so the citations are live URLs and the date they were read.
