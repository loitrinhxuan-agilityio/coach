# The design folder, and handing work between design and development

**Status: proposed, awaiting Owner approval.** Items marked *(not yet decided)* are recommendations
the Owner has not ruled on.

## Who owns what

**The Design Agent exclusively owns `docs/design/ailiftcoach/**`.** Boards, the token system, the
component library and the prototypes are its work. No Builder, and not the Dev Lead, edits a file
under that path.

**`docs/design/CHANGES-FOR-DESIGN.md` is the one carve-out.** It sits beside `ailiftcoach/`, not
inside it, and it is the only file under `docs/design/` that development may write. That makes the
boundary a path rule a reviewer can check without judgement.

Nothing enforces this mechanically yet. A `CODEOWNERS` entry was considered and does not fit:
GitHub only accepts real users and teams, and the Design Agent is a role an agent plays, not an
account — so the entry could only name the Owner, which restates the design-approval rule already
in `AGENTS.md`. Revisit it as a CI check once CI exists (see
[development-preparation.md](development-preparation.md), item 6).

## The handoff file carries one direction

`CHANGES-FOR-DESIGN.md` is **development to design**: a queue of requests from Builders and the Dev
Lead to the Design Agent. Its name says so.

Design to development already has a channel — the approved board, plus the UI quality gate checking
the build against it. Development has none, because development cannot write to the design folder.
One file carrying both directions would collide with the ownership rule above.

## Where it came from

The path is **ShredPace's own convention**, observed in its shipped bundle during the research and
recorded in [`../product/shredpace/review/open-questions.md`](../product/shredpace/review/open-questions.md).
The bootstrap commit created the same path here as an empty file, and nothing referred to it until
now. Its contents were never in the bundle, so only the filename was inherited.

It is kept because a development-to-design request queue is a sound idea on its own merits and the
filename is generic enough to belong to nobody — but it is kept **as this project's own decision**,
not as an artifact of reverse engineering. See D-030 in
[`../product/decision-log.md`](../product/decision-log.md).

## Design and code never share a pull request

**No PR may touch both `docs/design/ailiftcoach/**` and application code.** Design changes go in
their own PR from the Design Agent, for the Owner's design approval.

This is the rule that makes "design approval is required before implementation" real rather than
aspirational. Without it, a Builder's PR can edit a board and have it approved inside a code review
— by a reviewer with no authority to approve a design.

## When a Builder finds the board is wrong

Default: **build to the board as drawn, file an entry, and carry on.** Blocking every issue on a
design round-trip would stall Phase 1, and using your own judgement silently lets the build diverge
from the thing the UI gate checks against.

Stop and wait for a newly approved board **only** when the board is unbuildable, or when the gap
changes behaviour rather than appearance.

## Entry format *(not yet decided)*

The file's own header carries the format, so that this document does not have to. The recommendation
is a **queue, not a log**: every entry carries a status — Open, Done or Declined — and no entry is
ever deleted, so a declined request cannot quietly become a dropped requirement.

Each entry: the date, who raised it, the screen or board, what is wrong, what was built instead, the
issue or PR it came from, and the status.

## An open entry does not block a PR *(not yet decided)*

The recommendation is that it does not. The UI gate compares the build against the **approved**
board; a logged deviation is read by the Independent Reviewer and is visible to the Owner. Making an
open entry a blocker would stall development on design turnaround, which is the thing the default
above exists to avoid.
