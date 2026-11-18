# Handoff: what is left, and how to pick it up

Written 2026-11-18 so the remaining ShredPace work can be resumed later by you or by a new session with
no memory of this one. Read [README.md](../README.md) first for the map of this folder.

## 1. Where things stand

| Thing | State |
|---|---|
| Research | Complete from public sources: features, API (109 operations, unchanged), changelog, product rules, platform. See [README.md](../README.md) |
| Signed-in screens | Read **six times**, read-only, on the owner's own account (early Pro). Record: [signed-in.md](../observations/signed-in.md) |
| Prototype canvas | <https://claude.ai/artifact/Tmc3dQkVRrw1opsymgcuvW>, version 21 at the time of writing, **link-shared**. 59 boards |
| Interactive prototype | <https://claude.ai/artifact/KCk13wLYPLS6WbVX5Qw2xB>, version 6, **private**. 49 screens |
| Stored copy of the boards | [prototype/](../prototype/), with `check.sh` to detect drift, and [prototype/tools/](../prototype/tools/) to regenerate |
| PRD | **Draft** at `issues/prd.md` (167 stories). Not approved; see section 4 |
| Memory | `shredpace-open-items` and `shredpace-prototype-mirror` in the project's memory folder |

**Real versus reconstructed.** 29 desktop boards plus the phone Today were redrawn from live screens, and 6
more corrected from them. **28 boards are still reconstructions** (Ember dark, invented layout): all phone
boards except Today and the account menu, plus the Free-plan locked screens and a few others. Their titles in
the canvas say so.

## 2. What is still not seen, and what to do about each

Do these when you have time, then tell the next session which you did. **Each one adds test data to your
real account**; ask your agent to undo or delete it afterwards if you don't want it there (undo works for 7
days).

| # | Not seen | Why | What to do | Unlocks |
|---|---|---|---|---|
| 1 | **A trend** (weight, body fat, waist, goal status) | A trend needs **3 readings over a week or more** | Log weigh-ins, body-fat readings and a waist on **three different days**. Either wait three mornings, or backdate: *"Log my weight for Mon 16 Nov: 82.8 kg"* | Weight and body-fat charts, a goal showing on track or behind with a projected date, the recomp card's trend lines, the metric history charts |
| 2 | **A second week of progress** | The Progress chart and its % are held back until week two | Train again on Mon 23 Nov or later, or backdate a session into an earlier week: *"Log a pull workout for Thu 12 Nov: barbell row 60 kg × 8, 8, 8"* | The Progress chart, Your year, the 4-week bars on Sessions, the Coach's load gauge (it needs **2 weeks**) |
| 3 | **Coach insights** | A stall needs **5 sessions** of one lift (the guide says 4: see below); an imbalance needs pressing to outweigh pulling 2 : 1 over 30 days | Either train normally for about three weeks, or backfill: *"Log bench press 80 kg 3 × 5 at RPE 9 on Mon 9, Wed 11, Fri 13, Mon 16 and Wed 18 Nov. No rows."* | A stall and an imbalance insight with Accept and Dismiss, the weekly recap, a Coach page with content |
| 4 | **A benchmark** | None was created | *"Test my max push-ups every 4 weeks."* Then log a result: *"Push-up test: 32."* | The benchmark half of the habit-and-benchmark page, Today's "benchmark today" card |
| 5 | **Time away** | Needs an away period | *"I'm away from Sat 21 to Mon 23 Nov: holiday."* To end it: *"I'm back early."* | Today's time-away card, the plan week marking away days. **Do not overlap this with item 6** |
| 6 | **A missed day** | A planned day must pass with no session. The plan has **Upper A on Thu 19 Nov** | **Don't train Thursday.** Open Today on Friday morning, before training, and send a screenshot or tell the next session what it shows | The missed-day question and its two choices (the `MissedDays` board) |
| 7 | **The comeback question** | Needs more than 2 days with no session *and* planned days missed | After item 6, skip until Sunday or Monday. On the first session day back, open Today, then say *"starting upper"* and read what your agent asks | The "same weights or ease in?" question, the "were you away, ill or busy?" question (the `TodayComeback` board). For the **ill** version say *"I was ill from 20 to 23 Nov"* first |
| 8 | **A brand-new account's first Today** and sign-up | The account is days old and set up | **Your action only:** sign up a second account with another email. A new account starts in Studio. Claude reads it read-only | The `StudioNew` board's real first-run state, the start steps, sign-up |
| 9 | **Phone layouts** | The browser used would not narrow below desktop width, so only Today and the account menu were seen | **Screenshots from your phone**, of: Today, Sessions, a finished session, After, Food, Body, Goals, a goal, Coach, Progress, Plan, Activity, Before, During, Settings › Privacy. **Crop out your name and email.** Attach them to the chat | The 12 phone boards (PhoneSessions, PhoneSessionDetail, PhoneBefore/During/After, PhoneFood, PhoneBody, PhoneGoals, PhoneGoalDetail, PhoneProCoach, PhoneProProgress, PhoneProPrograms, AgentTrail) |
| 10 | Other themes, dark mode | Only Studio light was seen | Optional: *"Switch my dashboard to Trail"*, then back with *"Switch my dashboard to Studio"* | The other six themes drawn from fact |

**Cannot be captured**, so those boards stay reconstructions:
- The **Free-plan locked** Coach and Programs screens (`FreeCoachLocked`): the account is early Pro.
- **Checkout, payment and card-failure** screens: money moves only from the dashboard and is out of reach.
- The **one-click connector's consent page**: it appears only while adding a connector.

## 3. Resuming the capture (for the next session)

Say **"continue the ShredPace capture"** and tell it which items in section 2 you did.

**What it needs:** the Claude in Chrome extension connected, and you signed in to ShredPace in that Chrome
profile. It never creates an account or types a password. It opens its own tab and resizes it to 1440 × 900.

**Method that worked**
- Navigate by URL hash; wait 4–6 seconds; read text.
- `get_page_text` sometimes returns only the first `<article>`. **Use `document.body.innerText`** through the
  page-script tool for the full text.
- Many links have no `href`. To open a detail page, **click the element by its visible text** with a
  page-side script; the new URL then carries the id.
- Reading is enough. Nothing in the sweep clicks Copy, Send, Create, Revoke, End, Delete or Sign out.

**Routes seen**

| Kind | Routes |
|---|---|
| Fixed | `#today` `#sessions` `#progress` `#exercises` `#plan` `#plan/program` `#plan/zones` `#plan/setup/focus` `#coach` `#food` `#food/settings` `#food/usuals` `#body` `#body/scans` `#goals` `#activity` `#before` `#during` `#more` `#connect` `#settings` `#settings/appearance` `#settings/gym` `#settings/privacy` `#settings/plan` `#pro` `#contact` `#consent` `#privacy` |
| With an id | `#goal/{uuid}` (body goals and skill goals) · `#habit/{uuid}` · `#metric/{uuid}` · `#session/{uuid}` · `#after/{uuid}` · `#body/scan/{uuid}` |
| With a name | `#metric/weight` (and the other body metrics) · `#ache/{area}/{side}` e.g. `#ache/knee/left` |
| Redirects | `#signin` → `#today` when signed in · `#upgrade` → `#settings/plan` |
| Not routes | "Ask Claude" is a copy button · "Your agents" links to `#settings?agents` · an in-progress session opens `#today` |

**Privacy rules for anything stored or published**
- Never write the owner's name, either of their email addresses, or exact body measurements. Sample values
  are used instead (the boards say so).
- The **canvas artifact is link-shared**, so treat anything on it as public.
- Screenshots are not saved unless asked.

## 4. Regenerating and republishing the boards

1. Edit the content in `prototype/tools/gen*.py` (not the `.dc.html` files), then
   `python3 -I tools/gen7.py` and `python3 -I tools/build.py` from `prototype/tools/`.
2. **Canvas:** read the live `project/canvas.json` first (people move boards). Publish with the Artifact
   tool using `root` set to a folder holding `project/`, `file_path` one board and `files` the others.
   Send `canvas.json` **only** if a title, note or frame changed, and change only your keys.
3. **Interactive page:** publish `tools/dist/index.html` to the interactive prototype's URL.
4. Copy the published `canvas.json` into `prototype/project/`, regenerate `prototype/MANIFEST.txt`, and run
   `prototype/check.sh`. The README in `prototype/` has the exact steps.
5. Update the counts in [README.md](../prototype/README.md).

## 5. Decisions that are waiting on you (not capture)

- **The PRD** (`issues/prd.md`): confirm or correct the *Assumptions to confirm* table and the *Open
  questions*. Then run `/prd-to-issues` to split it into issues.
- **The 147 boards**: you said they come from ShredPace's own design canvas. If you can get it, share it;
  otherwise the figure stays unexplained.
- **Sharing**: the canvas is link-shared. It reproduces ShredPace's look and wording closely, so decide on
  purpose whether that should stay.
- **Git**: the repository has no commit and a remote that was never pushed to. `AGENTS.md` says never to push
  to `main`, so the first commit needs a branch such as `chore/bootstrap` and a PR.

## 6. Contradictions in ShredPace's own material

Worth settling before you copy them:
1. A stall: **5 sessions** in the Coach page, **4** in the agent guide.
2. A deload: **"about half the sets"** in both generated programs, **about 60% of the sets at 90% of the
   weight** in the guide.
3. One e1RM shown as **117, 116.7 and 116.5** on three pages.
4. A next-time target of **"all 8s"** next to **"6 on every set"** for the same lift.
5. The raw setting name `earlyProWelcomeDismissed` appears in the Activity feed, and a debug line
   (`query returned open=false`) appears on the Goals page.
6. The Time trained tile says "0:11 hours" for 11 minutes, and a single set reads "1 sets".
