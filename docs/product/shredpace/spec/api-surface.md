# API surface

`https://shredpace.com/api` — OpenAPI 3.1.0, Shredpace API v1.0.0.

**70 paths, 109 operations.** The spec is public and unauthenticated at <https://shredpace.com/api/openapi.json>; a 30-operation subset is served at `?for=gpt` for ChatGPT actions.

Everything the dashboard does is reachable by an API key, so the agent-facing surface and the UI's surface are the same. Summaries are verbatim from the spec, trimmed to 150 chars.

## Account, settings and gyms

| op | method | path | what it does |
|---|---|---|---|
| `list_gyms` | GET | `/gyms` | The person's gyms: each one's name, equipment (null: not said, a full gym), weights (barKg, platesKg, dumbbellsKg, kettlebellsKg), machines, a trip's  |
| `create_gym` | POST | `/gyms` | Save a gym the person trains at (home, a daily gym, a trip's): name, equipment, weights, machines, from and until for a trip, default. Ask "What does  |
| `remove_gym` | DELETE | `/gyms/{gym}` | Remove a gym the person no longer uses. The usual can't be removed (409 default_gym: "Make another gym your usual first."). Past sessions keep its nam |
| `get_gym` | GET | `/gyms/{gym}` | One gym, by name (any case) or id: what it has, its weights, machines, a trip's dates and default. A trip that has ended reads with its dates cleared. |
| `update_gym` | PATCH | `/gyms/{gym}` | Change a gym, partly: name, equipment, weights, machines; default: true makes it the usual ("make Home my usual"); from and until set a trip, null on  |
| `get_account` | GET | `/me` | Check the connection: the key you're using, the account's plan and its billing (a paid plan's state; on Free, the upgrade link to share), whether the  |
| `list_meals` | GET | `/meals` | The meals logged from..to (default the last 7 days), each with its local day and time, the numbers and where they came from (said, photo, label). Free |
| `log_meal` | POST | `/meals` | Log a meal after the person's yes to your one-line confirm, or a saved meal by savedMealId or name, with a portion; extras: supplements (creatine), fe |
| `delete_meal` | DELETE | `/meals/{mealId}` | Delete a meal logged by mistake or twice. The event log keeps a copy. |
| `update_meal` | PATCH | `/meals/{mealId}` | Correct a meal: portion (0.5 for half) scales every number, then any number given replaces its own; also name, time, source, note or extras (its suppl |
| `search_metrics` | GET | `/metrics` | The metrics the person tracks (resting heart rate, steps, grip…), each with its latest value and change, then sleep, soreness and energy from the chec |
| `create_metric` | POST | `/metrics` | Start tracking a number: name, unit, which way is better (up, down, range), how often. 409 similar (use that one), 409 built_in (weight, waist, body f |
| `archive_metric` | DELETE | `/metrics/{metric}` | Stop tracking a metric: it leaves the lists and its readings are kept. 409 has_goals while a goal uses it (remove the goal first). Sleep, soreness and |
| `get_metric` | GET | `/metrics/{metric}` | One metric: its latest value, readings newest first, and show. A body metric (bodyFat, waist…) or extra:<key>: the span's readings, stats (change, rat |
| `update_metric` | PATCH | `/metrics/{metric}` | Rename a metric, or change which way is better, how often it's logged or its kind (how it's charted). A new unit once it has readings is a 409 unit_ch |
| `log_metric` | POST | `/metrics/{metric}/readings` | Log a reading in the metric's unit (default now). Say its say line. A value far from the last one is held (202): ask the person, then confirm or fix.  |
| `delete_metric_reading` | DELETE | `/metrics/{metric}/readings/{metricReadingId}` | Delete a reading logged by mistake or twice. The event log keeps a copy. |
| `fix_metric_reading` | PATCH | `/metrics/{metric}/readings/{metricReadingId}` | Correct a reading's value, time or note. confirmed: true alone answers a held reading's check after the person says it's right. |
| `get_settings` | GET | `/settings` | The user's settings: unit (kg or lb), bodyweightKg (the latest weigh-in), time zone, weekly session target, current program, body type, theme, mode, t |
| `update_settings` | PUT | `/settings` | Change settings: unit, bodyweight (a weigh-in), time zone, name, body type, theme (ember/chalk/trail/blush/sage/lilac/studio), mode, bar (barKg; apply |

## Notes (standing rules every agent reads)

| op | method | path | what it does |
|---|---|---|---|
| `list_notes` | GET | `/notes` | The person's notes for every agent: standing rules and preferences (diet, training, units, other), each with who wrote it. get_account and get_today i |
| `add_note` | POST | `/notes` | Keep a standing rule or preference where every agent reads it (not only in your memory): "Dumbbell weights are per hand". One short rule each. A diet  |
| `delete_note` | DELETE | `/notes/{noteId}` | Delete a note that no longer holds. The event log keeps a copy. |
| `update_note` | PATCH | `/notes/{noteId}` | Change a note's words or kind when the person's rule changes. |

## Today, summary and progress

| op | method | path | what it does |
|---|---|---|---|
| `get_progress` | GET | `/progress` | Progress over a range (4w, 90d, 1y, 2y, all): totals and weeks trained, a lift by month and by week (older: by month), lifts by when last trained, the |
| `get_summary` | GET | `/summary` | Progress overview for coaching: streak, weekly volume, personal records, each exercise's trend and next-weight suggestion, time and distance per activ |
| `get_today` | GET | `/today` | Today: before, live or after a session, vs last time; say (one line: the session so far and food; mid-session only); notes, checkIn (none: ask; check_ |

## Before / during a session

| op | method | path | what it does |
|---|---|---|---|
| `get_targets` | GET | `/coaching/before` | Before a session: the planned day's targets per exercise (weight × sets × reps, loadable on the bar, target RPE, last time, change and why, warm-ups,  |
| `get_next_set` | GET | `/coaching/during` | During a session: the next set's target (adjusted when the last set was harder than planned), the same set last time, plates per side (plates.say), th |
| `check_in` | PUT | `/readiness/{date}` | Sleep, soreness and energy: ask before every session (checkIn says when missing), record them (1-5); recovered after ill (back.ask); comeback (same or |

## Sessions and sets

| op | method | path | what it does |
|---|---|---|---|
| `list_sessions` | GET | `/sessions` | Past sessions, newest first, filtered by local date range, category, program, activity (run, ride…) or activity group (cardio, outdoors…). Each lists  |
| `start_session` | POST | `/sessions` | Start a workout (category: Push, Legs, Run…); with sets, startedAt and endedAt, a past one at once. gym: a saved gym (default: the day's). This sessio |
| `get_last_session` | GET | `/sessions/last` | Before a session, read the last one of its category in one call: notes, effort and feel (and who set them), each exercise's top set, what the person s |
| `get_open_session` | GET | `/sessions/open` | The session in progress, if there is one (404 when there's none). Check it before start_session. |
| `delete_session` | DELETE | `/sessions/{sessionId}` | Delete a whole session that was logged by mistake. The event log keeps a copy. |
| `get_session` | GET | `/sessions/{sessionId}` | One session with all its sets. |
| `update_session` | PATCH | `/sessions/{sessionId}` | Fix a session: name, category, program, times, bodyweight, notes, gym ("home today"; null: the day's), barKg, platesKg, gymDumbbellsKg, gymKettlebells |
| `get_session_summary` | GET | `/sessions/{sessionId}/after` | After a session: plan against done, wins, records (each top set and the best it beat), the last session of its kind, sets per muscle this week, recove |
| `get_session_detail` | GET | `/sessions/{sessionId}/detail` | One session against the person's history: totals against the last of its kind, each set against last time, estimated 1RM, records, a verdict and next  |
| `end_session` | POST | `/sessions/{sessionId}/end` | End the session in progress, with optional notes and two ratings, asked separately: "How hard was it, Easy to Max?" (`rating`, the effort) and "How di |
| `get_previous_session` | GET | `/sessions/{sessionId}/previous` | The session before this one, same category by default, as get_last_session reads it: notes, effort and feel, top sets, what was said and asked, next t |
| `log_said` | POST | `/sessions/{sessionId}/said` | After a session, keep the person's own words about it (quote), the one question you asked (question), or both (the answer to it), optionally about one |
| `log_sets` | POST | `/sessions/{sessionId}/sets` | Log sets as they happen: the exercise by id, name or alias; reps and weight (unit unless given), or duration/distance for cardio. The reply's say is w |
| `delete_set` | DELETE | `/sessions/{sessionId}/sets/{setId}` | Delete a logged set (a typo or a double log). The event log keeps a copy. |
| `fix_set` | PATCH | `/sessions/{sessionId}/sets/{setId}` | Correct a logged set: reps, weight, exercise, RPE, warm-up, duration, distance, time, notes or its bar (barKg). confirmed: true alone answers a held s |

## Exercises

| op | method | path | what it does |
|---|---|---|---|
| `search_exercises` | GET | `/exercises` | Find exercises: the shared starter catalog plus the user's own, by forgiving name or alias ("bench", "OHP"). Search before creating one. Hidden exerci |
| `create_exercise` | POST | `/exercises` | Create the user's own exercise when nothing in search_exercises fits: give its activity and the muscles it works (muscles.primary, muscles.secondary). |
| `delete_exercise` | DELETE | `/exercises/{exercise}` | Delete one of the user's own exercises that no session uses (a mistake or a duplicate). For anything with history, hide it instead. |
| `get_exercise` | GET | `/exercises/{exercise}` | One exercise with the user's settings for it (rep range, increment, notes, loadType and its loadLabel: what a set's number means; barInUseKg: the bar  |
| `update_exercise` | PATCH | `/exercises/{exercise}` | Change an exercise. Starter exercises take training settings only (rep range, increment, notes, loadType, barKg, loadsKg: its loads, kg), kept for you |
| `hide_exercise` | POST | `/exercises/{exercise}/archive` | Hide an exercise from search, with an optional reason ("elbow"). Its history, PRs and charts stay, and logging it again brings it back. |
| `get_exercise_history` | GET | `/exercises/{exercise}/history` | Recent sessions for one exercise: top set, volume and estimated 1RM. Use it to coach and to spot trends; show: what to show at home (series draws the  |
| `get_suggestion` | GET | `/exercises/{exercise}/suggestion` | The suggested weight and reps for the next session of one exercise, from its history and rep range. |
| `show_exercise` | POST | `/exercises/{exercise}/unarchive` | Show a hidden exercise in search again. |

## Plan and away periods

| op | method | path | what it does |
|---|---|---|---|
| `list_away` | GET | `/away` | The person's away periods (time off: holiday, ill, injured or busy), each with its days (from, until), whether they'll train while away, and a note. D |
| `set_away` | POST | `/away` | Mark time off: from and until (local dates, inclusive; from may be past, a gap marked afterwards), reason, training (a lighter travel plan) and note.  |
| `remove_away` | DELETE | `/away/{awayId}` | Remove an away period marked by mistake (a trip that didn't happen): its days count as planned again. The event log keeps a copy. |
| `update_away` | PATCH | `/away/{awayId}` | Change an away period: its days, reason, training or note. "I'm back early": until today's date ends it today. Overlapping: 409 overlaps. One undo. |
| `get_plan` | GET | `/plan` | The plan: focus, pace and time, the intake (experience, limitations, the health check, starting weights, dislikes, equipment), the program and its del |
| `update_plan` | PUT | `/plan` | Set the plan: focus, pace, time {daysPerWeek, minutes, days, where, cardio}, endurance {sports}, and the intake: experience, limitations, health answe |
| `shift_plan` | POST | `/plan/shift` | After a missed planned day (get_today's missed), move the plan as the person chose: order (missed sessions since from, in turn from today, the rest mo |
| `preview_focus` | GET | `/plan/switch` | What switching the plan's focus would change, before anything moves: the food before and after, the goals that work against the new focus (each with i |
| `fill_week` | POST | `/plan/week` | Plan the coming week (default next Monday to Sunday) from last week: each empty day takes that weekday as done (swaps included) or as planned; planned |
| `clear_plan_day` | DELETE | `/plan/{date}` | Remove one planned day from the plan. The event log keeps a copy. |
| `plan_day` | PUT | `/plan/{date}` | Plan one local day, replacing what was planned: category, and exercises by name or alias with sets, reps and weight (and restSec), or distance and tim |

## Goals and skill ladders

| op | method | path | what it does |
|---|---|---|---|
| `list_goals` | GET | `/goals` | The person's goals, each with its progress and track: start, now and target, the status (not started, on track, behind, almost, holding, broken, reach |
| `set_goal` | POST | `/goals` | Set a goal named by its target, not the focus (400 focus_in_title): lift, performance, consistency (400 repeats_plan if the plan has days), body, food |
| `remove_goal` | DELETE | `/goals/{goalId}` | Take a goal off the dashboard (achieved or dropped). The event log keeps it. |
| `get_goal` | GET | `/goals/{goalId}` | One goal as its page shows it, for "how's my squat goal going?": its track, its history (the chart's points: readings, a lift's best set each session, |
| `update_goal` | PATCH | `/goals/{goalId}` | Change a goal: title, why, target, due date or program. Custom: progress and done. Skill: steps, current (a step's number, by hand), reached (the pers |
| `search_skill_ladders` | GET | `/skills/ladders` | Starter ladders for a skill goal (first pull-up, push-up, pistol squat, handstand, muscle-up, L-sit, first 5 km), each with its steps and where this p |

## Habits and benchmarks

| op | method | path | what it does |
|---|---|---|---|
| `list_benchmarks` | GET | `/benchmarks` | The person's benchmarks: each test with every result against the last one, the latest, and the next one (due, and the day the plan placed it). get_tod |
| `create_benchmark` | POST | `/benchmarks` | Repeat a test every few weeks: maxReps, holdSec, time over distanceM, or rm (1-5 reps). The plan puts it first after warm-ups on a matching day; that  |
| `stop_benchmark` | DELETE | `/benchmarks/{benchmarkId}` | Stop a benchmark. It leaves the plan; its results stay. |
| `get_benchmark` | GET | `/benchmarks/{benchmarkId}` | One benchmark as its page shows it: the latest result and its change, every result with who logged it, how, every, next, and show (Date · Result · Cha |
| `update_benchmark` | PATCH | `/benchmarks/{benchmarkId}` | Change a benchmark's name, how often (every: "6w") or how. |
| `correct_benchmark_result` | PATCH | `/benchmarks/{benchmarkId}/results/{date}` | Correct one day's result (a miscount): value in reps, seconds or weight (rm, in unit). The set stays as logged. |
| `list_habits` | GET | `/habits` | The person's habits: each tick or count with its days, today's state, the streak (only its days count; a pause waits), the best, the last 4 weeks and  |
| `create_habit` | POST | `/habits` | Start a habit after the person's yes: a tick or a count with its target a day and unit (supplements: "Creatine, 5 g"; limit true: at most), on its day |
| `stop_habit` | DELETE | `/habits/{habitId}` | Stop a habit. It leaves Today; its history stays. |
| `get_habit` | GET | `/habits/{habitId}` | One habit as its page shows it: streak, best, 4 weeks, the grid, a pause, fromMeals (what meals' extras added, from: meal, under health consent), and  |
| `update_habit` | PATCH | `/habits/{habitId}` | Change a habit: name, target, unit, days, limit (at most), or pausedUntil (travel, illness: the streak waits; null ends the pause). |
| `tick_habit` | POST | `/habits/{habitId}/ticks` | Tick a habit (today, or date), set a count's number (count) or add to it (add: "took 2 g more"); done: false takes a tick off. Undoable. Never mid-ses |

## Endurance zones

| op | method | path | what it does |
|---|---|---|---|
| `get_zones` | GET | `/zones` | Training zones per sport (run paces, ride watts, swim per 100), each from its newest source: a test (5k, ftp20, css benchmarks), a race, or set by han |
| `set_zones` | PUT | `/zones/{sport}` | Set a sport's zones by hand, with where the number came from: run {timeSec, distanceM?} (a 5 km or a race), ride {ftpW, test?}, swim {cssSec} or {t400 |

## Body readings

| op | method | path | what it does |
|---|---|---|---|
| `list_measurements` | GET | `/body` | Body readings (scale, scan, tape), newest first, each with its device and change against the last reading, any device (deviceChange: say its line); de |
| `log_measurements` | POST | `/body` | A weigh-in, scan or tape, with source {device, method}. From a screenshot, log every number it shows: bodyFat, fatMass, skeletalMuscle, muscleMass, bo |
| `rename_body_device` | PATCH | `/body/devices/{device}` | File every reading from one device under another name, when the person says two names are the same machine ("my Bathroom scale is the RENPHO"). rename |
| `delete_measurement` | DELETE | `/body/{readingId}` | Delete a body reading logged by mistake. The event log keeps a copy. |
| `fix_measurement` | PATCH | `/body/{readingId}` | Correct a body reading: a misread value (null removes it), the time, the source, the extra values or the note. confirmed: true alone answers a held re |

## Pain log

| op | method | path | what it does |
|---|---|---|---|
| `list_pain` | GET | `/pain` | The pain log: each area from the last 4 weeks with its latest level and Rising, Steady or Easing; what changes today (10% lighter at 5+ or rising, out |
| `log_pain` | POST | `/pain` | Log an ache in one line ("left knee 3/10 on squats"): area, side, 0–10, what it was during. Say its say line. At 5+ or rising its lifts are 10% lighte |
| `delete_pain` | DELETE | `/pain/{painId}` | Delete a pain entry logged by mistake. The event log keeps a copy. |
| `fix_pain` | PATCH | `/pain/{painId}` | Correct a pain entry: its area, side, level, what it was during, note or time. |

## Programs

| op | method | path | what it does |
|---|---|---|---|
| `list_programs` | GET | `/programs` | Training programs: the current one (week N of M, its block, each day of the plan so far as its status: done, changed, missed, planned, away, rest or l |
| `set_program` | POST | `/programs` | Start a multi-week program: name, weeks, blocks (Base weeks 1-3, Build 4-8…). Starting one ends the program running then. Then plan its days with plan |
| `remove_program` | DELETE | `/programs/{programId}` | Remove a program set up by mistake. To stop one the person trained in, end it instead (update_program with endedOn). The event log keeps it. |
| `update_program` | PATCH | `/programs/{programId}` | Change a program: name, start, weeks, blocks or notes. End it early with endedOn (its last day) and a result in the person's words. |

## Coach (Pro)

| op | method | path | what it does |
|---|---|---|---|
| `get_coach` | GET | `/coach` | The coach's checks (Pro): stalls, push-pull imbalance and training load as insights to act on, this week's plan, load against the 4-week average, last |
| `update_insight` | PATCH | `/coach/insights/{insightId}` | Accept or dismiss one of this week's insights (Pro). Accepting a stall lowers that lift on the next planned day to the deload weight; tell the person. |

## Food

| op | method | path | what it does |
|---|---|---|---|
| `get_nutrition` | GET | `/nutrition` | Food against the goal: the targets and how they were worked out (profile.weightBasis, worked.proteinBasis), today (eaten, left, the lead, in words), e |
| `list_saved_meals` | GET | `/saved-meals` | The person's saved meals ("usual breakfast", "whey, one scoop"), by name, with their numbers: log one with log_meal {savedMealId} or {name}. usuals: s |
| `save_meal` | POST | `/saved-meals` | Save a meal to log again by name: its name and numbers (and extras: its supplements), or fromMealId ("save this one", extras included). The same name  |
| `delete_saved_meal` | DELETE | `/saved-meals/{savedMealId}` | Delete a saved meal. Meals logged from it stay. The event log keeps a copy. |

## Activity log and undo

| op | method | path | what it does |
|---|---|---|---|
| `list_activity` | GET | `/activity` | The trail of writes, newest first: who made each (a key by name, or the person), what changed (before and after), the reason, and its undo call for 7  |
| `undo_change` | POST | `/activity/{eventId}/undo` | Undo one write ("undo that"): its items go back as they were; a delete comes back. Then say the reply's say line. Undoing the undo is redo. Refused (4 |

## Support and agent reports

| op | method | path | what it does |
|---|---|---|---|
| `report_issue` | POST | `/agent-reports` | Report what you noticed calling the API: a read cut off (truncation), a bug, a feature request, an API anomaly. One cheap call: only kind and call.end |
| `get_report_status` | GET | `/agent-reports/{reportId}` | A report you made: its cluster (how many reports share its signature, in 24 hours and in all), the issue once one is filed, and the resolution (open,  |
| `contact_support` | POST | `/support` | Send Shredpace support a bug, an idea, a plan question or anything else for the person, after their yes to your one-line confirm. Give them the refere |

