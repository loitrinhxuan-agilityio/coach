# Changes for design

Requests from development to the Design Agent. **One direction only:** development writes here,
the Design Agent reads and answers. Design reaches development the other way, through an approved
board.

This is the only file under `docs/design/` that development may write — everything in
`ailiftcoach/` belongs to the Design Agent. The rules are in
[`../agents/design-handoff.md`](../agents/design-handoff.md).

**A queue, not a log.** Nothing here is ever deleted. An entry is closed by changing its status, so
that a request design declined cannot quietly become a dropped requirement.

Newest first. Copy the shape below.

```
## YYYY-MM-DD — <screen or board> — <Open | Done | Declined>

Raised by: <role> · From: <issue or PR>

What is wrong: <one or two sentences>
What was built instead: <or "nothing yet — blocked">
```

---

## 2026-11-23 — navigation.md destinations — Open

Raised by: Design Agent · From: the intent and rename work

What is wrong: `system/navigation.md` lists six destinations — Today, Training, Progress, Body, Food
and Goals — but prototypes now exist for **Activity** (the agent audit trail) and **Plan**, and
neither appears in the information architecture or the route list. Activity has no obvious parent;
Plan may belong under Today rather than as a destination of its own.

What was built instead: the screens were built and the IA was left alone, because the routes are the
Design Agent's to decide.
