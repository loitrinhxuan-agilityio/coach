# PR quality gates

> **Status: proposed, awaiting Owner approval.** AGENTS.md requires "all three PR quality gates" but never named them. These three come from the existing workflow (run tests, verify UI screens, independent review).

All three must pass on every code PR. The Dev Lead merges only after they do.

## 1. Tests pass

The tests that cover the change run and pass. Paste or link the output in the PR. If the change has no test, the PR says why.

## 2. UI matches the approved design

Every screen the change affects is checked against its approved board in [docs/design/](../design/). Attach screenshots; they are kept in `test/visual/screenshots/`. A PR that touches no UI marks this gate "not applicable" and says why.

## 3. Independent review

The Independent Reviewer approves the PR. Neither the Dev Lead nor the PR's own builder can be that reviewer.

## Design PRs

The gates apply to code PRs. A PR from the Design Agent needs the Owner's approval of the design instead.
