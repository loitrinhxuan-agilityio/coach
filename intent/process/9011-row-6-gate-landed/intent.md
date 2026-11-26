# Intent: record that the review gate can now fail

Author: Owner, via the Dev Lead. Status: draft.

## Problem

Change 9010 made Gate 3 able to fail, and merged. Three places still describe that as outstanding:

- **Item 6** of [`development-preparation.md`](../../../docs/agents/development-preparation.md) carries
  it as *"the Dev Lead's proposal, for the Owner to accept or reject"*.
- **Item 7**'s second objection says a passing check *"does not mean a clean review ... the gate's own
  signal is misleading as it stands"*.
- The decision log's pending edits list it as *"a CI defect for the Owner to settle"*.

All three were written before the fix landed, and item 6 is the row the Owner reads to decide whether to
require the checks on `main`. A readiness list that reports a shipped fix as a pending proposal is the
same class of defect this session has been clearing all day.

## Proposed outcome

- Item 6 records that the defect is fixed, what the fix does, and that **one thing is still outstanding
  and only the Owner can do it** — the branch-protection setting.
- Item 6 and the closing paragraph both carry the caveat that matters: **the blocking path has never run
  red.** Every run since the step landed has found nothing, so only the pass path is proven live.
- The closing paragraph becomes an order of operations rather than two compounding problems, because the
  middle step is what tells the Owner the first one worked: the gate can block → watch one pull request
  with a real finding go red → then require the checks.
- The decision log's pending edit is struck through and replaced with what shipped and what is left.

## Affected users and systems

Nothing executable changes. What changes is what the Owner reads when deciding to require the checks —
and specifically that they are told to wait for one red run first. Requiring a check nobody has seen
fail is a milder version of the defect 9010 fixed, and that is now written down rather than carried in
this conversation.

## Constraints

- **`development-preparation.md` is the Owner's readiness list.** Item 6 moves no status: it was already
  **Done**, and it stays Done. What changes is the description of what remains inside it. No row is
  marked approved, and the opening line stands untouched.
- **Honesty about what is verified.** 9010's blocking path is verified against fixtures taken from real
  findings and has run clean on live pull requests. It has not been seen to fail in CI. The row says so
  rather than implying the gate is proven.

## Open questions

1. **Does the Owner want to require the checks now or after a red run?** The row recommends waiting for
   one. It is their setting either way.
