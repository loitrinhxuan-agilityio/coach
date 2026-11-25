# Intent: three of the five blocking architecture ADRs, drawn from what ShredPace shows publicly

Author: Owner, via the Dev Lead. Status: draft.

## Problem

Item 1 of [`docs/agents/development-preparation.md`](../../../docs/agents/development-preparation.md)
blocks the start of application development on five architecture ADRs, and none of them is written.
ADR 0001 and 0002 are accepted but cover agent access and the multi-account schema, not hosting,
authorisation, isolation, contracts or deploys. Item 2 is blocked behind the same thing: the identity
provider is unchosen and every other item waits on it.

The Owner asked for the ShredPace website to be explored and an ADR drawn from it. ShredPace publishes
a great deal about its own architecture — response headers, an OpenAPI document, an MCP server, OAuth
discovery metadata and a documentation site — and it is the nearest thing to a working reference for a
product of this shape.

The tension is that **D-026 removed ShredPace's claim on anything structural**, and D-028 struck
"follow the ShredPace app" as a justification even where it had already been used (ADR 0002). So the
research cannot be the *reason* for an architecture decision, however well it answers the question.

## Proposed outcome

Three ADRs exist as proposals, and three of the five blocking items have a document to review:

- **0003** — a Lifter and an Agent are separate principals on one API, and some operations are
  Lifter-only (item 2).
- **0004** — operations are defined once in a registry and every agent-facing surface is generated
  from it (item 4, in part).
- **0005** — static dashboard on CloudFront, API on Lambda, Aurora DSQL behind it (item 1).

Each is justified from this project's own recorded decisions. ShredPace appears in each only as an
evidence section, cited as corroboration that a shape is viable, never as a reason. Observation and
inference are marked apart, and `GLOSSARY.md` gains the one term the ADRs need.

`docs/architecture/architecture.md` lists them as proposed and says what is still missing, so the
index does not read as though the blockers are closed.

## Affected users and systems

`docs/adr/` gains three files. `docs/architecture/architecture.md` and `GLOSSARY.md` change. Nothing
executable is touched and no application code exists yet.

Downstream, approving these would commit the project's hosting, its authorisation model and the way
its contracts are produced — so D-022 applies: the Independent Reviewer reviews and the Owner
approves, before any dependent issue starts.

## Constraints

- **D-026 and D-028.** ShredPace justifies nothing structural. Every reason comes from
  [`docs/product/decision-log.md`](../../../docs/product/decision-log.md), the ADRs or
  [`requirements.md`](../../../docs/product/requirements.md).
- **D-013.** The API is in this project's own shapes, about 25 Phase 1 operations. ShredPace's 109
  operations are not a target and its contract is not to be copied.
- **D-015 and D-014.** Hosting stays inside the Owner's stated direction and the ~$10 a month ceiling.
- **D-040.** The research folder is untracked, so citations are live URLs with the date read, never
  paths into `docs/product/shredpace/`.
- **`GLOSSARY.md`.** *Owner* means the project's product owner and never an account holder, so
  ShredPace's "the account owner's" cannot be borrowed as a term.
- **Status `proposed`.** Writing an ADR approves nothing; `decision-boundaries.md` keeps that with
  the Owner.
- **Change 0198, already merged.** Its Agent guide names no operation by rule (R11, enforced by a
  grep), so guide-to-API drift is already solved for Phase 1 by avoidance. ADR 0004 must not claim
  to solve a problem that is solved, and must not ask 0198 to change: it argues only for the surfaces
  that *must* name operations — the guide's unwritten Part B, and the docs site (D-006).

## Open questions

1. **Is the generator in Phase 1?** ADR 0004 needs an operation registry and a generator, and neither
   is among D-010's fifty stories. Either Phase 1 grows, or Phase 1 hand-writes two surfaces and the
   registry arrives before the third. This changes scope, so it is the Owner's, and ADR 0004 cannot be
   approved without the answer.
2. **Aurora DSQL, or Postgres with row-level security?** DSQL has no row-level security, so under
   ADR 0002 isolation moves entirely into application code. ADR 0005 carries DSQL because it is
   D-015's direction, not because the comparison was made. It is cheaper to change before the first
   migration than after it.
3. **ADR 0005 is incomplete.** D-014 and D-022 require a monthly cost per component and an answer on
   idle latency, and neither is written. The ADR says so rather than reading as finished.
4. **Two ADRs remain unwritten:** account isolation without row-level security, and the deployment
   and approval process. Isolation should wait on question 2, because the answer decides what it has
   to say.
