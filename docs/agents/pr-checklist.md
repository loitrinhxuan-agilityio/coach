# PR checklist

> **Status: proposed, awaiting Owner approval.** AGENTS.md requires "the required checklist" but never defined it. This one is built from the workflow and the rules in AGENTS.md.

Copy this into every code PR description and tick each item. Details for the gates are in [quality-gates.md](quality-gates.md).

- [ ] GitHub issue linked: #___
- [ ] Owner has approved the design (link to the board or approval)
- [ ] Dependencies are met and every acceptance criterion is satisfied
- [ ] One issue only, built in its own worktree, on a branch other than main
- [ ] The branch is `change/NNNN-slug`, matching the change's folder under `intent/`
- [ ] The change's `spec.md` and `plan.md` are linked in this description
- [ ] The merged diff still matches `plan.md`, or `plan.md` was updated in the same commit
- [ ] Any infrastructure change is in code, not applied by hand
- [ ] Gate 1, tests: output attached
- [ ] Gate 2, UI: screenshots attached, or "not applicable" with the reason
- [ ] Gate 3, independent review: requested from the Independent Reviewer
- [ ] Implementation evidence: what changed and how it was verified
- [ ] Security-relevant changes flagged to the Dev Lead
