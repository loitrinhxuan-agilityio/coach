# AI Lift Coach

A design system for a read-only training dashboard that someone else's agent writes to.

The person never types a set into this interface. They tell Claude, ChatGPT or their own agent
what they did; the agent calls the API or the MCP server; this dashboard shows what is now true
and what the coaching rules make of it. That one fact decides nearly every rule below.

## Five principles

**1. Every number names its source.**
The coaching is deterministic and explainable, so the interface has to be able to say where a
figure came from: logged by an agent, told by the person, computed by a rule, or estimated. A
figure that cannot name its source does not belong on the page. This is what `ProvenanceChip`
is for, and why `small` exists as a type style.

**2. Chroma means something.**
Neutrals carry the whole interface. Colour is spent in exactly three ways: `accent` for things
you can interact with, `state-*` for status, and `series-*` for data. Nothing is coloured to
look good. If a reader sees colour, there is information in it.

**3. The dashboard reports; the agent acts.**
There is no Save, no Delete, no Edit. Where another product would put a button, this one puts
the sentence you say to your agent, with a copy control: `AgentCommand`. Read-only is not a
limitation to apologise for — it is the product, and the interface should look deliberate about
it rather than disabled.

**4. Density without crowding.**
This is a desktop-first instrument for people who want to see a training block at once.
Information is dense, but it is separated by `line` hairlines and the `space-*` grid rather than
by boxing everything. Fewer card edges, more aligned columns.

**5. Square, not soft.**
`radius-lg` (10px) is the largest corner in the system. Chips and pills take `radius-sm` (3px).
`radius-round` exists for status dots and the avatar, and for nothing else. The geometry should
read as a measuring instrument.

## Content fundamentals

Write from the lifter's side of the screen.

- Name things as a lifter does: *working sets*, *top set*, *e1RM*, *deload*, *RPE*, *tonnage*.
  Never *record*, *entity*, *payload*.
- State the rule, not the vibe. "Stay at 100 kg, 6 on every set" beats "Keep pushing".
- Attribute anything the system concluded. "Next time" lines say what triggered them.
- Units are always written: `kg`, `min`, `kcal`, `×`. A bare number is a bug.
- Dates in the lifter's own week: *Wed 18 Nov*, not *2026-11-18*, except where a column needs to
  sort.
- An empty state says what will fill it and which sentence to say to the agent. It never shows a
  zero as though it were a measurement.

## Visual foundations

**Type.** Two families from one superfamily, and the split carries meaning: `ui` (Spline Sans) for
everything a person reads as language, `mono` (Spline Sans Mono) for everything that is a
measurement. They share skeletons, so a table of figures sits beside its prose without looking
pasted in. If it has a unit, it is set in mono, with `font-variant-numeric: tabular-nums`, so
columns of figures line up and a changing number does not reflow its neighbours.

The `label` style is the system's signature: 11px, 600, `0.08em` tracking, uppercased in CSS.
Use it for tile labels and column heads, never for a sentence.

**Colour — Blueprint.** The identity is drafting: blue-grey paper in light, a deep navy ground in
dark, and one precise cyan. Neutrals are navy-biased rather than grey, so `ink` at `#10243a` is
never pure black and the whole page belongs to one family. `surface-page` is never white in light
theme: cards are white and need something to sit on. In dark theme the relationship inverts —
`surface-card` is lighter than `surface-page` — so build with the tokens and never with a
hard-coded colour.

The accent earns the direction or ruins it. Cyan on navy reads as instrumentation when it marks
only what you can interact with, and as a corporate template the moment it starts filling
headers, borders and icons for decoration. If a screen looks like a generic admin panel, the
cause will be accent used where `ink` or `line` belonged.

Both themes are designed, not inverted. Check any new colour at 4.5:1 against the surface behind
it in **both**.

**Rules over boxes.** Prefer a `line` hairline to a new card. A card is an object with its own
subject; a group of rows is not. Shadow is reserved for `shadow-popover`.

**Charts.** Axis text and labels come from `ink-muted`, grid lines from `line`. Series use
`series-1` to `series-4`, in order, never more than four. Anything that is context rather than
fact — last time, the plan, a projection — is `series-ghost`, and is drawn dashed. Every chart
labels its own units.

## Iconography

Line icons, 1.5px stroke, 20px on a 24px box, drawn on the same 4px grid, `currentColor` so they
inherit `ink` or `ink-muted`. They sit beside a word in navigation and status, and are never the
only label for an action.

The system has no mascot and no illustration style. The one picture it allows is the anatomical
body map, because it carries data (sets per muscle), and the one decorative-looking element is
`PlateStrip`, which is also data.

## Using the tokens

- Text on `surface-card` is `ink`; its labels and captions are `ink-muted`. `ink-faint` is for
  disabled and placeholder only — never for content.
- A link, a focus ring and the selected nav row are `accent`. Nothing else is.
- A status takes `state-*` as its text and `state-*-soft` as its fill, and always carries a word.
  Colour alone never encodes a state.
- `plate-*` appears only inside `PlateStrip`. Those are the real IWF plate colours, fixed across
  both themes because a 20 kg plate is blue in a dark gym too.
- Gaps and padding come from `space-*`. If a value is not on the 4px grid, it is wrong.

## What is here

| | |
|---|---|
| `tokens.json` | Colour, type, spacing, radius, shadow |
| `ux-patterns.md` | The ShredPace pattern analysis this system was built from |
| `navigation.md` | Information architecture and the navigation model |
| `components/` | Eleven components, each with guidelines and a live preview |

**Data display** — `StatTile`, `SetTable`, `DataTable`, `Chart`
**Explainability** — `ProvenanceChip`, `StatusPill`, `EmptyState`
**Training** — `PlateStrip`, `BodyMap`
**Agent** — `AgentCommand` · **Navigation** — `SideNav`

Three of these exist to keep the product honest rather than to decorate it. `ProvenanceChip` makes
every figure name its source. `EmptyState` names the threshold a panel is below and what unlocks
it, instead of apologising. `AgentCommand` is where a button would go in a product that could
write its own data.
