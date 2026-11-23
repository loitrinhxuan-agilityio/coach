# StatusPill

A one-word verdict on something the coaching rules track: a goal, a streak, a plan week, an ache.

## The states

| State | Colour | When |
|---|---|---|
| On track | `state-ok` | The projection reaches the target by the due date. |
| Holding | neutral `line` | Deliberately steady — a maintenance block, a paused habit. |
| Early days | neutral `line` | Not enough readings to judge. A trend needs three. |
| Behind | `state-caution` | The projection misses the date, but the goal stands. |
| Stalling | `state-caution` | Three or more sessions with no progression on a lift. |
| Broken | `state-alert` | A streak ended, or a goal passed its date unmet. |

Six states, and no more without a rule to back them. A status the system cannot derive
deterministically is an opinion, and opinions do not get pills.

## Rules

- **The word carries the meaning; the colour repeats it.** Never a bare coloured dot.
- **Neutral is a real state.** *Holding* and *Early days* are not failures, so they take `line`
  and `ink-muted`, not an amber. Most of a training year is one of these two, and a dashboard
  that renders normality as a warning teaches people to ignore it.
- **`state-alert` is rare by design.** If more than one pill on a screen is red, the thresholds
  are wrong, not the design.
- **Pair with the reason, nearby.** The pill says *Behind*; the line under it says
  *needs 0.9 points a month to make 28 February*. The pill is the flag, not the explanation.
- Pills take `radius-sm` (3px). They are not pills in the rounded sense, and that is deliberate.

## Consumer provides

The state and the explanatory line. The component never computes a state.
