# Intent: the per-change chain

Each change gets one folder here holding its whole chain, so what was asked for, what was
decided and what was planned sit together.

Not to be confused with [`docs/product/intent.md`](../docs/product/intent.md), the product's
own charter — why AI Lift Coach exists and how the Owner intends to develop it. That file
outranks every other document in this repository. This folder holds the individual changes
made under it.

## Layout

```
intent/phase-1/NNNN-slug/      a change that is part of Phase 1
intent/candidates/NNNN-slug/   a change that is not in Phase 1 (D-026)
```

A change folder fills up as the change progresses:

| File | Written in | By | From |
|---|---|---|---|
| `intent.md` | Stage 1 — Plan | the originator, with Claude | [`TEMPLATE.md`](TEMPLATE.md) |
| `spec.md` | Stage 2 — Design | Claude, from the accepted intent; the Owner reviews | [`TEMPLATE-spec.md`](TEMPLATE-spec.md) |
| `plan.md` | Stage 3 — Build | Claude in plan mode; the engineer accepts | [`TEMPLATE-plan.md`](TEMPLATE-plan.md) |

## The number

`NNNN` is the PRD story number from [`../issues/prd.md`](../issues/prd.md), zero-padded:
story 14 is `0014-log-by-speaking`. The same number runs through the GitHub issue, the branch
`change/0014-log-by-speaking` and the pull request, so a change can be followed end to end
with no lookup table.

Work with no story — a refactor, a chore, an incident — takes a number from **9000** upward.
This folder itself was added by `change/9001-artifact-chain`.

The number is only an identifier. `issues/prd.md` is explicitly not authoritative about scope;
Phase 1's fifty story numbers are enumerated in D-010 in
[the decision log](../docs/product/decision-log.md), which is.

## Who writes here, and the gate

Anyone may open a pull request adding an intent, including an agent. **Only the Owner merges
it, and that merge is the acceptance** that sends the change into Stage 2. A rejected intent
is a closed review, which is the record that it was considered.

## What a spec may be planned against

A `plan.md` is built from its own accepted `spec.md` and from nothing else — never directly
from `issues/prd.md` or `requirements.md`. Those, with the ADRs and the design system, are the
**standing constraints** a spec must conform to. They are not a spec for any one change.

## What came before

Changes made before this folder existed have no chain behind them: the design system, the
sixteen screens, and Phase 1's scope itself. They are not retro-fitted. The chain applies from
its adoption forward.

## What is not here yet

`intent/incidents/`, for the intents Stage 6 writes when a production control band is
breached. Nothing is deployed, so nothing can breach a band.
