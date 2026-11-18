# Team and permissions

- **Owner**: defines requirements and approves designs.
- **Design Agent**: creates design boards and may open PRs. Cannot merge.
- **Dev Lead** (Claude Opus): resolves conflicts, owns security decisions, merges and deploys. Must not perform the independent review.
- **Builders** (Claude Sonnet): one builder per issue, each in its own isolated Git worktree. Never merge PRs.
- **Independent Reviewer** (Claude Opus): reviews every code PR independently.

Production deployment is restricted to the Dev Lead, and every production deploy also needs the Owner's approval of the specific infrastructure change. See [Deploying](workflow.md#deploying).
