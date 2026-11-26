# Intent: Phase 1 is single-account, and the Sample account goes

Author: Owner, via the Dev Lead. Status: draft.

> **Decided during review, 2026-11-26.** This intent proposed a two-step flip: land ADR 0006 as
> `proposed`, then change both statuses once the Owner approved it. The Independent Reviewer pointed
> out that the same change already rewrote `REVIEW.md` and `requirements.md` S2/S3 as though ADR 0006
> were approved, which would have switched off the isolation review while ADR 0002 still mandated it.
> The Owner took the first remedy the review offered and **accepted ADR 0006 in this change**, so
> ADR 0002 is `superseded by ADR-0006` here rather than later. The principle the two-step protected —
> that no commit shows an inconsistent pair of records — is kept; only the mechanism changed.

## Problem

[ADR 0002](../../../docs/adr/0002-multi-account-from-day-one.md) is **accepted**: the data model is
multi-account from the first migration. D-028 narrowed its justification to exactly one reason — "the
Sample account has to be a second Account" — after D-026 struck "follow the ShredPace app" and the
consent, deletion and rate-limit stories as reasons for anything structural.

The Owner has now decided there is no Sample account. That does not merely remove a fixture: it leaves
an accepted ADR with **no stated reason at all**, and leaves `requirements.md` S2 asserting a
justification that no longer exists.

Keeping multi-account anyway would mean building for a candidate, which is the thing D-026 exists to
prevent — a second Account is explicitly not a goal (D-005) and is a "revisit if" (D-012). It would
also keep the project's largest self-inflicted risk class: `REVIEW.md` calls an unscoped query the
highest-value finding in this repository, and that bug class exists *only* because of tenancy.

A long design session also settled the identity and schema questions that single-account raises, and
those answers would be lost if they were not written down — the Phase 1 contracts (item 4 of
[`development-preparation.md`](../../../docs/agents/development-preparation.md)) do not exist yet.

## Proposed outcome

- **ADR 0006** records the decision: no `account` table, no `account_id`, the Lifter is a Cognito user,
  preferences are one `settings` row, and tenancy is deferred behind **surrogate UUID primary keys**.
  It proposes to supersede ADR 0002 rather than editing it.
- **D-042** records the same decision in the log with its reasoning, plus a subsection holding the
  nineteen schema and contract details agreed alongside it, so they survive until the contracts are
  written.
- The documents that assert the old model are brought into line in the same change: `requirements.md`
  S2 and S3, `REVIEW.md`'s Security pass, `GLOSSARY.md`, and the architecture index.
- ADR 0005 is amended: its isolation dependency disappears, and its `/api` cache rule **keeps its
  decision with a different reason** — the leak it prevents is authenticated-to-anonymous, not
  cross-account.

## Affected users and systems

No application code exists, so nothing executable changes. What changes is what the next Builder is
told: there is no `account_id` to thread through queries, no scoping layer to write, and no isolation
test to pass. The Independent Reviewer's Security pass changes shape with it.

Downstream, approving this commits Phase 1 to a schema in which **sign-up cannot be opened without a
migration first**. That is the price, and it is stated in the ADR rather than left to be discovered.

## Constraints

- **D-026.** Phase 1 is the only committed scope; a second Account is a candidate and cannot justify
  structural work. This is the decision's own reasoning, so it must not be quietly broken elsewhere.
- **D-022 and `decision-boundaries.md`.** An architecture decision is approved by the Owner through an
  ADR, and a consequential decision becomes reviewable by being recorded in the log. Hence both.
- **ADR 0002 is accepted, so it is not rewritten.** It keeps its text and its status, and gains a
  proposed-supersession note. Approving ADR 0006 flips both records; that two-step is deliberate, so
  that no commit shows an accepted ADR superseded by an unapproved one.
- **S7.** No health data in Phase 1, which is why there is no `lifter` table and why bodyweight
  movements record reps only.
- **The repository is public.** Visual-test fixtures must never be the Owner's real training data.
- **Scope documents are the Owner's.** `README.md`, `mvp-scope.md`, `issues/prd.md`, `vision.md` and
  `development-preparation.md` still describe a Sample account and five blocking ADRs. They are listed
  as pending edits in the log rather than edited here.

## Open questions

1. **Does the Owner want the five pending scope-document edits made now or separately?** They are
   mechanical, but they are scope documents and `development-preparation.md` is explicitly the Owner's
   own readiness list.
2. **Should the nineteen schema details become their own ADR when the Phase 1 contracts are written?**
   They sit in the decision log today because there is nowhere better. Most are not individually
   hard-to-reverse-and-surprising, so most do not deserve an ADR; the surrogate-key rule already has
   one, in ADR 0006.
3. **This PR stacks on PR #8.** ADR 0006 references ADRs 0003 to 0005, which are unmerged, so #8 has
   to merge first or this branch has to be rebased. A reviewer should read them in order.
