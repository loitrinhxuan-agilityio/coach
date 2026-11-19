# ProvenanceChip

A small marker saying where a value came from. The system's most important component, because
the coaching only counts as explainable if the interface can answer "says who?".

## The four sources

Every value on a screen is one of these, and each has a fixed chip:

| Source | Chip | Meaning |
|---|---|---|
| Logged | `Logged` · `state-ok` | An agent wrote it through the API. Fact. |
| Told | `You said` · `series-2` | The lifter reported it in words — effort, feel, soreness. |
| Computed | `Computed` · neutral `line` | A rule derived it from logged data. e1RM, tonnage, trend. |
| Estimated | `Estimated` · `state-caution` | A model filled a gap. Calories, bodyweight on an unweighed day. |

## Rules

- **A chip is a statement of fact, not a warning.** `Estimated` uses `state-caution` because it
  wants a second look, not because anything is wrong. Never pair a chip with an error colour.
- **No provenance chip uses `accent`.** Accent means *you can interact with this*, and a chip is
  not interactive. `You said` borrows the violet from the data ramp instead: it is the one mark
  for something the person contributed, which is neither a status nor a thing to click.
- **Only mark what is not obvious.** A set the lifter can see in the table does not need a
  `Logged` chip beside every row — mark the table once. Mark a figure individually when it sits
  next to figures of a different kind.
- **Computed values carry their rule.** The chip says *Computed*; the text nearby says what from.
  "e1RM from 100 kg × 5, Epley" is the point, and the chip is the flag that there is a rule
  behind it.
- **Pair with a timestamp where timing matters.** *You said · 12:05* under a feel rating tells the
  lifter it was captured after the session, not guessed later.
- Chips take `radius-sm`, `space-2` horizontal padding, and sit on the `-soft` fill of their own
  colour. The neutral `Computed` chip uses a `line` border with no fill, so it recedes — computed
  values are the most common, and should be the quietest.

## Accessibility

Colour is never the carrier: every chip has a word. The four are distinguishable in greyscale by
their text alone, which is the test.

## Consumer provides

The source, and optionally a timestamp and the rule that produced the value.
