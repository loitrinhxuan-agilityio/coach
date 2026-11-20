# AI Lift Coach design

The source of the design work, so it survives independently of the published artifacts.

**The artifacts are the live version.** These files are what produced them, copied here on
2026-11-19. If the two ever disagree, the artifact is right — people can edit an artifact's page,
and those edits do not come back here.

| Artifact | Link |
|---|---|
| Design system | <https://claude.ai/artifact/8LcochQYaXifGNJQ3uGeYi> |
| Today | <https://claude.ai/artifact/APK35PZ9JEeCuskz1ywm1a> |
| Session | <https://claude.ai/artifact/25mkV8Pzo6zC1XhRZ9dsrW> |
| Progress, Goals, Body, empty, first run | <https://claude.ai/artifact/MbdK4Ea9H8So5fiihsizV7> |
| Sign in, First sign-in, Sessions, Exercises, Settings | <https://claude.ai/artifact/M6VFZfJ3KbrAQEYM8niibL> |
| During a workout | <https://claude.ai/artifact/PdVXKt4yykwLJ6HYDZJV5P> |
| Food and Plan | <https://claude.ai/artifact/L7kUkWviavHxt1x1WirYQv> |
| Activity | <https://claude.ai/artifact/C7EWkpjXw3tbX9ZjpSvCH3> |
| Identity options | <https://claude.ai/artifact/NxoJpKmDY7hF5EZBptT5KU> |

An artifact is private until it is shared from its own page's Share menu, and nobody else can open
it before then. Two were shared during the design sessions — the design system and the five-screen
page — so read each page's Share menu rather than assuming from this table.

## What is here

```
prototypes/
  today.html             the Today dashboard
  session.html           a finished workout session
  screens.html           Progress, Goals, Body, not-enough-data, first run (hash-routed)
  phase1.html            Sign in, First sign-in, Sessions, Exercises, Settings (hash-routed)
  during.html            the live mid-workout board, with its agent-gone-quiet state
  food-and-plan.html     intake against targets, and the plan week with a missed day
  activity.html          the agent audit trail: who wrote what, when, and what is still undoable
  identity-options.html  the three directions, and why Blueprint won
tools/
  check-contrast.mjs     every colour pair the system uses, against WCAG, both themes
  audit-rendered.mjs     the rendered pages: computed colour against the surface it lands on
system/
  README.md              the brand book: principles, content and visual foundations, token usage
  tokens.json            colour (2 themes), type, spacing, radius, shadow
  ux-patterns.md         what the ShredPace captures taught, taken / adapted / refused
  navigation.md          information architecture, routes, page skeleton, responsive reduction
  components/            eleven components, each a README plus a live preview, and the Cover
```

Open any prototype straight from disk — they are self-contained, with no build step and no
dependency beyond Google Fonts.

```bash
open docs/design/ailiftcoach/prototypes/today.html
```

The component previews under `system/components/` are fragments that expect the design system's
generated `tokens.css`, so they render unstyled on their own. Read them in the artifact.

## Status

**A proposal, not an approved design.** `AGENTS.md` requires design approval before implementation
and that gate has not been passed.

Both previously unverified claims are now measured.

**Contrast: 50 pairs, two themes, 0 failing.**

```bash
node tools/check-contrast.mjs
```

It exits non-zero on a failure, so it can gate a palette change. Four exceptions are recorded in
the script with their reasons rather than skipped: `ink-faint` is placeholder and disabled text,
which WCAG exempts, and three hairline tokens are decorative separators that identify no component
and so fall outside 1.4.11. Those rules are deliberately quiet — raising them to 3:1 would read as
a border and rebuild the boxes this system avoids.

**Both themes, every screen: 34 renders, 0 text elements below contrast.**

```bash
node tools/audit-rendered.mjs
```

`check-contrast.mjs` proves the palette is sound in the abstract; this proves the pages *use* it
correctly. It walks the rendered DOM, reads each element's computed colour and the surface its text
actually lands on — compositing translucent layers on the way up — and checks the ratio. It is the
check that catches a literal colour readable in only one theme, or a token defined solely inside a
`[data-theme]` block.

It found one real defect, in the identity comparison page: **every dark specimen's table text was
invisible**. The cause is the third instance of the same root problem — a standalone file has no
`<!doctype html>` (the artifact skeleton supplies it), so it renders in **quirks mode, where a
table does not inherit colour from its ancestors**. The cells fell back to the page theme while
their panel kept its own background. The doctype cannot be added, because the published file must
not carry one, so those cells now set colour explicitly.

It caught a second one on Activity: the "past 7 days" marker on a write too old to undo was set in
`ink-faint`, which the system reserves for placeholder and disabled text. That marker is content —
it is the page telling you a write can no longer be reversed — so it is `ink-muted` now. The
distinction it carries lives in the wording (`undo until 27 Nov` against `past 7 days`), which is
what the system requires anyway: colour alone never encodes a state.

**Phone width: every screen rendered at 390px, no horizontal overflow.** Three defects surfaced
only by rendering the files rather than the artifacts, and all three were invisible in the
published pages because the artifact skeleton papers over them:

1. **No `<meta name="viewport">`.** Standalone, Chrome fell back to a 980px layout, so every page
   was zoomed out on a phone. The skeleton injects one; a file opened from disk has none.
2. **`[hidden]` was being overridden.** `.shell { display: flex }` is a class selector and outranks
   the browser default for `[hidden]`, so the whole signed-in shell rendered underneath the sign-in
   screen. The skeleton supplies `[hidden] { display: none !important }`; standalone files now
   carry it themselves.
3. **Set-table columns scrolled out of reach** at phone width with no affordance. Cell padding is
   tightened below 900px so all four columns fit — *Last time* is the comparison the table exists
   for, and a column scrolled out of sight is a column lost.

## One trap worth knowing before editing colours

`plate-*` are the real IWF plate colours and are fixed across both themes — a 20 kg plate is blue in
a dark gym too. Two of them share hex values with state tokens (`#1f7a4d` is both the old ok green
and `plate-10`; `#e0a33a` is both dark caution and `plate-15`), so **never recolour by
find-and-replace on hex values**. Match on token name, per theme block.

## Not copied

`design-system.json` — the artifact's own index. It is machine state for the published page, and it
carries records for 263 uploaded ShredPace captures that have no business in this repository.
