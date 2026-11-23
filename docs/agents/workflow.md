# Workflow

Follow the documented ADLC lifecycle.

## Issues

GitHub is the source of truth, so builders work from the GitHub issue. Issues drafted as local `issues/NNN-*.md` files (the write-a-prd and prd-to-issues skills write these) are drafts: the Owner or Dev Lead files them on GitHub before any builder starts.

## The artifact chain

Every change moves through the chain, and each stage ends by committing an artifact that
triggers the next. The commits are the audit trail: who asked for what, what the agent
produced, and who approved it.

```
intent.md  →  spec.md  →  plan.md  →  the diff and its tests  →  the PR and its findings
```

- Artifacts live in `intent/phase-1/NNNN-slug/` or `intent/candidates/NNNN-slug/`. See
  [`intent/README.md`](../../intent/README.md).
- `NNNN` is the PRD story number; 9000 upward for work with no story.
- The branch is `change/NNNN-slug`. Never `main`.
- **An intent is accepted by the Owner merging it,** and that merge starts Stage 2.
- **A plan is built only from its own accepted `spec.md`** — never directly from
  `issues/prd.md` or `requirements.md`. Those, with the ADRs and the design system, are the
  standing constraints a spec must conform to; they are not a spec for any one change.
- Until CI exists this is convention, backed by the Compliance pass in
  [`REVIEW.md`](../../REVIEW.md). A hook that blocks a plan without an accepted spec is the
  follow-up; see D-029.
- The chain applies from its adoption forward. Work that predates it is not retro-fitted.

## Before starting work

- Read the relevant GitHub issue.
- Review approved designs and requirements.
- Check dependencies and acceptance criteria.
- Confirm the assigned role and permissions in [team.md](team.md).

## Before completing work

- Run required tests.
- Verify relevant UI screens.
- Document implementation evidence.
- Open a PR with the required checklist ([pr-checklist.md](pr-checklist.md)).

## Pull requests

- Every code PR requires independent review. Who reviews, and who may not, is in [team.md](team.md).
- All three PR quality gates must pass ([quality-gates.md](quality-gates.md)).
- **A PR never touches both `docs/design/ailiftcoach/` and application code.** Design changes go in their own PR from the Design Agent. If you find an approved board is wrong, build to it, file an entry in [`CHANGES-FOR-DESIGN.md`](../design/CHANGES-FOR-DESIGN.md) and carry on — see [design-handoff.md](design-handoff.md).

## Deploying

- Only the Dev Lead deploys to production, and only through infrastructure code, never by hand in the console.
- **Every production deploy needs the Owner's approval first.** The approval is for the specific infrastructure change, shown as the diff, and is never blanket or standing. This applies to stateless and stateful changes alike.
- Deploy credentials are short-lived. Do not keep long-lived deploy credentials in the repository or on a laptop.
- A merge is not a deploy: merged changes can wait and be deployed together, each deploy with its own approval.
