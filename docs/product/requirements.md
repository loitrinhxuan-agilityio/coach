# Rung: requirements

> **Status: draft for the Owner's review.** Written on 2026-11-18 from [decision-log.md](decision-log.md)
> (D-001 to D-022). The full text of every user story lives in [`issues/prd.md`](../../issues/prd.md) (205
> stories), which is also a draft. This document does not repeat the stories. It states the scope by phase, the
> constraints and non-functional requirements that the decisions impose, and what is deliberately left open.
> Terms are defined in [GLOSSARY.md](../../GLOSSARY.md). Nothing here is agreed until the Owner approves it.
>
> **Precedence.** If this document disagrees with the decision log, the decision log wins. If it disagrees with the PRD,
> this document wins until the PRD is brought into line.

## 1. Scope by phase

The phases and what is in each are defined once: Phase 1 in [mvp-scope.md](mvp-scope.md), and the order after it
(D-011) in [vision.md](vision.md). This document does not repeat them.

The PRD's 205 stories are 50 in Phase 1, 8 in Phase 2 (plus OAuth, which still needs stories written), and 147
in later phases. If the Owner accepts assumption 5 in [mvp-scope.md](mvp-scope.md), Phase 1 becomes 51 and later 146.

### The functional areas of the destination

Every area below is part of the destination (D-006). The area is cloned from ShredPace's behaviour, in Rung's own
shapes and wording.

| Area | PRD stories | Phase |
|---|---|---|
| Account and agents | 1–11, 195 | Phase 1 has 4, 9, 10, 11; the rest are Phase 2 or later |
| Sessions and sets: the core loop | 12–30 | Phase 1 except 29 (undo, Phase 2) and 30 |
| Exercises, load types, bar and gyms | 31–43 | Phase 1 has 31, 32, 34, 36, 37, 43; gyms and the rest are later |
| Coaching: before, during and after | 44–63 | Phase 1 has 46–48, 52–54, 57, 58; check-ins, warm-ups, first week and retests are later |
| Plan, intake and programs | 64–78 | Later |
| Time away, missed days and coming back | 79–88 | Later |
| Goals, habits, benchmarks and skills | 89–101 | Later |
| Food | 102–115 | Later |
| Body, metrics and aches | 116–129 | Later |
| Insights | 130–135 | Later |
| Endurance | 136–139 | Later |
| The dashboard | 140–154, 168–197 | Phase 1 has 140, 142, 144, 152, 154, 174, 192; the rest are later |
| Privacy, consent and trust | 155–167 | Phase 1 has 166 (clear errors). Consent and legal text are deferred (D-021); rate limits (167) are Phase 2. |
| Agent guide, tests and test data | 198–201 | Phase 1 has 198, 199, 201. Story 200 (the Week) is needed by the "this week" tiles and is proposed for Phase 1; see assumption 5 in [mvp-scope.md](mvp-scope.md). |
| Signing in | 202–205 | Phase 1 |

## 2. Product constraints

| # | Requirement | Decision |
|---|---|---|
| R1 | Rung has no AI inside. Coaching is deterministic rules, and every target comes with its reason. | PRD |
| R2 | An Agent can do everything the dashboard shows. The dashboard is read-only for training data. | PRD, D-009 |
| R3 | Every logged set returns one short line. | PRD story 15 |
| R4 | Rung has its own name, wording, visual design and **API shapes**. ShredPace's API is a reference for what an operation does, never a contract to copy. | D-006, D-013, D-018 |
| R5 | Weights are stored in kilograms. Phase 1 accepts and shows kilograms and kilometres only. | PRD, D-010 |
| R6 | A Week runs Monday to Sunday in one time zone per Account. In Phase 1 the script sets the time zone. | PRD story 200, D-009 |
| R7 | Insights, the recap and the morning check are computed when asked. No scheduler, email or push in v1. | PRD |
| R8 | Phase 1 is desktop only. Phone layouts come later as a PWA. | E-02, D-019 |

## 3. Interfaces

| # | Requirement | Decision |
|---|---|---|
| I1 | An Agent connects with a **Key** over MCP or REST. There is no OAuth in Phase 1. | D-011, ADR 0001 |
| I2 | OAuth connectors are the first item of Phase 2, so the Claude phone and desktop apps can connect. The identity provider (Cognito has no dynamic client registration) is a risk to verify early. | D-011, D-015 |
| I3 | Rung ships an **agent guide** (MCP server instructions plus a Markdown page), written in its own words. | D-010, story 198 |
| I4 | Scripted conversations run against a real assistant as acceptance tests. | story 199 |
| I5 | The Dev Lead proposes the Phase 1 API contracts (about 25 operations) and the Owner approves them before implementation. | D-013, D-022 |

## 4. Security and data

| # | Requirement | Decision |
|---|---|---|
| S1 | Keys are stored only as hashes. A Key cannot manage Keys, export data, delete the Account or give consent. | PRD stories 10, 11 |
| S2 | The data model is multi-account from the first migration. Accounts (the Owner and Sam) are created by a script. No sign-up in Phase 1. | D-003, ADR 0002 |
| S3 | An Account's data is kept apart from every other Account's. **The planned database has no row-level security**, so isolation is enforced in application code, every query is scoped, and the Independent Reviewer checks it. The ADR must say how an unscoped query is made impossible. | ADR 0002, D-015 notes |
| S4 | A retry never records the same set twice (idempotent creates). | story 28 |
| S5 | Sign in with email and password. First sign-in replaces a temporary password. An expired session says "Please sign in again". Passwords can be changed. | D-009, stories 202–205 |
| S6 | The identity provider and how a person and an Agent's Key are each authorised are architecture decisions, not made here. | D-022 |
| S7 | No health data is stored in Phase 1, so there is no consent gate in Phase 1. The consent wording is written when the first health-data feature enters a phase. | D-021 |
| S8 | There is no data-residency requirement. Revisit if anyone other than the Owner holds an Account on production. | D-012 |
| S9 | Terms and Privacy pages wait until anyone other than the Owner holds an Account. | D-021 |

## 5. Platform, cost and delivery

| # | Requirement | Decision |
|---|---|---|
| P1 | Runs on AWS. Running cost stays at or under about **$10 a month**. The proposal shows a monthly cost per component. | D-014 |
| P2 | Infrastructure is code only. | `AGENTS.md` |
| P3 | **Direction (not approved):** CloudFront and S3, API Gateway and Lambda, Aurora DSQL, Cognito, AWS CDK. | D-015 |
| P4 | The first set of a session must not feel slow after an idle period. The proposal says how idle latency is handled. No numeric target is set yet. | D-014 |
| P5 | The Dev Lead deploys, but **every production deploy needs the Owner's approval** of the specific infrastructure change. No long-lived deploy credentials stored in the repository or on a laptop. | D-016 |
| P6 | Architecture decisions that are hard to reverse, surprising and a real trade-off are written as ADRs and approved by the Owner **before** any dependent issue starts. | D-022, `AGENTS.md` |
| P7 | Aurora DSQL constraints the ADRs must address: optimistic concurrency with retries; 3,000 rows and 10 MiB per write transaction; 60-minute connection life. Seeding the Sample account and deleting an Account's data must be batched. | D-015 notes |

## 6. Process and quality

| # | Requirement | Decision |
|---|---|---|
| Q1 | Never push to `main`. Designs and architecture need the Owner's approval before implementation. | `AGENTS.md`, D-022 |
| Q2 | Every code PR passes three gates (tests pass, UI matches the approved design, independent review). **The gates are still "proposed".** | `docs/agents/quality-gates.md` |
| Q3 | Pure rule modules are tested with table-driven cases, operations with contract tests, and conversations with the scripted scenarios. UI is checked in empty and populated states, which is why the Sample account is in Phase 1. | PRD Testing Decisions, D-010 |
| Q4 | The Design Agent restyles the 29 redrawn desktop ShredPace boards in Rung's identity, with one design that follows the device's light or dark mode, and submits them for approval one area at a time. | PRD, I-12 |
| Q5 | Review outcomes are recorded honestly. | D-004 |

## 7. Out of scope

Billing and Free/Pro gating; ShredPace's brand, name, wording, assets and design canvas; and everything ShredPace
does not have: native apps, push or email reminders, wearable sync, AI inside the coach, social features, other
languages and medical advice (D-006, D-019). Pounds and miles, "fix it by hand", and a public launch are not in
Phase 1.

## 8. To consider later

Anything the Owner finds by exploring ShredPace again goes here and is scheduled late (D-007, D-020). It starts with
the ten items not yet seen, listed with exact instructions in
[`shredpace/review/handoff.md`](shredpace/review/handoff.md): the trend and second-week states, Coach insights with
data, the benchmark page, time away, missed day and comeback states, a brand-new account's first Today, phone
screenshots and the other themes. The PRD also marks several features as the later reduced tier (full endurance,
all skill ladders, typical ranges).

## 9. Open requirements questions

1. The identity provider and the two ways of authorising a request (S6).
2. How often production deploys happen, and how the Owner's approval of each one is recorded (P5).
3. The language, framework and whether a staging environment exists. These are for the Dev Lead's ADRs.
4. A numeric latency target for the first set of a session (P4).
5. The order of the later phases.
6. The four assumptions listed in [mvp-scope.md](mvp-scope.md).
7. PRD edits that the decisions now require (listed in decision-log.md under "Pending").
