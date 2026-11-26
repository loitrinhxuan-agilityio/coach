# Phase 1: the capability map

**This is an index of the changes Phase 1 is divided into. It is not a spec.** D-034 is explicit that
treating all of Phase 1 as one change "would produce a single `spec.md` for fifty stories, which is the
PRD again under a new name." Each change below gets its own chain — `intent.md`, then `spec.md`, then
`plan.md` — written one at a time, in the order given here.

[`issues/prd.md`](../../issues/prd.md) is not authoritative about scope. **D-010 is**, as amended by
D-046.

## Why there is a layer between stories and changes

A user story is a unit of *wanting*. A change is a unit of *delivering*. They are not the same size: a
story like "weights I say per side understood on barbells" is not worth a pull request of its own, while
"log a set by speaking" pulls seven stories along with it. Grouping them by hand, change by change,
would mean re-deciding the grouping every time and never being able to say what is left.

So the stories are partitioned once into **business capabilities** — what the product can *do* — and
changes are drawn from those.

**Capabilities are not the PRD's "deep modules."** The PRD decomposes the product into fifteen deep
modules (progression engine, load calculator, set sanity checker, operation registry, event log…) that
are "testable without a database, a network or a clock." Those are code units. Capabilities are scope
units. They overlap heavily and deliberately cross-reference, but collapsing them would let a scope
document dictate the internal design, and the two cuts genuinely differ: C6 below maps to one module,
while C4 spans four.

## The stories

D-010 names 50 story numbers. **Story 201 (the Sample account) is withdrawn** — D-042 removed the
Sample account, so the story has no subject. **Story 199 is refiled** to `process/`, because scripted
acceptance tests are machinery for checking the product, not something a Lifter can do. That leaves
**49 committed stories: 48 product features and one process change** (D-046).

## Layer 1 → Layer 2: the capabilities

A complete partition. Every one of the 50 story numbers appears exactly once.

| | Capability | Stories | n |
|---|---|---|---|
| C1 | Lifter identity and session access | 192, 202, 203, 204, 205 | 5 |
| C2 | Agent access and the capability boundary | 4, 9, 10, 11 | 4 |
| C3 | Training-session lifecycle | 12, 13, 24, 25, 26 | 5 |
| C4 | Set capture — the logging loop | 14, 15, 17, 21, 22, 23, 28 | 7 |
| C5 | Exercise identity and resolution | 16, 31, 32 | 3 |
| C6 | Load semantics and plate maths | 19, 20, 34, 36, 37 | 5 |
| C7 | Set plausibility | 18 | 1 |
| C8 | Targets and progression | 46, 47, 48, 52, 53, 54 | 6 |
| C9 | Record recognition | 27, 58 | 2 |
| C10 | History and session review | 43, 57, 174 | 3 |
| C11 | Dashboard shell and presentation | 140, 142, 144, 152, 154 | 5 |
| C12 | Agent contract: errors and the guide | 166, 198, 199 | 3 |
| C13 | ~~Demonstration data~~ **withdrawn (D-042)** | 201 | 1 |
| | | **total** | **50** |

Capabilities are not evenly sized, and are not made so. C7 is one story because set plausibility is one
coherent thing; padding it to match C4 would be the index deciding the work.

## Layer 2 → Layer 3: the changes, in build order

**One change per capability**, with three departures, each for a stated reason. Each change takes the
number of its **lead story** and lists its members; the folder is the lookup table (D-046).

| # | Change | Cap. | Stories | Waits on |
|---|---|---|---|---|
| 1 | `0009` the spine: one Lifter, one Key, one read | C2 | 4, 9, 10, 11 | **ADR 0007** |
| 2 | `0166` the error contract | C12a | 166 | 1 |
| 3 | `0202` signing in and out | C1 | 192, 202–205 | 1 |
| 4 | `0016` exercise identity and the starter catalogue | C5 | 16, 31, 32 | 2 |
| 5 | `0034` load semantics and plate maths | C6 | 19, 20, 34, 36, 37 | 2 |
| 6 | `0012` training-session lifecycle | C3 | 12, 13, 24, 25, 26 | 2 |
| 7 | `0014` logging sets by speaking | C4 | 14, 15, 17, 21, 22, 23, 28 | 4, 5, 6 |
| 8 | `0018` plausibility holds | C7 | 18 | 7 |
| 9 | `0142` the dashboard shell | C11a | 142, 144, 152, 154 | 3 |
| 10 | `0140` the Today page | C11b | 140 | 7, 9 |
| 11 | `0046` targets and progression | C8 | 46, 47, 48, 52, 53, 54 | 7 |
| 12 | `0027` records | C9 | 27, 58 | 7 |
| 13 | `0043` history and the session summary | C10 | 43, 57, 174 | 7 |
| 14 | `0198` the guide's Part B | C12b | 198 | 13 |
| — | `9015` scripted conversations as acceptance tests | C12 | 199 | 14 |

**D-004's product proof lands after change 11**: log a real session through the assistant (7), see it on
the dashboard (10), and get a next-time weight suggestion (11). Changes 12 to 14 complete Phase 1 but
are not needed to prove it.

### The three departures from one-change-per-capability

1. **C11 splits** into the shell (`0142`) and the Today page (`0140`). The shell is navigation, empty
   states and theming; Today reads live session data. The shell is useful — and reviewable against the
   design boards — before any session exists.
2. **C12 splits** into the error contract (`0166`) and the guide's Part B (`0198`). This one was found
   while deriving the build order, and it matters: story 166's one-sentence error contract is
   **cross-cutting and must land before any other operation**, or every change invents its own error
   shape and the contract becomes a retrofit. Part B is the opposite — ADR 0004 says it is *generated
   from the operation registry*, so it cannot be written until the operations exist. Keeping them in one
   change would force the error contract to wait for the last change in Phase 1.
3. **C13 is dropped**, not deferred. Story 201's subject no longer exists.

### What is deliberately not split

**C4 (7 stories) and C8 (6 stories) stay whole.** Each is one deep module's worth of rules — the set
sanity checker and conversation formatter for C4, the progression engine for C8 — and splitting them
would spread a single module across changes, which is the coupling the capability/module separation
exists to avoid.

## Rules that apply to every change here

- **One number per change**, running through the intent folder, the GitHub issue, the branch
  `change/NNNN-slug` and the pull request. D-033's measurement property is preserved: each change still
  has exactly one number. What D-046 gives up is only the story-to-change bijection.
- **Members are listed in the change's own `intent.md`**, under its heading, so a reader never has to
  consult this file to know what a change covers.
- **A `plan.md` is built from its own `spec.md` and nothing else.** This index, the PRD,
  `requirements.md`, the ADRs and the design system are standing constraints, not a spec.
- **Only the Owner merges an intent, and that merge is the acceptance** into Stage 2.
- **`deleted_at` from the first migration** for sets and sessions (D-046). Story 23 needs delete; the
  event log behind undo (story 29) is Phase 2 and is not built now, but on Aurora DSQL adding a column
  later is cheap while back-filling meaning into existing rows is not.

## What this file does not do

It does not change Phase 1's scope. Every story in the table above is one D-010 already committed, and
no story outside D-010 appears. Where this index and D-010 disagree, **D-010 wins** and this file is
wrong.
