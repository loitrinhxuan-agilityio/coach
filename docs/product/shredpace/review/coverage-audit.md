# Desktop coverage audit

**Question:** does the PRD cover every feature of ShredPace's desktop product? Written 2026-11-18, after
the six signed-in reads recorded in [signed-in.md](../observations/signed-in.md) and one
more pass on the screens that had never been opened.

**Answer:** **almost, and now yes.** Walking every desktop screen and every API operation against the 167
stories turned up **30 missing features** (the product's own habit of "fix, delete and review" pages, a
Progress page, a contact and privacy path, and a few settings). They are now stories **168–197** in
[`issues/prd.md`](../../../../issues/prd.md). Phone layouts are deferred to phase 2, as decided.

## Method

1. **Operations.** All 109 operations in `evidence/openapi.json`, each mapped to the stories that cover it.
2. **Screens.** The 44 screens in the shipped router ([screens-and-routes.md](../spec/screens-and-routes.md)),
   plus the pages found by following links on the live dashboard, each mapped to what it shows.
3. **Evidence per screen.** *Live* means it was rendered for a signed-in account and read; *public* means it
   was read logged-out; *router only* means it exists in the code but was never rendered.
4. **A gap** is something a screen or operation does that no story describes.

## Result in numbers

| Measure | Count |
|---|---|
| API operations | 109 |
| Fully covered by stories 1–167 | **89** |
| Only partly covered | **20** |
| Stories added by this audit | **30** (168–197) |
| Operations still uncovered after the additions | **0** |
| Desktop screens seen live or public | all but one (`#benchmark/{id}`, none was ever created) |

## Screen by screen (desktop)

| Screen | Route | Evidence | Stories (existing → added) |
|---|---|---|---|
| Landing | `#landing` | public | none → **168** |
| Sign in / sign up | `#signin` | public | 1 |
| Connector sign-in | `#connector` | router only | out of scope (one-click OAuth) |
| Contact us | `#contact` | live | 165 (agent only) → **169–171** |
| Consent | `#consent` | live (after agreeing) | 155–160 |
| Privacy, Terms | `#privacy` `#terms` | live | 163 → **172** |
| Today | `#today` | live | 26, 77, 140, 141, 147 |
| Sessions | `#sessions` | live | 144 → **173** |
| A finished session | `#session/{id}` | live | 57 → **174–178** |
| Before | `#before` | live | 46, 63 |
| During | `#during` | live | 151 |
| After | `#after/{id}` | live | 57, 58 → **177** |
| Exercises | `#exercises` | live | 31–33, 43 → **179, 196** |
| Food | `#food` | live | 102–115 → **181–182** |
| Usuals, one usual | `#food/usuals` `#food/usual/{id}` | live | 105, 106 → **197** |
| Food targets | `#food/settings` | live | 107, 108, 114 → **180** |
| Body | `#body` | live | 116–121 |
| Scans, one scan | `#body/scans` `#body/scan/{id}` | live | 116 → **183–184** |
| A metric | `#metric/{id}` `#metric/weight` | live | 123, 125 → **183–184** |
| An ache | `#ache/{area}/{side}` | live | 127–129 → **183–184** |
| Goals | `#goals` | live | 89–95 |
| A goal | `#goal/{id}` | live | 93 → **185** |
| A habit | `#habit/{id}` | live | 98–100 |
| A benchmark | `#benchmark/{id}` | **router only** | 101 |
| Plan | `#plan` | live | 65–78 |
| Plan setup | `#plan/setup/{step}` | live | 64 |
| A week of the plan | `#plan/week/{date}` | live | 72, 73 → **186** |
| Zones | `#plan/zones` | live | 137 |
| Progress | `#progress` | live | none specific → **187–189** |
| Coach | `#coach` | live | 130–135 |
| Program | `#plan/program` | live | 76 |
| Activity | `#activity` | live | 146 → **190** |
| Connect | `#connect` | live (the "add an agent" page was not opened) | 2–5 |
| Settings | `#settings` | live | 148 → **191** |
| Agents and keys | `#settings?agents` | live | 5, 6 → **195** |
| Your data | `#settings?data` | live | 161, 162 → **192** |
| What your agents know | `#settings?notes` | live | 149 |
| Privacy and consent | `#settings/privacy` | live | 155–160 |
| Your gym | `#settings/gym` | live | 38 |
| Appearance | `#settings/appearance` | live | 154 (one look; seven themes are out of scope) |
| Settings › Plan, welcome | `#settings/plan` `#pro` | live | out of scope (billing) |
| The rail and "Ask Claude" | on every screen | live | 5 → **193–194** |

## Operations

| `get_account` | GET `/me` | covered | 9 |
| `get_summary` | GET `/summary` | covered | 140, 141 |
| `get_today` | GET `/today` | covered | 140, 141, 77 |
| `get_settings` | GET `/settings` | covered | 148 |
| `update_settings` | PUT `/settings` | covered | 148, 114 |
| `list_gyms` | GET `/gyms` | covered | 38 |
| `create_gym` | POST `/gyms` | covered | 38 |
| `get_gym` | GET `/gyms/{gym}` | covered | 38 |
| `update_gym` | PATCH `/gyms/{gym}` | covered | 38, 39 |
| `remove_gym` | DELETE `/gyms/{gym}` | covered | 38 |
| `search_exercises` | GET `/exercises` | covered | 31 |
| `create_exercise` | POST `/exercises` | covered | 32 |
| `get_exercise` | GET `/exercises/{exercise}` | covered | 31, 34 |
| `update_exercise` | PATCH `/exercises/{exercise}` | covered | 32, 36 |
| `delete_exercise` | DELETE `/exercises/{exercise}` | **partly** | 183, 184 (added) |
| `get_exercise_history` | GET `/exercises/{exercise}/history` | covered | 43 |
| `get_suggestion` | GET `/exercises/{exercise}/suggestion` | covered | 46, 52 |
| `hide_exercise` | POST `/exercises/{exercise}/archive` | covered | 33 |
| `show_exercise` | POST `/exercises/{exercise}/unarchive` | covered | 33 |
| `list_sessions` | GET `/sessions` | **partly** | 173 (added) |
| `start_session` | POST `/sessions` | covered | 12 |
| `get_open_session` | GET `/sessions/open` | covered | 13 |
| `get_session` | GET `/sessions/{sessionId}` | **partly** | 174, 175, 176, 177, 178 (added) |
| `update_session` | PATCH `/sessions/{sessionId}` | covered | 24, 36, 39 |
| `delete_session` | DELETE `/sessions/{sessionId}` | covered | 23 |
| `get_last_session` | GET `/sessions/last` | covered | 25 |
| `get_previous_session` | GET `/sessions/{sessionId}/previous` | covered | 25 |
| `log_said` | POST `/sessions/{sessionId}/said` | covered | 25 |
| `get_session_detail` | GET `/sessions/{sessionId}/detail` | **partly** | 174, 175, 176, 177, 178 (added) |
| `get_session_summary` | GET `/sessions/{sessionId}/after` | covered | 57, 58 |
| `get_targets` | GET `/coaching/before` | covered | 46 |
| `check_in` | PUT `/readiness/{date}` | covered | 44, 45 |
| `get_next_set` | GET `/coaching/during` | covered | 47, 48 |
| `log_sets` | POST `/sessions/{sessionId}/sets` | covered | 14 |
| `end_session` | POST `/sessions/{sessionId}/end` | covered | 24 |
| `fix_set` | PATCH `/sessions/{sessionId}/sets/{setId}` | covered | 23 |
| `delete_set` | DELETE `/sessions/{sessionId}/sets/{setId}` | covered | 23 |
| `get_plan` | GET `/plan` | covered | 65 |
| `update_plan` | PUT `/plan` | covered | 64, 65 |
| `preview_focus` | GET `/plan/switch` | covered | 67 |
| `plan_day` | PUT `/plan/{date}` | covered | 72 |
| `clear_plan_day` | DELETE `/plan/{date}` | covered | 72 |
| `fill_week` | POST `/plan/week` | covered | 72, 73 |
| `shift_plan` | POST `/plan/shift` | covered | 81, 82 |
| `list_away` | GET `/away` | covered | 79 |
| `set_away` | POST `/away` | covered | 79, 80 |
| `update_away` | PATCH `/away/{awayId}` | covered | 79 |
| `remove_away` | DELETE `/away/{awayId}` | covered | 79 |
| `list_goals` | GET `/goals` | covered | 89, 68 |
| `set_goal` | POST `/goals` | covered | 90 |
| `get_goal` | GET `/goals/{goalId}` | covered | 93 |
| `update_goal` | PATCH `/goals/{goalId}` | **partly** | 185 (added) |
| `remove_goal` | DELETE `/goals/{goalId}` | **partly** | 185 (added) |
| `search_skill_ladders` | GET `/skills/ladders` | covered | 96 |
| `list_habits` | GET `/habits` | covered | 98 |
| `create_habit` | POST `/habits` | covered | 98, 100 |
| `get_habit` | GET `/habits/{habitId}` | covered | 98 |
| `update_habit` | PATCH `/habits/{habitId}` | covered | 98, 99 |
| `stop_habit` | DELETE `/habits/{habitId}` | **partly** | 183, 184 (added) |
| `tick_habit` | POST `/habits/{habitId}/ticks` | covered | 98 |
| `list_benchmarks` | GET `/benchmarks` | covered | 101 |
| `create_benchmark` | POST `/benchmarks` | covered | 101 |
| `get_benchmark` | GET `/benchmarks/{benchmarkId}` | covered | 101 |
| `update_benchmark` | PATCH `/benchmarks/{benchmarkId}` | covered | 101 |
| `stop_benchmark` | DELETE `/benchmarks/{benchmarkId}` | **partly** | 183, 184 (added) |
| `get_zones` | GET `/zones` | covered | 137 |
| `set_zones` | PUT `/zones/{sport}` | covered | 137 |
| `correct_benchmark_result` | PATCH `/benchmarks/{benchmarkId}/results/{date}` | **partly** | 183, 184 (added) |
| `list_measurements` | GET `/body` | covered | 116 |
| `log_measurements` | POST `/body` | covered | 117 |
| `fix_measurement` | PATCH `/body/{readingId}` | **partly** | 183, 184 (added) |
| `delete_measurement` | DELETE `/body/{readingId}` | **partly** | 183, 184 (added) |
| `rename_body_device` | PATCH `/body/devices/{device}` | **partly** | 183, 184 (added) |
| `list_programs` | GET `/programs` | covered | 76 |
| `set_program` | POST `/programs` | covered | 76 |
| `update_program` | PATCH `/programs/{programId}` | covered | 76 |
| `remove_program` | DELETE `/programs/{programId}` | covered | 76 |
| `log_meal` | POST `/meals` | covered | 102, 103 |
| `list_meals` | GET `/meals` | covered | 102 |
| `list_saved_meals` | GET `/saved-meals` | covered | 105 |
| `save_meal` | POST `/saved-meals` | covered | 105 |
| `delete_saved_meal` | DELETE `/saved-meals/{savedMealId}` | **partly** | 183, 184 (added) |
| `update_meal` | PATCH `/meals/{mealId}` | covered | 104 |
| `delete_meal` | DELETE `/meals/{mealId}` | **partly** | 183, 184 (added) |
| `list_notes` | GET `/notes` | covered | 8, 149 |
| `add_note` | POST `/notes` | covered | 8 |
| `update_note` | PATCH `/notes/{noteId}` | covered | 149 |
| `delete_note` | DELETE `/notes/{noteId}` | covered | 149 |
| `search_metrics` | GET `/metrics` | covered | 126 |
| `create_metric` | POST `/metrics` | covered | 125 |
| `get_metric` | GET `/metrics/{metric}` | covered | 123 |
| `update_metric` | PATCH `/metrics/{metric}` | covered | 125 |
| `archive_metric` | DELETE `/metrics/{metric}` | **partly** | 183, 184 (added) |
| `log_metric` | POST `/metrics/{metric}/readings` | covered | 125 |
| `fix_metric_reading` | PATCH `/metrics/{metric}/readings/{metricReadingId}` | **partly** | 183, 184 (added) |
| `delete_metric_reading` | DELETE `/metrics/{metric}/readings/{metricReadingId}` | **partly** | 183, 184 (added) |
| `list_pain` | GET `/pain` | covered | 127 |
| `log_pain` | POST `/pain` | covered | 127 |
| `fix_pain` | PATCH `/pain/{painId}` | **partly** | 183, 184 (added) |
| `delete_pain` | DELETE `/pain/{painId}` | **partly** | 183, 184 (added) |
| `get_nutrition` | GET `/nutrition` | covered | 107, 112 |
| `get_progress` | GET `/progress` | **partly** | 187, 188, 189 (added) |
| `get_coach` | GET `/coach` | covered | 130, 131, 132 |
| `update_insight` | PATCH `/coach/insights/{insightId}` | covered | 130, 133 |
| `list_activity` | GET `/activity` | covered | 146 |
| `undo_change` | POST `/activity/{eventId}/undo` | covered | 29 |
| `report_issue` | POST `/agent-reports` | covered | 164 |
| `get_report_status` | GET `/agent-reports/{reportId}` | covered | 164 |
| `contact_support` | POST `/support` | covered | 165 |

## What was found

| Gap | Where it showed up | What it was | Stories |
|---|---|---|---|
| G1 | `#landing` | No public page explaining the product and its price | 168 |
| G2 | `#contact`, `#settings/privacy` | The PRD only let an *agent* contact support. The site has a **human contact form** (topic, subject, message, a removable "sent with this" line) and a **person-only privacy-request path** | 169–171 |
| G3 | footers | Privacy and Terms pages, each with an *Updated* date | 172 |
| G4 | `#sessions` | Filters *All · Strength · Cardio · Outdoors* | 173 |
| G5 | `#session/{id}`, `#after/{id}` | The **finished-session page** (per-exercise tables against last time and all-time best, muscles, previous/next) and the After page's per-muscle sets, recovery times and next targets | 174–178 |
| G6 | `#exercises` | Notes from your trainer, and the cue read with the first set | 179 |
| G7 | `#food/settings` | Editable targets and an optional fibre switch | 180 |
| G8 | `#food` | A day navigator and short coach tips | 181–182 |
| G9 | 11 operations | **Fix and delete** for readings, metric readings, aches, meals and exercises; stopping a metric, habit or benchmark with history kept; correcting a benchmark result; renaming a device | 183–184 |
| G10 | `#goal/{id}` | Mark a goal done or remove it | 185 |
| G11 | `#plan/week/{date}` | A page for any week, with a "move a day" sentence | 186 |
| G12 | `#progress` | **The Progress page**: ranges, first marks, e1RM trends, bests, year grid, muscle balance, the recomp card | 187–189 |
| G13 | `#activity` | A **"To check"** filter: everything held for your yes | 190 |
| G14 | `#settings` | Name, units (kg/km), time zone, height, birth year, body type | 191 |
| G15 | `#settings?data` | **Sign out** | 192 |
| G16 | every screen | "Ask Claude" copies an example sentence; the rail shows the agent's status | 193–194 |
| G17 | `#settings?agents` | The keys page: name, state, last use, Revoke, Make a key, and *"Only you connect, make or revoke: a key can't."* | 195 |
| G18 | `#exercises` | The list is ordered by recent use, then alphabetically; there is no search box | 196 |
| G19 | `#food/usual/{id}` | A saved meal's page: per-serving numbers and extras | 197 |

## Things confirmed as correctly out of scope

- **Billing** — a Stripe checkout and plan page. The Terms page states the prices: **Pro $6.99 a month or
  $55.99 a year**, a **14-day refund window**, **30 days' notice** of a price change, and that on lapsing
  Free shows 90 days of history, a coach preview, and keeps anything over its limits (3 metrics, 3 habits,
  one agent key) working without letting you add more. See [product.md](../spec/product.md).
- **Seven themes**, the **docs site**, the **one-click connectors** and the **public API reference**.
- **"Coming soon" features**: the movement demo, the emailed recap, the shareable recap card. The product
  itself marks them as unbuilt.

## What this audit could not verify

- **`#benchmark/{id}`** was never rendered because no benchmark exists on the account.
- **The "add an agent" pages and "Make a key"** were not opened: creating a key is a write, so the steps for
  connecting each assistant are known only from the docs pages.
- **Export, CSV, sign out and delete** were read but not triggered.
- **"Fix it by hand".** The row was clicked once. It did not open a page and nothing changed on screen, but
  it may have enabled the one-hour edit mode. No edit controls were visible and nothing was stored in the
  browser, so this is probably nothing; if you saw edit controls appear, tell me.
- **Activity "Details"** was clicked but its expansion was not captured.
- **Populated multi-week screens** still need data over time; see [handoff.md](handoff.md).

## Coverage of the 109 operations

The first column of the table above is the operation; **covered** means stories 1–167 already describe it,
**partly** means only the added story does. After the additions every operation has at least one story.
