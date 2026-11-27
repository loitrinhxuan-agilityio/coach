# Architecture

**This file is an index, not a source of truth.** Architecture is decided through ADRs and
approved by the Owner before any dependent implementation starts (D-022, `AGENTS.md`), so
[`docs/adr/`](../adr/) is authoritative and this page only lists each ADR and its status —
accepted, superseded, proposed, or not yet written.

Nothing architectural should be written here. If a decision is worth recording, it is worth
an ADR.

## Accepted

| ADR | Decision |
|---|---|
| [0001](../adr/0001-key-based-agent-access-first.md) | Agents connect with a Key first; OAuth comes after v1 |
| [0003](../adr/0003-lifter-and-agent-are-separate-principals.md) | A Lifter and an Agent are separate principals on one API, and some operations are Lifter-only |
| [0004](../adr/0004-one-operation-registry-generated-surfaces.md) | Operations are defined once in a registry, and every agent-facing surface is generated from it |
| [0005](../adr/0005-hosting-and-the-data-store.md) | Static dashboard on CloudFront, API on Lambda, Aurora DSQL behind it, and a ping that keeps the cluster from scaling to zero |
| [0006](../adr/0006-phase-1-is-single-account.md) | Phase 1 is single-account; tenancy is deferred behind surrogate UUID primary keys |
| [0007](../adr/0007-deployment-and-approval-process.md) | How a change reaches AWS: GitHub OIDC rather than a stored deploy key, one GitHub Environment gate carrying D-016's per-change approval, and a plan job that refuses a destructive diff before the Owner is offered a button |

ADRs 0003 and 0004 were accepted by the Owner on 2026-11-26 (D-043). **Accepting 0004 settled its
rule, not its schedule:** the generator is still not among D-010's 50 stories, and whether it is built
in Phase 1 remains the Owner's to settle. That question is recorded in 0004 itself.

ADR 0007 was accepted on 2026-11-27 (D-047). **Accepting it settled the mechanism, not the operating
decisions, and it configured nothing:** all six questions 0007 put to the Owner are still open, two of
them — who bootstraps, and which GitHub identity the Dev Lead acts under — before the first production
deploy can succeed; and three of its controls are repository or account settings rather than files
here, including the checks required on `main`, outstanding since change 9010. Those are recorded in
0007 itself.

## Superseded

| ADR | Decision | Superseded by |
|---|---|---|
| [0002](../adr/0002-multi-account-from-day-one.md) | The data model is multi-account from the first migration | [0006](../adr/0006-phase-1-is-single-account.md), accepted 2026-11-26 (D-042) |

## Proposed, awaiting review and the Owner's approval

**None.** Every architecture ADR written so far is decided.

**Writing one approves nothing** (D-022: the Independent Reviewer reviews and the Owner approves,
before any dependent issue starts), and that is how each accepted ADR above reached it.

## Not yet written

Item 1 of [`../agents/development-preparation.md`](../agents/development-preparation.md) named five
ADRs. ADR 0006 removed one of them, ADRs 0003, 0004 and 0005 are accepted (D-043, D-045), and the
deployment process is accepted as 0007 (D-047), so **one is only partly covered and none is missing
outright**:

- ~~**How one Account's data is kept from another's without row-level security.**~~ **No longer
  needed** (D-042, ADR 0006). Phase 1 is single-account, so there is no second Account for data to
  leak to. If tenancy ever returns, this ADR has to be written *before* it does.
- **The Phase 1 REST and MCP contracts.** ADR 0004 decides *how* the contracts are produced and kept
  in step. It does not specify them: the roughly 25 Phase 1 operations (D-013) still have to be
  written and approved, and item 4 stays open until they are.
