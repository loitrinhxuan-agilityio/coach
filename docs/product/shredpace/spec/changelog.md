# Release timeline

Distilled from the publisher's own changelog ([evidence/changelog.md](../evidence/changelog.md)), newest
first. **Source weight: authoritative** — it is the publisher's statement of what shipped and
when.

**ShredPace is about 46 days old.** The first entry is 2 October 2026; the latest is 17 November
2026. In that time it logged **19 dated entries** (one is only "bug fixes") and renamed itself
once. The API "only grows": operations and fields are added, and none is renamed or removed
without a changelog note.

> The 109-operation API surface in [api-surface.md](api-surface.md) was re-checked against
> the live site on 2026-11-18 and is **byte-identical** (sha256 match on `openapi.json` and
> `llms.txt`). Everything in the 17 November entry therefore arrived as **new fields on existing
> operations**, not new endpoints.

## What each week was about

| Window | Theme |
|---|---|
| 2–4 Oct | **Launch.** Core loop, plan, goals, programs, food, body, consent, undo, docs, the one-click OAuth connector |
| 6–8 Oct | **Domain depth.** Load types and the barbell model, saved meals, notes, swaps, endurance, body devices, typical ranges |
| 9–11 Oct | **Memory and honesty.** Last-session reads, agent bug reports, goals that fit the focus, five tabs |
| 17–18 Oct | **Feel.** "Easy is easy", records celebrated, new-best-as-you-log, plain-word effort |
| 21–22 Oct | **Studio.** A new look in which the agent does the writing |
| 23–26 Oct | **Real life.** Time away, missed days, ill, easing back in, your gyms |
| 27 Oct–17 Nov | **Gyms and comebacks.** Swaps at smaller gyms, steadier food targets, the comeback question |

## Entries

### 17 November 2026
- **Back after a break.** The first set starts at an easy effort; once you lift more at that
  effort, the next set follows what you lifted.
- **Same weights, or ease in.** On the first session back after a break the person is asked
  **once, together with the check-in**, whether to pick up where they left off or ease in. Today's
  targets follow the answer. Fields: `back.comeback` on `get_today`, `get_targets`,
  `start_session`; the answer goes in `check_in` as `comeback`.

### 28 October 2026
- Bug fixes and improvements only.

### 27 October 2026
- **Your gyms.** Home gym, daily gym, a trip's gym; **up to 20** saved. Each day's targets fit the
  gym you're at. `list_gyms` · `get_gym` · `create_gym` · `update_gym` · `remove_gym`.
- **Training at another gym today.** `gym` on `start_session` / `update_session`, for that session
  only; a trip's gym applies by itself on its dates.
- **Swaps at a smaller gym.** When the gym lacks equipment, the agent swaps to something doable
  there for that session only and says so once ("At Home today: Band Pull-Apart instead of Face
  Pull (no cables)."). With no good swap the exercise is **left out and never counts as missed**.
  Fields: `swaps`, `leftOut`, `gymLine`, `insteadOf`; a past day on a trip reads `left-out`.
- **Gyms on the dashboard.** Settings › Your gyms; Today and Before name the gym; Before shows
  each swap; the plan's week marks a trip and where a day was left out (`leftOutAt`).
- **Clearer food targets.** Each target says what it was worked out from: lean mass from a recent
  scan, a healthy weight for the height, or the 7-day average weight. `profile.proteinScan`.
- **Your gym in every theme**; **report resolutions** on `get_report_status`.
- **A first Today in Studio** for new accounts: leads with the next step and shows what fills in
  after the first session, with a sentence to copy when at the gym.

### 26 October 2026
- **Your gym page.** The bar, plates, dumbbells, kettlebells and each machine's weights.
- **Studio is the default for new accounts** — "the clean read-only look your agent fills in".
- **Missed days and time away on Today.** A missed day shows a one-step choice to move the week;
  time away and how today eases you back in are shown. `missed.choices`, `shift_plan.lands`,
  per-day `moved`.
- **Steadier food targets.** Targets follow the **7-day average weight**; protein follows lean
  mass from a body-fat scan of the last **180 days**, or a healthy weight for the height.
  `profile.weightBasis`, `worked.proteinBasis`.
- **Fix a set's bar.** `fix_set` takes `barKg`; what you loaded a side stays, the total follows.
- **Weights your gym has.** `gymDumbbellsKg`, `gymKettlebellsKg`, `loadsKg`: the agent suggests
  only weights you can pick up; at the heaviest you own, it asks for more reps instead.

### 25 October 2026
- **Clearer health details**: one item per line, new items marked; Settings › Privacy names the
  reasons you gave for time off and says the days away stay if consent is turned off.

### 24 October 2026
- **Back after being ill.** Tell the agent you were ill; it eases you back in.
- **Easing back in.** After time away the first session back is an easy one. `back`, and
  `check_in` takes `recovered`.

### 23 October 2026
- **Time away, never against you.** Away days don't count against the plan or the streak.
  `set_away` · `list_away` · `update_away` · `remove_away`.
- **A missed day, picked back up.** The agent asks whether to move the week back a day or keep
  today's session; one write, one undo. `shift_plan` takes `from` and `mode` (`order` | `weekdays`).
- **Counting on past last time.** "set 3", not "set 3 of 2"; "exercise 4" past the plan.
- **Your plan says a side.** `perSide` on plan rows, `barKg` on barbell rows, `usualBarKg`,
  `barInUseKg`.
- **A lift that keeps its own bar, said** (`keepsOwnBar`); **another bar for just today's sets**
  (`barKg` on `log_sets`, later sets carry `barGiven`).

### 22 October 2026
- **Studio, run by your agent.** Where you would edit, add or delete, a short sentence waits with
  **Copy** ("In Shredpace: …") to paste into any chat. Where the change needs the person's answer,
  the sentence asks the agent to ask. Settings › **What your agents know** lists every note with
  *Forget this note*. The person's own choices stay theirs: look, agents and keys, privacy and
  consent, plan, export, sign out, delete account. **Settings › Fix it by hand** allows editing on
  that device **for an hour**.
- **Studio's Sessions, Food and Appearance**: Sessions beside the last 7 days, the plan's week and
  the last 4 weeks; Food shows today against targets, meals and usuals; Appearance lists all seven
  themes in one list with the mode beside it.

### 21 October 2026
- **A new look, Studio.** Calm, light or dark as you choose. Today shows **a body figure** with
  what you trained this week called out (drag, tap, or Front/Back to turn it), anything that needs
  you first, **six tiles for the week**, today's sessions and meals on a **timeline**, and the
  coach's insights — a **side rail on a computer, tabs on a phone**.

### 18 October 2026
- **Easy is easy, however you log it.** A set tapped Easy and a set reported with 4+ reps left now
  get the same advice. After the first week "Too easy" adds a step.
- **Metrics know their kind** — `level`, `total`, `duration`, `rating`, `done` — so they chart
  correctly.
- **A new record, celebrated once.** The After page shows a "New record" card ("was 72.5 × 8,
  29 Sep"); the numbers count up from the old bests, once.
- **A new best, as you log it.** The agent says so in the same line; the workout screen marks the
  set "New best", with a short buzz on phones that allow it.
- **Your workout in plain words.** "How hard was that?" asks Easy / Good / Hard / All out; the
  button says "Done: 8 reps"; last time is one line; rest says how long and why.
- **Progress for agents, a shorter reply**: week by week for a year, month by month before that;
  `weeks=all`; `kept.sessions`.

### 17 October 2026
- **Connect an agent from your phone**: a key made on the phone, shown once with *Copy key*, with a
  warning before leaving without copying it. Connect says which agent already holds a key.

### 11 October 2026
- **One range for all of Progress**, including the last 4 weeks, with weeks trained. `range=4w`.

### 9 October 2026
- **Docs feedback** — Yes/No at the foot of each page counts; No lets you say what was missing.
  Stores the answer, "never who you are". `POST /api/docs-feedback`, no key.
- **Your agent remembers last time**: `get_last_session`, `get_previous_session`, `log_said`.
- **Agents can report problems**: `report_issue`, `get_report_status`; keys and personal details
  are stripped before anything is kept.
- **Health consent v5** — now covers what you tell your agent about how a session went; people who
  agreed earlier are asked once more, with **30 days** to answer.
- **Five tabs**: Today, Training, Food, Body, Goals. Account, plan and agents sit under the
  person's picture; old links still work.
- **Goals that fit your focus** (`conflicts`, `keepGoal`, `replaces`); **start steps** on a new
  account's Today; **endurance week against its plan** ("Running 13 of 22 km").
- **Docs in dark mode.**

### 8 October 2026
- **A body metric's history**: ranges, stats, a typical range for age and sex, and when the goal
  will be reached. **Your devices**: Body can show one device, lists the ones used, renames one;
  a near-duplicate device name is checked first.
- **Body readings across devices**: a reading compares with the last value from any device and
  says when a change came from switching device; missing numbers are asked for; fat mass,
  fat-free mass and skeletal muscle are derived.
- **Deleting your account deletes it everywhere**, including the services the product uses; only
  the minimum legally required record is kept, unlinked.
- **Food in one line**; **supplements go to habits, not meals** (a 0 kcal supplement answers
  `use_habit`).
- **Endurance planned with your lifting** (zones, `get_zones` / `set_zones`), **runs, rides and
  swims** with laps, heart rate, power and per-rep comparison, **progress for endurance**.
- **Name exercises your way** ("incline bench", "OHP"); **dates default to today**; **friendlier for
  agents** (misspelt fields understood and noted in `warnings`; every error has a `say`).
- **Targets you can load** (never below the bar); **the bar said once**; **the rep range while you
  climb it**; **lighter, by one step at most**; **a new lift starts from a related one**; **the cue**
  read with an exercise's first set; **supplements with a meal** (`extras`); **habits with an
  amount** and a `limit`; **a new skill step starts as a try**; **distance steps**; **"How am I
  doing today?"** mid-session; **Body, in full** (sparklines, sleep, soreness, energy, aches).

### 7 October 2026
- **Skill goals** — a ladder of steps, each a test; 16 new exercises came with the ladders.
- **Habits** (tick or count, chosen days, streaks); **Benchmarks** (a test repeated every few
  weeks); **Track anything** (custom metrics); **Aches and pains** (a bad or rising ache makes the
  lifts that load it lighter, or leaves them out).
- **A fifth focus, recomp** ("Lose fat, build muscle") with its own food targets and status.
- **Goals named for their target**; **try a focus before you switch** (`preview_focus`); **early
  days** instead of "on track".
- **Charts and tables in the agent's replies** — an MCP App at `ui://shredpace/chart`.
- **Counting the bar**, **correcting the bar**, **an exercise's own bar**, **another gym's bar and
  plates for one session**, **a different bar is asked once, for its scope**, **lighter than the
  bar is checked** (`below_bar`).
- **Every set write says something** (`say`); **your first week keeps finding** (`stillFinding`).
- **Early access: everything is free.**
- **The rename: the app became Shredpace, at shredpace.com**; old links redirect, keys keep
  working, one-click connectors reconnect once. The MCP server's name is `shredpace`.
- **Check in from chat**, **your first session** (first marks), **During, chat-first**.
- Health consent v4.

### 6 October 2026
- **Load types** (`barbell`, `plates`, `dumbbell`, `one-side`, `stack`, `bodyweight`, `assisted`),
  "15 a side", dumbbell volume counting both hands, assisted progress = bodyweight − assist.
- **Half or double, checked** (`per_side`); **checked against your last set**
  (`far_from_previous_set`, including voice slips like "fourteen" for "forty").
- **Since you last looked** on Today, with a *Looks right* button.
- **Plates and rest with the next set**; **one-line replies in the gym**.
- **Your usuals and the week ahead**; **saved meals**; health consent v3 (dietary needs).
- **Sign in your way** — Continue with Google or with email.
- **Notes for every agent**; **fill the coming week**; **effort and feel** as two ratings;
  **next weights from the sets you managed**; **swaps**; **first marks**.
- **One-click for Grok and ChatGPT**, and the key it makes is named for the app.

### 4 October 2026
- **The one-click connector** for Claude's web, desktop and phone apps (OAuth 2.1 with PKCE);
  revocable with the keys. Claude Code keeps using a key.
- **Getting to know you** — setup asks about experience, injuries, a short health check, the
  starting point, dislikes and home equipment, then checks in after a week.
- **Training that respects it** (moderate targets under a health flag; injured lifts left out or
  easy; first week finds the weights; lighter deload weeks).
- **Your first weeks**, **body numbers that add up** (`units_mixed`), **one plan** (focus, pace,
  time), **goals that agree with themselves**, **everything still waiting for your yes**
  (`kind=held`), **recovery** on a rest day, **a custom GPT** (the 30 most-used operations),
  **steps emailed to your computer** (never with a key). Health consent v2.

### 3 October 2026
- **Food**, **body readings**, **goals** (body, food and guard), **before / during / after**,
  **the docs**, **contact us**, **health consent** (kept only after the person agrees; turning it
  off deletes at once), **undo anything** (7 days), **a big difference asks first** (HTTP 202),
  **forgotten sessions**, and **every route listed**.

### 2 October 2026 — launch
- **Today**, **Progress and the coach**, **plan, goals and programs**, **one API for every agent**,
  **account and settings**, **exercises**, **sessions and sets**.
