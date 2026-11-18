# Workflow

Follow the documented ADLC lifecycle.

## Issues

GitHub is the source of truth, so builders work from the GitHub issue. Issues drafted as local `issues/NNN-*.md` files (the write-a-prd and prd-to-issues skills write these) are drafts: the Owner or Dev Lead files them on GitHub before any builder starts.

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

## Deploying

- Only the Dev Lead deploys to production, and only through infrastructure code, never by hand in the console.
- **Every production deploy needs the Owner's approval first.** The approval is for the specific infrastructure change, shown as the diff, and is never blanket or standing. This applies to stateless and stateful changes alike.
- Deploy credentials are short-lived. Do not keep long-lived deploy credentials in the repository or on a laptop.
- A merge is not a deploy: merged changes can wait and be deployed together, each deploy with its own approval.
