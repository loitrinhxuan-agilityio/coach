# Navigation and information architecture

Desktop-first. A fixed 240px sidebar, a content column that grows to a 1280px maximum, and an
optional right rail at 360px for context that supports the main subject without being it.

## The model

Two groups, and the split is meaningful rather than cosmetic.

**Destinations** are places where training data lives. A lifter moves between them the way they
would flip sections of a logbook.

| | What it answers |
|---|---|
| **Today** | What is true right now, and what is planned |
| **Training** | Every session, and any one session in detail |
| **Progress** | What has changed over weeks and blocks |
| **Body** | Weight, composition, measurements, aches |
| **Food** | Intake against targets |
| **Goals** | What was committed to, and whether it is on track |

**Settings** is the second group, on its own: plan and billing, units, gym equipment, privacy and
data export, and the agent keys.

Below both, pinned to the foot of the sidebar, sits the **agent status** element. It is not a
destination. In a product whose only writer is an external agent, *is it connected and when did it
last write* is a standing question, so it is standing information.

## What is deliberately absent

- **No assistant entry point.** There is no model in this product. A chat affordance would promise
  something the application cannot do.
- **No create, edit or delete anywhere.** Every mutation happens through the agent. Where an
  action would sit, the interface offers the sentence to say instead — see `AgentCommand`.
- **No notification centre.** Coaching conclusions surface on the screen they belong to, with the
  rule that produced them.

## Routing

Routes are flat and readable, and a detail route always carries its own id so that any view can be
linked, bookmarked and sent.

```
/today
/training                    /training/{sessionId}
/progress
/body                        /body/metric/{metric}      /body/ache/{area}/{side}
/food
/goals                       /goals/{goalId}
/settings                    /settings/{panel}
```

Three rules keep this honest:

1. **Every detail view is addressable.** No state that exists only after a click.
2. **A malformed id falls back to its parent**, never to an error page.
3. **A view that needs data it does not have renders its empty state**, which names the sentence
   that would fill it.

## Page skeleton

Every page is built from the same parts, in the same order:

1. **Breadcrumb**, where the page has a parent (`‹ Training`).
2. **Eyebrow** in `label` style: the metadata that locates this page — date, time range,
   category, programme.
3. **Title** in `display-l`. One per page.
4. **Stat row**: three to five `StatTile`s. The summary, before any detail.
5. **Body**: tables, charts and panels in the content column.
6. **Rail** (optional): supporting context — what this means, what is next, what to say to the
   agent.

The summary always precedes the detail, so a lifter who reads only the first screen still leaves
with the answer.

## Responsive reduction

The phone view is the desktop view reduced, not redrawn.

- The sidebar becomes a bottom bar carrying the first five destinations; Settings and agent status
  move into an account sheet.
- The rail unstacks and follows the body content, in the same order.
- Stat tiles go from a five-across row to a two-across grid; the fifth tile wraps rather than
  shrinking below legibility.
- Tables keep all their columns and scroll horizontally inside their own container. Dropping the
  *Last time* column would remove the comparison that gives the table its point.
