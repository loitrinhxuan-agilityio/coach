# SetTable

One exercise from one session: every set, what the same exercise did last time, and what each set
projects to. The densest component in the system and the one a lifter looks at longest.

## Columns

| Column | Style | Why it is there |
|---|---|---|
| **Set** | `figure-s`, `ink-muted` | The index. Deliberately quiet. |
| **Today** | `figure-m`, `ink` | `weight × reps`. The fact. |
| **Last time** | `figure-m`, `ink-muted` | The comparison that makes the table worth reading. |
| **e1RM** | `figure-m`, `ink-muted`, right-aligned | What the set projects to, by one stated rule. |

*Last time* is `ink-muted`, not `ink`: today is the subject, last time is the reference. An
exercise with no history shows `—` rather than an empty cell, so the column still reads as a
column.

## The footer line

Under the rows, separated by a `line-strong` rule: the deterministic next-time prescription.
It states its **trigger** and then its **prescription**, in that order, in one sentence.

> **First time logged.** Next time: stay at 100 kg, 6 on every set.

> **Three sessions at the same weight.** Next time: 102.5 kg, 5 on every set.

This is the coaching, and it is the reason the component has a footer slot at all rather than
sending recommendations to a panel elsewhere. A rule shown next to the data it read is
explainable; the same rule in a sidebar is an opinion.

## Rules

- **Every figure is `mono` and tabular.** Columns of weights must align on the `×`.
- **The header row** is `label` style on `surface-sunken`, with a `line-strong` rule beneath.
- **Rows are separated by `line`**, never striped. Striping adds colour that means nothing.
- **Never colour a row for being good or bad.** A personal best is marked with a word in the
  Today cell, not a green row.
- **Warm-up sets are excluded** unless the lifter asks for them; the table counts working sets,
  and the tile row above it agrees.
- The whole table scrolls horizontally inside its own container at narrow widths. Dropping *Last
  time* to fit would remove the comparison the table exists for.

## Consumer provides

The exercise name and its muscle list, the rows, the previous session's matching rows, the
computed e1RM per set, and the footer sentence with its trigger. The component formats nothing
and decides nothing.
