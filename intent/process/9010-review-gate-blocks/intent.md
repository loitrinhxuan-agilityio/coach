# Intent: make Gate 3 able to block, and stop its prompt contradicting REVIEW.md

Author: Owner, via the Dev Lead. Status: draft.

## Problem

**Gate 3 could not fail.** `.github/workflows/independent-review.yml` ran the Independent Reviewer and
let the action's own exit code be the whole check. That action exits 0 whether it posts twenty findings
or none, so a green `Independent review` never meant a clean review — the verdict was only ever in the
pull request's inline comments.

This was found by using the gate rather than reading it. On
[PR #13](https://github.com/loitrinhxuan-agilityio/coach/pull/13) the check reported success three
times while the reviewer was holding **five, then one, then two findings**. Two were substantive: an
option rejected on the price of a function twice the size the ADR specified, and a claim about Lambda
VPC cold starts that has been false since 2019. Reading "3 checks passing" as "clean" would have merged
every one of them, and nearly did.

It matters now because of what item 6 of
[`development-preparation.md`](../../../docs/agents/development-preparation.md) asks the Owner to do
next: make these checks **required** on `main`. Requiring a check that always passes produces a gate in
name only — worse than no gate, because it reads as a control.

**A second defect, found while fixing the first.** The workflow's `--append-system-prompt` opened with
"Follow REVIEW.md in this repository" and then contradicted it: it still said the database has no
row-level security, that account isolation falls to application code, and that an unscoped query is the
most valuable finding here. D-042 and ADR 0006 reversed all of that, and `REVIEW.md` now states the
opposite — cross-account isolation is **not** a finding class. The contradiction has been harmless only
because no application code exists yet; it would have misdirected the Security pass on the first real
handler.

## Proposed outcome

- **A step after the review reads the findings back and fails on any that is not a nit.** Scoped to the
  pull request's head commit, so findings from an earlier pass on an earlier commit cannot fail a branch
  that has since been fixed, and so the check clears by pushing a fix.
- **Severity comes from a tag the prompt now mandates** — `[Bugs, important]`, `[Compliance, nit]` — and
  from nothing else. Nits warn and pass; anything else fails; **anything untagged is treated as
  blocking.**
- **The Security paragraph is rewritten to match `REVIEW.md`**, including the explicit instruction not
  to hunt for unscoped queries.
- The skip-when-unconfigured behaviour is untouched: with no `CLAUDE_CODE_OAUTH_TOKEN` the workflow
  still warns and skips rather than failing every pull request.

## Affected users and systems

No application code exists, so nothing shipped changes. What changes is what a merge means. Once this
lands, a pull request carrying an important finding **cannot** show all-green, which is the property
item 6 needs before requiring the checks is worth doing, and item 7 needs before approving the quality
gates records a control rather than an intention.

The cost is the obvious one: a false positive now blocks a merge instead of being ignorable. The
mitigations are that nits do not block, and that the reviewer converges — four passes on PR #13 returned
5, 1, 2, then 0 findings, so a correct change does reach green.

## Constraints

- **`AGENTS.md`: infrastructure as code only.** The gate is a workflow file, not a branch setting
  configured in the web UI. The one part that cannot be expressed in the repository is making the check
  *required*, which stays the Owner's to set and is why item 6 remains open after this.
- **D-022.** This is a Dev Lead decision inside approved bounds, recorded in the pull request. It is not
  an architecture decision: it is one workflow step, trivially reversible, and it decides nothing about
  the product.
- **`REVIEW.md` is the standard, and the prompt must not restate it wrongly.** The second defect above
  is exactly what happens when the same rule is written in two places. The prompt now carries a comment
  saying it has to be kept in step.
- **Severity classification must fail closed.** A finding the gate cannot classify has to block. The
  first draft of the classifier searched the opening words for "nit" and so downgraded a real bug whose
  text read "not a nit" — a false negative, which is the only direction that actually costs anything.

## Open questions

1. **Should nits block too?** They do not here. The argument for blocking them is that the Owner then
   never merges with a known finding outstanding; the argument against is that a style nit stopping a
   docs merge will teach everyone to bypass the gate. Easy to change later — one `case` arm.
2. **Does the reviewer comply with the tag reliably?** The prompt mandates it and the gate fails closed
   when it is missing, so a lapse costs a spurious failure rather than a missed bug. Worth watching over
   the next few pull requests before item 6 is closed.
3. **`development-preparation.md` item 6 names this fix as a proposal, and PR #12 carries that file.**
   It is not edited here, to avoid two open pull requests touching the same file. Once #12 merges, row 6
   should say the fix landed and that only the branch-protection setting is left.
