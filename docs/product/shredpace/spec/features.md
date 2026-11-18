# Feature inventory

Grouped by domain. Each group names the API operations behind it (see
[api-surface.md](api-surface.md)) and the screens that show it
(see [screens-and-routes.md](screens-and-routes.md)).

## 1. Session logging — the core loop

The defining feature: sets are logged **by the agent, mid-session, conversationally**.

- Start a session by category (Push, Legs, Run…), optionally backdated with sets already attached
- Log sets as they happen: exercise by **id, name or alias**; reps, weight, RPE, warm-up flag, duration
- One open session at a time (`get_open_session`, 404 when none)
- Correct or delete any set; correct or delete a whole session
- End a session with notes and **two separate ratings**, which the guide insists are never conflated:
  - `rating` — "How hard was it, Easy to Max?" (effort)
  - `feel` — "How did it feel, Bad to Great?"
- Keep the person's own words about a session (`log_said`)
- Mark a session reviewed

**Conversational protocol** (from `llms.txt`, enforced by the API's response shape):

- Every set write returns a `say` string — what was logged plus the next set, e.g.
  *"Logged Barbell Row 62.5 kg × 8. Next: 62.5 kg × 8 · set 3 of 3 · rest 2 min."*
  The guide's rule: *"never end a turn with a write and no words."*
- A set that looks wrong returns **HTTP 202** with a clarifying question in `say`, word for word:
  *"14 × 10? Your last set was 40 × 10. Did you mean 40?"* — one question per reply.
- Effort vocabulary maps the app's words to RPE: Easy = 7, Good = 8, Hard = 9, All out = 10.

### Load types and the barbell problem

A genuinely careful piece of domain modelling:

- Barbells and plate-loaded machines **store the total**, with `plateWeights` describing how a
  human reads it ("15 a side × 6", "50 kg × 6")
- Reads carry `perSide` — the guide warns: *"never halve a total"*
- A set's weight is interpreted by its exercise's `loadType`: barbell total, one dumbbell, or
  an assisted machine's assist. `loadLabel` renders it ("26 kg per hand")
- Bar weight resolution asks once and remembers at three scopes: just today (session `barKg`),
  always for this lift (`keepsOwnBar`), or the usual bar from now on
- Per-gym available weights: `gymDumbbellsKg`, `gymKettlebellsKg`, `loadsKg`

## 2. Coaching — before, during, after

| Phase | Operation | What it gives |
|---|---|---|
| Before | `get_targets` | The planned day's targets per exercise (weight × sets × reps) |
| Before | `get_last_session` | The last session of this category in one call |
| Before | `check_in` | Sleep, soreness, energy — asked before every session |
| During | `get_next_set` | Next set's target, **adjusted when the last set was off** |
| After | `get_session_summary` | Plan vs done, wins, records, each top set |
| After | `get_session_detail` | This session against history |

Weight suggestion (`get_suggestion`) comes from history plus the user's rep range, **with the
reason** — the landing page's "Picks your next weight … with the reason."

## 3. The Coach (Pro)

Automated review, not conversational:

- Detects **stalls**, **push-pull imbalance** and **training load** problems
- Produces weekly **insights** the user accepts or dismisses (`update_insight`)
- Accepting a stall insight triggers a step-back (deload)
- Writes the week's plan

## 4. Planning

- Plan: **focus** (lose, recomp, gain, maintain, perform), pace, time
  (`daysPerWeek`, `minutes`, `days`, `where`)
- Intake: experience, limitations
- `preview_focus` — **what switching focus would change, before anything moves**
- Plan one day (`plan_day`), clear a day, or `fill_week` from last week
- `shift_plan` — after a missed day, move the plan rather than lose it
- **Away periods**: holiday, ill, injured, busy — with reason, training-while-away, notes
- Multi-week **programs** (Pro): weeks, named blocks (Base 1–3, Build 4–6), per-day structure

## 5. Not just the gym

Landing page lists: **Lifts, Runs, Rides, Swims, Hikes, Mobility.**

**Endurance** gets its own model:
- Zones per sport from a test — run paces, ride watts, swim per 100
- `get_zones` / `set_zones` with provenance ("where the number came from")
- Logged after the fact with type and laps
- Heart rate is explicitly classed as **health data**
- A `202` hold asks before recording something uncertain

## 6. Food

- Log a meal **from a photo or a sentence**
- **Saved meals** ("usual breakfast", "whey, one scoop") — log again by name
- Correct a meal by `portion` (0.5 scales every number), then adjust individual numbers
- `get_nutrition` — food against the goal, with **how the targets were worked out**
- Targets follow the focus: *"Calories first when you cut, protein first when you build"*
- Adaptive targets are Pro

## 7. Body

- Readings from **scale, scan or tape**, each with its source `{device, method}`
- **Read from a screenshot** — the guide requires logging *every* number the screenshot shows,
  not just weight, with the rest in `extra`; a reply with `missing` asks for the rest
- Device identity: same machine recognised by name from `devices`; `rename_body_device`
  re-files every reading from one device
- Fix or delete a reading
- Body map of trained muscles, by session, week or longer (landing page)

## 8. Track anything

- Arbitrary **custom metrics**: name, unit, which direction is better (up, down, range), cadence
  — resting heart rate, steps, grip strength, whatever
- `search_metrics` **before** `create_metric` is a stated rule, to avoid duplicates
- **Pain log** separately: area, side, 0–10, what it was during, note
  (*"left knee 3/10 on squats"*)

## 9. Goals, habits, benchmarks

| Thing | Behaviour |
|---|---|
| **Goals** | Named by their **target, not the focus** (API returns `400 focus_in_title` otherwise). Progress + track: start, now, target |
| **Skill ladders** | Starter progressions for skill goals — first pull-up, push-up, pistol squat |
| **Habits** | Tick or count, with target, days, "at most" limits, pause-until; streak, best, 4-week grid. **Never ticked mid-session.** Supplements are habits, not meals |
| **Benchmarks** | Repeat a test every few weeks (`every: "6w"`): maxReps, holdSec, time over distance. Results compared against the last |

## 10. Exercises

- Shared **starter catalog** plus the user's own
- Starter exercises accept training settings only (rep range, increment, notes); user-created
  ones are fully editable
- Per-exercise history: top set, volume, estimated 1RM
- Hide / show (archive) with a reason ("elbow") — history is kept
- Delete only if no session uses it

## 11. Gyms

- Multiple gyms: home, daily, a trip's
- Equipment, weights, machines; one is the default
- `equipment: null` means "not said" — distinct from "empty"
- New gym or trip prompts "What does it have?" **once**

## 12. Multi-agent, audit and undo

This is the feature set that follows from "several agents write to one account":

- **Activity trail** — every write, newest first, attributed to *which key by name* or the person
- **`undo_change`** — "undo that": items go back as they were; a delete is restored
- **Notes** — standing rules and preferences stored where **every** agent reads them, not just one
- Deletes are soft: *"The event log keeps a copy"* appears on essentially every destructive op
- API keys are hashed and individually revocable

## 13. Reads built for conversation

Review reads return a `show` object containing: `say`, `table`, `sparkline`, chart `series`, and
a `link`. The stated protocol: at home say `say`, paste `table` verbatim, then the `link` —
**never mid-session and never in voice**. MCP Apps clients draw the chart themselves.

## 14. Export, privacy, support

- Export CSV and JSON (`/export`, `/export?format=csv`) — Pro
- Consent and health-details screens; a privacy-paused state exists in the UI
- Delete "in one tap"; nothing deleted on plan change
- `contact_support` for bugs, ideas, plan questions
- `report_issue` / `get_report_status` — **agents report API problems** (a truncated read, a bad
  response) and get back a cluster signature showing how many reports share it

---

# Added 2026-11-18

The sections above came from the OpenAPI document, `llms.txt` and the landing page. On
2026-11-18 the publisher's full agent guide ([evidence/skill.md](../evidence/skill.md)) and changelog
([evidence/changelog.md](../evidence/changelog.md)) were retrieved, and they describe a good deal that the first
pass did not capture. Numbers and thresholds are in [product-rules.md](product-rules.md); dates
are in [changelog.md](changelog.md). Sections 1–14 above are not wrong, only incomplete.

## 15. Studio — the look in which the agent does the writing

*Corrects an earlier inference:* Studio is **not** an internal design-review mode. It is a
user-facing theme, the **default for new accounts since 26 October**, and one of the product's
central ideas.

- **The dashboard is read-only; the agent makes the changes.** Where a person would edit, add or
  delete, a short sentence waits with a **Copy** button — *"In Shredpace: …"* — carrying everything
  an agent needs, ready to paste into any chat. Where the change needs the person's answer (how
  they slept, a new target), the sentence tells the agent to ask.
- **Settings › What your agents know** — every note any agent keeps, each with *Forget this note*.
- **Settings › Fix it by hand** — editing on **this device for an hour**, if an agent can't help.
- **Stays the person's own, even in Studio:** the look, agents and keys, privacy and consent, the
  plan, export, sign out, delete account.
- **Layout**: a **body figure** with this week's trained muscles called out (drag, tap, or
  Front/Back); anything needing the person first; **six tiles for the week**; today's sessions and
  meals on a **timeline**; the coach's insights; a **side rail on desktop, tabs on a phone**. A new
  account's first Today leads with the next step and a sentence to copy when at the gym.
- Studio's Sessions shows each week beside the last 7 days, the plan's week and the last 4 weeks;
  its Food shows today against targets, meals and usuals; its Appearance lists all seven themes
  with the mode beside them.
- The seven themes are `ember`, `chalk`, `trail`, `blush`, `sage`, `lilac`, `studio`; the mode is
  `system | light | dark`. An account **keeps the theme it has**; only new accounts start in Studio.

## 16. Time away, missed days and coming back

Four connected flows (see [product-rules.md §5](product-rules.md)):

- **Time away** — holiday / ill / injured / busy; never counts against plan or streak; optionally
  still training (the agent writes a lighter travel plan and offers to pause habits).
- **A missed day, picked back up** — a one-step choice on Today: move the week, or keep today's
  session; one write, one undo.
- **Easing back in** — the first session back is an easy one (RPE ≤ 7); a week about 20% lighter
  after illness, with a "Fully recovered?" question.
- **The comeback question** (17 Nov) — *"same weights as last time, or ease in?"* asked once with
  the check-in, and today's targets follow the answer.

## 17. Gyms, in depth

*Extends section 11.* Up to **20** gyms. A trip's gym applies on its own dates; "home today" applies
to one session. When the gym lacks equipment the agent **swaps** for that session only and says so
once, or **leaves the exercise out — which never counts as missed**. The plan's week marks a trip
and shows which gym a day was left out at, even after the trip. Settings › Your gyms lists each
gym's equipment and which you're at today.

## 18. Small moments of feedback

- **First marks** — after the first week, each lift's first best set; **first session** — the first
  marks after session one.
- **A new best, as you log it** — said in the same line; the set is marked "New best" on the workout
  screen with a short buzz on phones that allow it. Equalling a best, or a lift's first set, isn't one.
- **A new record, celebrated once** — After shows a "New record" card ("was 72.5 × 8, 29 Sep"); the
  numbers count up from the old bests **the first time only**.
- **"Looks right"** — Today shows what an agent logged since the person last visited, with a button
  to confirm; an agent's own calls never count as the person looking.
- **Plain-word effort** — Easy / Good / Hard / All out, "Done: 8 reps", one-line last time, rest with
  its reason.

## 19. A real intake, and safety behaviour

*Extends section 4.* Setup is a trainer's intake: experience, injuries and limitations, a
**health questionnaire asked word for word**, body type, focus, starting weights (or "find them"),
dislikes, home equipment. A health flag caps targets at RPE 7; an injured lift is left out or kept
easy and re-asked every 4 weeks; the **first week finds weights**; a check-in follows; a retest every
6 weeks; the health check repeats yearly. Pain ≥ 5 lightens the loading lifts, ≥ 7 removes them.
Deload weeks come on a cadence set by experience. See §3–4 and §10 of the rules file.

## 20. Body, in more depth

*Extends section 7.* Each body metric has its **own history page** (ranges W / M / 3M / Y / All,
stats, rate per week, a **typical band** where a published adult reference exists, and the **date the
goal will be reached**). Extra numbers a scale reports become metrics of their own. **Derived**
values (fat mass, fat-free mass, skeletal muscle) are worked out. Body can be filtered to one
device, and shows sleep, soreness and energy (from check-ins) and aches from the last 4 weeks.

## 21. Metrics know what kind of number they are

`level` (a line), `total` (bars), `duration` (bars), `rating` (cells), `done` (a calendar). Inferred
from the unit when not set; sleep is a duration, soreness and energy are ratings.

## 22. Food, in more depth

*Extends section 6.* Targets say what they were **worked out from** (lean mass from a scan, a healthy
weight for the height, or the 7-day average); a **one-line day summary**; **extras** (a supplement
logged with a meal adds to its habit and adds no calories); **offerHabit**; a Pro **weekly
adjustment** capped at 300 kcal in all. Formulas in [product-rules.md §8](product-rules.md).

## 23. Getting connected

- **Claude** (web, desktop, phone): add `https://shredpace.com/mcp` as a custom connector, sign in
  with Google or email — no key. **Grok** and **ChatGPT (developer mode)** work the same way; the
  grant is a key named for the app and revocable.
- **Claude Code / Cursor / VS Code / Claude Desktop (config)**: a key in an `X-Api-Key` header.
- **A custom GPT**: import `/api/openapi.json?for=gpt` — the **30** operations a trainer uses most.
- **Any agent**: give it `/api/skill.md` and the key.
- **On a phone**, Connect can make a key (shown once, with Copy) or **email the steps to your
  computer** — never with a key.
- A free account has **one** agent key; Claude's own free plan allows one custom connector.

## 24. Account lifecycle and trust

- **Deleting the account deletes it everywhere** — also the services the product uses; only the
  minimum legally required billing record stays, unlinked (**6 years**, for tax law).
- **Export** — JSON on every plan, CSV on Pro, with `billingRecords` on a paid plan.
- **Billing** — Stripe, monthly or yearly, from the dashboard only.
- **Agents report problems** — `report_issue` clusters reports by route, kind and field; the
  account's reports are in the export; an issue number and resolution can come back.
- **Docs feedback** — Yes/No on every docs page, anonymous, with an optional "what was missing".
- **Rename** — the product was renamed to Shredpace on **7 October 2026**; old links redirect.
- **The docs' "Try it"** keeps the key you type in that browser only; it goes to the site's own API and nowhere else.
