---
status: accepted
---

# Operations are defined once in a registry, and every agent-facing surface is generated from it

AI Lift Coach has its own API in its own shapes (D-013), about 25 operations in Phase 1. Each one is
defined once in an internal **operation registry** — path, method, principals (ADR 0003), input and
output schema, errors, idempotency and the prose an Agent needs — and every surface that names
operations is generated from it: the HTTP routes, the MCP tool list, the OpenAPI document and the
Agent guide's Part B. The guide's Part A stays hand-written and names no operation (change 0198).

The docs site, the per-operation reference and the 30-operation Custom-GPT subset are **candidates,
not commitments.** D-026 amends D-006: "Phase 1 is the only committed scope. Every other feature is a
candidate, decided when Phase 1 is in daily use." So they are not a reason for this decision. They
appear below only as work the registry would make cheap *if* the Owner ever pulls them in.

**Accepted by the Owner on 2026-11-26** (D-043), together with ADR 0003.

**Acceptance settles the rule, not the schedule.** This record decides that operations are defined
once and that every surface naming them is generated. It does **not** add the generator to Phase 1:
D-010 lists Phase 1's 50 stories and the generator is not among them, and under D-026 nothing outside
that list is committed scope. So the rule binds whenever a surface that names operations is built, and
the first such surface inside Phase 1 is the guide's Part B. **Whether the generator itself is built
in Phase 1 or the first two surfaces stay hand-written remains the Owner's to settle**, and settling
it the other way would change D-010. The architecture index recorded this as 0004's known gap before
acceptance; acceptance does not close it.

## Why

- **Avoidance is what keeps the Agent guide honest, and it does not reach every surface.** The guide
  as merged by change 0198 names no operation at all: requirement R11 forbids it, a grep enforces it,
  and the plan calls "call `get_next_set`" a fabricated contract. So the guide has no drift problem
  today, and this ADR does not claim otherwise — Phase 1 solved it by avoidance, and that should
  stand. What avoidance cannot cover is a surface whose whole purpose is to name operations: the
  guide's own Part B, which 0198 ships explicitly marked unwritten. That one is inside Phase 1's
  boundary, because 0198 already committed the guide and left Part B as its unfinished half. The docs
  site is **not** such a reason — D-026 makes it a candidate.
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
- **One approved contract instead of four drifting ones.** D-013 requires the Owner to approve the
  Phase 1 contracts before implementation. A registry makes that one reviewable artifact; hand-written
  REST, MCP, OpenAPI and guide make it four, approved once and drifting after.
- **The candidate surfaces are cheap under a registry and expensive without one.** The docs site, the
  per-operation reference and the Custom-GPT subset are candidates under D-026, not Phase 1 work, so
  they carry none of this decision's weight. The point is only that each is a filter over the same
  definitions: if the Owner pulls one in, a registry makes it a projection rather than a fourth
  document to keep true. That is a reason to prefer the registry *given* the case above, never a
  reason on its own.
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
  cannot extend to Part B, because a per-operation reference *is* a list of operation names, so for
  that half it defers the problem rather than solving it. Nothing here asks 0198 to change.
- **One registry, every surface generated (chosen).** Costs a generator, and puts an unusual piece of
  machinery in a small codebase.

## Consequences

- The Owner approves the registry's ~25 entries once. Contract tests run against the registry, so a
  surface that no longer matches it fails rather than drifting.
- **Open, and the Owner's to settle: the generator is not in Phase 1's 50 stories** (D-010). Either it
  is added to Phase 1, or Phase 1 hand-writes the HTTP routes and the MCP tool list and the registry
  arrives before the third surface. This ADR cannot be approved without that answer, because it
  changes Phase 1 scope.
- A capability missing from the registry is missing everywhere, which is the point, and also means the
  registry is a single point of failure for the build.
- If the Custom-GPT subset is ever pulled in from the candidate list, it is a filter expression rather
  than a second document. Nothing here schedules it.

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
matches the "Custom-GPT subset (30 operations)" D-006 recorded, exactly, which confirms the earlier
research rather than adding anything — and confirms a number, not a plan: D-026 amended that list to
candidates.

Under D-026 none of this justifies the decision; the reasons above are the project's own, and D-013
already bars copying ShredPace's shapes. Its 109 operations are not a target: Phase 1 has about 25.
The research folder is untracked (D-040), so the citations are live URLs and the date they were read.
