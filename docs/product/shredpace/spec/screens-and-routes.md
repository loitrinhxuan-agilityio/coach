# Screens and boards

## What a "board" is

The app is a single-page app with **hash routing**. The router resolves a hash to a triple:

```js
{ screen: "today", board: "TodayDesktop", param: undefined }
```

`screen` is the logical destination; **`board` is the named layout drawn for it**. The same
screen resolves to a different board depending on:

- **viewport** — phone vs desktop (`PhoneToday` vs `TodayDesktop`)
- **plan** — free vs Pro (`FreeCoachLocked` vs `ProCoach`)
- **auth** — any signed-in screen falls back to the `SignIn` board

Boards are a design-system concept, not components: board names are *compared* at runtime
(`e.route.board === "PhoneFood"`) to switch layout inside a screen. There is also a **`studio`
theme** — the **default look for new accounts** (see [features.md §15](features.md)) — with
its own layouts for phone (a 390 px frame), tablet and desktop, tagged with `data-studio-screen` /
`data-studio-ui` attributes. *An earlier version of this file called Studio "an internal
design-review mode". That was wrong: the publisher's changelog says new accounts start in it.*

The bundle refers to an **external** numbered design canvas in code comments, e.g.

```
/* 933 · Studio dark: the same rules through the dark map (the board's DARK table) */
/* A tablet too narrow for the tiles side by side stacks them (undrawn, departure 9011). */
/* Item 449 (#458, board MissedDays): the time-off card draws its own icon, head and the choices ... */
/* Item 433 (ConnectKeyPhone frame 4): "Leave without copying your key?" sits over the viewport ... */
```

so boards carry canvas numbers, drawings are tracked as numbered **items** and deviations as
numbered **departures**. **A second pass over the comments on 2026-11-18 found far more than the
two references first recorded:**

| What | Found |
|---|---|
| Board names cited that are **not** among the 54 registry names | **7** — `ConnectKeyPhone`, `MissedDays`, `NavigationMore`, `ProgressRange`, `StudioNew`, `StudioStates`, `TodayStates` |
| Boards cited that have **numbered frames** | `ConnectAgentV2` (1, 3, 4), `ConnectKeyPhone` (4), `NavigationMore` (7), `ProgressRange` (4), `StudioStates` (3) |
| Design **item** numbers cited | 22, from 123 to 466 |
| Other board-style numbers | 933, 942, 943, 944, **9011** |
| Source references to the design files | `TodayStates.dc.html`, `Body.tsx`, **`docs/design/CHANGES-FOR-DESIGN.md`** |

So the design canvas holds boards the router never names (the states and frames of a screen), and
at least **61 distinct board names** exist against the 54 the router uses. See
[open-questions.md §1](../review/open-questions.md) for what that does and does not prove about "147".
One UI string acknowledges the gap outright: *"Today, the states the boards didn't draw."*

## Counts

| Measure | Count |
|---|---|
| Screens in the desktop registry | **44** |
| Distinct board names in the bundle | **54** |
| Public (no auth) screens | 7 |
| Pro-gated screens | 3 |

The 54 break down as **17** phone-specific (`Phone*`, three of which are `PhonePro*`), **3**
desktop Pro (`Pro*`), and **34** others — shared, desktop-only or viewport-agnostic.
**This does not match the 147 figure** — see [open-questions.md](../review/open-questions.md).

## Screen → board map

| screen | desktop board | phone board | pro board (desk/phone) | free-locked | auth |
|---|---|---|---|---|---|
| `ache` | TrackAnything | — | — | — | signed-in |
| `activities` | Activities | — | — | — | signed-in |
| `activity` | ActivityHistory | AgentTrail | — | — | signed-in |
| `after` | SessionDesktop | PhoneAfter | — | — | signed-in |
| `appearance` | Appearance | — | — | — | signed-in |
| `before` | SessionDesktop | PhoneBefore | — | — | signed-in |
| `benchmark` | SkillsHabits | — | — | — | signed-in |
| `body` | BodyDesktop | PhoneBody | — | — | signed-in |
| `coach` | — | — | ProCoach/PhoneProCoach | FreeCoachLocked | signed-in |
| `connect` | ConnectAgentV2 | — | — | — | signed-in |
| `connector` | SignIn | — | — | — | public |
| `consent` | ConsentPage | PhoneConsentPage | — | — | public |
| `contact` | ContactPage | PhoneContactPage | — | — | public |
| `during` | SessionDesktop | PhoneDuring | — | — | signed-in |
| `endurance` | Endurance | — | — | — | signed-in |
| `exercises` | Exercises | — | — | — | signed-in |
| `food` | FoodDesktop | PhoneFood | — | — | signed-in |
| `goal` | GoalDetailDesktop | PhoneGoalDetail | — | — | signed-in |
| `goals` | GoalsDesktop | PhoneGoals | — | — | signed-in |
| `habit` | SkillsHabits | — | — | — | signed-in |
| `healthdetails` | Settings | ConsentSettings | — | — | signed-in |
| `landing` | LandingV2 | PhoneLanding | — | — | public |
| `metric` | TrackAnything | — | — | — | signed-in |
| `more` | PhoneMore | — | — | — | signed-in |
| `nutrition` | NutritionSettings | — | — | — | signed-in |
| `plan` | PlanPage | — | — | — | signed-in |
| `plansetup` | PlanSetup | — | — | — | signed-in |
| `planweek` | NotesWeekConsent | — | — | — | signed-in |
| `privacy` | Legal | — | — | — | public |
| `pro` | Billing | — | — | — | signed-in |
| `programs` | — | — | ProPrograms/PhoneProPrograms | FreeCoachLocked | signed-in |
| `progress` | — | — | ProProgress/PhoneProProgress | limited | signed-in |
| `scan` | BodyHistory | — | — | — | signed-in |
| `scans` | BodyHistory | — | — | — | signed-in |
| `session` | SessionDetail | PhoneSessionDetail | — | — | signed-in |
| `sessions` | SessionsDesktop | PhoneSessions | — | — | signed-in |
| `settings` | Settings | — | — | — | signed-in |
| `signin` | SignIn | — | — | — | public |
| `terms` | Legal | — | — | — | public |
| `today` | TodayDesktop | PhoneToday | — | — | signed-in |
| `upgrade` | Upgrade | — | — | — | signed-in |
| `usual` | MealExtras | — | — | — | signed-in |
| `usuals` | MealExtras | — | — | — | signed-in |
| `zones` | Endurance | — | — | — | signed-in |


## Hash routes

Parameterised and aliased routes, from the router (`evidence/router.min.js`):

| Hash | Screen | Board | Param |
|---|---|---|---|
| `#landing` | landing | LandingV2 / PhoneLanding | — |
| `#signin` | signin | SignIn | — |
| `#today` | today | TodayDesktop / PhoneToday | — |
| `#sessions` | sessions | SessionsDesktop / PhoneSessions | — |
| `#session/{id}` | session | SessionDetail / PhoneSessionDetail | session id |
| `#before` / `#during` | before / during | SessionDesktop / PhoneBefore,PhoneDuring | — |
| `#after/{id}` | after | SessionDesktop / PhoneAfter | session id |
| `#exercises` | exercises | Exercises | — |
| `#plan` | plan | PlanPage | — |
| `#plan/setup[/{step}]` | plansetup | PlanSetup | step, default `about` |
| `#plan/week/{YYYY-MM-DD}` | planweek | NotesWeekConsent | week start |
| `#plan/zones` | zones | Endurance | — |
| `#plan/program` | programs | ProPrograms / FreeCoachLocked | — |
| `#progress` | progress | ProProgress (90-day on free) | — |
| `#coach` | coach | ProCoach / FreeCoachLocked | — |
| `#goals` | goals | GoalsDesktop / PhoneGoals | — |
| `#goal/{id}` | goal | GoalDetailDesktop / PhoneGoalDetail | goal id |
| `#habit/{id}` | habit | SkillsHabits | habit id |
| `#benchmark/{id}` | benchmark | SkillsHabits | benchmark id |
| `#body` | body | BodyDesktop / PhoneBody | — |
| `#body/scans` | scans | BodyHistory | — |
| `#body/scan/{id}` | scan | BodyHistory | reading id |
| `#metric/{id}` | metric | TrackAnything | metric id |
| `#ache/{id}` | ache | TrackAnything | pain id |
| `#food` | food | FoodDesktop / PhoneFood | — |
| `#food/usuals` | usuals | MealExtras | — |
| `#food/usual/{id}` | usual | MealExtras | saved-meal id |
| `#food/settings` → `nutrition` | nutrition | NutritionSettings | — |
| `#activity` | activity | ActivityHistory / AgentTrail | — |
| `#connect` | connect | ConnectAgentV2 | — |
| `#settings` | settings | Settings | — |
| `#settings/gym[/{name}]` | settings | GymWeights | gym name |
| `#settings/appearance` → `appearance` | appearance | Appearance | — |
| `#settings/privacy` | settings / healthdetails | Settings / ConsentSettings | — |
| `#settings/plan`, `#settings/body` → `settings` | settings | Settings | — |
| `#pro` | pro | Billing | — |
| `#upgrade` | upgrade | Upgrade | — |
| `#more` | today + `avatar:true` | PhoneMore | — |
| `#contact` | contact | ContactPage / PhoneContactPage | — |
| `#consent` | consent | ConsentPage / PhoneConsentPage | — |
| `#privacy`, `#credits`, `#terms` | privacy / terms | Legal | — |

### Router behaviour worth noting

- **Aliases**: `#credits` → `privacy`; `#activities` → `#sessions`; `#programs` → `#plan`;
  `#settings/plan` and `#settings/body` → `settings`
- **`#more`** resolves to the `today` screen with an `avatar: true` flag, and on phones draws the
  `PhoneMore` board — a bottom-sheet menu rather than a route of its own
- **`#more?contact=…`** is rewritten to `#today?…`, preserving the query
- `#settings/privacy` splits by viewport: phones get a dedicated `healthdetails` screen
  (`ConsentSettings`), desktop folds it into `Settings`
- Every malformed param (`decodeURIComponent` throwing) falls back to a parent route rather
  than erroring
- Signed-in users hitting `#landing` or `#signin` are redirected to `#today`
