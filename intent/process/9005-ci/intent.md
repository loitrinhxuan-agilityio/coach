# Intent: stand up CI, so the quality gates can be enforced rather than asserted

Author: Owner, via the Dev Lead. Status: draft.

## Problem

Item 6 of [`docs/agents/development-preparation.md`](../../../docs/agents/development-preparation.md)
is open and blocks item 7: there is no `.github/workflows` and no `test/visual/screenshots/`. The
consequence is written down in item 7 and is the real problem here —

> Gate 1 asks that automated tests pass with nothing to run them, and Gate 2 names a directory that
> does not exist. Approving a gate nothing can enforce buys the comfort without the check.

Two checks already exist and already exit non-zero on a failure, so they can gate a change today:
the palette contrast check and the rendered contrast audit in
[`docs/design/ailiftcoach/tools/`](../../../docs/design/ailiftcoach/tools/). Nothing runs them except
an agent remembering to.

Gate 3 has a different problem. [`team.md`](../../../docs/agents/team.md) names the Independent
Reviewer as Claude Opus, but gives it no identity on GitHub, and the repository's only collaborator
is the Owner, who is also the author of every pull request so far. GitHub will not let the author
request a review from themselves, so Gate 3 has had no mechanism at all — the review could only ever
be run by hand, by an agent, with nothing recorded on the pull request.

## Proposed outcome

- `.github/workflows/design-checks.yml` runs both design checks on every pull request and on pushes
  to `main`. No paths filter, so the check always reports and can be made a required check without
  the skipped-but-required trap.
- `.github/workflows/independent-review.yml` runs `anthropics/claude-code-action@v1` in automation
  mode on every pull request, as `claude-opus-5-5`, posting its findings on the pull request itself.
  It carries this repository's own standard from [`REVIEW.md`](../../../REVIEW.md) — the three passes,
  what Important means, the nit cap, and the exclusion of `docs/product/shredpace/` — so the gate
  matches the repository rather than being a generic review.
- `test/visual/screenshots/` exists, with a README stating the naming convention and that nothing
  generates its contents yet.

Gate 3 gains a real mechanism: the action posts as the Claude GitHub App, which is neither the Dev
Lead nor the pull request's builder, so it satisfies
[`quality-gates.md`](../../../docs/agents/quality-gates.md) Gate 3 instead of only appearing to.

## Affected users and systems

Every future pull request gains two or three checks. The Owner's GitHub account: the Claude GitHub
App has to be installed, and it carries a broad permission set that GitHub does not let you narrow
(Actions, Contents, Issues, Pull requests and more, read and write). The Owner's Claude subscription
pays for the reviews. GitHub Actions minutes are consumed on every pull request.

Nothing is deployed and no application code exists, so none of this touches production.

## Constraints

- **`AGENTS.md`: infrastructure as code only.** Both workflows are files in the repository. This is
  why the separate Code Review product was not used: it is configured outside the repository, so it
  could not be reviewed, versioned or rolled back with it.
- **An agent may not handle credentials.** The Owner runs `claude setup-token` and creates the
  `CLAUDE_CODE_OAUTH_TOKEN` secret themselves. Until it exists, the review workflow emits a GitHub
  warning and skips, so it neither fails every pull request nor reports a gate that did not run.
- **D-014, about $10 a month.** A subscription token was chosen over an API key so reviews bill to
  the Owner's existing Claude subscription rather than adding API spend to that ceiling.
- **Item 6 is the Owner's to close.** `development-preparation.md` says nothing in it is approved and
  each item is theirs to close, so this change does not edit that table or
  [`quality-gates.md`](../../../docs/agents/quality-gates.md), both of which are still marked
  proposed.

## Open questions

1. **Should these become *required* checks?** That is a GitHub branch-protection setting on `main`,
   not a file, so it cannot be committed here and the Owner has to set it. Until they do, the checks
   report but do not block a merge, and the gates remain advisory.
2. **Does Gate 3 hold when the reviewer declines to review?** The action skips draft and closed pull
   requests, ones it judges trivial, and ones that already carry a comment from Claude — the last of
   which means a re-review after a further push may not happen. A gate that can silently skip is the
   same shape of problem item 7 warns about, so the Owner should decide whether a skipped review
   counts as a pass.
3. **Is Gate 1 honest yet?** There are no application tests, because there is no application. These
   workflows make Gate 2's half enforceable and give Gate 1 a place to live, but Gate 1 has nothing
   to run until the first code lands.
4. **The GitHub App's permission set is broader than this use needs.** GitHub does not allow accepting
   a subset. A custom GitHub App with only Contents, Issues and Pull requests is possible and would
   cover the action, but not the other Claude GitHub features. The Owner owns this security decision.
