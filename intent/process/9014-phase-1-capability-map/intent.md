# Intent: partition Phase 1 into capabilities and changes

Author: Owner, via the Dev Lead. Status: draft.

## Problem

Phase 1 is fifty story numbers in D-010 and nothing else. There is no statement of how those stories
become changes, so the first Builder would have to invent the grouping, and every Builder after them
would invent a different one. Nothing could say what was left.

Three things make the obvious answer — one story, one change — wrong.

**It is more upstream effort than D-034 permits.** D-034 settled that the chain is not retro-fitted,
because "writing fifty intents for work already specified is more upstream effort before the loop has
run once, which is the failure D-031 exists to correct." Fifty intents is that failure. D-034 also
rejects the other extreme: one change for all of Phase 1 "would produce a single `spec.md` for fifty
stories, which is the PRD again under a new name." The answer has to sit between them, and D-034 does
not say where.

**Stories are not change-sized.** Story 19 ("weights I say per side understood on barbells") is not a
pull request. Story 14 ("say *squat 100 kg for 5, 5, 5* and have each set logged") pulls six others
with it. A unit of wanting is not a unit of delivering.

**Two of the fifty are no longer what D-010 says they are.** Story 201 is the Sample account, which
D-042 removed — the story has no subject, and a mapping taken from D-010 as written would produce a
change for cancelled work. Story 199 asks for scripted conversations run against a real assistant as
acceptance tests, which is machinery for checking the product; by `intent/README.md`'s own reasoning
for why `process/` exists, it does not belong in `phase-1/`.

## Proposed outcome

- **A capability layer, decided once.** The 50 story numbers are partitioned into 13 business
  capabilities — a complete partition, every number appearing exactly once. Capabilities are what the
  product can *do*. They are deliberately **not** the PRD's fifteen deep modules, which are code units
  "testable without a database, a network or a clock"; the two cuts differ, and collapsing them would
  let a scope document dictate the internal design.
- **Fourteen changes plus one process change**, one per capability with three stated departures, in a
  recorded build order with dependencies. D-004's product proof lands after change 11 of 14.
- **`intent/phase-1/README.md`** holds the map durably, as an index and explicitly not as a spec.
- **The numbering rule is amended**: a change may cover several stories, takes its lead story's number,
  and lists its members in its own `intent.md`.
- **D-046** records all of it, amending D-010 (the scope list) and D-033 (one number per *change*,
  not per story).
- **The intents are written one at a time** in that order, not all fourteen up front.

## Affected users and systems

No application code exists, so nothing executable changes. What changes is that the next Builder is
handed a change with a stated boundary instead of a story and a guess, and that "what is left in
Phase 1" becomes a question with an answer.

One rule falls out of the mapping rather than being chosen for its own sake: story 23 (correct or
delete a set, delete a session) needs deletes, while the event log behind undo (story 29) is Phase 2.
So **sets and sessions carry `deleted_at` from the first migration** and the event log is not built —
D-026 forbids building for a candidate, and on Aurora DSQL adding a column later is cheap while
back-filling meaning into existing rows is not.

## Constraints

- **D-010 is the authority on scope, not the PRD.** Every story in the map is one D-010 already
  committed, and no story outside D-010 appears. Where the map and D-010 disagree, D-010 wins.
- **D-033's measurement property must survive.** Its reasoning is that one number running from story to
  issue to folder to branch to PR makes the playbook's measurements — elapsed time between two commits
  — computable with no bookkeeping. Many-to-one keeps that: each change still has exactly one number.
  What it gives up is the **story-to-change bijection**, and that cost is stated rather than glossed.
- **D-026.** Phase 1 is the only committed scope. The map adds no story and promises nothing outside it.
- **D-034.** This file is an index, not a spec. No `spec.md` is written here, for this change or any
  other.
- **Scope documents are the Owner's.** `README.md`, `mvp-scope.md` and `vision.md` all say Phase 1 is
  50 stories. They are listed as pending edits in the decision log rather than edited here.
- **Merged chains are not rewritten.** `intent/phase-1/0198-agent-guide/` says "Phase 1's fifty
  stories" throughout. It is the record of what was decided on the day, and D-034 says the chain is not
  retro-fitted, so it keeps its wording — as ADR 0002 keeps its text under supersession.

## Open questions

1. **The third departure was found, not planned.** C12 was agreed as one capability and the build order
   split it: story 166's error contract is cross-cutting and must land before every other operation, or
   each change invents its own error shape; the guide's Part B is generated from the operation registry
   (ADR 0004) and cannot be written until the operations exist. Keeping them together would force the
   error contract to wait for the last change in Phase 1. **The split is in the map; merging this change
   accepts it.**
2. **Is `0009` the right first change, given it cannot be built yet?** It deploys, so its `plan.md`
   waits on ADR 0007, which is `proposed` on PR #16. Its `intent.md` and `spec.md` can be written now.
   The alternative is to start with `0166` and fold the spine into it, which would hide the ADR 0005
   and 0006 obligations inside a feature change.
3. **Does the Owner want GitHub issues filed per change or per story?** Item 9 of
   `development-preparation.md` says no issue has been filed. D-033 ties the number to the issue, and
   under D-046 that is one issue per change. Fourteen issues, not forty-eight — but the stories would
   then have no issue of their own, and `/prd-to-issues` assumes otherwise.
