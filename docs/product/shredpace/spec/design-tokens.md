# Design tokens

Extracted from the shipped bundle, not guessed. Full data in
[`evidence/themes.json`](../evidence/themes.json); the font declarations are verbatim in
[`evidence/fonts.css`](../evidence/fonts.css) and the no-flash boot script in
[`evidence/theme-boot.js`](../evidence/theme-boot.js).

## Themes

**Seven themes × three modes** (`system`, `light`, `dark`). The default is **Ember, dark** —
the SPA shell ships `data-theme="ember" data-mode="dark"` hard-coded. A blocking
`theme-boot.js` reads `localStorage` keys `shredpace.theme` and `shredpace.mode`, falls back to
`prefers-color-scheme`, and sets `--boot-bg` plus the `theme-color` meta before first paint.

| Theme | Name | Blurb (verbatim) | Display face | Radius / pill |
|---|---|---|---|---|
| `ember` | Ember | Charcoal and orange, condensed italic. | Archivo, italic, `font-stretch: 78%`, 800, uppercase | 20 / 999 |
| `chalk` | Chalk and iron | Graphite, chalk and lime, sharp. | Archivo, `font-stretch: 118%`, 900, uppercase | **6 / 6** |
| `trail` | Trail | Slate, paper and signal yellow. | IBM Plex Sans Condensed, 600 | 12 / 10 |
| `blush` | Blush | Rose and plum, a soft italic serif. | Fraunces, italic, 700 | 26 / 999 |
| `sage` | Sage | Sage and cream, calm and airy. | Outfit, 600 | 18 / 999 |
| `lilac` | Lilac | Lavender and violet, crisp and modern. | Sora, 700 | 22 / 999 |
| `studio` | Studio | Warm paper, frosted cards, light type. | Inter, 600 | 14 / 999 |

`chalk` is the only theme with a non-pill small radius — 6 px on both, which is what "sharp"
in its blurb refers to.

## Palette shape

Every theme carries a light and a dark map with the same ten keys:

```
bg · bg2 · panel · line · text · muted · accent · on · bar · acts[3]
```

`acts` is a three-colour categorical ramp for charts and status. In Ember dark that is
`#ff8a4c`, `#f6c445`, `#8bd17c` — orange, amber, green, which differ in hue *and* lightness.

### Ember (the default)

| Token | Dark | Light |
|---|---|---|
| `bg` | `#0e0e10` | `#f3efe8` |
| `bg2` | `#131316` | `#ece6dc` |
| `panel` | `#18181b` | `#fffdf9` |
| `line` | `#2e2e33` | `#e0d9cc` |
| `text` | `#f4f4f5` | `#1b1a18` |
| `muted` | `#a1a1aa` | `#6e695f` |
| `accent` | `#ff5b1f` | `#c8401a` |
| `on` | `#0e0e10` | `#ffffff` |
| `bar` | `#3a3a40` | `#d9d2c5` |

The accent darkens from `#ff5b1f` to `#c8401a` in light mode rather than staying put — the
orange would fail contrast on cream otherwise. Only `chalk` keeps one accent (`#c6f432`) across
both modes.

### Theme boot backgrounds

`theme-boot.js` carries a `[dark, light]` background pair per theme, used for `--boot-bg` and
the browser `theme-color`:

| Theme | Dark | Light |
|---|---|---|
| ember | `#0e0e10` | `#f3efe8` |
| chalk | `#101211` | `#f4f5f1` |
| trail | `#0d1317` | `#f5f3ec` |
| blush | `#141013` | `#fbf3f4` |
| sage | `#0f1311` | `#f4f3ee` |
| lilac | `#110f16` | `#f6f4fb` |
| studio | `#101012` | `#f5f5f3` |

## Typefaces

All seven are **self-hosted woff2 under SIL Open Font License**, with a stated rule that
"a face downloads only when a theme uses it":

Archivo (variable width 62–125% and weight 100–900, italic and normal), IBM Plex Sans Condensed
600, IBM Plex Mono 500, Fraunces italic, Outfit, Sora, Inter.

Archivo's **width axis** is load-bearing: Ember condenses it to 78% and Chalk expands it to
118%, from the same font file.

## Where this is used

The prototype in this folder's companion artifact is built on exactly these values — see
[README.md](../prototype/README.md).
