# Development preparation

The Owner's own readiness list, lifted from the intent document, with where each item stands.

> The project is not implementation-ready simply because discovery, design exploration or
> architecture discussion is complete.

Nothing below is approved. Each item is the Owner's to close.

| # | Before application development starts | Where it stands |
|---|---|---|
| 1 | Finalise and obtain approval for the architecture ADRs | **Open, and narrower.** ADR 0006 removed one of the five, so four remain. ADR 0001 and ADR 0006 are accepted; ADR 0002 is superseded. ADRs [0003](../adr/0003-lifter-and-agent-are-separate-principals.md) (authorisation), [0004](../adr/0004-one-operation-registry-generated-surfaces.md) (how contracts are produced) and [0005](../adr/0005-hosting-and-the-data-store.md) (hosting) are written and **proposed** — they need the Owner's approval before dependent work starts (D-022). ADR 0005 cannot be approved as it stands: D-014 and D-022 require a monthly cost per component and an idle-latency answer, and neither is written. ADR 0004 asks a scope question first: its generator is not among D-010's 50 stories. The deployment-process ADR is the one still unwritten. |
| 2 | Confirm authentication and authorisation boundaries for human users and Agents | **Open, but no longer the thing everything waits on.** ADR 0006 (accepted) settles how the Lifter is recognised: one pinned `cognito_sub`, every other verified token refused. ADR 0003 (proposed) splits Lifter and Agent into separate principals with a Lifter-only set. The identity provider is Cognito, named in D-015 and in ADR 0005 (proposed). What remains is approving 0003 and 0005, and the JWT-verification detail ADR 0006 hands to the authorisation ADR. |
| 3 | Define account isolation and ensure every data access is correctly scoped | **Closed by ADR 0006, not completed.** Phase 1 is single-account (D-042), so there is no second Account for data to leak to. `requirements.md` S3 is withdrawn and `REVIEW.md`'s Security pass no longer treats cross-account isolation as a finding class. If tenancy ever returns, this item returns with it, and its ADR has to be written **before** the migration. |
| 4 | Specify the REST and MCP contracts, with validation, errors and idempotency | **Open.** About 25 operations, in the project's own shapes. |
| 5 | Document infrastructure, deployment and approval procedures | **Partly done.** [`workflow.md`](workflow.md) carries the deploy rules and the Owner-approval requirement; the procedures themselves are unwritten. |
| 6 | Stand up CI, and the directory the UI gate's screenshots go in | **Done** (change 9005). `.github/workflows/design-checks.yml` runs both contrast checks on every pull request and on pushes to `main`; `.github/workflows/independent-review.yml` runs Claude Opus over every pull request and posts its findings; `test/visual/screenshots/` exists. It no longer gates item 7. **Still outstanding and only the Owner can do it:** making these checks *required* is a branch-protection setting on `main`, which no file in this repository can express. Until it is set, the checks report but do not block a merge. |
| 7 | Agree the quality gates and the PR checklist | **Open, no longer blocked.** Both are still proposed. Item 6's two objections are answered: Gate 1 has checks that actually run, and Gate 2's directory exists. Gate 3 has a mechanism it never had — the reviewer posts as the Claude GitHub App, which is neither the Dev Lead nor the change's builder, as [quality-gates.md](quality-gates.md) requires — and it has been exercised: nine findings across the two ADR pull requests (four on #8, five on #11), all of which held up on checking. Two things to weigh before approving: the reviewer skips drafts, changes it judges trivial, and pull requests that already carry a comment from it, so it is a gate that can silently skip; and until the checks are required, approving them still buys the comfort without the check. |
| 8 | Integrate the relevant Superpowers workflows into the agent instructions and the development process | **Open.** Superpowers is installed — brainstorming, test-driven development, systematic debugging, verification before completion, requesting and receiving code review, writing and executing plans — and no agent document refers to any of it yet. It supports the lifecycle; it does not replace a stage or an approval. |
| 9 | Finalise the Phase 1 requirements, assumptions, acceptance criteria and GitHub issues | **Open.** The requirements and scope are drafts, five assumptions in [`../product/mvp-scope.md`](../product/mvp-scope.md) are unconfirmed, and no issue has been filed on GitHub. |
| 10 | Validate the design's contrast and responsive behaviour | **Done.** 50 colour pairs across both themes with 0 failures, 34 rendered screens with 0 text elements below contrast, and every screen at 390px with no horizontal overflow. The two scripts are in [`../design/ailiftcoach/tools/`](../design/ailiftcoach/tools/) and both exit non-zero on a failure, so they can gate a change. |
| 11 | Obtain an explicit implementation-readiness decision | **Open.** It is the last item, not the first. |

## The quality gates

As proposed, and **not approved**:

1. Required automated tests pass.
2. The UI conforms to the approved design.
3. An independent reviewer approves the change.

They stay proposals until they are reviewed and approved. Item 6 no longer comes first — CI exists —
but one thing still does: **the checks are advisory until they are required on `main`.** That is a
branch-protection setting, not a file, so it is the Owner's to set.
