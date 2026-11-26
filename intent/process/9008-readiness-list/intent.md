# Intent: bring the readiness list back in line with what is on main

Author: Owner, via the Dev Lead. Status: draft.

## Problem

[`development-preparation.md`](../../../docs/agents/development-preparation.md) is the Owner's own
readiness list, and five of its eleven rows now describe a repository that no longer exists. The
changes that merged today (9005, 9004, 9007) moved past it without touching it, because it is the
Owner's list to close.

What the file says on `main`, against what is true:

| Row | Says | Actually |
|---|---|---|
| 1 | "None of the five is written" | Four written, two accepted, three proposed, one left |
| 2 | "The identity provider is unchosen, and every other item here waits on it" | Cognito is named in D-015 and ADR 0005; ADR 0006 settles how the Lifter is recognised |
| 3 | Isolation falls to application code; the ADR must say how an unscoped query is impossible | No subject: Phase 1 is single-account (D-042), and S3 is withdrawn |
| 6 | "There is no `.github/workflows` and no `test/visual/screenshots/`" | Both exist; three checks run on every pull request |
| 7 | "Blocked on item 6… Gate 1 asks that tests pass with nothing to run them" | Not blocked; Gate 1 has checks, Gate 2 has its directory |

A readiness list that is wrong is worse than one that is merely incomplete, because it is the document
the Owner reads to decide whether to start building.

## Proposed outcome

Those five rows state what is true on `main`. Nothing is marked **approved**, because approval is not
mine to record: items 1, 2, 4, 5, 7, 8, 9 and 11 stay open, and the file keeps its opening line that
nothing below is approved and each item is the Owner's to close.

Two rows change status on facts rather than on approval, matching how row 10 was already handled:

- **Row 6 becomes Done**, because the files exist and the checks run. The one part that is not done is
  named in the same cell: the checks are not *required*, which is a branch-protection setting no file
  can express.
- **Row 3 becomes Closed by ADR 0006, not completed** — closed as a consequence of a decision the
  Owner accepted, not because the work was done. The wording says so, and says it returns if tenancy
  does.

## Affected users and systems

Only this document. No code, no ADR, no requirement changes. The audience is whoever next reads the
list to judge readiness — today, the Owner.

## Constraints

- **The list is the Owner's.** Nothing here marks an item approved, and the opening line stays.
- **Say what is not done in the same breath as what is.** Rows 6 and 7 both carry the outstanding
  branch-protection setting, so "CI exists" cannot be read as "the gates are enforced".
- **No new decisions.** Every status change here follows from D-042, ADR 0006 or change 9005, all
  already on `main`.

## Open questions

1. **The scope documents are still untouched.** `README.md`, `mvp-scope.md`, `issues/prd.md`,
   `vision.md` and I-11 still describe a Sample account. They are listed as pending edits in the
   decision log and are not in this change, because they are scope rather than process.
2. **Does row 9 need revisiting?** It says five assumptions in `mvp-scope.md` are unconfirmed. D-041
   confirmed one of them. Not changed here, because it predates this session and was not checked.
