# Spec: the agent guide

From: `intent.md`, accepted 2026-11-23 (PR #7). Status: draft.

**The blocking question is settled.** Story 198 is **reworded**; story 44 does not enter Phase 1.
That confirms assumption 1 in `mvp-scope.md`, which names **both** 198 and 199, so the reword
covers the pair — correcting one and leaving the other would make each story fail its own test.

Two further questions from the intent are answered below by recommendation, and marked as mine.

## Requirements

Each traces to the Phase 1 stories it comes from, so the guide can be read against the slice rather
than against taste.

| # | The guide must | From |
|---|---|---|
| R1 | State the session lifecycle: start only when the Lifter says they are at the gym; resume today's open session; end a stale one first; end a long-open session where it stopped. | 12, 13, 26 |
| R2 | State the reply format: **one short line** per logged set, saying what was logged and what is next, with a new best in that same line. | 15, 27 |
| R3 | **Forbid the agent computing a barbell total or plate loading.** It asks the product. | 34, 36, 37 |
| R4 | State that a set which looks wrong is held with **one** clarifying question, and that a barbell weight below the bar is checked. | 18, 20 |
| R5 | State **at most one question per reply.** | story 198 |
| R6 | State what a Key may not do: manage keys, export data, delete the Account, give consent. | 10, 11 |
| R7 | State the input conventions the agent may rely on: natural exercise names, "again"/"same", per-side weights, effort words, warm-up **only when said**. | 14, 16, 17, 19, 21, 22 |
| R8 | State the end-of-session behaviour: two separate ratings, and a session note in the Lifter's own words. | 24, 25 |
| R9 | State that a retry after a timeout must never log the same set twice, and how to retry safely. | 28 |
| R10 | State that every coaching number comes from the product **with its reason**, and that the agent must not invent one. | R1, 46–48, 52–54, 57, 58 |
| R11 | **Name no API operation,** and say explicitly where the operation reference will go and why it is absent. | D-013, D-022 |
| R12 | Be short enough to hold in context on every turn. Target **under 200 lines.** | R3, story 15 |
| R13 | Mention **no feature outside Phase 1's fifty** — no check-in, no time away, no plans, no food. | D-026 |
| R14 | PRD stories 198 and 199 are reworded so their examples are in Phase 1 scope. | assumption 1, now confirmed |

R1–R13 are checked by reading the guide against the story list. R14 is checked by `git diff` on
`issues/prd.md`.

## Design

### The guide ships in two parts, and says so

| Part | Contents | When |
|---|---|---|
| **A — Behaviour** | R1 to R10, R12, R13. Everything about how to act. | **Now** |
| **B — Operations** | Which call to make, with what fields, and what each error means. | **When the Owner approves the API contracts** (D-013) |

Part B is present as a named section that states plainly that it is unwritten, that the contracts
are unapproved, and that an agent should not guess an operation name. A visible hole is honest; an
invented operation name would be a lie that reads as fact.

*This answers the intent's question 2, and it is my recommendation rather than a decision already
taken.* Waiting for five unwritten ADRs would mean this story does not ship in Phase 1 at all, and
the behaviour half is the half that shapes the Agent.

### Where it lives

`docs/product/agent-guide.md`.

**Not `docs/agents/`,** which is a trap worth naming: `GLOSSARY.md` reserves **Agent** for the
Lifter's own assistant and **Team agents** for the five roles that build this product, and
`docs/agents/` holds the latter — team, workflow, decision boundaries, the PR checklist. A product
guide filed there would read as instructions to the Builders.

### Serving it as MCP instructions

The Markdown page ships now. The MCP server's instructions are **the same text**, served by a
server that does not yet exist, so nothing is built for that half beyond keeping the guide short
enough and free of Markdown that would not survive being pasted into an instructions field.

*This answers the intent's question 3.* The story asks for two ways; Phase 1 delivers one way and a
document shaped for the second.

### The reword (R14)

Story 198's "ask the check-in first" is replaced with an example drawn from Phase 1 — holding a set
that looks wrong is the natural one, since story 18 is in the slice and it is the behaviour most
likely to be got wrong. Story 199's "I'm going away" is replaced with a Phase 1 scenario for the
same reason.

The PRD wins over nothing (`README.md`), so the reword carries no decision weight on its own.
**D-041 records the confirmation of assumption 1**, which is where the weight sits.

## Conformance

- **Phase 1 only** (D-026, R13). The guide's scope is the fifty stories.
- **No API operation named** (R11) until the Owner approves the contracts, so nothing here
  pre-empts D-013 or D-022, and the architecture gate in `AGENTS.md` is not crossed.
- **No AI inside the product** (R1). The guide instructs someone else's model; it is not a prompt
  for a model this product runs, and every number it describes comes from a rule with its reason.
- **This product's own words** (I3, D-010). The ShredPace research informs *what a guide must
  cover* and never its wording — and it is untracked since D-040, so it is on the Owner's machine
  and absent from a clone.
- **Metric only** (I-09): kilograms and kilometres.

## Areas of concern

1. **The guide ships untestable.** Its test is story 199's scripted conversations run against a
   real assistant — and that needs the API, which does not exist. So a Phase 1 deliverable arrives
   with its Phase 1 test unable to run. The alternative is holding the guide until the API lands,
   which leaves Phase 1's agent behaviour undefined while the API is built against no stated
   behaviour.
2. **Is a story with a deliberate hole "done"?** Part B is a named absence. The Owner should decide
   whether story 198 closes now and reopens when the contracts land, or stays open.
3. **R12's number is an analogy, not a documented limit.** Under 200 lines mirrors Claude Code's
   published `CLAUDE.md` guidance. I know of no published size limit for MCP server instructions,
   so the budget is reasoned rather than sourced, and the plan should measure what it actually gets.
4. **R5 has no story behind it.** "At most one question per reply" comes from story 198's own text
   and nowhere else in the PRD. It is sound — a lifter holding a loaded bar can answer one thing —
   but it is the one requirement with no independent basis.
5. **The reword changes a document the decision log supersedes.** `issues/prd.md` must stay
   consistent with D-010's list of fifty, and D-010 is the authority if they disagree.

## Open questions from the intent

**1. Check-in example → settled.** Reworded. Story 44 stays out, story 45 with it, and assumption 1
is confirmed for both 198 and 199.

**2. Can the guide be written before the contracts? → Yes, split in two.** Part A now, Part B when
the contracts are approved, with the absence stated in the document. See Design.

**3. What serves the MCP instructions? → Nothing yet, and that is the honest answer.** The Markdown
page is the deliverable; the instructions half is the same text awaiting a server.

**4. Does story 199 get corrected here? → Yes.** Assumption 1 names both stories, and they are each
other's test.
