# Intent: write the deployment and approval process as ADR 0007

Author: Dev Lead. Status: draft.

## Problem

**One architecture document named by item 1 of
[`development-preparation.md`](../../../docs/agents/development-preparation.md) has never been
written: the deployment and approval process.** Every other ADR that item named is decided — five
accepted, one superseded, and since D-045 `docs/adr/` has had nothing proposed at all. ADR 0005
settled *what* gets deployed. Nothing settles *how* it gets there, or how the Owner sees it first.

The rules exist and the procedures do not. [`workflow.md`](../../../docs/agents/workflow.md) says
only the Dev Lead deploys, that every production deploy needs the Owner's approval of the specific
change shown as the diff, that deploy credentials are short-lived, and that a merge is not a deploy.
Those are four sentences. They do not say what a diff is, where the Owner sees it, what stops a
destructive one, what rolling back means, or where the first set of credentials comes from.

**D-016 is the binding constraint and it is the strictest of the three options the Owner was
offered.** Every production deploy needs the Owner's approval of *that specific change*, shown as the
infrastructure diff, never blanket, stateless and stateful alike — and the proposal "must not rely on
long-lived deploy credentials stored in the repository or on a laptop." D-015 adds that the agent
deploys and the Owner does not use the console. Two of those pull against each other: an agent that
deploys needs credentials, and the one place a credential could sit is ruled out.

**D-016 deliberately left the cadence open** — "How often deploys happen (per merge or batched per
release) is not decided" — and `mvp-scope.md` still lists two more open items this document touches:
whether a separate staging environment exists, and how each approval is recorded. Those are the
Owner's, not the Dev Lead's, so this ADR puts them rather than answers them.

It matters now rather than later because of ordering. D-022 requires the Owner to approve an ADR
*before any issue that depends on it starts*, and the first Phase 1 issue that produces running code
depends on this one. `infra/` is empty, so writing it costs nothing to change later; writing it after
the first deploy costs a production incident.

## Proposed outcome

- **[`docs/adr/0007-deployment-and-approval-process.md`](../../../docs/adr/0007-deployment-and-approval-process.md)
  exists with `status: proposed`.** Writing it approves nothing (D-022). It answers seven questions:
  credentials without a stored secret, how the diff reaches the Owner, how a destructive diff is
  refused rather than skim-approved, what rollback means when the stateful part is Aurora DSQL,
  whether a staging environment exists, who bootstraps and what drift does, and where the runtime
  configuration comes from.
- **Each answer carries its trade-off rather than a recommendation dressed as a fact.** Where the
  choice is the Owner's under `decision-boundaries.md` — cadence, staging, who holds the bootstrap
  credential — the ADR prices the options and stops.
- **Every AWS fact in it is read from a live AWS page on 2026-11-26 and dated**, as ADR 0005 does,
  and anything AWS does not publish is recorded as not published rather than filled in.
- **`architecture.md` lists 0007 as Proposed** — that section currently reads "None" — and its "not
  yet written" bullet for the deployment process is removed, because it has been written.
- **The decision log's architecture notes are corrected where current AWS pages contradict them**,
  with the date and what changed.
- **No new D-NNN row.** A D row records a decision the Owner made. The Owner has made none here; the
  ADR is the proposal that lets them make several.

## Affected users and systems

No application code exists and `infra/` is empty, so nothing shipped changes and nothing is deployed
by this change. What changes is what the first deploy will be allowed to look like.

Three things this document decides are **not** files in this repository, and that is worth saying
plainly because the same gap already bit item 6:

- The **GitHub Environment** and its required reviewer are a repository setting. So is making a check
  required on `main`, which is still outstanding from change 9010.
- The **IAM OIDC provider and the deploy roles** must exist in AWS *before* any workflow can assume
  them, so the first one is created by hand or by a locally run `cdk bootstrap`.
- The **AWS account** itself. ADR 0005 already notes that a newly opened account under the current
  Free Tier plan "closes on its own 6 months after you open it or when your credits run out", which
  is an account question rather than an architecture one, and it lands on whoever bootstraps.

`AGENTS.md` says infrastructure as code only. Three controls in this ADR cannot be expressed as code
in this repository, and the ADR names each one rather than implying the rule is satisfied.

## Constraints

- **D-016**, in full: approval of the specific change, shown as the infrastructure diff, never
  blanket, stateless and stateful alike, and no long-lived deploy credential in the repository or on
  a laptop. Nothing in the ADR may weaken any clause of it.
- **D-015**: the agent deploys; the Owner does not use the console.
- **D-014**: about $10 a month, and a monthly cost per component for anything added. A staging
  environment is a cost question before it is an architecture one.
- **[ADR 0005](../../../docs/adr/0005-hosting-and-the-data-store.md)** fixes the stack being deployed,
  including D-044's keep-warm ping — which this ADR depends on, because AWS Backup cannot back up an
  `Idle` cluster at all.
- **[ADR 0006](../../../docs/adr/0006-phase-1-is-single-account.md)** fixes what the deploy must not
  break: one Cognito user, one pinned `cognito_sub`, and a provisioning script that owns both sides.
  Re-running it is the documented recovery after a pool rebuild.
- **This repository is public** (`REVIEW.md`), which changes the credential question rather than
  decorating it: anyone may open a pull request against it.
- **D-022 and `decision-boundaries.md`**: the ADR proposes, the Independent Reviewer reviews, the
  Owner approves. An agent that reaches a consequential decision stops and asks.

## Open questions

These are carried into the ADR as the Owner's to settle, not answered here.

1. **How often production deploys happen** — per merge, or batched per release. D-016 left it open on
   purpose. Each deploy costs one approval, so cadence and approval fatigue are the same question.
2. **Whether a separate staging environment exists.** Priced in the ADR. The cost turns out to be
   small; the argument against it is the second approval surface and the second bootstrap, not the
   bill.
3. **Who runs `cdk bootstrap` the first time, and with what credential.** AWS documents the
   bootstrapping identity as needing `cloudformation:*`, `ecr:*`, `ssm:*`, `s3:*` and `iam:*` on
   `*`. That is the one step the pipeline cannot gate, because it creates the pipeline's own access.
4. **Whether a deploy that the destructive-change gate refuses can be overridden, and by whom.** A
   gate with no override is a gate that will one day block a legitimate change; a gate with an easy
   override is the skim-approval it was built to prevent.
5. **Whether schema migrations are inside this gate.** `cdk diff` cannot show them, and on Aurora
   DSQL they are the irreversible part. If they are outside the gate, D-016's "stateful changes too"
   is satisfied in letter and not in substance.
