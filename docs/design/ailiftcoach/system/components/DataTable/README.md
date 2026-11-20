# DataTable

The general table: sessions, exercises, measurements, anything that is a list of records with
figures. `SetTable` is the one specialisation, because a set table has fixed columns and a footer
rule; everything else uses this.

## Structure

- **Head** in `label` style on `surface-sunken`, with a `line-strong` rule beneath. The rule is the
  one piece of weight in the table.
- **Rows** separated by `line`. **Never striped** — striping adds colour that carries no meaning,
  and this system spends colour only on information.
- **Text cells** in `body`. **Figure cells** in `mono`, `figure-m`, right-aligned, with
  `tabular-nums` so columns align on the decimal and a changing value does not reflow its
  neighbours.
- **A secondary line** inside a cell takes `small` and `ink-muted`: an exercise's equipment under
  its name, a rule under its label.

## Rules

- **Right-align figures, left-align words.** A column of right-aligned numbers can be compared at a
  glance; a column of centred ones cannot.
- **Units go in the head or the cell, never nowhere.** `Best set` with `100 × 5` is clear because
  the unit is in the value; `Volume` needs `kg` somewhere.
- **A missing value is `—`, not blank and not `0`.** Blank reads as a rendering fault; zero is a
  measurement that was not taken.
- **The whole table scrolls horizontally inside its own container**, never the page. Below 900px
  the cell padding tightens before anything is dropped — a column scrolled out of sight with no
  affordance is a column lost, and the comparison column is usually the one that matters.
- **No row is coloured for being good or bad.** A personal best is a word in the cell, not a green
  row. Use `StatusPill` where a row genuinely has a state.
- **Sorting and filtering are reads, so they are allowed.** Filter chips above the table are real
  controls; nothing inside the table is.

## Density

`space-3` (12px) vertical padding is the floor for a comfortable row, `space-5` (24px) horizontal
on desktop. A table that needs more than about seven columns is usually two tables, or a detail
page with a list.

## Consumer provides

The columns with their alignment, the rows, and the empty-cell marker. The component does no
formatting — figures arrive already rounded, because a figure is rounded once where it is computed.
