# Development preparation

The Owner's own readiness list, lifted from the intent document, with where each item stands.

> The project is not implementation-ready simply because discovery, design exploration or
> architecture discussion is complete.

Nothing below is approved. Each item is the Owner's to close.

| # | Before application development starts | Where it stands |
|---|---|---|
| 1 | Finalise and obtain approval for the architecture ADRs | **Open.** None of the five is written. ADR 0001 and 0002 are accepted but cover agent access and the multi-account schema, not hosting, authorisation, isolation, contracts or deploys. |
| 2 | Confirm authentication and authorisation boundaries for human users and Agents | **Open.** The identity provider is unchosen, and every other item here waits on it. |
| 3 | Define account isolation and ensure every data access is correctly scoped | **Open.** The planned database has no row-level security, so this falls to application code and the ADR has to say how an unscoped query is made impossible. |
| 4 | Specify the REST and MCP contracts, with validation, errors and idempotency | **Open.** About 25 operations, in the project's own shapes. |
| 5 | Document infrastructure, deployment and approval procedures | **Partly done.** [`workflow.md`](workflow.md) carries the deploy rules and the Owner-approval requirement; the procedures themselves are unwritten. |
| 6 | Stand up CI, and the directory the UI gate's screenshots go in | **Open, and it gates item 7.** There is no `.github/workflows` and no `test/visual/screenshots/`. |
| 7 | Agree the quality gates and the PR checklist | **Open, and blocked on item 6.** Both are proposed. Gate 1 asks that automated tests pass with nothing to run them, and Gate 2 names a directory that does not exist. Approving a gate nothing can enforce buys the comfort without the check. |
| 8 | Integrate the relevant Superpowers workflows into the agent instructions and the development process | **Open.** Superpowers is installed — brainstorming, test-driven development, systematic debugging, verification before completion, requesting and receiving code review, writing and executing plans — and no agent document refers to any of it yet. It supports the lifecycle; it does not replace a stage or an approval. |
| 9 | Finalise the Phase 1 requirements, assumptions, acceptance criteria and GitHub issues | **Open.** The requirements and scope are drafts, five assumptions in [`../product/mvp-scope.md`](../product/mvp-scope.md) are unconfirmed, and no issue has been filed on GitHub. |
| 10 | Validate the design's contrast and responsive behaviour | **Done.** 50 colour pairs across both themes with 0 failures, 34 rendered screens with 0 text elements below contrast, and every screen at 390px with no horizontal overflow. The two scripts are in [`../design/ailiftcoach/tools/`](../design/ailiftcoach/tools/) and both exit non-zero on a failure, so they can gate a change. |
| 11 | Obtain an explicit implementation-readiness decision | **Open.** It is the last item, not the first. |

## The quality gates

As proposed, and **not approved**:

1. Required automated tests pass.
2. The UI conforms to the approved design.
3. An independent reviewer approves the change.

They stay proposals until they are reviewed and approved, and item 6 above comes first.
