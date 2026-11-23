# Rung

**An agent-first training log.** You tell your own AI assistant what you lifted. Rung remembers it, coaches from
the history with plain rules, and shows the result on a calm, read-only dashboard.

> **Status: pre-implementation.** This repository holds the product discovery, requirements, decisions and
> research for Rung. **There is no application code yet.** Every document here is a draft awaiting the Owner's
> approval, and the architecture has not been approved. See [Where things stand](#where-things-stand).

Rung is a personal project. It clones the behaviour of [ShredPace](https://shredpace.com), an agent-first training
log, with its own name, wording, design and API. Rung is **not affiliated with ShredPace**.

## How it works

The person training talks to the assistant they already use. The assistant logs each set the moment it is said, and
Rung answers in one line. The text below is illustrative; the real wording is still to be designed.

```text
You:    Back squat, 100 kilos for 5, 5, 5.
Agent:  Logged Back Squat 100 kg × 5. Next: 100 kg × 5, set 2 of 3, rest 3 min.
        ...
You:    That's it for today. Hard, but it felt good.
Agent:  Session saved. Back Squat 100 kg × 5, 5, 5. Next time: 102.5 kg.
```

- **The assistant is the trainer's voice; Rung is its memory and its rulebook.** Rung supplies the data and the
  rules (which weight comes next, when to step back after a stall, how to ease back after a break). The assistant
  supplies the conversation.
- **There is no AI inside Rung.** Every target is deterministic and comes with its reason.
- **The dashboard is read-only for training data.** Wherever a person would otherwise edit something, it shows a
  short sentence to copy to their assistant.
- **Every dashboard feature is also reachable by an assistant,** over MCP or a REST API, using a revocable Key.

## Principles

1. Agent first.
2. Rules, not a model.
3. One short line in the gym.
4. Clone the behaviour, own the identity: ShredPace is the reference for *what* a feature does, never a contract
   for how Rung's API looks.
5. Phased: every ShredPace feature is the destination, and Phase 1 is the first slice that is useful for real
   training.
6. Nothing reaches production unseen: designs, architecture decisions and every production deploy need the
   Owner's approval.

## Phase 1

Phase 1 is **50 of the PRD's 205 user stories**, delivered on the desktop. It is done when the Owner can log a real
leg session through their assistant, see it on the dashboard, and get a next-time weight suggestion.

| Area | What it covers |
|---|---|
| Agent access | Connect with a Key over MCP or REST; Keys stored only as hashes; clear errors |
| Logging a session | Start, resume and end sessions; log sets by speaking; one-line replies; sanity checks on odd sets; fixes and deletes; safe retries |
| Exercises and loading | About 60 starter exercises plus custom ones; load types; bar weight and plate loading |
| Suggestions and progression | Targets with reasons; the next set and rest; double progression and the step-back rule; a finish summary |
| Dashboard | Seven desktop pages (sign in, first sign-in, Today, Sessions, a finished session, Exercises, Settings); light and dark |
| Agent guide and tests | Instructions that make an assistant behave like a trainer, and scripted conversations as acceptance tests |
| Test data | A Sample account (Sam) with about eight weeks of invented history |

The full list, with story numbers, is in [docs/product/mvp-scope.md](docs/product/mvp-scope.md).

**Phase 2** starts with one-click OAuth connectors (so the Claude phone and desktop apps can connect), then undo,
the Keys page, attribution and rate limits. After that, the rest of the ShredPace feature set follows in phases the
Owner orders: plans and programs, check-ins, time away, goals and habits, food, body readings, Insights, endurance,
themes, a PWA, and more. The only things deliberately **not** cloned are billing and ShredPace's brand.

## Stack direction (not yet approved)

The Owner's direction, to be turned into ADRs by the Dev Lead and approved before any dependent work starts:

- Front end on CloudFront and S3, back end on API Gateway and Lambda, Aurora DSQL, Cognito for sign-in
- AWS CDK, so all infrastructure is code
- AWS at or under about $10 a month

Known pressure points already recorded for the proposal: Aurora DSQL has no row-level security, so isolating one
Account's data from another's falls to application code; Cognito has no dynamic client registration, which affects
the OAuth work; and the first set of a session must stay fast after an idle period.

## How it is built

Rung is built by a team of AI agents following the Agentic Development Lifecycle (ADLC), with GitHub as the source
of truth.

| Role | What it does |
|---|---|
| **Owner** (human) | Defines requirements, approves designs, architecture decisions and every production deploy |
| **Design Agent** | Draws design boards and opens PRs; cannot merge |
| **Dev Lead** (Claude Opus) | Owns security, proposes the architecture, merges and deploys; never does the independent review |
| **Builders** (Claude Sonnet) | One per issue, each in its own Git worktree; never merge |
| **Independent Reviewer** (Claude Opus) | Reviews every code PR |

The rules every contributor and agent follows are in [AGENTS.md](AGENTS.md): never push to `main`, infrastructure as
code only, and approval before implementation for both designs and architecture. Roles are in
[docs/agents/team.md](docs/agents/team.md), the workflow and deploy rules in
[docs/agents/workflow.md](docs/agents/workflow.md), and the proposed PR gates (tests pass, UI matches the approved
design, independent review) in [docs/agents/quality-gates.md](docs/agents/quality-gates.md).

## Where things stand

| Item | State |
|---|---|
| Product discovery and 22 recorded decisions | Done, as drafts for review |
| PRD (205 stories) | Draft, brought into line with the decisions |
| Vision, Phase 1 scope, requirements | Draft, awaiting the Owner's review |
| Quality gates and PR checklist | Proposed, awaiting approval |
| Architecture | Direction only; ADRs not yet written |
| Design boards for Rung | None yet |
| Application code, tests, infrastructure | None yet |

## Repository map

| Path | What is in it |
|---|---|
| [`intent.md`](intent.md) | Why this project exists, in the Owner's own words. Wins over everything else |
| [`AGENTS.md`](AGENTS.md) | The always-rules for every agent, and links to the rest |
| [`GLOSSARY.md`](GLOSSARY.md) | The project's vocabulary (Lifter, Agent, Key, Insights, Check-in and so on) |
| [`issues/prd.md`](issues/prd.md) | The PRD: the text of all 205 user stories, tagged by phase |
| [`docs/product/`](docs/product/) | [`vision.md`](docs/product/vision.md), [`mvp-scope.md`](docs/product/mvp-scope.md), [`requirements.md`](docs/product/requirements.md) and the [`decision-log.md`](docs/product/decision-log.md) |
| [`docs/adr/`](docs/adr/) | Accepted architecture decision records |
| [`docs/agents/`](docs/agents/) | Team roles, workflow, quality gates and the PR checklist |
| [`docs/design/`](docs/design/) | Rung's own design boards, once the Design Agent draws them |
| [`docs/architecture/`](docs/architecture/) | The architecture, once the Dev Lead's ADRs are approved |
| [`docs/product/shredpace/`](docs/product/shredpace/) | The reverse-engineered reference for the product being cloned |

## Where to start reading

1. [intent.md](intent.md): why this project exists and what it is for
2. [docs/product/vision.md](docs/product/vision.md): what AI Lift Coach is and where it is going
3. [docs/product/mvp-scope.md](docs/product/mvp-scope.md): exactly what Phase 1 contains
4. [docs/product/decision-log.md](docs/product/decision-log.md): every decision, why it was made, and what is still to confirm
5. [GLOSSARY.md](GLOSSARY.md): the words used throughout
6. [issues/prd.md](issues/prd.md): the detailed stories

If two documents disagree, `intent.md` wins, then the decision log, then the requirements and scope documents, then
the PRD.

## The ShredPace reference

[`docs/product/shredpace/`](docs/product/shredpace/) records what was learned about ShredPace: its features, its
109 API operations, its product rules, what its dashboard shows, and 59 reconstructed screen boards with the
scripts that regenerate them. It is reference material about another product, kept so that Rung's behaviour can be
specified from evidence. Rung's own API shapes, wording and design are its own.

The captured source files (`evidence/`) are not tracked in git. [Its README](docs/product/shredpace/evidence/README.md)
says what is there and how to fetch it again.

## Licence

No licence has been chosen yet.
