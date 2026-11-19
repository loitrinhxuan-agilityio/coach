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
| Identity options | <https://claude.ai/artifact/NxoJpKmDY7hF5EZBptT5KU> |

All five are private. Nobody else can open them until they are shared from each page's Share menu.

## What is here

```
prototypes/
  today.html             the Today dashboard
  session.html           a finished workout session
  screens.html           Progress, Goals, Body, not-enough-data, first run (hash-routed)
  identity-options.html  the three directions, and why Blueprint won
system/
  README.md              the brand book: principles, content and visual foundations, token usage
  tokens.json            colour (2 themes), type, spacing, radius, shadow
  ux-patterns.md         what the ShredPace captures taught, taken / adapted / refused
  navigation.md          information architecture, routes, page skeleton, responsive reduction
  components/            seven components, each a README plus a live preview, and the Cover
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

Two claims are not yet verified, and are the first work when this resumes:

1. **Contrast.** `system/README.md` asserts 4.5:1 in both themes. The values were chosen by eye and
   never measured.
2. **Phone width.** The prototypes carry responsive CSS but were only ever rendered at desktop.

## One trap worth knowing before editing colours

`plate-*` are the real IWF plate colours and are fixed across both themes — a 20 kg plate is blue in
a dark gym too. Two of them share hex values with state tokens (`#1f7a4d` is both the old ok green
and `plate-10`; `#e0a33a` is both dark caution and `plate-15`), so **never recolour by
find-and-replace on hex values**. Match on token name, per theme block.

## Not copied

`design-system.json` — the artifact's own index. It is machine state for the published page, and it
carries records for 263 uploaded ShredPace captures that have no business in this repository.
