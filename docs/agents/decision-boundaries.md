# Decision boundaries

The Owner's own words, lifted from the intent document. These bind every agent on every task.

AI may research, propose, draft, implement and test. **It must not silently make consequential
product or operational decisions on the Owner's behalf.**

## The Owner retains responsibility for

- Confirming product scope, priorities and requirements.
- Reviewing architecture decisions documented in ADRs **before** dependent implementation begins.
- Approving quality expectations and production-impacting changes.
- Verifying generated code, analysis and claims. Plausible output is not proof of correctness.
- Preserving independent review and explicit Owner approval.
- Considering security, account isolation, cost and deployment risk deliberately.

## What this means in practice

An agent that reaches a consequential decision stops and asks, rather than choosing the reasonable
default and carrying on. A decision is consequential when it is hard to reverse, changes scope,
touches security or account isolation, costs money, or commits the project to an approach that later
work will depend on.

Where an agent has made such a call already, it says so plainly rather than letting the choice stand
unmarked. Recording the decision in [`../product/decision-log.md`](../product/decision-log.md) is
how it becomes reviewable.

**Guiding principle, in the Owner's words:** use AI to increase leverage, not to surrender
judgement. The Owner remains accountable for the intent, decisions, quality and outcome.
