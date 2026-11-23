# AI Lift Coach: Phase 1 scope

> **Status: draft for the Owner's review.** Written on 2026-11-18 from decisions D-004, D-009, D-010, D-011,
> D-013 to D-016 and D-022 in [decision-log.md](decision-log.md). Story numbers refer to
> [`issues/prd.md`](../../issues/prd.md), which holds the full text of each story. Nothing here is agreed until the
> Owner approves it.
>
> **Precedence.** If this document disagrees with the decision log, the decision log wins. If it disagrees with the PRD,
> this document wins until the PRD is brought into line.

## Definition of done

Phase 1 is done when **both** are true (D-004, amended by D-005):

- **Product proof.** The Owner logs a real leg session through their assistant, using Claude Code or Cursor with a
  Key over MCP (D-011), sees it on the desktop dashboard, and gets a next-time weight suggestion.
- **Standing rules held.** Every merged pull request passed the three quality gates, was independently reviewed,
  and every production deploy was approved by the Owner (D-016). Review outcomes are recorded honestly, including
  any round that asked for changes and any PR that needed none. The evidence is the GitHub history.

## What is in: 50 stories, 26 features

| # | Feature | What it does | Stories |
|---|---|---|---|
| | **Agent access** | | |
| 1 | Connect by Key | An Agent connects over MCP or REST with a Key. Accounts and Keys are made by a script (D-003). | 4 |
| 2 | "Who am I" call | One call returns the Account, its settings and standing notes | 9 |
| 3 | Key safety | Keys stored only as hashes. A Key cannot manage Keys, export data, delete the Account or give consent. | 10, 11 |
| 4 | Clear errors | Every bad request returns the fix in one sentence | 166 |
| | **Logging a session** | | |
| 5 | Session lifecycle | Start only when the Lifter says they are at the gym. Resume today's open session, end a stale one first, end a long-open one where it stopped. | 12, 13, 26 |
| 6 | Log by speaking | "Squat 100 kg for 5, 5, 5" logs each set. Natural names, "again"/"same", per-side weights, effort words, a warm-up flag only when said. | 14, 16, 17, 19, 21, 22 |
| 7 | One-line replies | Each set returns one line: what was logged and what is next, with a new best in the same line | 15, 27 |
| 8 | Sanity checks | A set that looks wrong is held with one question. A barbell weight lighter than the bar is caught. | 18, 20 |
| 9 | Corrections | Fix or delete any set, delete a session | 23 |
| 10 | End of session | Two ratings (how hard, how it felt) and a session note | 24, 25 |
| 11 | Safe retries | A retry after a timeout never logs the same set twice | 28 |
| | **Exercises and loading** | | |
| 12 | Catalogue | AI Lift Coach's own starter list of about 60 exercises, plus custom exercises | 31, 32 |
| 13 | Load types | Each lift knows what its number means (barbell total, dumbbell per hand, assistance, and so on) | 34 |
| 14 | Bar and plates | Bar weight asked once with its scope. Barbell targets loadable with the plates, never below the bar, plates per side shown. | 36, 37 |
| | **Suggestions and progression** | | |
| 15 | Exercise history | Top set, volume and estimated one-rep maximum per lift | 43 |
| 16 | Targets and next set | Today's targets with the reason. The next set, its plates and rest, adjusted when the last set was harder than planned. | 46, 47, 48 |
| 17 | Progression rules | Build on the heaviest weight where the rep range was reached. Raise weight only when every working set hit the top. Step back about 10% after two short sessions. | 52, 53, 54 |
| 18 | Finish summary | Plan against done, records, what to do next time. A record celebrated once. | 57, 58 |
| | **Dashboard (desktop, read-only)** | | |
| 19 | Read-only, with sentences to copy | Nothing is edited on the page. Empty screens say what to tell the Agent. | 142, 152 |
| 20 | Today page | Follows where the Lifter is: before, during or after training | 140 |
| 21 | Training area | Sessions list, exercises list and a finished-session page showing every set against last time and the all-time best | 144, 174 |
| 22 | Light and dark | One look that follows the device | 154 |
| | **Signing in** | | |
| 23 | Sign-in and sign-out | Sign in with email and password. Replace the temporary password at first sign-in. "Please sign in again" on expiry. Change password. Sign out. | 192, 202, 203, 204, 205 |
| | **Agent guide and tests** | | |
| 24 | The guide | MCP server instructions plus a Markdown page that tells the Agent how to behave | 198 |
| 25 | Scripted conversations | Acceptance tests run against a real assistant | 199 |
| | **Test data** | | |
| 26 | Sample account | An Account named Sam with about eight weeks of invented history (a stalled lift, a missed day, an away period, a few scans), for tests, design boards and demos | 201 |

**Also in the slice, not as stories:**
- About 25 API operations, in AI Lift Coach's own shapes (D-013). ShredPace has 109 in total, and its capabilities are the
  reference for what each must do.
- Five of the PRD's 15 rule modules: the progression engine (in part), load calculator, set sanity checker,
  conversation formatter and operation registry.
- No consent gate, since Phase 1 holds no health data (D-021).

## The seven dashboard pages (D-009)

| Page | Contents |
|---|---|
| Sign in | Email and password |
| First sign-in | Replace the temporary password |
| Today | Greeting, a sentence to copy, four tiles (Volume, Strength, New bests, Time trained), today's timeline of sessions, empty states |
| Sessions | Sessions listed by week. No filters, no plan bar. |
| Session (finished) | Every set against last time and the all-time best (story 174) |
| Exercises | The list, and one exercise's history (story 43) |
| Settings | Sign out and change password only |

The left rail shows Today, Training and Settings. The Account's time zone is set by the script and is not editable
in the app in Phase 1.

## What is out, and the order that follows

**Phase 2, in this order** (D-011): OAuth connectors, undo (29), the Keys page and revocation (2, 3, 5, 6, 195),
attribution (7), rate limits (167).

**Later, not yet ordered:** plans, intake and programs; check-ins and readiness; time away and comebacks; goals,
habits, benchmarks and skill ladders; food; body readings, metrics and aches; Insights; endurance; the Progress
page; the activity feed; phone layouts as a PWA; seven themes; the docs site; the Custom-GPT subset; CSV export;
sign-up and the public landing page; Continue with Google; emailed password reset; Terms and Privacy pages; the
consent wording (with the first health-data feature). Also out of Phase 1 by decision: Streak and the "% of 4 h"
tile, separate Before, During and After pages, and the body figure.

## Before Phase 1 can start

| Needed | State |
|---|---|
| The Owner approves the quality gates and the PR checklist (`docs/agents/quality-gates.md`, `pr-checklist.md`) | **Open.** Both are still "proposed". |
| The architecture ADRs are approved (D-022): hosting and data store, sign-in and authorisation, Account isolation, API contracts, deploy process | **Open.** The Dev Lead writes them; the Owner approves. |
| The first AI Lift Coach design board is approved | **Open.** None exists yet. |
| The product name is chosen (D-017) | **Done.** AI Lift Coach (D-023, superseding D-018's "Rung"). |
| `AGENTS.md` carries the architecture-approval rule | **Done.** |
| `docs/agents/team.md` and `workflow.md` state that every production deploy needs the Owner's approval | **Done.** |
| Issues are filed on GitHub from the PRD (`/prd-to-issues`, then the Owner or Dev Lead files them) | **Open.** After the items above. |

## Assumptions to confirm

These are my recommendations, made while listing the slice, and the Owner has not yet confirmed them individually:

1. **The agent guide and its scripted conversations stay inside Phase 1's features.** Stories 198 and 199 mention
   "ask the check-in first" and "I'm going away". Check-ins and time away are not in Phase 1, so those examples should
   be reworded.
2. **Targets are for the exercises the Lifter names when starting a session.** Story 46 says "planned exercise", but
   plans are not in Phase 1.
3. **Phase 1 uses a default 20 kg bar and standard plates.** Editing gyms and plates comes later. Story 37 needs a
   plate set, and the gym stories (38 to 42) are not in the slice.
4. **Standing notes (story 9) will be empty** until the stories that create them (8 and 149) are built.
5. **The Week (story 200) should join Phase 1, making it 51 stories.** The Today tiles "Volume" and "Time trained" are
   "this week" figures, and they need the Monday-to-Sunday rule. Story 200 is not among the 50 the Owner accepted.

## Not decided here

The identity provider; how often production deploys happen; the language and framework; whether a separate staging
environment exists; the numeric latency target for the first set of a session. These belong to the architecture ADRs.
