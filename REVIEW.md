# Review instructions

How a review of a code pull request in this repository is run. Who reviews, and who may not,
is in [`docs/agents/team.md`](docs/agents/team.md). The three human quality gates are in
[`docs/agents/quality-gates.md`](docs/agents/quality-gates.md).

## Passes

Run three passes and tag each finding with its pass:

- **Bugs** — logic errors, broken edge cases, subtle regressions.
- **Security** — credentials or personal data reaching a log, an error body or a committed
  fixture; a Key reaching a Lifter-only operation (ADR 0003); and anything that would let an
  unauthenticated request read the Lifter's data, including a CDN that caches an authenticated
  response (ADR 0005). **This repository is public**, so a secret or a personal detail in a
  commit is the highest-value finding here.
  Phase 1 is single-account (ADR 0006), so **cross-account isolation is not a finding class** —
  there is no second Account, and `requirements.md` S3 is withdrawn. Do not hunt for unscoped
  queries; a missing `deleted_at` filter is a correctness bug, not a breach. If tenancy ever
  returns, this pass changes back.
- **Compliance** — the change matches its `spec.md`, its `plan.md`, and the approved design
  board. A diff that does what the plan did not say is a finding even when the code is correct.

## What Important means here

Reserve **Important** for findings that would break behaviour, leak data, cross an account
boundary, or breach a rule in [`AGENTS.md`](AGENTS.md). Style and naming are nits.

## Cap the nits

Report at most five nits per review; summarize the rest as a count.

## Do not report

- Anything CI already enforces.
- The ShredPace research under `docs/product/shredpace/`. It is reference material about
  another product and is not held to this repository's standards.

## Keeping this file honest

When a review flags the same mistake twice, the correction goes into the agent instructions in
the same review, so the next pull request is checked against it. A review that finds nothing is
a valid outcome and is recorded as one.
