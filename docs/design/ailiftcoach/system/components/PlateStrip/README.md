# PlateStrip

How to load the bar for a given weight, drawn in the real colours of the plates.

A lifter reading *102.5 kg* has to do the arithmetic before they can load it. This does it: bar,
then plates per side, largest first, in IWF competition colours.

## Why it is the one decorative-looking thing

It is not decoration. The colours are the plates' own — red 25, blue 20, yellow 15, green 10,
white 5 — so a lifter who knows a gym reads the loading faster from the strip than from the
number. This is the one place in the system where colour is not state or series, and the
`plate-*` tokens exist only here.

Those tokens are **fixed across both themes**. A 20 kg plate is blue in a dark gym too.

## Rules

- **Per side, always.** Label it `per side`. The ambiguity between total and per-side loading is
  the mistake this component exists to prevent.
- **Bar weight is named**, not assumed: `20 kg bar` under the strip. A lifter on a 15 kg bar gets
  a different strip, and the gym's bar is a setting.
- **Largest plate first**, outward from the collar, as they are actually loaded.
- **`plate-5` needs a border.** White plates need `line-strong` around them or they vanish on
  `surface-card` in light theme.
- **If the weight cannot be made** from the gym's plates, say so in words and show the nearest
  achievable load. Never round silently — the number in the table and the strip must agree.
- Each plate is labelled with its weight in `figure-s`. Colour alone would fail for a lifter who
  cannot distinguish red from green, and these are the two heaviest plates.

## Consumer provides

The target weight, the bar weight, and the gym's available plates. The component does the
decomposition and reports when it cannot be done exactly.
