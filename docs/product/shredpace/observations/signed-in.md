# Signed-in observations

**The first time a signed-in screen was actually rendered.** Until 2026-11-18 every dashboard board
in this folder was reconstructed. On that date the account owner signed in to ShredPace in their own
Chrome, and about 30 routes were visited by URL and read as text, with a few screenshots. This file
records what those pages showed.

## Method, and what was kept out

- **Read-only.** Navigation by URL hash only. Nothing was clicked that could change the account: no
  *Open*, *Copy*, *End session*, *Create key*, *Revoke*, *Send* or *Sign out*.
- **Not stored here:** the account's name, email address, session times, and any other personal value
  that appeared on screen, and no screenshot was saved to disk. Only labels, layout and the publisher's
  own copy are recorded. (The privacy policy is public and is quoted by section, not reproduced.)
- **Two visits.** The first (about 30 routes) was on an almost-empty account. The second, later the same
  day, followed the account owner logging **one leg workout** through their agent. See *Second visit* below.
- **The account was nearly empty on the first visit.** It was created the day before, with one agent connected, an
  agent-written 8-week program, one open session and no meals, weigh-ins, goals or bests. So **empty
  and first-run states are observed; populated states are not.** Data-heavy boards (progress charts,
  food days, body trends, a filled Activity list) remain reconstructions.
- **Plan:** *Early Pro*, so everything in Pro was on. **The Free-plan locked screens were not seen.**
- **Theme:** Studio, light, desktop at about 1440 px and a 390 px phone width. Other themes, dark mode
  and tablet widths were not seen.

## Confirmed against the earlier reconstruction

| Claim in this folder | Observed |
|---|---|
| Studio is a user-facing look and a new account's default | **Yes** — it is the theme on a new account, shown as "Studio · your device's mode" |
| In Studio the agent does the writing; each edit has a sentence to copy | **Yes** — nearly every screen ends with a *Tell Claude* block of quoted sentences with a **Copy** button |
| `#signin` redirects a signed-in user to `#today` | **Yes** |
| `#upgrade` shows the plan page | **Yes** — it redirects to `#settings/plan` |
| Health-consent text is at version 6 | **Yes** — "text version 6" on the Privacy page and the consent page |
| Week 1 is "finding your weights", with the RPE scale | **Yes** — a Today card says so, with "RPE 10 = nothing left · 9 = one more rep · 8 = two more · 7 = three more" |
| A program whose days differ from the plan's time raises a mismatch | **Yes** — "Your program has 3 days a week; your time says 4" |
| The Coach has three preferences | **Yes** — Morning plan check · Weekly recap on Monday · Tell me about stalls and imbalances |
| Undo works for 7 days | **Yes** — stated on the Activity page |
| Free-text agent sentences are the input method | **Yes** |

## Corrections this forced

| Earlier statement | Reality |
|---|---|
| The avatar menu is a short list under the picture | A **bottom sheet** on phone with **nine rows**: Your plan · Coach · Your agents · What changed · Settings · Appearance · Subscription · Contact us · Sign out. Plus the person's name, email and a plan pill |
| Today's six tiles were unnamed | **This week · Volume · Strength · New bests · Streak · Time trained** |
| Privacy policy "last updated 15 November 2026" (invented) | **"Updated 24 October 2026"** |
| The Contact form's fields (invented) | Topic · Subject (max 200) · Message (max 2,000) · "Reply to" the account email · a removable "Sent with this" line |
| `#more` is "a bottom-sheet menu rather than a route" | Confirmed on phone. **On desktop `#more` simply shows Today with the menu content appended** |

## Navigation, as built

- **Five tabs:** Today · Training · Food · Body · Goals. A phone shows them as a **floating rounded
  tab bar** (icon above label), not a full-width bar.
- **A second group, "TOOLS":** Ask Claude · Your agents · Coach · Settings.
- **Training has three sub-tabs:** Sessions · Progress · Exercises. **Coach has two:** Plan · Coach.
- **The rail's footer is an agent status card:** *"Claude is connected · Last heard HH:MM · logs every
  set you send"*.
- A small floating button sits on the right edge of every screen.
- **`#connect` is a standalone page with no rail:** "YOUR AGENTS · Claude is connected · Last call 1 h
  ago · Go to Today › · Add another agent".

## Screen by screen

### Today (`#today`)
- **Header:** *Hello, {first name}.* · *Here's your training today.* · the date. A **green dot on the
  avatar** shows the agent is connected.
- **Banner cards:** a **forgotten-session card** ("Full Body is still open · Open · since … no sets
  logged. Ending it closes it now." with a copyable sentence and *It's still going*); a **first-weeks
  card** (Week 1 · RPE scale).
- **Body figure:** anatomical, with **Front / Back**, *Drag to turn*, a **Fewer sets ↔ More** legend and
  *"Nothing trained yet this week"*. A caption: *"Tracked by your agent, set by set."*
- **Six tiles, three tinted** (green, peach, pink on light): *This week* ("of 4 sessions", names the next
  planned days) · *Volume* ("tonnes this week") · *Strength* ("kg · no lift yet") · *New bests* ·
  *Streak* ("weeks in a row · Your best") · *Time trained* ("hours this week"). Each tile says where it
  opens ("opens Progress", "opens Training › Sessions").
- **Today's Timeline** — a 6:00–21:00 axis; empty state *"Nothing yet today. Tell Claude when you
  start, or what you ate."* **Recent Insights** — *"Nothing new from your coach this week."*

### Training
- **Sessions** — filters *All · Strength · Cardio · Outdoors*; *THIS WEEK · n SESSIONS* as rows (a date
  block, a title, an *In progress* chip, a time range); side panels *Last 7 days, every activity*,
  *Your plan this week 0 of 4* and *Last 4 weeks · Minutes, every activity* (weekly bars).
- **Progress** — *Since you started · {date} (n weeks)* · *Workouts* · *Weeks trained* · *Your strength*
  (*"Log a lift with a weight and your strength shows here, week by week."*) · *Bests* · *Your year*
  (*"one square a week · dashed: before you started · faint: still to come"*) · *Longest streak*.
- **Exercises** — a master list (*name · Equipment · rep range*, e.g. "Barbell · 5–8") with columns
  *Main muscle · Also works*, and a detail pane: *Main muscle · Also works · Rep range · Increment ·
  Loaded as* ("sets the label and the maths") · *Your progress — estimated 1RM* · *Notes from your
  trainer* · **"Movement demo: coming soon"**. Copyable sentences: *"Change how {exercise} is loaded"*,
  *"Hide {exercise}"*.
- **Before** (`#before`) — breadcrumb *TODAY › BEFORE*; with nothing planned: *Nothing planned · No
  targets for today · Your next planned day is … · **Preview targets ›*** and *"Training anyway? Tell
  Claude 'starting full body'"*.
- **During** (`#during`) — *{Session} · {time} · Live from Claude*; the current exercise (*Next · set 1
  of 3 · × 12*); an **Up next** list (*3 × 8–12 · find it*); copyable *"Log my next set"*, *"Swap this
  exercise"*, *"End my session"*; and *"This page updates as Claude logs."*

### Plan and Coach
- **Plan** (`#plan`) — *FOCUS · Not set yet* ("Pick what you're training for, and your goals, program
  and food targets follow from it. Or tell your agent: 'set up my plan'. It asks the same four things.");
  *TRAINING · n days a week · Program: … week 1 of 8*; the mismatch warning; a **Mon–Sun strip** with the
  planned day names; *Your zones ›*.
- **Program** (`#plan/program`) — *CURRENT PROGRAM · WRITTEN BY YOUR COACH* · *WEEK 1 / 8* · *STUCK TO
  IT 100%* · block descriptions (*Foundation wk 1–3 … Build wk 4–7 … Deload wk 8*) · a Mon–Sun grid with
  the legend *Done as planned · Done, changed · Missed · Planned* · *Your goals* · *Programs — Ask your
  coach for a new one* · *Runs, rides and swims — "Send your agent a GPX, FIT or a screenshot from
  Strava or Garmin; it logs the run."*
- **Zones** (`#plan/zones`) — three cards, *RUN · NO TEST YET — A 5 km time trial sets your paces*,
  *RIDE — A 20-minute FTP test sets your watts*, *SWIM — A 400 and a 200 set your CSS*; and *"Heart rate
  zones show instead where there's no test yet."*
- **Plan setup** (`#plan/setup`) — in Studio the page tells the person to ask the agent: *Goal · Days
  and time · Program* rows and the sentence *"Set up my plan: ask me what you need"*.
- **Coach** (`#coach`) — *"your coach worked overnight"* · **Nothing to change this week** · *"Nothing
  flagged yet. The checks need some history: a stall after 5 sessions of a lift, your load after 2
  weeks."* · a **Load and recovery** gauge (*Detraining · Building · Pushing · Risky*) that *"Shows
  after two weeks of training"* · *Last week's recap* (*email coming soon · Share recap card coming soon*)
  · *How your coach checks in* (three On/Off rows).

### Food and Body and Goals
- **Food** — a day navigator (*‹ Tue 17 Nov · Today*); *Your daily targets — kcal* with the explanation
  *"calories first to lose fat, protein first to build muscle, a band to maintain, carbs around training
  to perform"*; **Meals** table *Time · Meal · kcal · Protein · Carbs · Fat · Source* ("click to correct ·
  logged by your agent"); *Last 14 days*; *Bodyweight*. Empty: *"Tell Claude 'had porridge and a
  coffee', or send it a photo."*
- **Food targets** (`#food/settings`) — *Focus* · switches **Calories · Protein, carbs and fat · Fibre
  (off) · Show numbers** ("off: Today shows on track or not, without figures").
- **Usuals** — *"No usuals yet. Tell your agent 'save this as my usual' after a meal."*
- **Body** — *Your weight, over time* · *"Send Claude a screenshot of your scale's app, or say a number."* ·
  *Your metrics · Add ›* (*"Resting heart rate, steps, grip: anything you track."*). **Scans** —
  *ALL SCANS · No scans yet* · *"A partial scan shows what it has; its metrics' pages skip it for the rest."*
- **Goals** — *No focus yet · Set up your plan ›* · *Your goals* · *"A lift to hit, a pace, a body-fat
  number, or a guard that warns when strength slips."*

### Account
- **Settings** is two groups. **"Yours, here"** (the person's own): *Appearance · Agents and keys ·
  Privacy and consent · Plan (Early Pro) · Your data, your account (Export, sign out, delete account) ·
  Fix it by hand ("edit here for an hour")*. **"Set by your agent"**: *Name and units · Body type ("How
  your figure is drawn") · Your gym · Food goal · Coach check-ins · What your agents know (n notes) ·
  "Workouts, sets, food, body, goals — shown here; changed by telling your agent"*. Units shown were
  **kg and km**.
- **Appearance** — all seven themes with taglines (Ember "Charcoal and orange, condensed italic" · Chalk
  and iron "Graphite, chalk and lime, sharp" · Trail "Slate, paper and signal yellow" · Blush "Rose and plum,
  a soft italic serif" · Sage "Sage and cream, calm and airy" · Lilac "Lavender and violet, crisp and
  modern" · Studio "Warm paper, frosted cards, light type"); **Mode** System / Light / Dark with *"Follows
  your device. It is light right now."*; *"Saved to your account, so your phone and laptop match. Your
  agent can change it too."*; and a **live preview** card.
- **Your gym** (`#settings/gym`) — *Free weights*: **Bar · Plates · Dumbbells · Kettlebells · Machines**,
  each with an *Agent* badge; defaults *20 kg, the usual* and *25, 20, 15, 10, 5, 2.5, 1.25 kg*; and
  *"Until your agent knows, dumbbells, kettlebells and machines round to 2.5 kg steps."*
- **Privacy** (`#settings/privacy`) — *Health details · On · Agreed {date}, on the link your agent sent ·
  text version 6 · read it* · *Kept now: n body readings, n meals, n check-ins · download (JSON)* ·
  *Turn off and delete* · *Make a privacy request ›*.
- **Plan** (`#settings/plan`) — *Early Pro — "Free while Shredpace is in early access. Everything in Pro is
  on…" · "When pricing is ready you'll see the date here at least 14 days ahead. Nothing you log is ever
  deleted." · Help shape Shredpace · Send feedback*.
- **Welcome** (`#pro`) — *"Almost there · Finishing up…"* with four ticks (*Your whole history · Several
  agents: add Grok beside Claude · The coach's take, every week · Five more themes, and export*), *Pick a
  theme*, *Back to Today ›*.
- **Activity** (`#activity`) — *"Everything your agents and you have changed. Undo works for 7 days; older
  items open where you can change them."* Filters **WHO** (Everyone · each agent · You) and **WHAT** (All ·
  To check · Sessions · Food · Body · Goals and plan · Settings); rows with a time, an initial, a
  sentence, who, *Details* and *Open ›*, grouped by day. *"Each agent is named after its key … Removing a
  key keeps its history here."*
- **Avatar menu / More** — see Corrections.
- **Contact** (`#contact`) — *"A person reads every message. Write in your own words; there's no wrong
  topic."* · topic chips *Something's broken · An idea · Plan or billing · Privacy request · Something
  else* · *Subject 0 / 200* · *Message 0 / 2,000* · *Reply to {account email} · your account email* ·
  *"Sent with this: the page you came from, app version {n}, your browser · Remove"* · *"Please don't
  include health details, passwords or API keys."* · **Send**.
- **Consent page** (`#consent`) — *YOUR AGENT SENT YOU HERE · Health details · Done. Tell your agent it
  can try again.*
- **Privacy policy** (`#privacy` / `#credits`) — *Updated 24 October 2026*. Sections: **Who's responsible**
  (a named operating company as controller; a privacy mailbox) · **What's stored** · **Signing in with
  Google** · **Health details and your consent** · **Why we may use it** · **Your agents** · **What we
  don't do** · **Export or delete** · **Your rights**. Facts worth keeping: error logs are kept **one
  month**; contact messages **until a year after resolution**; billing records **6 years**; the consent
  record **3 years after the account is deleted**; paused health data gets **30 days** before deletion;
  keys are stored **hashed, with the name and first 8 characters kept**; **no analytics, trackers or ads**.

## Second visit: after one logged workout

The owner asked their agent to log a leg workout (three sets of a squat and one set of a Romanian
deadlift). Nothing else was logged: **food, body, goals and the plan focus stayed empty**. Read-only
again. So this adds the first *populated* training screens and nothing more.

**Checked against the agent guide, and matched**
- **Estimated 1RM uses Epley and rounds to the whole kilogram.** 100 kg × 5 showed as **117**
  (formula: 116.7) and 80 kg × 8 as **101** (formula: 101.3).
- **First marks.** After the first session Progress shows *"FIRST MARKS · 2 new lifts · Today's best set
  of each lift. Next time is measured against these."* Each lift lists its set and e1RM, and says
  *"The chart and its % start with a second week."*
- **A set is credited to its primary muscle.** The body figure tinted the quads and labelled them
  *"3 sets"* and the hamstrings *"1 sets"*: three squat sets and one deadlift set.
- **An open session is finished by the agent.** The Activity feed shows the agent *Finished* the previous
  day's empty session, *Changed* it, *Started* a new one, then *Logged 4 sets*. This is the guide's
  "end a stale session first" rule, performed by a real agent.

**New things only visible with data**
- **Today fills in.** A banner *"Claude changed 4 things today · What changed ›"* with the latest
  line (*"Logged 4 sets in Leg workout"*). The body figure is **tinted red on the trained muscles** with
  a leader line and a callout (*"Quads · 3 sets · Wednesday"*); a *Front / Back* toggle flips it.
- **Tile values.** *This week* — `1` *of 4 sessions*, an *On plan* chip, and the next two planned day
  names; *Volume* — `2.1` *tonnes this week*; *Strength* — `100` *kg · {lift}, best set*; *New bests* `0`;
  *Streak* `1 weeks in a row`; *Time trained* `0:11` *hours this week*. The **This week** tile carries a
  concentric-rings graphic and **Volume** a wave line.
- **The timeline** shows the open session as a block: *"{session} · {start} – now · 4 sets · In progress"*.
- **An in-progress session's row opens the live Today view**, not a separate session page.
- **Sessions list.** Rows show a date block, a name, an *In progress* chip, a time range, *sets* and
  volume (*"4 sets · 2.1k kg"*). A *"Strength 10 min"* summary appears under *Last 7 days*, and the
  plan panel shows which planned day was done.
- **Progress.** *Workouts · Lifted ({n} t) · Weeks trained*, a **What you trained** panel with the last
  workout's muscles (*"So far: glutes, quads, hamstrings and adductor magnus."*), **Bests** (one e1RM per
  lift, dated), and *Your year*.
- **The plan strip** puts a **✓** on the day done and fills the new planned day.
- **Exercise detail.** *Main muscle · Also works · Rep range ("your setting") · Increment ·
  **Loaded as*** ("log the total, the bar included"), a **Bar** choice (including a note that a Smith
  machine does not count the bar), and *Your progress — estimated 1RM · 1 session*.

**Small bugs seen with data**
1. **"1 sets"**: the plural is wrong for a single set on the body figure's label.
2. **"2.1k kg"** is how a session's volume reads on the Sessions list (the "k" and the unit run together).
3. **"0:11 hours this week"** means 11 minutes: the tile's unit label is wrong below an hour.

**Still not seen:** a session's own detail page (an in-progress session does not open one), a
finished session's After page, a second week of progress (the chart is held back until week two), any
populated Food, Body or Goals screen, and the Coach with insights.

## Third visit: after a meal, a weigh-in and a new program

The owner then had their agent log **one meal**, **one weigh-in** and **a different 8-week program**. Still
no goal and no plan focus. Read-only again.

**What the new data showed**
- **A meal row** — *Time · Meal · kcal · Protein · Carbs · Fat · Source*, with the source written as plain
  words (*"you said"*). Food's header line becomes *"Last 14 days · average 650 kcal · 35 g protein"*, and
  *"Set a goal to see your days against a target."* **The daily targets stay "— kcal" until a focus is set**,
  which confirms targets depend on the plan's focus.
- **Today's timeline now includes meals**, as a block next to the session (*"{meal} · {time} · {kcal} kcal ·
  Logged"*), as the guide says.
- **Body becomes a grid of six metric tiles** — *Weight · Body fat · Muscle · Waist · Visceral · BMR · Fat
  mass* (seven names appear, six at a time). The weight tile reads *"{value} kg · 7-day average {value} kg ·
  Latest {date}"*; the others say *"not logged yet"*. Beneath: *"Each tile is its metric's latest value, its
  change under it; an older one carries its date."*, a *Goals on these numbers* panel, and **Every reading**
  (*"latest reading · change since {date}"*, with *"same"* when there is only one).
- **Starting a new program ends the old one.** The Program page lists the new program as *current*, and the
  previous one under *Programs* with its length and an adherence figure (*"1 week · Nov 2026 · 100%"*).
  *Stuck to it* shows "—" until a planned day has passed.
- **A program describes its blocks** — *Accumulation wk 1–3 · Build wk 4–7 · Deload wk 8*. The deload is
  described as *"About half the sets, lighter weights to recover"* **in both programs generated so far**.
- **The mismatch warning disappears** when the program's days match the plan's time (*"4 lifting days · no
  cardio"*). A new line names the block (*"week 1 of 8 · Accumulation block · Program ›"*).
- **The first-weeks card follows the program.** It now says *"work up until a set of 6 feels like 2–3 reps
  were left"* where it said 10 before, so its rep count comes from the current program's range.
- **Agent writes are one per day.** The Activity feed shows *Added a program* followed by six separate
  *Planned {date}: {day}* entries, covering only the first two weeks of an eight-week program, plus
  *Weight 82.3 kg*, *Added a meal* and *Changed a session*. A new program's plan **replaced** the earlier
  program's planned days for the same dates.
- **A banner counts the day's changes** — *"Claude changed 14 things today"* — with the most recent line.

**Contradiction found with data**
- **Food's Bodyweight panel still says "No weigh-ins yet"** (*"Tell your agent your weight in the morning,
  before eating: the trend shows after a few."*) **while Body shows a 82.3 kg weigh-in**, on two loads six
  seconds apart. The panel may be waiting for several readings, but its wording says there are none.

## Fourth visit: a body-fat reading and a goal

A body-fat reading (18.0%) and a goal, **"Body fat down to 15%"**, had been added. The plan focus was still
unset, so food targets stayed empty. Read-only again.

- **A goal card** reads *BODY · BODY FAT · Early days · {title} · Start {x} · Now {x} · Target {x}*, then
  a sentence that does the arithmetic: *"Trends need 3 readings or more; it needs 0.9 points a month to
  make 28 February."* That matches the guide's rule that a trend needs three readings, and 18 → 15 over
  about 3.4 months is 0.9 a month.
- **Body** fills the Body-fat tile (*"18.0%"*), lists the goal under *Goals* as *"Body fat down to 15% ·
  Early days · 18% → 18% → 15%"*, and adds Body fat to *Every reading*.
- **Still empty after this:** plan focus, food targets, weight trend, the Coach, and a finished session.
  The Food page's Bodyweight panel still said *"No weigh-ins yet"* with a weigh-in on Body.

## Fifth visit: a plan focus, a run, goals, a habit, a scan, an ache and a gym

The owner filled in most of the account. Still read-only. **The strength session from the first visit is
still open**, so a finished strength session with sets was never seen.

**The numbers matched the guide's food rules.** With the focus set to *Lose fat, build muscle* (recomp)
the Food targets page showed **2,450 kcal a day on average**, protein **165 g** (2 g per kg of 82.3 kg),
carbs **300 g**, fat **65 g** (*"at least 0.6 g per kg for hormones"*) and fibre **30 g**. Training days
read **2,600** and rest days **2,300**, so **150 above and 150 below the average**, the 300 kcal gap the
guide states for a recomp. On a training day carbs were 340 g and the page said *"Workout burn is never
added back."* The Food page's **Bodyweight panel now showed the weight**: the earlier "No weigh-ins yet"
was the panel waiting for a focus, not a missing reading.

**The Progress recomp card** read *"Week 1 of 12 · Early days"* and listed the three trend inputs the guide
names: **waist** (*"1 readings: a trend needs 3"*), **the main lift's e1RM** (*"Not enough sessions yet"*)
and **body fat from the same scale**, plus a **weight band** drawn as *80.3 — 82.3 kg · steady, as it
should be — 84.3*, which is the guide's ±2 kg band.

**Routes and what lives behind them**

| Route | Page |
|---|---|
| `#goal/{uuid}` | A goal: *Start · Now · Target*, a small chart, **Details** (Measures, Due, Why, Set by whom, *Goes with* a food target) and a copyable "mark done" sentence. A **skill goal** also lives here and shows its four-step ladder |
| `#habit/{uuid}` | A habit on its own page without the rail: *Streak · Best · 4 weeks*, a 4-week grid (*"filled: done · grey: missed"*), *"5 g a day, every day. Ticked by you or your agent; today isn't ticked yet."* |
| `#metric/weight` and the other body metrics | Tabs *Weight · Body fat · Muscle · Waist · Fat mass · Visceral fat · BMR*, range *W · M · 3M · Y · All* with paging, readings (*"Tap one to fix or delete it"*) and an *About* paragraph |
| `#metric/{uuid}` | A custom metric: *"Lower is better · logged daily · by Claude"*, a *Goal* block (*"No goal for it yet. Set one ›"*), readings, *Edit the metric ›* |
| `#ache/{area}/{side}` | **Not an id**: `#ache/knee/left`. Level and trend, a 0–10 chart, *What changes* (*"under 5/10 and not rising, your plan stays as it is"*), the log, and the 7/10 message with *"Shredpace doesn't diagnose."* |
| `#body/scan/{uuid}` | One reading: *"Your first measure: changes show from the next one."*, *Fix a value ›*, *Delete this scan* |
| `#body/scans` | Rows with a date, a device (*by hand*, *InBody 570*), the headline value and *"only these"* for a partial reading or *"+2 more"* for a fuller one |
| `#session/{uuid}` | A finished session. A run shows *Distance · Time · Pace · Calories (estimate)*, **Against your runs** (fastest 5 km, runs this month, average pace) and *Muscles — "From the activity, not from sets: an estimate"*. A strength session shows *Time · Working sets · Volume · Records · Calories*, *"You did 0 of 15 targets"* and a **Coach's take** |
| a session still in progress | opens the live **Today**, not a session page |
| `#settings?agents` | "Your agents" is a link into Settings, not its own route |

**Smaller things**
- **"Ask Claude" in the rail is a button, not a page.** It copies an example sentence (*"Bench 80 × 8, felt good"*).
- **Banners fold**: Today's cards end in *"Show 1 more ›"*.
- **The Time trained tile shows a target** (*"16% of 4 h"*): four days at about 60 minutes from the plan's time.
- **Activity** now names more kinds of write: *Added a body reading*, *Added a body scan*, *Saved a meal*,
  *Added a goal*, *Changed a gym*, *Logged 5 km run (1 set)*, *Added a program*.
- **The Gym page summarises dumbbells as a range** (*"2.5 to 30 kg in 2.5s"*) and names the gym "My gym".
- **Zones stay "no test yet" after a 5 km run is logged**, so a run only sets zones when it is typed as a
  test or a race, as the guide says.
- **A debug line leaks onto the Goals page**: *"query returned open=false"* appears as page text.
- **The window would not narrow to phone width** in the browser used, so **phone layouts of these
  screens were not captured**.

## Sixth visit: a finished strength session

The owner ended the leg workout (hard, felt good). That produced the two pages that had never been seen
with sets in them: the **finished session page** and the **After page**.

**The After page** (`#after/{uuid}`) reads, top to bottom: *TODAY › AFTER · LEGS*, a title (*"{name}, done"*)
and times; **Plan against done** (*"no plan"* when none); a copyable *"Ask me how it went"*; **Coach's take**
(*"Next legs, keep the weights and add a rep where you can."*); **This week per muscle** with a sentence
when sets are low (*"…are low this week (under 10 sets): the coach adds sets to the next plan."*, which is
the guide's 10–20 sets-per-muscle rule); **Recovery** (*"Quads, glutes, hamstrings · ready Fri afternoon.
Back · ready now. Next: Upper A, Thu. It fits: those muscles are rested by then."*); **Next time** (a target
per lift); then a *DONE TODAY* block with *Working sets · Volume · Records · Time*, an **exercise table**
(*Today · Last time · All-time best · Last 8 times*) and a **muscles panel** with a range switch (*Last
session · This week · 90 days · 1 year · All time*), plus *Against recent weeks* (*Sessions this week ·
Records this month · {muscle} sets this week — "low"*).

**The finished strength session page** (`#session/{uuid}`) has the header *{date} · {times} · {split} ·
{program}*, a *‹ {previous date}* link, tiles (*Time · Working sets · Volume · First marks · Calories*),
**How it went** (*"You did 4 working sets. It felt good, and it was hard."*), **Effort** and **Felt** with
*"from Claude"* beside each, a **Next legs** line, one table per exercise (*Set · Today · Last time · e1RM*)
each ending *"First time logged. Next time: stay at {weight}, {reps} on every set."*, *Muscles this session*
(primary sets and *"helping"* sets), the Coach's take, and *"Something wrong with {exercise}? Tell Claude
and it fixes it here."* with *Fix a set* and *Delete a set* sentences to copy.

**Rules the pages confirmed**
- A first-ever lift is **not a record**: the table says *"today, all-time record"* but the *Records* tile
  says *0 · none this time*, matching the guide ("your first set of a lift isn't one").
- Effort and feel are **two separate ratings**, each attributed to the agent that set it.
- Today's *This week* tile moved to **3 of 4**, the timeline showed the session as *Completed*, and *Time
  trained* read **1:00 — 25% of 4 h**, a target built from the plan's four days of about an hour.

**Three things that disagree with each other**
1. **One e1RM, three displays.** The session table shows **117**, Progress shows **116.7**, the After page
   shows **116.5**. The Epley formula gives 116.67.
2. **Two "next time" targets.** *Next legs* says **"Back Squat 100 kg, all 8s"**, but the exercise's own
   line says **"stay at 100 kg, 6 on every set"**, and the Coach's take says to *"add a rep"*.
3. **The plan panel's count.** The Sessions page says **3 of 4** but names four plan entries without marking
   which are done.

## Quirks and discrepancies found

1. **The Coach says a stall needs "5 sessions of a lift"; the agent guide says 4.** Two of the
   publisher's own sources disagree. See [product-rules.md §1](../spec/product-rules.md).
2. **A raw setting name leaks into the Activity feed** — *"Changed your earlyProWelcomeDismissed"*. An
   internal key in user-facing copy.
3. **"Coming soon" is shown in the UI** for the movement demo, the emailed recap and the shareable recap
   card, so those are announced but unbuilt.
4. **Both generated programs describe their deload as "about half the sets, lighter weights"**, while the
   guide describes a deload as about 60% of the sets at 90% of the weight. Two samples agree with each
   other and not with the guide.
5. **`#more` on desktop is not a distinct screen** — it renders Today.

## Not observed

The Coach with insights, several weigh-ins (a trend), a second week of progress, a benchmark, every phone layout except Today and the account menu; the Free-plan locked Coach and Programs; a brand-new account's first Today (the
`StudioNew` board stays a reconstruction); sign-up and checkout; the other six themes and dark mode;
tablet widths; the MCP connector's consent page; and any screen that needs an id (`#session/{id}`,
`#goal/{id}`, `#metric/{id}`, `#habit/{id}`).
