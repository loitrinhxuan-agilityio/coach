# SideNav

The fixed 240px sidebar: six destinations, Settings, and the agent status pinned to the foot.

## Structure

- **Wordmark** at the top, `display-s`.
- **Destinations** — Today, Training, Progress, Body, Food, Goals. Icon plus word, `body` style,
  48px rows.
- **Settings**, separated by a `line` rule. It is not a training destination.
- **Agent status**, pinned to the bottom. Not a nav row — a standing answer to a standing
  question.

## The selected row

`accent-soft` fill at `radius-md`, label in `accent` at 600, icon inheriting. No left border bar:
that device is a cliché and it fights the hairline language used everywhere else.

## Agent status

In a product whose only writer is an external agent, *is it connected, and when did it last
write* is permanent context, so it gets permanent space.

- A `state-ok` dot and **Connected**, with the agent's name: *Claude · Connected*.
- The last write in `small`: *Last wrote 16:07*.
- If nothing has arrived for longer than the lifter's usual gap, the dot goes `state-caution` and
  the line reads *No writes since Tuesday* — a fact, not an error. The dashboard cannot know
  whether that is a problem.
- It links to Settings → Agents, where keys live. It never offers to reconnect, because the
  dashboard cannot.

## Rules

- **Six destinations, and that is the budget.** A seventh means something belongs inside another.
- **Never put an assistant entry here.** There is no model in this product.
- **No badges or counts.** Nothing in this product is unread.
- Icons are 20px line icons on a 24px box, `currentColor`, and always beside their word.

## Responsive

Below 900px the sidebar becomes a bottom bar with the first five destinations. Goals, Settings
and agent status move into an account sheet. The bottom bar adds
`env(safe-area-inset-bottom)` to its own padding.

## Consumer provides

The current route, the agent's display name, its connection state and last-write time.
