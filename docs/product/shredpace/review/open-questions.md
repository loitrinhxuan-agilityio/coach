# Open questions and limits of this capture

## 1. The "147 boards" figure is not what the shipped site contains

This was given as a premise. What is actually observable:

| Measure | Observed |
|---|---|
| Distinct board names in the client bundle | **54** |
| Screens in the desktop board registry | **44** |
| Canvas board numbers cited in code comments | **1** (board 933) |
| Numbered "departures" cited | **1** (departure 9011) |

The 54 figure is a complete enumeration of the four board registries (`Pd` desktop, `iu` phone,
`nO` Pro, `iO` free-locked) **plus** every `route.board === "…"` comparison in the bundle. Only
one board name (`GymWeights`) appears in comparisons without being in a registry, which
suggests the registries are near-complete and the enumeration is sound.

So 147 is not wrong so much as **measuring something this capture cannot see**. The likely
explanations, in order of plausibility:

1. **147 counts board *states*, not board *layouts*.** A single board like `PhoneToday` has many
   drawn states — empty, loading, live session, ahead of last time, error, offline. The bundle
   references a numbered canvas (board 933, departure 9011) whose numbering reaches at least the
   900s and 9000s, far beyond 54, consistent with per-state numbering.
2. **147 is the design canvas's own count**, including boards never shipped. The bundle contains
   a UI string that says so almost explicitly: *"Today, the states the boards didn't draw"* — and
   marks responsive behaviours as `undrawn`.
3. 147 is the count in a canvas file you hold that this capture has no access to.

**This needs your input.** If you have the canvas, the mapping between its 147 boards and these
54 shipped board names is the one artifact that would make this folder genuinely complete, and I
can't derive it from the public site. I have documented what ships; I have not documented your
canvas, and I have not assumed the two are the same thing.

### Update, 2026-11-18 — what a second look found

Re-reading every comment in the client bundle (381 block comments) turned up evidence the first
pass missed, and it moves explanation 1 and 2 from "plausible" to "supported":

- **The design canvas names boards the shipped router never does.** Seven more board names are cited
  in code comments — `ConnectKeyPhone`, `MissedDays`, `NavigationMore`, `ProgressRange`,
  `StudioNew`, `StudioStates`, `TodayStates` — so there are **at least 61 distinct board names**,
  not 54.
- **Boards have numbered frames**, so one board is several drawings: `ConnectAgentV2` frames 1, 3, 4;
  `NavigationMore` frame 7; `ProgressRange` frame 4; `StudioStates` frame 3. A per-frame count is
  necessarily larger than a per-board count.
- **The backlog is large and numbered**: 22 design "items" are cited (123–466), plus 933, 942–944 and
  departure 9011, and pull-request/issue numbers up into the 450s.
- **The canvas format is `.dc.html`** (`TodayStates.dc.html`) — the same format as the Design
  canvas artifact used for the prototype — and the code points at
  **`docs/design/CHANGES-FOR-DESIGN.md`**.

**What this does not prove.** None of it yields the number 147. 61 names plus their frames could
plausibly reach 147, but this is arithmetic nobody can complete from the shipped code: no frame
*count* is stated anywhere in the bundle. The honest position is: **147 is very likely the design
canvas's own board/frame count, which the public site cannot reveal.** It is still unconfirmed,
and the canvas itself remains the one artifact that would settle it.

## 2. Signed-in screens: observed once, on an almost-empty account

**Update, 2026-11-18.** Until then no signed-in screen had been seen, because the dashboard sits
behind AWS Cognito and no account was created. The account owner then signed in themselves, in their
own Chrome, and about 30 routes were read read-only. The record is
[signed-in.md](../observations/signed-in.md). No account was created and no
credentials were entered by Claude.

What that did and did not settle:

- **Settled:** the real navigation (five tabs, a Tools group, sub-tabs), the real avatar menu, the
  six Today tiles, the Settings structure, the Contact form, the privacy-policy structure and date, and
  dozens of empty-state sentences. It also confirmed Studio is live, user-facing and the default.
- **Still unobserved:** every **populated** screen (the account held almost no data), the **Free-plan**
  locked screens, a brand-new account's first Today, sign-up and checkout, the other six themes, dark
  mode, tablet widths, and routes that need an id. Those boards remain reconstructions.
- **Two of the publisher's sources disagree** (a stall needs 5 sessions in the UI, 4 in the guide);
  see the observations file.

## 3. Inferred from minified code, so lower confidence

The bundle has no sourcemap. These claims come from reading minified identifiers and should be
treated as inferences:

- Board-to-screen mapping and the free/Pro gating mechanism (read from `Pd`/`iu`/`nO`/`iO`/`Uce`)
- `progress` being degraded rather than locked on Free — the pricing table agrees, but the
  implementation detail is inferred
- The `#more` → `today` + `avatar:true` behaviour
- ~~That `studio` is an internal design-review mode~~ — **retracted 2026-11-18.** The changelog (26 Oct) says new accounts start in it; it is a user-facing theme and the default look. The inference was wrong.

## 4. Retrieved on 2026-11-18

Everything the first pass listed as "not retrieved" is public and needed no key. It is now stored
under [evidence/](../evidence/):

| Source | Size | Stored as |
|---|---|---|
| `/api/skill.md` — the full agent guide | 167 KB, 1,664 lines | [evidence/skill.md](../evidence/skill.md) |
| `/docs/changelog.md` — dated releases | 43 KB | [evidence/changelog.md](../evidence/changelog.md) |
| 123 other docs pages (109 are one-per-operation API reference) | 628 KB | [evidence/docs/](../evidence/docs/) |

The first pass guessed `/api/skill.md` required a key. It does not: it returned 200 with no
credentials. Both documents are summarised in [changelog.md](../spec/changelog.md) and
[product-rules.md](../spec/product-rules.md).

The API surface itself was re-checked against the live site and is **byte-identical** to the
capture (`openapi.json` and `llms.txt` sha256 match), so nothing in [api-surface.md](../spec/api-surface.md)
is stale.

**Still not done:**
- **Response schemas.** [evidence/openapi.json](../evidence/openapi.json) has them in full; 04 summarises only
  operations, not request/response shapes.
- **The MCP server's own tool metadata** — `/mcp` was not called (it needs a key or sign-in).
- **Any rendered signed-in screen** (§2).
- **Two robots/sitemap probes** returned 404, so there is no sitemap to cross-check the 124 pages.

## 5. Worth flagging about the API itself

- **109 operations are reachable with an API key**, including every destructive one
  (`delete_session`, `remove_goal`, `delete_measurement`, …). Mitigated by soft deletes
  ("the event log keeps a copy") and `undo_change`, but a leaked `gtk_` key is a full-account
  write capability.
- **`get_account` returns the plan and the key's own identity**, which is how an agent
  self-checks its connection.
- The `202`-with-a-question pattern is unusual and load-bearing: a client that treats 202 as
  success will silently drop clarification prompts.
