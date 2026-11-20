# StatTile

A single measurement with its label, unit and, where the figure needs qualifying, a caption.

Stat tiles always appear as a row of three to five, directly under the page title, before any
detail. They are the summary a lifter leaves with if they read nothing else.

## Anatomy

- **Label** — `label` style, `ink-muted`, uppercased in CSS. Names the measure, not the context.
- **Figure** — `figure-xl` in the `mono` family, `ink`, tabular. The only large thing on the tile.
- **Unit** — `figure-m`, `ink-muted`, sharing the figure's baseline. Never omitted.
- **Caption** (optional) — `small`, `ink-muted`. Present whenever the figure is not a direct
  measurement: `estimate`, `new lifts`, `of 4 planned`.

The tile is `surface-card` with a `line` border at `radius-lg`, padded `space-4`.

## Rules

- **A figure without a unit is a bug.** If the measure is genuinely unitless, the unit slot takes
  the noun: `4` + `sets`.
- **Qualify estimates in the caption, not the figure.** Write `255` + `kcal` with caption
  `estimate`, never `~255`. The figure stays machine-readable; the caveat is beside it.
- **Three to five per row.** Two is a pair of facts, not a summary; six stops being scannable.
- Tiles in a row are the same height whatever their content, so their labels and figures align
  across the row. A tile without a caption keeps the caption's space.
- **No colour by default.** A tile takes `state-*` on its figure only when the figure itself is a
  status — a broken streak, a pain score at 7 or more. Volume is never green for being high.
- Where a tile is derived rather than logged, pair it with a `ProvenanceChip` in the caption slot
  instead of plain text.

## Consumer provides

The label, the formatted figure, the unit, and the caption or chip. The component does no
rounding and no unit conversion — a figure is rounded once where it is computed, so every surface
shows the same value.
