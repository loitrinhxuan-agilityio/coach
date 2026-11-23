# EmptyState

What a panel shows when the coaching rules do not yet have enough to say anything sound.

Most empty states apologise or sell. This one does neither: it names the **threshold**, says what
**unlocks** it, and gives the **sentence** that would fill it. A lifter should leave knowing exactly
why the panel is empty and exactly what changes it.

## Anatomy

- **A heading that states the rule**, not the absence: *"The chart starts in week two"*, not
  *"No data yet"*.
- **One sentence of why.** The reason is a threshold the coaching needs, and saying it out loud is
  the difference between a product that looks broken and one that looks careful:
  *"A trend line needs at least two weeks of sessions. One week gives a single point, and a single
  point is not a direction."*
- **Where you are against it**, in bold: *"You have 3 sessions in week 1."*
- **An `AgentCommand`** that would move it along, where one exists.
- A dashed `line-strong` border at `radius-lg` on `surface-card`. Dashed is the one place the system
  uses it: the panel is a placeholder for something real.

## Rules

- **Never show a zero as if it were a measurement.** A tile with no reading shows `—`, not `0`.
  Zero sets is a fact; zero body fat is a missing reading, and drawing it as `0%` is a lie.
- **Say what unlocks it, with the number.** *3 weigh-ins over 7+ days*, *5 sessions of one lift*,
  *30 days*. Vague waiting feels like a fault.
- **Never imply a paywall when there is none.** Where thresholds are statistical rather than
  commercial, say so plainly: *"Nothing here is a paywall. These are the thresholds the coaching
  rules need before a conclusion would be sound."*
- **Keep the surrounding furniture.** The card, its title and its subtitle stay; only the content
  area is empty. A panel that vanishes teaches people it was never there.
- **Do not animate it**, and do not illustrate it. There is no mascot.

## The first-run case

A brand-new account is not an error state and gets no dashed box — it gets the connect flow. Use
`EmptyState` for *a specific panel below its threshold*, not for *an account with nothing in it*.

## Consumer provides

The threshold, the current position against it, and the command. The component decides nothing.
