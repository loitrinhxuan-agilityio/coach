# Decision log

Product discovery and requirements validation for Rung (called "Coach App" until 2026-11-18; see D-018). Every decision is recorded here with its status.
The PRD ([`issues/prd.md`](../../issues/prd.md)) is a draft and has not been approved; this log is how it gets
validated.

**Statuses**
- **Agreed**: decided by the Owner in this discovery session.
- **Inherited**: accepted by the Owner in the first grilling (2026-11-18) by replying "yes" to recommendations,
  and still **under revalidation**. Nothing in this section changes without the Owner's say-so.
- **Superseded**: replaced by an Agreed decision, with the reason.

## How these documents fit together

| Document | Role | Wins over |
|---|---|---|
| [`intent.md`](../../intent.md) | Why the project exists, in the Owner's own words | Everything below, this log included |
| **This log** | Every decision, with its reason and status | Everything below |
| [requirements.md](requirements.md) and [mvp-scope.md](mvp-scope.md) | What is committed: Phase 1 scope, and the constraints the decisions impose | The PRD |
| [vision.md](vision.md) | Why Rung exists and where it is going | (not a source of requirements) |
| [`issues/prd.md`](../../issues/prd.md) | The text of every user story (205), plus implementation and testing notes | Nothing, until it is brought into line |
| [`GLOSSARY.md`](../../GLOSSARY.md) and [`docs/adr/`](../adr/) | The words, and the hard-to-reverse decisions | (referred to by all of the above) |

## Agreed in this discovery session

| ID | Date | Decision | Why | Affects |
|---|---|---|---|---|
| D-001 *(superseded by D-005)* | 2026-11-18 | **Phase 1 is a thin product slice used by the Owner alone, and its success is measured by ADLC evidence** (issues, design approvals, reviews, gate results), not by user count. Invitees come later. | The PRD is written as a product for lifters, but the repo's real subject is the ADLC team in `AGENTS.md`. A real working core loop makes the ADLC demonstration credible; consent, legal text, sign-up and public hosting teach nothing about ADLC. | I-01 (audience), I-17 / ADR 0002 (multi-account), the whole MVP scope |
| D-002 *(superseded by D-005)* | 2026-11-18 | **Beyond Phase 1, Coach App is for a small circle.** The Owner is persona zero; friends and colleagues who lift and use an AI assistant can be invited later. There is no public launch in the vision. Public becomes a future decision, made only if the ADLC demonstration and the Owner's own use show it is worth the cost. | The PRD's "lifter" is generic and nothing shows anyone besides the Owner. The only evidence about this audience is ShredPace's own marketing, so claiming a public product would be a claim the project cannot support. | I-01, I-17 / ADR 0002, consent and legal work, hosting region, OAuth priority |
| D-003 | 2026-11-18 | **The data model is multi-account from the first migration, following ShredPace.** Phase 1 has no sign-up or invitation flow: Accounts (the Owner and the Sample account) are created by a script. Keys, consent and deletion are per Account. | ShredPace is multi-account (sign-in through AWS Cognito, keys and data per account). Retrofitting accounts into a single-user schema later would touch every table. The Sample account needs a home, and "a Key cannot read another Account's data" is a concrete property for the Independent Reviewer to verify. Owner's words: "Follow the ShredPace app." | I-17 / ADR 0002 (updated), the first migration, the test plan, hosting |
| D-004 *(ADLC half amended by D-005)* | 2026-11-18 | **Phase 1 is done when both proofs exist.** *Product proof:* the Owner logs a real leg session through their assistant (a Key over MCP), sees it on the desktop dashboard, and gets a next-time weight suggestion. *ADLC proof:* the Owner approves a Design Agent board; a Builder PR is made in its own worktree; Gate 1 passes with test output; Gate 2 passes with screenshots on at least one UI issue; the Independent Reviewer approves; the Dev Lead merges and deploys through infrastructure code. Review outcomes are recorded honestly, including any round that asked for changes and any PR that needed none. The evidence is the GitHub history. | D-001 made success an ADLC measure but did not define it. Product proof alone says nothing about the process; ADLC proof alone could be a trivial app. A rejection is not staged: a review that finds nothing is a valid outcome. | MVP scope; quality gates; hosting; design boards |
| D-005 | 2026-11-18 | **The goal is a personal product that clones every ShredPace feature, built with ADLC.** Coach App is for the Owner's own use, for training or for exploration. Whether it is ever public or private does not matter to the Owner and is not a goal either way. ADLC (the Agentic Development Lifecycle) is the method: the rules in `AGENTS.md` apply to every change and every merged PR passes the three gates, but proving ADLC is not an exit test. Work is still phased: all features are the destination, and Phase 1 is the first slice of the clone that the Owner can use for real training (D-004's product proof). | The Owner clarified that "the same way ShredPace does" means cloning all of its features, for personal purposes, and that the goal is the product with ADLC as the method. | Supersedes D-001, D-002 and E-01; amends D-004 (its ADLC half becomes a standing rule); reopens the PRD's reduced tier and Out of Scope list, and I-07 (OAuth) |
| D-006 *(native-apps part amended by D-008)* | 2026-11-18 | **"All features" means everything ShredPace has, except billing and its brand.** *In (later phases):* one-click OAuth connectors (the first item after Phase 1), the Custom-GPT subset (30 operations), the docs site and per-operation reference, seven themes, PWA install (with the phone layouts), CSV export, and endurance with auto-planning, all skill ladders and typical ranges in full (replacing the PRD's "reduced" tier). *Out:* billing and Free/Pro gating (everything behaves as Pro); ShredPace's brand, name, wording, assets and design canvas; and everything ShredPace does not have (native apps, push or email reminders, wearable sync, AI inside the coach, social features, other languages, medical advice). | One user and nobody to charge, so billing has no function. Brand is identity, not a feature. Features the source lacks cannot be cloned; its "emailed recap" and "share recap card" are only "coming soon". | PRD Out of Scope list and "reduced" tier; roadmap; I-07 (ADR 0001 keeps OAuth first after Phase 1) |
| D-007 *(clarified by D-020)* | 2026-11-18 | **The 2026-11-18 snapshot is the committed baseline, and it is a floor, not a ceiling.** Tracking ShredPace is continuous, but anything new or newly discovered goes onto a "to consider" list scheduled **late**: it enters a phase only when the Owner pulls it in. The snapshot's known gaps (the ten unseen items in `review/handoff.md`) go on that list too. | The Owner is not sure the snapshot recorded every feature, and the research agrees: populated screens, the benchmark page, the add-an-agent pages and the 147-board canvas were never seen. Fixing the scope at the snapshot gives the clone a finish line; the late list stops tracking from enlarging the current phase. Fingerprint below. | Roadmap; the "to consider" list; Q7 (how the tracking runs) |
| D-008 *(kind of app settled by D-019)* | 2026-11-18 | **Web first, an app later.** The kind of app (an installable web app like ShredPace's PWA, or a native app) is not decided. | Owner: "web first, app later". Amends D-006, which put native apps out because ShredPace has none. E-02 stands: desktop first, phone layouts in phase 2. | Roadmap; D-006 |
| D-009 | 2026-11-18 | **Phase 1 signs in with email and password and has seven dashboard pages.** *In:* sign in (story 202), first sign-in that replaces the temporary password (203), "Please sign in again" on an expired session (204), change password (205), sign out (192). *Later:* sign-up and the public landing page (stories 1 and 168), Continue with Google, emailed password reset (a script resets the password in Phase 1). *Pages:* Sign in, First sign-in, Today, Sessions, Session (finished), Exercises, Settings (sign out and change password only). Today has four tiles (Volume, Strength, New bests, Time trained), a sentence to copy and today's timeline of sessions. The rail shows Today, Training and Settings. *Taken from the Owner's "ok" as accepting my recommendations on four gaps:* Streak and the "% of 4 h" tile are left out (they need a weekly target from the plan, and how Streak is computed is unverified); there are no separate Before, During and After pages in Phase 1; the body figure is a later phase; the time zone is set by the script and not editable until a later phase. | The PRD had sign-up and sign-out but no sign-in, first sign-in, expiry or password change. ShredPace uses a temporary password for accounts an administrator creates, which fits scripted Accounts (D-003). Which identity provider to use is an architecture decision and is **not made here**. | PRD stories 202–205; the Phase 1 slice; priority 6 (authentication) and 7 (architecture) |
| D-010 *(Phase 2 order amended by D-011)* | 2026-11-18 | **Phase 1 is these 50 stories** (24% of the PRD's 205): 4, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32, 34, 36, 37, 43, 46, 47, 48, 52, 53, 54, 57, 58, 140, 142, 144, 152, 154, 166, 174, 192, 198, 199, 201, 202, 203, 204, 205. It is the core loop (logging a session), exercises and loading, suggestions and progression, the agent guide and its scripted conversations, sign-in and sign-out, the Sample account, and seven desktop dashboard pages. *Not in Phase 1, in this order of Phase 2:* undo (29), the Keys page and revocation (2, 3, 5, 6, 195), attribution (7), rate limits (167), then OAuth (D-006). Everything else in the PRD follows in later phases. | The product proof (D-004) needs only the core loop and suggestions. The Sample account is in because Gate 2 checks screens against approved boards, and the PRD's visual tests cover populated states as well as empty ones; without it the only populated screens would be the Owner's real training data. Undo is the feature the Owner would miss first in daily use, so it opens Phase 2. | `mvp-scope.md`; `/prd-to-issues`; the design boards to be drawn |
| D-011 | 2026-11-18 | **Phase 1's real session is done on a computer, with Claude Code or Cursor sending a Key over MCP.** OAuth is the **first** item of Phase 2, ahead of undo, so phone use follows within one phase. The Phase 2 order is now: OAuth (D-006), then undo (29), the Keys page and revocation (2, 3, 5, 6, 195), attribution (7), rate limits (167). | Claude's phone and desktop apps connect through custom connectors that sign in with OAuth, so a Key-only server cannot be used from them. OAuth is the largest and most security-sensitive item, about five stories plus an authorization server, and it depends on the identity-provider choice, which is not yet made. Phase 1 is already 50 stories. ADR 0001 already says OAuth is the first item after v1; this removes the conflict with D-010's order. | D-010 (order amended); I-07 / ADR 0001 (confirmed, unchanged); Phase 2 plan |
| D-012 | 2026-11-18 | **There is no data-residency requirement.** Coach App is a personal training tool, and the Owner has no legal or policy reason to pin data to a region. Hosting may use any region, chosen in the architecture step. **Revisit if anyone other than the Owner holds an Account on a production system**, since another person's data may bring rules of their own. | Options were a hard EU requirement, a preference, or none; the Owner chose none. The PRD's "must keep personal data in the EU" was my assumption from the brief and ShredPace's sign-in region, not a verified ShredPace promise. | PRD Implementation Decisions, Assumptions and Open question 2 (to be edited); priority 7 (hosting and database) |
| D-013 | 2026-11-18 | **Coach App has its own API: the same capabilities as ShredPace, designed in our own shapes.** Operation names, paths, fields and error bodies are ours. ShredPace's `openapi.json` and agent guide are references for *what* an operation must do (its rules, limits and edge cases), not a contract to copy, and nothing written for ShredPace's API is expected to work against ours. The Dev Lead proposes the Phase 1 contracts (about 25 operations); the Owner approves them before implementation. | The Owner chose "our own API, same capabilities" over wire compatibility. This keeps Coach App's identity separate, avoids inheriting ShredPace's quirks, and avoids tying the API to a changing snapshot (D-007), at the cost of designing about 25 contracts instead of transcribing them. | PRD module 14 (operation registry) and API contracts; contract tests; the agent guide (D-010); Phase 1 issues |
| D-014 | 2026-11-18 | **Constraints for the architecture, not the architecture itself.** The monthly running cost of Phase 1 stays at or under **about $10**. The Owner plans to use **AWS**. Everything is infrastructure as code (`AGENTS.md`). The detailed architecture is decided later: the Dev Lead proposes it within these constraints and the Owner approves it before anything is built. The proposal must show a monthly cost per component and how idle latency is handled, since a slow first request would hurt the logging loop. | The Owner chose a ceiling of about $10 and named AWS. A near-zero ceiling would put the service to sleep and add delay to the first set of a session. Some AWS building blocks can exceed $10 a month by themselves, such as load balancers, NAT gateways and always-on database clusters; the Dev Lead must verify current prices and say so. | priority 7 (architecture); the hosting dependency in D-004; Dev Lead's proposal |
| D-015 | 2026-11-18 | **The Owner's intended stack (a direction, not yet an approved architecture).** Front end: CloudFront and S3, with no server-side rendering, built and deployed with AWS CDK. Back end: API Gateway and Lambda. Database: Aurora DSQL. Sign-in: Cognito, email and password with Google linked. Infrastructure as code: AWS CDK. The agent deploys to production and the Owner does not use the console. Lambda rather than ECS, so nothing is paid while idle. The Owner's own listed trade-offs: no SSR, Lambda cold starts, a 15-minute Lambda timeout, a 30-second API Gateway timeout. The detailed architecture stays a later Dev Lead proposal for the Owner's approval, and the ADR is written then. | Provided by the Owner as input to the interview. It is consistent with D-014 (AWS, about $10 a month) and D-009 (Cognito's admin-created users start with a temporary password). The research below shows it puts pressure on D-011, ADR 0002 and the latency goal. | D-011, D-014, ADR 0002, D-009; `AGENTS.md` (the "Lambda, not ECS" rule is **not currently in it**); Dev Lead's proposal |
| D-016 | 2026-11-18 | **Every production deploy needs the Owner's approval.** The Dev Lead agent carries out the deploy, but only after the Owner has approved that specific change, shown as the infrastructure diff, never as a blanket approval. This applies to stateless and stateful changes alike. The deploy proposal must not rely on long-lived deploy credentials stored in the repository or on a laptop. How often deploys happen (per merge or batched per release) is not decided. | The Owner chose the strictest of three options (fully automatic, approval only for stateful changes, approval for every deploy). Under the ADLC rules the Owner approves designs and not code PRs, so without this nobody but the Dev Lead agent would see a change before it reaches production, where the Owner's real training data will live. An infrastructure change can replace a stateful resource and lose data. | D-004 (its deploy step), D-015; `docs/agents/team.md` and `workflow.md`; the Dev Lead's deploy process |
| D-017 | 2026-11-18 | **The final product name is chosen before the first design board is submitted for approval.** "Coach App" stays the working title until then. The name is kept in one configuration value and one wordmark asset, so a rename is a single change. Trademark and domain checks are the Owner's. | The name appears on every design board, in the MCP server's name inside the assistant, and in the agent guide; renaming after approval costs rework. The API contracts and the architecture proposal do not show the name, so they can start first. | Design boards; PRD open question 1; the agent guide |
| D-018 | 2026-11-18 | **The product is called Rung.** It replaces the working title "Coach App" in `GLOSSARY.md`, `AGENTS.md`, ADR 0001, `issues/prd.md` and the ShredPace reference README. Earlier entries in this log still say "Coach App" because they record what was decided at the time. "Rung" names the product and nothing else: a step on a skill ladder is a step. The repository and its GitHub remote keep the name `coach`. The name lives in one configuration value and one wordmark asset (D-017). Trademark, domain and store checks are still the Owner's; a quick search found no app with this exact name, which is weak evidence only. | The Owner chose it from the candidates after a collision check. It echoes progression and the skill ladders, and it is short enough to serve as an MCP server name. Heft, Cairn and Spotter were rejected because strength apps already use them. | PRD open question 1 (settled); design boards (the wordmark); the agent guide; the MCP server name |
| D-019 | 2026-11-18 | **The "app" in D-008 is an installable web app (a PWA), like ShredPace's.** It is the same code as the web dashboard, installed to the home screen, and arrives with the phone layouts in phase 2 (D-006). A native iPhone or Android app is not planned; it is reconsidered only if a concrete need that a PWA cannot meet is named (for example a home-screen widget, an Apple Watch view, or offline use). | ShredPace ships a PWA, not a native app. A native app would be a second codebase outside the CloudFront, S3 and Lambda stack (D-015), and Apple's developer programme (about $99 a year, to be verified) would use most of the $10 monthly ceiling (D-014). Rung's design is agent-first with a read-only dashboard, so a native app would add little beyond what the assistant's own app already does. | D-008 (kind of app settled); D-006 (PWA); the phase 2 plan |
| D-020 *(clarifies D-007, and settles Q7)* | 2026-11-18 | **"Tracking" means the Owner keeps exploring ShredPace later, and applies any features found.** It is not an automatic watch on ShredPace for changes: nothing is scheduled, and no job runs. The Owner is not sure the REA exploration found every feature, so they will explore again with REA when they choose. Anything found goes onto the "to consider" list (scheduled late, D-007) and is added to the PRD as new stories if the Owner decides it belongs. The existing resume point is `docs/product/shredpace/review/handoff.md`, which lists the ten items not yet seen and how to resume. The baseline hashes stay in this log as an optional check of whether ShredPace itself has changed. | The Owner's words: unsure whether all of ShredPace's features were explored via REA, so they will continue exploring later and apply more features if there are any. This is owner-driven, so there is nothing to build or host (D-014). | D-007; the "to consider" list; `review/handoff.md`; `requirements.md` |
| D-021 | 2026-11-18 | **Legal text is split.** The Terms, the Privacy policy and the pages that carry them (stories 168–172) wait until anyone other than the Owner holds an Account on a production system (the same trigger as D-012). The in-app **consent wording** for health data is written when the first health-data feature (check-ins, body readings, food or aches) enters a phase, because the consent gate is part of the clone (D-006) even with one user. The agents draft any wording in Rung's own words, never ShredPace's, and the Owner approves it. None of it is legal advice; if others ever hold Accounts a qualified person should review it. | None of the 50 Phase 1 stories needs a legal page or a consent step, and Phase 1 holds no health data. The two kinds of text exist for different reasons: Terms and Privacy are for other people, while the consent page is a feature that stops an agent writing health data without the Owner's agreement. | PRD open question 3 (settled); stories 155–160 and 168–172; D-012 |
| D-022 | 2026-11-18 | **Architecture decisions are approved through ADRs.** The Dev Lead writes one ADR for each decision that is hard to reverse, surprising without context, and a real trade-off, as a pull request. The Independent Reviewer reviews it and the Owner approves it **before any issue that depends on it starts**. Everything else the Dev Lead decides within the approved ADRs and records in the PR. The rule "Architecture approval is required before implementation" is added to `AGENTS.md`. The first ADRs the Dev Lead is asked for: hosting and the data store (with a monthly cost per component), sign-in and how a person and an Agent's Key are each authorised, how one Account's data is kept apart without row-level security, the Phase 1 API contracts, and the production deploy process. | Nothing in `team.md` or `AGENTS.md` said how an architecture proposal is approved. The ADR test already in use (hard to reverse, surprising, a real trade-off) limits the Owner's approvals to the few decisions that can hurt. It reuses the design-approval process and leaves a record in GitHub. | `AGENTS.md` (one line added); D-013, D-014, D-015, D-016; Phase 1 issue order |

### Dependencies created by D-004 (not scope)

- The Owner must approve `docs/agents/quality-gates.md` and `docs/agents/pr-checklist.md`; both are still "proposed".
- Hosting and the database must be decided before the deploy criterion can be met (`infra/` is empty). This is an open architecture decision and is not made here.
- Gate 2 needs a Coach design board in `docs/design/`; none exists yet.

### Baseline fingerprint (D-007)

Captured 2026-11-17 and 2026-11-18 from <https://shredpace.com>. 109 API operations, 19 changelog entries
(2 October to 17 November 2026). The files themselves are in `docs/product/shredpace/evidence/`, which git
ignores, so these hashes are how a re-fetch is compared with the snapshot.

| File | sha256 |
|---|---|
| `openapi.json` | `e329e0cba03ef3cbcc7bba2ab7ef71df60c68e5d9a9c2260e66ac14cbf062617` |
| `llms.txt` | `39b78f94412a83f54c3fa414fec996466529870941dfa5eba86a68ed7c99c5c4` |
| `skill.md` | `8d87a48032369cec85ceb2070db6219624cef524d473d1440a6e0ea7a34e213c` |
| `changelog.md` | `f2e94ce5ce4ce496590180537898569654dd70ef34c5bfe9866d9040ecd04f2b` |

## Notes for the Dev Lead's architecture proposal (from the grilling, 2026-11-18)

Facts found while checking the Owner's stack (D-015). None of this changes a decision; it is what the proposal must address. Dated, web-sourced and to be re-verified against current AWS pages.

- **Aurora DSQL has no row-level security** (the official SQL-support page says so, and a January 2026 test agreed; unconfirmed for November 2026). Account isolation under ADR 0002 would be enforced in application code only, so every query must be scoped to its Account and the Independent Reviewer must check that. The proposal should say how an unscoped query is made impossible.
- **Aurora DSQL uses optimistic concurrency.** A conflict is reported at commit as a serialization error, and the application must retry. This reinforces the PRD's idempotency rule (story 28) and favours append-only writes for sets.
- **Per-transaction limits:** 3,000 rows and 10 MiB of writes, 5 minutes per transaction, and connections last at most 60 minutes. Seeding the Sample account and deleting an Account's data must be batched.
- **Not supported:** temporary tables and PL/pgSQL, so rules live in application code, as the PRD already assumes. The docs now say foreign keys are supported; an older page said otherwise, so the proposal should check the current page.
- **Cost:** pay per use with scale to zero, and a free tier of the first 100,000 DPUs and 1 GB a month. That fits the $10 ceiling (D-014), but how many DPUs a personal log uses is unknown and should be measured in Phase 1.
- **Idle latency is not documented for DSQL.** Lambda cold starts add to it. D-014 requires the proposal to show how the first set of a session stays fast.
- **Cognito has no dynamic client registration,** which MCP-style connectors normally expect. Workarounds are a pre-registered app client or a registration proxy, and Claude's connector settings do have fields for a client ID and secret. This makes D-011's OAuth item (first in Phase 2) larger and riskier than "about five stories" and must be verified with a real connector early.
- **Two kinds of caller on one API:** the dashboard (a signed-in person) and agents (Keys). The proposal must say how each is authorised.
- **"The agent deploys to production"** (D-015) needs a decision on credentials and approval; see the next question in the log.

## Inherited from the first grilling, under revalidation

| ID | Decision | Source | Status |
|---|---|---|---|
| I-01 | v1 is for the Owner plus a few invited people; no public sign-up | PRD decisions table | **Superseded by D-001 and D-002**: Phase 1 is the Owner alone; invitees are a later, small circle. |
| I-02 | Stall: four sessions without a better top set while effort rises or reaches 9; one named constant | PRD module 9 | Inherited |
| I-03 | The weekly-checks module is called **Insights** (not "Coach") | `GLOSSARY.md` | Inherited |
| I-04 | **Check-in** means only the pre-session readiness question; the week-after one is the **First-week review** | `GLOSSARY.md` | Inherited |
| I-05 | Notes are split into **Standing note**, **Session note** and **Exercise cue** | `GLOSSARY.md` | Inherited |
| I-06 | **Lifter** / **Agent** / **Account** / **Key**; the build team is **Team agents**; **Owner** is reserved for the product owner | `GLOSSARY.md` | Inherited |
| I-07 | Agents connect with a Key only; OAuth is the first item after v1 | ADR 0001 | **Confirmed by D-011.** Consequence: no claude.ai or Claude Desktop connector in Phase 1; OAuth is the first item of Phase 2 |
| I-08 | First slice is the core loop on desktop | PRD Build order | Inherited. Needs reconciling with the Phase 1 MVP scope |
| I-09 | Metric units only (kg, km) | PRD | Inherited |
| I-10 | Our own starter exercise list of about 60, in a JSON seed file | PRD | Inherited |
| I-11 | A Sample account of about eight weeks of history | PRD story 201 | Inherited |
| I-12 | The Design Agent restyles the 29 redrawn desktop boards, approved one area at a time | PRD Interface decisions | Inherited |
| I-13 | An agent guide is a v1 deliverable, tested by scripted conversations | PRD stories 198, 199 | Inherited |
| I-14 | Insights are computed when asked; no scheduler, email or push in v1 | PRD Architectural decisions | Inherited |
| I-15 | "Fix it by hand" (story 150) is phase 2 | PRD | Inherited |
| I-16 | A Week runs Monday to Sunday in one time zone per Account | PRD story 200 | Inherited |
| I-17 | The data model is multi-account from the first migration | ADR 0002 | **Confirmed by D-003** (Owner: "Follow the ShredPace app"). ADR 0002's wording was updated from "invite-only" to "Accounts created by script". |

## Decisions made earlier by the Owner, outside the grilling

| ID | Decision | Status |
|---|---|---|
| E-01 | Coach App is a smaller copy of ShredPace with every major feature cloned in full | **Superseded by D-005**: now every feature, not only the major ones |
| E-02 | Desktop first; phone layouts are phase 2 | Stands |
| E-03 | Never push to `main`; infrastructure as code only; design approval before implementation | Stands (`AGENTS.md`) |

## Owner clarifications

| Date | What the Owner said | Effect (proposed, not yet applied) |
|---|---|---|
| 2026-11-18 | "ADLC is agentic development lifecycle I intend to follow. But the goal is to build a coach application the same way ShredPace does." | The **goal is the product**; ADLC is the **method**. This contradicts D-001's ranking (success measured by ADLC evidence) and the ADLC half of D-004 (proof of every gate as an exit test). **Resolved as D-005.** The AGENTS.md expansion was corrected to "Agentic Development Lifecycle" and ADLC added to `GLOSSARY.md`. |

## Pending: edits caused by decisions above

**Done on 2026-11-18, with the Owner's yes:** `issues/prd.md` was brought into line with the decisions. The "smaller
copy" wording, the EU-residency lines, the "reduced" tier, the old Out of Scope list, the first-grilling decisions
table and the open questions were replaced or reduced to pointers (D-005, D-006, D-012, D-018, D-019, D-021). Each
story is tagged **[Phase 1]** (50) or **[Phase 2]** (8). Stories 202–205 were added, and stories 1 and 168 are marked
"later phase" (D-009).

**Also done:** `docs/agents/team.md` and `workflow.md` now state that every production deploy needs the Owner's
approval of the specific infrastructure change (D-016), with a new "Deploying" section in `workflow.md`.

**Still pending:**
- Wording: E-02 and D-019 say "phase 2" for phone layouts. That predates the numbered phases (D-011 made Phase 2
  start with OAuth). Read it as "a later phase, after desktop"; the vision, requirements and PRD say "later phase".
- OAuth connectors need user stories written; the PRD has none.

## Interview status

All eight priority topics have been worked through, and the four deliverables are drafted for the Owner's review:
[vision.md](vision.md), [mvp-scope.md](mvp-scope.md), [requirements.md](requirements.md) and this log. None of them
is agreed until the Owner approves it.

1. ~~Product vision and who it is for~~ (D-005, D-018)
2. ~~Single-user versus multi-account~~ (D-003)
3. ~~MVP scope and feature priorities~~ (D-010, D-011)
4. ~~Agent-first REST and MCP workflows~~ (D-011, D-013)
5. ~~Dashboard scope and desktop-first design~~ (D-009)
6. ~~Security, authentication, consent~~ (D-009, D-012, D-016, D-021). The identity provider is an architecture ADR (D-022).
7. ~~Architecture and infrastructure constraints~~ (D-014, D-015, D-016, D-022)
8. ~~Open business and product rules~~ (D-017 to D-021)

## Items for the Owner to confirm in review

**A. Inherited decisions that were accepted by "yes" in the first grilling and never re-validated since.** They
stand until the Owner changes them.

| ID | Decision |
|---|---|
| I-02 | Stall: four sessions without a better top set while effort rises or reaches 9, as one named constant |
| I-03 to I-06 | The vocabulary in `GLOSSARY.md` (Insights, Check-in and First-week review, the three kinds of note, Lifter, Agent, Account, Key, Owner, Team agents) |
| I-09 | Metric units only in Phase 1 |
| I-10 | Rung's own starter exercise list of about 60 |
| I-12 | The Design Agent restyles the 29 redrawn desktop boards, approved one area at a time |
| I-13 | The agent guide is a Phase 1 deliverable (also covered by D-010) |
| I-14 | Insights are computed when asked; no scheduler, email or push |
| I-15 | "Fix it by hand" (story 150) is a later phase |
| I-16 | A Week runs Monday to Sunday in one time zone per Account |

I-07, I-11 and I-17 were confirmed this session (D-011, D-010, D-003). I-01 and I-08 were superseded or reconciled.

**B. Assumptions in [mvp-scope.md](mvp-scope.md)** that were my recommendations and have not been individually
confirmed: reword the examples in stories 198 and 199; targets are for the exercises named at session start;
default 20 kg bar and standard plates; standing notes empty until built; **and add story 200 (the Week), making
Phase 1 51 stories.**

**C. Actions waiting on the Owner.**
- Approve `docs/agents/quality-gates.md` and `docs/agents/pr-checklist.md` (both still "proposed").
- Approve the PRD edits listed under "Pending" above, then run `/prd-to-issues`.
- OAuth connectors need user stories written; the PRD has none.

**D. Open questions, deliberately left to the Dev Lead's ADRs or to later planning:** the identity provider; how often
production deploys happen and how each approval is recorded; the language and framework; whether a staging
environment exists; a numeric latency target for the first set of a session; the order of the later phases.
