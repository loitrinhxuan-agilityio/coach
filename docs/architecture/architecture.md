# Architecture

**This file is an index, not a source of truth.** Architecture is decided through ADRs and
approved by the Owner before any dependent implementation starts (D-022, `AGENTS.md`), so
[`docs/adr/`](../adr/) is authoritative and this page only lists what has been accepted.

Nothing architectural should be written here. If a decision is worth recording, it is worth
an ADR.

## Accepted

| ADR | Decision |
|---|---|
| [0001](../adr/0001-key-based-agent-access-first.md) | Agents connect with a Key first; OAuth comes after v1 |
| [0002](../adr/0002-multi-account-from-day-one.md) | The data model is multi-account from the first migration |

## Proposed, awaiting review and the Owner's approval

Written 2026-11-25. **None is approved, and writing one approves nothing** (D-022: the Independent
Reviewer reviews and the Owner approves, before any dependent issue starts).

| ADR | Decision | Known gap |
|---|---|---|
| [0003](../adr/0003-lifter-and-agent-are-separate-principals.md) | A Lifter and an Agent are separate principals on one API, and some operations are Lifter-only | — |
| [0004](../adr/0004-one-operation-registry-generated-surfaces.md) | Operations are defined once in a registry, and every agent-facing surface is generated from it | Whether the generator is in Phase 1 changes D-010's scope and is the Owner's to settle |
| [0005](../adr/0005-hosting-and-the-data-store.md) | Static dashboard on CloudFront, API on Lambda, Aurora DSQL behind it | Incomplete: D-014 and D-022 require a monthly cost per component and an idle-latency answer, and neither is written |

## Not yet written

Of the five ADRs that block the start of application development
([`../agents/development-preparation.md`](../agents/development-preparation.md), item 1), two are
still missing and one is only partly covered:

- **How one Account's data is kept from another's without row-level security.** Nothing exists. ADR
  0005 makes it a blocking dependency rather than a parallel one: Aurora DSQL has no row-level
  security, so this ADR has to say how an unscoped query is made impossible, and no handler should be
  built before it does.
- **The deployment and approval process.** The rules are in
  [`../agents/workflow.md`](../agents/workflow.md); the procedures themselves are unwritten.
- **The Phase 1 REST and MCP contracts.** ADR 0004 decides *how* the contracts are produced and kept
  in step. It does not specify them: the roughly 25 Phase 1 operations (D-013) still have to be
  written and approved, and item 4 stays open until they are.
