# Plan: the agent guide (from `spec.md` 2026-11-23)

The guide's real test is story 199's scripted conversations against a live assistant, and that
needs an API which does not exist. So this plan's job is to make a document that **cannot** be
behaviourally tested **mechanically** checkable instead: two of the Proof steps are greps, because
the two requirements easiest to break by accident — naming an operation, and mentioning an
out-of-scope feature — are both detectable by pattern.

## Files that change

| File | Why |
|---|---|
| `docs/product/agent-guide.md` | **new** — the guide. Part A written, Part B a named absence. Not in `docs/agents/`, which is the Team agents' folder. |
| `issues/prd.md` | **edit** — reword stories 198 and 199 so their examples are in Phase 1 (R14). |
| `docs/product/mvp-scope.md` | **edit** — mark assumption 1 confirmed; it has read "not yet confirmed" since 2026-11-18. |
| `docs/product/decision-log.md` | **edit** — D-041 records the confirmation, which is where the decision weight sits. |
| `docs/product/requirements.md` | **edit** — I3 promises an agent guide; point it at the file now that one exists. |
| `README.md` | **edit** — the repository map's `docs/product/` row does not mention the guide. |
| `intent/phase-1/0198-agent-guide/plan.md` | this file. |

## Order of work

**Step 1 is the guide, because it is the only step that can fail.** Fourteen requirements have to
fit in under 200 lines (R12), and whether they do is not knowable until it is written.

1. **Write `docs/product/agent-guide.md`** — Part A covering R1 to R10, and Part B as a section
   that states it is unwritten, that the contracts are unapproved, and that an agent must not guess
   an operation name. Then **measure it.**
2. **If it is over 200 lines,** cut content or restate the budget *with its reason* in this plan.
   Do not silently exceed it — R12's number is an analogy to Claude Code's published `CLAUDE.md`
   guidance, not a documented MCP limit, so it is a budget to defend rather than a law to obey.
3. **Grep for operation names** (R11) and **for out-of-scope features** (R13). Both before anyone
   reads it, because both are the kind of mistake that survives a careful read.
4. **Reword stories 198 and 199** in `issues/prd.md`. Change the example text only — not the
   numbering, not the `**[Phase 1]**` tags.
5. **Mark assumption 1 confirmed** in `mvp-scope.md` and **record D-041.**
6. Point `requirements.md` I3 and `README.md`'s repository map at the guide.
7. **Walk the fourteen requirements one at a time** against the finished guide and record each
   result in this plan's Proof table. A table of ticks written without doing this is worthless.

## Risks

- **The Proof cannot show the guide works.** It can show the guide *says* the right things, is
  short enough, names no operation and stays in scope. Whether an agent actually behaves better is
  unmeasurable until story 199 can run, which needs the API. This is the spec's first area of
  concern and the plan does not pretend to close it.
- **R11 is easy to break while being helpful.** "Ask the product for the plate breakdown" is
  correct; "call `get_next_set`" is a fabricated contract. The grep in step 3 looks for
  `snake_case` identifiers, `camelCase` identifiers, and HTTP verbs with paths.
- **R13 is easy to break while being thorough.** A sentence about what to do when the Lifter
  mentions a plan, a meal, a goal or time away would be useful *and* out of scope. The grep checks
  a list of feature words that belong to no Phase 1 story.
- **R12 may simply not hold.** Fourteen requirements is a lot for 200 lines. Step 2 exists because
  the honest outcome may be a larger budget with a stated reason.
- **Rewording the PRD can silently break D-010.** The fifty-story list is authoritative; a stray
  edit to a number or a tag would put the PRD and the decision log at odds. Step 4 is deliberately
  narrow and the Proof diffs it.
- **Riskiest step: 1**, and everything after it is bookkeeping.

## Proof

| # | Check | Expected |
|---|---|---|
| P1 | `wc -l docs/product/agent-guide.md` | under 200 (R12), or over it with a reason recorded here |
| P2 | Grep for `snake_case`/`camelCase` identifiers and `GET\|POST\|PUT\|DELETE /` | **no match** (R11) |
| P3 | Grep for `check-in`, `time away`, `comeback`, `plan`, `programme`, `food`, `meal`, `goal`, `habit`, `benchmark`, `Insights`, `endurance`, `body`, `ache` | **no match** outside a sentence that explicitly says the feature is not in Phase 1 (R13) |
| P4 | Each of R1 to R10 present, checked one at a time | fourteen rows, each with the line it is satisfied by |
| P5 | Part B present and explicitly marked unwritten | a reader cannot mistake it for a complete reference |
| P6 | `git diff issues/prd.md` | exactly two stories changed; no number and no `**[Phase 1]**` tag touched |
| P7 | D-041 in the decision log, assumption 1 marked confirmed in `mvp-scope.md` | both present |
| P8 | Every relative link in the new guide resolves | zero dead |
| P9 | Behavioural effect on a real agent | **not provable.** Needs story 199 and an API. Stated, not claimed. |

Nothing here is implemented. Accepting this plan is what starts the implementation.
