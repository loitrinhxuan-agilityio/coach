# AI Lift Coach: vision

> **Status: draft for the Owner's review.** Written on 2026-11-18 from decisions D-001 to D-022 in
> [decision-log.md](decision-log.md). Nothing here is agreed until the Owner approves it. Terms are defined in
> [GLOSSARY.md](../../GLOSSARY.md).

## What AI Lift Coach is

AI Lift Coach is an agent-first training log and dashboard. A Lifter's own AI assistant (their **Agent**) logs each set as
they train and coaches from the history, using rules that AI Lift Coach supplies. The website is a calm, read-only
dashboard that shows the result.

There is no AI inside AI Lift Coach. The coaching is a set of deterministic rules (which weight next, how to ease back after
a break, what a goal's projected date is). The Agent supplies the conversation; AI Lift Coach supplies the rules and the data.

AI Lift Coach is a personal product with its own name, wording, design and API.
[ShredPace](shredpace/README.md) is a research reference for how a feature should behave when it is built, never a
checklist to complete (D-026).

## Why it exists

**The practice is the primary goal and the product is the vehicle** (D-024). The Owner is using AI Lift Coach as a
practice ground for directing, evaluating and governing AI-assisted software work; see [`intent.md`](intent.md).
The product still has to be genuinely useful, or it teaches nothing. The Owner does not mind whether it is ever
public or private, and neither outcome is a goal.

The problem it solves, from the PRD: an assistant forgets between chats, generic workout apps want manual entry
that nobody wants to do with chalk on their hands, and apps that do track well ignore the assistant the person
already talks to. AI Lift Coach gives that assistant a place to put what happens in the gym and a rule engine to coach from it.

AI Lift Coach is built by the Team agents and the Owner following the AI-assisted Development Lifecycle (ADLC).
Getting good at that lifecycle is why the project exists (D-024); the product is how it is proved.

## Who it is for

The Owner, as the only user in Phase 1. More broadly: someone who trains regularly and already talks to an AI
assistant every day, with the Owner as the first example. Nobody else is a goal. Two things come back if anyone
other than the Owner ever holds an Account on a production system: the Terms and Privacy text (D-021) and the
question of data residency (D-012).

## Principles

1. **Agent first.** Everything the dashboard shows is reachable by an Agent. The dashboard is read-only for training
   data and offers a short sentence to copy wherever a Lifter would otherwise edit.
2. **Rules, not a model.** Coaching is deterministic and explainable: every target comes with its reason.
3. **One short line in the gym.** Every logged set returns one line saying what was logged and what is next.
4. **Research reference, own identity.** ShredPace is evidence for how a feature should behave when it is built.
   AI Lift Coach's name, wording, visual design and API shapes are its own (D-013, D-026).
5. **Phase 1 is the only commitment.** It is the slice the Owner can use for real training. Every other feature is
   a candidate, decided once Phase 1 is in daily use (D-026).
6. **Nothing reaches production unseen.** The Owner approves designs, architecture decisions and every production
   deploy (D-016, D-022).

## Candidates beyond Phase 1

**Nothing here is committed** (D-026). These are the features ShredPace has that AI Lift Coach might want, and each
enters a phase only when the Owner pulls it in: sessions and sets beyond the core loop, exercises and load types,
coaching before, during and after, plans, programs and intake, time away and comebacks, goals, habits, benchmarks and
skill ladders, food, body readings and aches, Insights, endurance, activity and undo, consent, one-click OAuth
connectors, the Custom-GPT subset, a docs site, seven themes, an installable web app (PWA) and CSV export.

**Not building:** billing and Free/Pro gating, ShredPace's brand and wording, and everything ShredPace does not have
(native apps, push or email reminders, wearable sync, AI inside the coach, social features, other languages,
medical advice).

## How the research is used

The 2026-11-18 research snapshot is the record of what ShredPace does. It is not a scope commitment (D-026). The
Owner is not sure the exploration found every feature and will keep exploring (D-020); anything new joins the
candidate list above. Nothing is scheduled and nothing runs automatically.

## What success looks like

**Phase 1 is done when the Owner can log a real leg session through their assistant over MCP with a Key, see it on
the desktop dashboard, and get a next-time weight suggestion** (D-004, D-010, D-011). That is the product proof. The
practice succeeds on the terms set out in [`intent.md`](intent.md).

Standing rule for every phase: every merged pull request passes the three quality gates, and the evidence is the
GitHub history. There are no user-count or revenue targets.

## Constraints

- **Where it runs:** AWS, at or under about $10 a month, with infrastructure as code only (D-014).
- **Stack direction (not yet approved):** CloudFront and S3, API Gateway and Lambda, Aurora DSQL, Cognito and AWS
  CDK (D-015). The architecture is decided later by Dev Lead ADRs that the Owner approves (D-022).
- **No data-residency requirement** (D-012).
- **Web first, desktop first,** then phone layouts as an installable web app (E-02, D-008, D-019).
- **Phase 1 is metric only** (kilograms and kilometres).

## Shape of the roadmap

| Phase | What it holds |
|---|---|
| **Phase 1** | 50 stories: the core loop, exercises and loading, suggestions and progression, sign-in, the agent guide, the Sample account and seven desktop pages. See [mvp-scope.md](mvp-scope.md). |
| **Phase 2** | In order: OAuth connectors, undo, the Keys page and revocation, attribution, rate limits (D-011) |
| **Candidates** | Not committed (D-026). In no order: plan, intake and programs; check-ins and readiness; time away; goals, habits and skills; food; body and aches; Insights; endurance; the Progress page; phone layouts as a PWA; themes; docs site; CSV export; sign-up and the public pages |

## Still open

See "Items for the Owner to confirm" in [decision-log.md](decision-log.md). The largest are the identity provider,
the architecture ADRs, and how often production deploys happen.
