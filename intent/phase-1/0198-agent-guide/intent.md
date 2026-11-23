# Intent: the agent guide

Author: Dev Lead, for the Owner's review. Status: draft.

PRD story **198** (Phase 1, D-010), `issues/prd.md` lines 437–438.

## Problem

An Agent connected to this product has no idea how to behave, and the product has no way to tell
it. Left to itself an assistant will write paragraphs where one line is wanted, work out a barbell
total in its head and get it wrong, stack three questions into a reply while the Lifter is holding
a loaded bar, and invent coaching the rule engine was supposed to supply.

The product's whole premise is that the Agent is the only writer and the dashboard only reports.
That makes the guide load-bearing rather than documentation: it is the single place the product
gets to shape the behaviour of software it does not control.

Story 198 asks for one guide served two ways — the MCP server's instructions and a Markdown page —
so that the same rules reach an agent whether it connects over MCP or reads the docs.

**Two things about this story are not buildable as written, and both are already known.**

First, **the story's own example is out of scope.** It says the guide should tell an agent to "ask
the check-in first". The check-in is **story 44** — *asked about sleep, soreness and energy in one
line before a session* — and story 44 is **not among Phase 1's fifty**. Neither is story 45, which
makes a poor check-in lighten the day. This is recorded as assumption 1 in
[`mvp-scope.md`](../../../docs/product/mvp-scope.md) and the Owner has never confirmed it. The
story's three other examples are fine: one short line is story 15, not computing a barbell total is
stories 34, 36 and 37, and one question per reply is nobody's story but costs nothing.

Second, **the guide has two halves with very different readiness.** The *behaviour* half — how to
reply, what never to compute, how many questions to ask, when to stop and confirm — can be written
today from Phase 1's fifty stories. The *API* half — which operation to call, with what fields, and
what the errors mean — cannot: the roughly 25 Phase 1 contracts are unapproved (D-013) and the five
architecture ADRs that precede them are unwritten. A guide that names operations now would be
naming names that do not exist.

There is also no MCP server to attach instructions to.

## Proposed outcome

An Agent reading this guide behaves like a competent trainer on the features Phase 1 actually has,
without being told again each session: it answers in one short line saying what was logged and what
is next, it never works out a barbell total itself but asks the product, it asks at most one
question per reply, and it holds a set that looks wrong rather than logging it.

The same content is shaped so that it can be served as the MCP server's instructions when a server
exists, and read as a Markdown page in the meantime.

## Affected users and systems

The Lifter's own Agent — in Phase 1 that means Claude Code or Cursor over MCP with a Key (D-011).

The future REST API and MCP server, whose contracts the guide has to name once they are approved,
and the five Phase 1 rule modules it has to describe the behaviour of: the progression engine, the
load calculator, the set sanity checker, the conversation formatter and the operation registry.

**Story 199**, the scripted conversations that exist to test this guide. It has the same defect —
its example is "I'm going away", and time away has **no story in Phase 1 at all**.

## Constraints

- **Phase 1 is the only committed scope** (D-026). The guide covers Phase 1's fifty stories and
  says nothing about features that are candidates.
- **Architecture approval precedes implementation** (`AGENTS.md`). No operation name in this guide
  can be final until the Owner approves the API contracts (D-013, D-022).
- **There is no AI inside this product** (R1). The guide is deterministic instruction for someone
  else's model, not a prompt for a model this product runs. Every coaching number comes from a rule
  and arrives with its reason.
- **The guide is written in this product's own words** (I3, D-010). The ShredPace research covers
  what such a guide must address, and it is a reference for *that* — never for wording. It is also
  untracked as of D-040, so it is on the Owner's machine and absent from a clone.
- Metric units only in Phase 1 (I-09). Kilograms and kilometres.
- One short line per logged set (R3, story 15) is the guide's own first rule, so the guide must
  itself be short enough for an agent to hold in context on every turn.

## Open questions

1. **Does "ask the check-in first" come out of the story, or does story 44 come into Phase 1?**
   This is `mvp-scope.md` assumption 1, unconfirmed since 2026-11-18. Rewording the story is far
   cheaper; pulling story 44 in adds a fifty-first story to the set the Owner accepted in D-010,
   and story 45 would follow it. **This blocks the spec** — the guide cannot be written to an
   example that may or may not be in scope.
2. **Can the guide be written before the API contracts are approved?** Either split it — behaviour
   now, operations when the contracts land — or wait for the ADRs. Splitting gets the valuable half
   moving; waiting avoids writing a document that is half-finished by design.
3. **What serves the MCP instructions, given there is no MCP server?** The Markdown page can ship
   alone. The story asks for both, so this may be one story delivered in two parts.
4. **Does story 199 get the same correction in the same change, or its own?** Its "I'm going away"
   example has exactly the same problem, and the two stories are each other's test.
