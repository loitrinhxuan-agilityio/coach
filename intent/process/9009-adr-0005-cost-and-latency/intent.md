# Intent: accept ADRs 0003 and 0004, and supply ADR 0005's two missing conditions

Author: Owner, via the Dev Lead. Status: draft.

## Problem

The Owner approved [ADR 0003](../../../docs/adr/0003-lifter-and-agent-are-separate-principals.md) and
[ADR 0004](../../../docs/adr/0004-one-operation-registry-generated-surfaces.md) on 2026-11-26 and asked
for [ADR 0005](../../../docs/adr/0005-hosting-and-the-data-store.md) to be reviewed again. Two separate
things follow from that.

**The approvals are unrecorded.** Both ADRs still say `status: proposed`, the architecture index still
lists them as awaiting approval, and nothing in the decision log shows the Owner decided. Under D-022
an ADR is the approval mechanism, so an approval that lives only in a chat message is not an approval
the next Builder can rely on.

**ADR 0005 could not be approved, and reviewing it again would not change that.** It says so itself:
D-014 requires a monthly cost per component and an answer on idle latency, and it had neither. Those
were explicitly the Dev Lead's to supply, so a review that reported "still missing" would restate a
gap the document already declares. The gap had to be closed before a review could say anything.

Closing it turned up something that changes what the ADR is for. ADR 0006 settled the
DSQL-versus-Postgres question, which this ADR called "the live trade-off and the reason this ADR is
worth reading" — leaving a hard-to-reverse decision with no trade-off in it, which is the ADR test
D-022 sets. Pricing the stack and reading the Aurora DSQL lifecycle produced the replacement.

## Proposed outcome

- **ADRs 0003 and 0004 become `accepted`**, each gaining a dated acceptance note. 0004's note records
  what acceptance does *not* do: the generator is not among D-010's 50 stories, so under D-026 it is
  not committed Phase 1 work, and the schedule question the index listed as 0004's known gap is still
  open. An approval must not quietly widen Phase 1.
- **ADR 0005 gains a cost table and an idle-latency decision**, and **stays `proposed`** — supplying
  the conditions is the Dev Lead's job, approving the result is the Owner's.
- **D-043** records the approvals and the fact that 0005's conditions are now supplied.
- The decision log's architecture notes are corrected where pricing contradicted them, and **I-17** is
  marked reversed: it still asserted the multi-account data model that ADR 0006 superseded.

## What the review found

Five findings, all verified against AWS pages on 2026-11-26 rather than from memory:

1. **The component list was short.** Route 53, CloudWatch Logs, AWS Backup and the ACM certificate
   were all absent. A Route 53 hosted zone is a flat **$0.50 a month with no free tier** — the only
   certainly non-zero line in the entire stack, and it was in neither the ADR nor the decision log.
2. **Cost is not the binding constraint.** The stack prices at about **$1.65 a month against $10**, so
   D-015's Lambda-over-ECS argument is won by a margin wide enough to stop being a trade-off.
3. **Idle latency is worse than "undocumented".** The DSQL lifecycle is `Active -> Idle -> Inactive`:
   two transitions, both with undocumented durations, and the guide says only that the first
   connection to either state "will be slower than usual". No SLO can be read from documentation.
4. **The free-tier reasoning was fragile and did not need to be.** API Gateway's free million calls is
   new-customers-only for twelve months, but at this volume the paid rate is a cent — so the budget
   does not depend on free tiers at all, which is a stronger position than the ADR took.
5. **The ADR had lost its subject**, and finding 2 against finding 3 supplies the new one: pay about a
   cent a month to stop the database scaling to zero, or accept an unmeasurable delay on the first set
   of every session. Provisioned concurrency is the third option and is rejected on its price —
   **$10.80 a month is the whole D-014 ceiling** — not on its merits.

## Affected users and systems

No application code exists, so nothing executable changes. What changes is what the next Builder is
told: the Lambda is **not in a VPC** (DSQL's public endpoint and a SigV4 token remove the need, and
with it the NAT gateway D-014 warns about), the first request of a session is a measured number rather
than an assumed one, and the deploy may carry a scheduled keep-warm ping.

## Constraints

- **D-022 and `decision-boundaries.md`.** Approval is the Owner's. This change records an approval
  already given and supplies evidence for one not yet given; it approves nothing itself.
- **D-014.** The cost figure must be verified and said to be verified. Every rate here carries its
  source, and the ones AWS does not publish per-region — or at all, like the `.com` registration — are
  marked rather than filled in with a plausible number.
- **D-026.** Phase 1 is the only committed scope. This is why 0004's acceptance note refuses to read
  the generator into Phase 1, and why the keep-warm ping is presented as a Phase 1 cost rather than a
  candidate.
- **Scope documents are the Owner's.** `development-preparation.md` item 1 is stale again now that two
  ADRs are accepted. It is listed as a pending edit, not edited here — and change 9008 already has
  that file open on PR #12.

## Open questions

1. **Which latency fallback does the Owner want?** The ADR recommends the keep-warm ping at about a
   cent a month. It cannot be settled by evidence: it is a choice about whether to switch off the
   property the stack was chosen for.
2. **Is the ADR 0004 generator in Phase 1?** Still unsettled, and still the one answer that would
   change D-010's 50 stories.
3. **Is the AWS account new?** The Free Tier page now describes a plan where the account "closes on
   its own 6 months after you open it". That is an account question rather than an architecture one,
   but it decides whether the free allowances in the cost table exist at all.
