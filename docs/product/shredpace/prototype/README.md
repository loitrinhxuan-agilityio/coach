# Prototype

A clickable reconstruction of the screens, published as a Design canvas artifact:
**<https://claude.ai/artifact/Tmc3dQkVRrw1opsymgcuvW>**.

> **Sharing.** It was private when first published. At the 2026-11-18 publish the artifact service
> reported it as readable by **anyone with the link**; someone changed that from its Share menu.
> Sharing is controlled from the page, not from here, so check the Share menu for the current
> setting. The interactive prototype below was reported **private** at the same time.

**All 54 boards the router names, plus 5 states added on 2026-11-18 (59 in all)**, laid out on one canvas in Ember dark with the real tokens from
[design-tokens.md](../spec/design-tokens.md). The desktop sidebar and the phone tab bar navigate,
so it clicks through as a prototype rather than sitting as flat comps.

## Interactive prototype

A second artifact runs the same 59 boards as one navigable app rather than as artboards on a
canvas: **<https://claude.ai/artifact/KCk13wLYPLS6WbVX5Qw2xB>** ("Shredpace Prototype", also
private).

It reimplements the shipped router from the four registries in `evidence/router.min.js`, so the
board you see is the board the real app would draw. Three toggles drive it:

| Toggle | What it changes |
|---|---|
| Desktop / Phone | `TodayDesktop` ↔ `PhoneToday`, and the 17 other paired boards |
| Free / Pro | `#coach` and `#plan/program` → `FreeCoachLocked` on Free, `ProCoach` / `ProPrograms` on Pro; `#progress` stays reachable on Free but degraded |
| Signed in / out | every non-public screen falls back to the `SignIn` board |

A readout names the real hash route, the resolved board and the frame size; an "All screens"
directory lists all **49 screens** (the 44 the router registers plus the 5 added states) with the board each currently resolves to. Two route
details had to change, because the artifact viewer only accepts a plain `#name`: slashed
routes are flattened (`#plan/setup/{step}` → `#plan-setup`) and the reserved names `#settings`
and `#upgrade` became `#account` and `#go-pro`. The readout always shows the real route.

## Stored source

The artboards are also kept in this repository, fetched back out of the artifact so they do
not live only inside it: the `project/` folder next to this file holds the 59 `.dc.html` files and
the `canvas.json` index, with the format explained under [Prototype source](#prototype-source) below.
`MANIFEST.txt` records the artifact version they were taken from.

The two copies are independent — editing one does not change the other. One naming note:
`Main.dc.html` is the `LandingV2` board, named for its role as the canvas's entry artboard;
every other file is named for the board it draws.

## Coverage

Every board name in [screens-and-routes.md](../spec/screens-and-routes.md)'s router registry is drawn —
54 of 54 — and, since 2026-11-18, five further states (below). 59 boards in all, checked against the
canvas index: no entry without a file, no file outside the index.

| Group | Boards |
|---|---|
| Public | `LandingV2`, `PhoneLanding`, `SignIn`, `Legal`, `ContactPage`, `PhoneContactPage`, `ConsentPage`, `PhoneConsentPage` |
| Today & sessions | `TodayDesktop`, `PhoneToday`, `SessionsDesktop`, `PhoneSessions`, `SessionDetail`, `PhoneSessionDetail`, `SessionDesktop`, `PhoneBefore`, `PhoneDuring`, `PhoneAfter`, `Activities` |
| Food | `FoodDesktop`, `PhoneFood`, `MealExtras`, `NutritionSettings` |
| Body & metrics | `BodyDesktop`, `PhoneBody`, `BodyHistory`, `TrackAnything` |
| Goals | `GoalsDesktop`, `PhoneGoals`, `GoalDetailDesktop`, `PhoneGoalDetail`, `SkillsHabits` |
| Plan | `PlanPage`, `PlanSetup`, `Endurance`, `NotesWeekConsent` |
| Pro | `ProProgress`, `PhoneProProgress`, `ProCoach`, `PhoneProCoach`, `ProPrograms`, `PhoneProPrograms`, `FreeCoachLocked` |
| Exercises & audit | `Exercises`, `ActivityHistory`, `AgentTrail` |
| Account | `ConnectAgentV2`, `Settings`, `Appearance`, `GymWeights`, `ConsentSettings`, `Billing`, `Upgrade` |
| Phone shell | `PhoneMore` |

### Added 2026-11-18: states from the changelog

The changelog and agent guide describe screens the router's 54 names do not cover. Five were drawn.
All are **reconstructions** from the publisher's own words; none was rendered.

| Board | What it shows | Name | Source |
|---|---|---|---|
| `MissedDays` | Today's three time-off states: a missed day with its two choices, time away, easing back | **in the shipped code** | Changelog 23–26 Oct; guide "Plan the next session" |
| `TodayComeback` | The comeback question for a short break, a long one and after illness, with the exact replies | **ours** — the shipped code gives it no name | Changelog 17 Nov; guide "Coming back" |
| `StudioNew` | Studio's first Today before any session: next step, a sentence to copy, empty tiles, a body figure | **in the shipped code** | Changelog 26–27 Oct; Studio palette from `evidence/themes.json` |
| `ConnectKeyPhone` | The key made on a phone, shown once, with the *Leave without copying your key?* check (frame 4) | **in the shipped code** | Changelog 17 Oct |
| `NavigationMore` | The avatar menu with the ring on the open avatar (frame 7) | **in the shipped code** | Guide "Asked where something is in the app" |

What is quoted and what is invented: the question wording, the two comeback replies, the missed-day
choice texts and the "Away until … don't count against your plan" line are quoted from the guide. The
layout, button labels, the six tile names and the *"In Shredpace: I'm at the gym. Start my session."*
sentence are **ours** — the guide says Studio has six tiles and a copy sentence but names neither.
`StudioNew` is drawn in **Studio light** with the real palette (accent = text colour, Inter 600,
14 px radius), because Studio is monochrome and does not use Ember's orange.

The sample identity on these boards, and now on `PhoneToday` and `PhoneMore`, is invented ("Sam").

Phone boards are framed at **390 × 844**, the frame width the bundle's own studio CSS states
(`the board's frame is 390 px`). Desktop boards are fluid pages framed at 1280.

Several boards serve more than one route, exactly as the shipped router maps them —
`SessionDesktop` covers `#before`, `#during` and `#after`; `SkillsHabits` covers `#habit/{id}`
and `#benchmark/{id}`; `TrackAnything` covers `#metric/{id}` and `#ache/{id}`; `Legal` covers
`#privacy`, `#terms` and `#credits`.

## Provenance, per board

Two boards reproduce something displayed to a logged-out visitor:

- **`LandingV2`** — copy verbatim from the rendered landing page
- **`SignIn`** — the public sign-in surface

**On 2026-11-18 a signed-in account was read** ([signed-in.md](../observations/signed-in.md)),
and boards were then corrected or redrawn from it:

- **Corrected in place (6):** `ContactPage`, `PhoneContactPage` (the real form), `PhoneMore` and
  `NavigationMore` (the real nine-row menu), `Legal` (the real date and section structure), `StudioNew`
  (the real rail, tile names and tints).
- **Redrawn from the live screens (29),** in **Studio light**, the look a new account actually sees. After the account held real data (a plan focus, a run, goals, a habit, a scan, an ache, a gym) most of them were drawn a second time with it, and four pages that only exist with data were added: `GoalDetailDesktop`, `SkillsHabits` (a habit and a skill goal), `TrackAnything` (metric and ache pages) and `SessionDetail`:
  `TodayDesktop`, `PhoneToday`, `SessionsDesktop`, `ProProgress`, `Exercises`, `PlanPage`, `ProPrograms`,
  `ProCoach`, `FoodDesktop`, `BodyDesktop`, `GoalsDesktop`, `ActivityHistory`, `Settings`, `Appearance`,
  `GymWeights`, `Upgrade` (Settings › Plan), `Billing` (the early-Pro welcome), `Endurance` (zones),
  `PlanSetup`, `NutritionSettings`, `MealExtras` (usuals), `BodyHistory` (scans), `SessionDesktop`
  (Before, During and After side by side), `ConnectAgentV2` and `ConsentPage` (the state after agreeing).

The redrawn boards take their **labels, copy, structure and order** from what was on screen. What stays
ours: the body figure (a placeholder for the real anatomical illustration), the approximate tile tints,
and all the **figures**, which are sample data. The account holds a few days of test data, so these are
real structures with a **few** rows each: no multi-week chart, no trend, no insight.

**The canvas now mixes two looks.** The redrawn boards are Studio light; the 28 boards that were not
seen are still Ember dark, so navigating from a redrawn board to an unseen one changes the theme.
That is a real seam in the prototype, not a feature of the site.

**Every other board is a reconstruction.** The dashboard is behind AWS Cognito and the observed account
held almost no data. Those boards are built from three real
sources, so the structure and vocabulary are evidence-based even though the layout is not:

1. **Routes and board names** — the shipped router (`evidence/router.min.js`)
2. **Fields, units and states** — the OpenAPI schemas (`evidence/openapi.json`)
3. **Copy** — 904 UI strings lifted from the bundle (`evidence/ui-strings.txt`), used verbatim
   wherever one fits: *"A trend needs 3 readings"*, *"Above target on average this week"*,
   *"Be honest: a plan you keep beats a bigger one you skip"*, *"Nothing flagged: no lift has
   stalled…"*

What is **invented**: the visual arrangement, and all figures (weights, meals, dates, names).
Treat the numbers as plausible examples, never as anyone's data.

## Details taken from the real system

- `Appearance` renders all **seven themes** with their true palettes, typefaces and radii
- `SessionDetail` shows the three `loadType` readings the API distinguishes — barbell total with
  its bar weight, dumbbell per-hand, assisted-machine assist
- `GymWeights` marks the weights a gym does *not* have, and separates `null` ("not said") from
  empty — the distinction the API makes
- `PhoneAfter` asks effort and feel as **two separate questions**, which `llms.txt` insists are
  never read as one
- `PhoneDuring` uses the app's effort words (Easy / Good / Hard / All out) that map to RPE 7–10
- `ActivityHistory` and `AgentTrail` attribute each write to the key that made it, with per-row
  undo, and note that deletes keep a copy in the event log
- `FreeCoachLocked` locks Coach and Programs while leaving Progress reachable and degraded,
  which is how the gating actually works in the router
- `ConsentPage` and `ConsentSettings` switch each category of health data separately, with heart
  rate off by default

---

## Prototype source

The 59 artboards behind the published prototype, fetched back out of the artifact so
they survive outside it.

- **Published canvas:** <https://claude.ai/artifact/Tmc3dQkVRrw1opsymgcuvW> ("Shredpace Screens")
- **Captured from:** the version recorded in `MANIFEST.txt` (re-checked by `check.sh`)
- **Contents:** `project/` — 59 `.dc.html` artboards plus `canvas.json`, the index that
  places each one on the canvas and carries its title and route

### Reading these files

Each board is a self-contained HTML page in the Design canvas's artboard format: an
`<x-dc>` element wrapping the markup, a `<helmet>` block holding the fonts and CSS, and a
trailing `text/x-dc` script carrying the board's `$preview` frame size. They render as
plain pages in a browser too — the `./support.js` include and the `x-dc` wrapper are inert
outside the canvas.

`canvas.json` is the source of truth for layout: `boards` gives each file its position,
frame size and title (board name · the hash routes it serves), `order` fixes the reading
order, and `notes` holds the three captions pinned to the canvas.

### Board names vs file names

One file is named for its role on the canvas rather than for its board: **`Main.dc.html`
is the `LandingV2` board** (`#landing`), the canvas's entry artboard. Every other file is
named for the board it draws — with one exception: **`TodayComeback.dc.html`** is a state the
shipped code gives no name, so the name is ours. The full screen → board → route map is in
[../screens-and-routes.md](../spec/screens-and-routes.md).

### What these are, and are not

`Main.dc.html` (landing) and `SignIn.dc.html` reproduce what a logged-out visitor sees. Six boards were
corrected on 2026-11-18 from a read-only look at a signed-in account, and **29 more were redrawn** from
its live screens in Studio light (their titles in `canvas.json` say "redrawn from the live screen"); see
[../signed-in.md](../observations/signed-in.md). Every other board is a reconstruction from the shipped router, the OpenAPI
schemas and the 904 UI strings lifted from the bundle — and, for the five files added on
2026-11-18 (`MissedDays`, `TodayComeback`, `StudioNew`, `ConnectKeyPhone`, `NavigationMore`),
from the publisher's changelog and agent guide. The structure and vocabulary are
evidence-based, the visual arrangement is not. All figures (weights, meals, dates, names)
are invented examples and are nobody's data. See
[../README.md](README.md) for the per-board provenance.

### Keeping the two in step

Editing a file here does **not** change the published canvas, and editing a board on the
canvas does not change these files. The two drift apart silently, so this folder records
what it was copied from:

- `MANIFEST.txt` — the artifact version this copy came from, and a sha256 for all 60 files
- `check.sh` — compares the folder against that manifest and against `canvas.json`

```sh
docs/product/shredpace/prototype/check.sh
```

It reports three things: whether any file has changed since capture, whether the index and
the files on disk still agree, and which version the copy is from. It **cannot** see the
published artifact — nothing on this machine can fetch an artifact's files, so detecting a
new version upstream is Claude's job, not the script's.

#### Re-syncing from the artifact

Ask Claude to re-sync the prototype folder. It reads the artifact's published files
(`Artifact` tool, `action: "read"`, the 60 paths under `project/`, `out_dir` set to this
folder), then rewrites `MANIFEST.txt` with the new version. Claude is told the current
version number whenever it touches the artifact, so it will notice an upstream change on
its own the next time it does.

A session can also watch the artifact (`ArtifactComments`, `action: "watch"`). The watch
only keeps track of new versions — **it does not wake the session or send a notification**,
and it is session-local, so it does not survive into a new conversation. It is a
convenience, not an automatic sync.

#### Pushing changes the other way

Publish the edited files back to the same artifact URL. Read the artifact first and merge
onto the live version — a publish to a version you have not read is refused, and the canvas
may have been edited in the browser since this copy was taken.
