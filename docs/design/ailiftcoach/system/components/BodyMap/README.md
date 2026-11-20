# BodyMap

Which muscles a session worked, and how much. The only picture in the system, because it is the one
that carries data a table reads worse.

## It is a schematic, not an anatomical drawing

Regions are simple shapes on a figure outline, not muscle bellies traced from an atlas. That is a
deliberate choice, not a shortcut:

- The data has about a dozen groups. An anatomical rendering implies a precision the data does not
  have — it suggests the system knows which head of the triceps did the work.
- A schematic reads at a glance on a phone between sets. A detailed figure does not.
- It stays legible in both themes without a second asset, and it carries no illustration style for
  the rest of the system to live up to.

If a region cannot be shown honestly at this fidelity, it belongs in the list beside the figure
rather than on it.

## Encoding

- **Intensity by sets**, in `series-1` at four steps of opacity: 1, 2, 3, 4+ working sets. Opacity
  rather than hue, so the scale reads as *more of the same thing*.
- **Indirect work is outlined, not filled.** A muscle that helped gets a `line-strong` outline and
  no fill. Direct and indirect are different kinds of fact, and the difference is real coaching
  information — pressing twice as much as you pull is an imbalance whether or not the pulling was
  direct.
- **Untouched regions take `surface-sunken`.** Absence is quiet, not red.
- **The list beside the figure is the source of truth**, and names every region with its count and
  kind: *Glutes · 4 helping*. The figure is the glance; the list is the answer.

## Rules

- **Never colour a muscle by soreness, pain or fatigue.** Those are different data with different
  thresholds, and overloading one picture with three meanings makes all three unreadable. Pain
  lives on Body, with its own scale.
- **Front and back are two figures, not a toggle**, where space allows. A toggle hides half the
  session.
- **The figure is never the only label.** Everything it encodes is also in the list, so the panel
  works for a screen reader and in greyscale.
- Give the `<svg>` a `role="img"` and an `aria-label` that states the session's direct work in
  words.

## Consumer provides

Sets per muscle group, split into direct and indirect. The component does no attribution — which
muscles an exercise works is a property of the exercise, decided where the set was logged.
