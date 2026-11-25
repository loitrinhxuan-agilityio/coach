# Intent: answer "@claude" in a comment, which nothing currently does

Author: Owner, via the Dev Lead. Status: draft.

## Problem

Change 9005 installed the Independent Reviewer, and it works: on PR #8 it found that ADR 0004 cited
D-006's "later phases" list as committed scope when D-026 had amended it to candidates, and the ADR
was corrected. But 9005 installed only the **automation-mode** workflow, which triggers on
`pull_request` events.

The Owner then replied `@claude fix it` under that inline finding, and `@claude review` on the pull
request. **Nothing happened, and nothing was ever going to.** Neither workflow on `main` listens to a
comment event:

| Workflow | Triggers |
|---|---|
| `design-checks.yml` | `pull_request`, `push` to `main` |
| `independent-review.yml` | `pull_request` — `opened`, `synchronize`, `ready_for_review`, `reopened` |

Answering a mention is a second, separate workflow running in the action's **interactive** mode. It
was not installed, and 9005 did not say so, which left a reasonable expectation unmet: the reviewer
posts a comment that invites a reply, and a reply goes nowhere.

## Proposed outcome

`.github/workflows/claude-mentions.yml` answers `@claude` in an issue comment, a pull request comment
or a reply to an inline review comment, as `claude-opus-5-5`. The reply thread under a review finding
becomes usable, which is where the Owner tried to use it.

Its system prompt carries this project's standing rules, so an answer does not have to be corrected
after the fact: never push to `main` or merge; architecture goes through an ADR the Owner approves;
`docs/design/ailiftcoach/` belongs to the Design Agent and never shares a pull request; and **check
whether a decision is marked amended or superseded before relying on it.**

That last rule is in here because the same mistake has now been made twice in one change — ADR 0004
read past "scope amended by D-026", and an earlier draft read past change 0198 — and
[`REVIEW.md`](../../../REVIEW.md) says a mistake flagged twice goes into the agent instructions in
the same review, so the next pull request is checked against it.

## Affected users and systems

Anyone with write access to the repository, which today is the Owner alone, can trigger a run by
writing `@claude`. The Owner's Claude subscription pays for it, and GitHub Actions minutes are
consumed per mention rather than per pull request.

**This workflow can write to the repository.** `contents: write` is what lets Claude push a fix to a
branch when asked, and it is a real escalation over the reviewer, which holds read-only permissions
and cannot modify code at all.

## Constraints

- **`AGENTS.md`: infrastructure as code only.** The workflow is a file here.
- **It must never merge.** [`team.md`](../../../docs/agents/team.md) reserves merging for the Dev
  Lead and [`workflow.md`](../../../docs/agents/workflow.md) requires the Owner's approval for every
  deploy. The system prompt says so, but nothing enforces it: a comment that asks Claude to merge is
  the Owner overruling their own rule, and the rule binds whoever writes the comment.
- **The two workflows must not loop.** The reviewer posts as `claude[bot]`. The action rejects a bot
  actor unless it is named in `allowed_bots`, which this workflow does not set, so a reviewer comment
  cannot trigger a mention run.
- **Same credential as 9005.** `CLAUDE_CODE_OAUTH_TOKEN`, so runs bill to the subscription rather
  than the API and stay outside D-014's ceiling. Missing secret warns and skips, as in 9005.
- **One run per thread.** A `concurrency` group keyed on the issue or pull request number queues a
  second mention behind the first rather than racing it on the same branch.

## Open questions

1. **Is `contents: write` wanted at all?** A read-only variant would let Claude answer questions and
   propose diffs in a comment without being able to push. That is strictly safer and still covers
   "what do you think of this?", but not "fix it" — which is the thing the Owner actually asked for.
   The write permission is here because the request was `@claude fix it`.
2. **Should a mention be able to start work on an issue?** Interactive mode also responds to the body
   or title of a newly opened issue. That event is deliberately not wired up, because an issue in
   this project is meant to go through the artifact chain (intent, spec, plan), and a mention that
   turns an issue straight into a pull request would bypass it.
3. **Nothing rate-limits mentions.** A long thread could start many runs. The `concurrency` group
   serialises them per thread but does not cap them.
