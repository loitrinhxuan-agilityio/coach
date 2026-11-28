# Intent: record the decisions change 1 rests on, and correct the build order

Author: Dev Lead, for the Owner's review. Status: draft.

Process change **9016**. No product scope, no application code.

## Problem

Change `0009` — the first application code in this repository — rests on three things that are not
written down anywhere, and on an index that contradicts itself.

**The language and runtime were never decided.** `mvp-scope.md` lists "the language and framework"
under *Not decided here*, this project's decision log lists them under "Still genuinely undecided",
and no ADR picked them. ADR 0005 fixed the runtime *shape* — arm64, a small bundle, no VPC — and
stopped there. Nothing can be built until this exists.

**The region was never decided.** ADR 0005 says so in as many words: *"The region is free to choose —
D-012 found no residency requirement."* Nobody chose. The cost table in that same ADR is priced at US
East rates with three rows marked "rate not verified per region", which was honest when no region had
been picked and becomes a gap the moment one is.

**The build order contradicts its own reasoning.** `intent/phase-1/README.md` says story 166's error
contract *"must land before any other operation, or every change invents its own error shape and the
contract becomes a retrofit"* — and then schedules it as change 2, waiting on change 1. Change 1 is an
operation. As written, the index guarantees the retrofit it warns about.

The three belong together because they share a failure mode: putting any of them inside change
`0009`'s own pull request would ask the Owner to approve a decision and the code that depends on it in
a single click. That is the pattern D-016 and ADR 0007 are careful to avoid everywhere else — D-016
requires approval of *that specific change, shown as the diff, never a blanket approval* — and the
reasoning does not stop being true because the thing being approved is a sentence rather than an IAM
policy.

## Proposed outcome

- **D-048** records TypeScript on Node 22, Lambda on arm64 and CDK in TypeScript, with the reason it
  is a decision-log row and not an eighth ADR: it fails two of D-022's three tests.
- **D-049** records `ap-southeast-1`, with the measured DSQL rates for Singapore, Ireland and US East
  read on 2026-11-27.
- **D-050** records the fold of story 166 into change `0009`, amends D-046, and states the cost —
  change 1 is the only change carrying two capabilities.
- **`intent/phase-1/README.md`** is renumbered to thirteen changes, its dependency column corrected,
  and the product proof moved to after change 10 of 13. The capability partition is untouched.
- **ADR 0005's cost table** carries Singapore's measured rates in its Aurora DSQL row, with a dated
  note saying which figures changed and which did not. The total stays at about $1.67, because DSQL's
  expected charge is zero inside the free allowance in all three regions.

Once this merges, change `0009`'s intent cites records rather than asserting decisions, and a reviewer
opening it does not find the intent and the index disagreeing about how many changes Phase 1 has.

## Affected users and systems

- `docs/product/decision-log.md` — three rows added, D-046 marked amended.
- `intent/phase-1/README.md` — the build-order table, the proof sentence and the second departure.
- `docs/adr/0005-hosting-and-the-data-store.md` — one table row and one dated note.
- **Nothing executable.** No application code exists yet, and this change adds none.
- Nothing under `docs/design/ailiftcoach/`, and no scope document.

## Constraints

- **An accepted ADR is amended, not rewritten.** ADR 0005 keeps every word it had; the change is one
  table row and a dated note recording what was measured, when, and what was left alone. The
  precedent is the ADR's own handling of the provisioned-concurrency and Hyperplane corrections —
  the earlier mistake stays visible rather than being silently replaced.
- **D-022.** None of this is an architecture decision. The region and the language are consequential
  and therefore the Owner's, which is why they arrive as decision-log rows for approval rather than as
  choices made in passing; the fold is a correction to an index, recorded for the same reason.
- **D-010 is untouched.** No story is added, removed or moved between phases. D-046's partition into
  thirteen capabilities stands; only the build order drawn from it changes.
- **`AGENTS.md`.** Design and application code never share a pull request — not engaged here, since
  this change contains neither.

## Open questions

1. **Would you rather ADR 0005 stayed untouched?** The measured rates could live only in D-049, leaving
   the ADR's table reading "no Ireland rate published" when there now is one. I think the correction
   belongs where the table is, but it is an accepted record and the call is yours.
2. **Does `mvp-scope.md` want the matching edit?** Its *Not decided here* list still names the language
   and framework, and D-048 settles them. It is a scope document, so that edit is the Owner's and is
   not made here.
