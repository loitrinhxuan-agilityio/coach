# AgentCommand

The sentence to say to your agent, with a control that copies it.

This is how the product does actions. The dashboard cannot write training data — only an agent
can — so wherever another application would put a button, this one shows the words that cause the
thing to happen, ready to paste into Claude, ChatGPT or whatever the lifter uses.

## Anatomy

- A **lead line** in `body` naming what this does: "Correct a set", "Start the next session".
- The **command** itself in `mono` on `surface-sunken`, quoted, at `radius-sm`.
- A **Copy** control at the end of the row.
- Optionally a **note** in `small` saying what will come back.

## Rules

- **Write the command as a person would speak.** `"Bench 80 × 8, felt good"` — not
  `log_sets(exercise="bench", weight=80, reps=8)`. The lifter is talking to an agent, not calling
  an API. Where the agent needs an id, the command names the thing in words and lets the agent
  resolve it.
- **Fill in what the screen knows.** On a session page, the command already contains that
  session's exercise and date. A generic command the lifter has to edit is a worse button.
- **Copy, never send.** There is no channel from this dashboard to the agent. The control says
  `Copy` and the toast says `Copied`. Never imply the message was delivered.
- **Group at most three** in one block. A wall of suggested sentences reads as a command
  reference, which is what the API docs are for.
- Place it where the action would have been: under the table it corrects, at the foot of the rail
  it belongs to. Never collected into a global "actions" panel.

## Why not a real button

A write button would need a model in the product to interpret it, and there is none. It would
also lie about where the lifter's training record comes from: one agent, with one audit trail.
Keeping every mutation in the agent's own transcript is the product's integrity story, and the
interface should look like it means it.

## Consumer provides

The lead line, the fully-resolved command text, and the optional note. The copy behaviour and the
toast belong to the component.
