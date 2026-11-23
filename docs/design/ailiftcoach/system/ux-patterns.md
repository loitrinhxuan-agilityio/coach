# Patterns taken from ShredPace

Read from 417 full-page captures of shredpace.com — the public site, the API reference, and the
signed-in dashboard at desktop and phone in both themes. What follows is a reading of **how that
product solves the agent-first problem**, and what AI Lift Coach takes, adapts or refuses.

Nothing about its branding is carried over. Its identity is charcoal and orange, condensed italic
uppercase display type, and 999px pills. Ours is Blueprint: navy-biased neutrals, Spline Sans with
Spline Sans Mono for anything carrying a unit, and a 10px maximum corner. The overlap is
structural, not visual.

## Taken

**The agent-command affordance.** A read-only dashboard still has to let people *do* things. Its
answer: print the sentence to say to the agent, with a copy control — "Fix a set", "Delete a set",
"Bench 80 × 8, felt good". This is the single most important pattern in the product, and the one
most easily got wrong by adding real buttons that then have nothing to call. Ours is
`AgentCommand`.

**Provenance on derived values.** Effort and feel carry a *from Claude* badge; a line underneath
reads *told to Claude at 12:05*. It makes the difference between what the lifter said, what the
agent logged and what the system computed legible at a glance. Ours is `ProvenanceChip`, and we
push it further: estimates are marked too.

**The deterministic next-time line.** Under each exercise table: *First time logged. Next time:
stay at 100 kg, 6 on every set.* The rule states its trigger and its prescription in one
sentence. This is explainable coaching done as interface, and it is why `SetTable` has a footer
slot rather than a separate "recommendations" panel.

**Today / Last time / e1RM as the set table's columns.** Three columns answer what a lifter
actually asks: what did I just do, what did I do before, what does that project to. We keep the
shape exactly.

**The stat tile row.** Five tiles — time, working sets, volume, first marks, calories — label on
top, figure with its unit, and a caption where the figure is qualified (*estimate*, *new lifts*).
The caption slot is what makes the row honest, so `StatTile` keeps it.

**Agent connection as persistent status.** A card pinned to the bottom of the sidebar: *Claude is
connected · Last heard 16:07 · logs every set you send*. In a product where an agent is the only
writer, "is it still connected" is a first-class question. Ours lives in `SideNav`.

**Sets per muscle, split working vs helping.** The body map lists *Glutes 4 sets*, *Adductor
magnus 4 helping*. Distinguishing direct from indirect work is a real coaching distinction and
costs one word.

**A token contract with a fixed shape.** Every one of its seven themes carries the same ten keys
(`bg · bg2 · panel · line · text · muted · accent · on · bar · acts[3]`), which is why theming is
cheap there. We adopt the discipline — one flat token list, every theme answering the same names —
without adopting the names or values.

**Categorical colours that differ in lightness, not only hue.** Its three-colour chart ramp varies
both. Ours does the same across `series-1` to `series-4`, so a chart survives greyscale and
colour-blindness.

## Adapted

**Navigation.** Its sidebar splits destinations (Today, Training, Food, Body, Goals) from a TOOLS
group (Ask Claude, Your agents, Coach, Settings). The split is right; the contents are not, for a
product with no built-in model. We drop *Ask Claude* entirely — there is no assistant in our
product to ask — and promote agent connection from a tool to a status element. See
`navigation.md`.

**Theme count.** Seven named themes is a lot of surface for a dashboard, and it dilutes the
identity: a product that looks like seven things looks like none. We ship light and dark of one
identity and spend the saved effort on both being properly designed.

**The phone layout.** Its phone boards move navigation to a bottom bar and stack the tiles two
across. Sound, and we keep it — but our product is explicitly desktop-first, so phone is a
graceful reduction of the desktop view rather than a separately designed board set.

## Refused

**Pills and heavy rounding.** 999px radii and 20px cards read as consumer fitness. This product is
a measuring instrument. `radius-lg` stops at 10px.

**Display type as personality.** Condensed italic uppercase at 64px is a strong voice that fights
with dense numeric tables. Our display face stays quiet so the figures can be the loud thing.

**Seven-theme switching as a feature.** See above.

**An in-product assistant.** There is no model in our application. Anything that looks like a chat
affordance would be a lie about what the product does.

## Contradictions worth not inheriting

Its own material disagrees with itself in places, and this product should settle these rather than
reproduce them:

- A stall is **5 sessions** on one page and **4** in the agent guide.
- A deload is *about half the sets* in generated programs and *about 60% of the sets at 90% of the
  weight* in the guide.
- One e1RM renders as **117**, **116.7** and **116.5** on three different pages. Pick a rounding
  rule and apply it once.
- *Time trained* shows "0:11 hours" for eleven minutes, and a single set reads "1 sets".

Our rule: a derived figure is rounded once, at the point it is computed, and every surface shows
that same value. Units and plurals are formatted by one helper, not per screen.
