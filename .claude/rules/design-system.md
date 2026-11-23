---
paths:
  - "docs/design/ailiftcoach/*.md"
  - "docs/design/ailiftcoach/prototypes/**/*.html"
  - "docs/design/ailiftcoach/system/**/*.{md,json,html}"
---

# Design system: the four traps

Four mistakes have each been made more than twice in this design system. Every one was caught by
rendering or by checking, never by reasoning about the code — so check, do not reason.

## 1. An inline `<span>` cannot carry layout

**A `<span>` that carries `margin`, `height` or a background needs `display: block`.** Three bugs
came from this: every progress bar was invisible because `.bar-fill` was an inline `<i>`; settings
rows ran their title into their caption; and numbered steps rendered as `AppearanceBlueprint`.

## 2. A standalone file lacks what the artifact skeleton supplies

These prototypes are opened from disk *and* published as artifacts, and the publish skeleton
quietly provides three things a local file does not have. All three produced bugs that were
invisible in the published page:

- **No `<meta name="viewport">`** — the page falls back to a 980px layout, so every screen is
  zoomed out on a phone. Each file carries its own.
- **`[hidden]` is outranked** by any class selector such as `.shell { display: flex }`. Each file
  carries its own `[hidden] { display: none !important }`.
- **No `<!doctype html>`,** which a published file must not carry — so a local file renders in
  **quirks mode, where a table does not inherit colour from its ancestors.** Table cells must set
  colour explicitly. This made every dark table specimen render invisible.

## 3. Example figures must survive arithmetic

Six separate errors, including day-header counts that did not sum to their weekly tile, a meal
credited with more protein than the chicken bowl, and a 30-day per-agent total the feed could not
support. Before committing example data, check that meals sum to totals, totals match tiles, bar
widths match value over target, and a feed's day counts reconcile with its tiles. **Where a feed is
truncated, the page says so** ("5 more on Wed 18 Nov") rather than leaving the sums unexplained.

## 4. Colour never encodes a state on its own

A status always carries a word. **`ink-faint` is placeholder and disabled text only — never
content.** Where a faint tone is tempting for "inactive", the wording carries the distinction
instead; "past 7 days" against "undo until 27 Nov" is content, so it is `ink-muted`.

## The token rules live elsewhere, and that file is authoritative

Read **`docs/design/ailiftcoach/system/README.md`**, section "Using the tokens", before changing
anything visual. It is the authority on `accent`, `state-*`, `series-*`, `ink-*` and spacing, and
it is not copied here so that there is only one of it.

One trap from it is worth repeating because it destroys data silently: **never recolour by
find-and-replace on hex values.** Two `plate-*` tokens share hex values with state tokens
(`#1f7a4d`, `#e0a33a`). Match on token name, per theme block.

## Verifying

Both commands and their healthy output are in `AGENTS.md` under Commands. Run them before
reporting a design task complete.
