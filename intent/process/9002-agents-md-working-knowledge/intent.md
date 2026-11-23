# Intent: the working knowledge an agent needs at session start

Author: Dev Lead, for the Owner's review. Status: draft.

## Problem

This project's hardest-won knowledge is not in any file a session reads before it starts work.
It is in prose, in design READMEs, and in the heads of sessions that have since ended.

Four classes of mistake have each bitten **more than twice**, which is the threshold at which a
correction is supposed to stop being a memory and become a file:

- Inline `<span>`s used as block labels — three separate bugs: invisible progress bars,
  run-together settings rows, and run-together numbered steps.
- The artifact publish skeleton supplies things a standalone file lacks — three bugs: no
  `<meta name="viewport">` so a 980px fallback layout, `[hidden]` outranked by
  `.shell { display: flex }`, and no doctype so quirks mode, where a table does not inherit
  colour and every dark table specimen rendered invisible.
- `ink-faint` used for content when the system reserves it for placeholder and disabled text.
- Example data that does not survive arithmetic — six instances, including day counts that did
  not sum to their weekly tile and a 30-day per-agent total the feed could not support.

Every one was caught by rendering or by checking, never by reasoning about the code. Some
recurred specifically because the correction was written somewhere a later session had no reason
to read.

Two narrower gaps sit alongside it. There is **no Commands section anywhere**, so a session is
not told how to verify design work even though two scripts exist that exit non-zero and have
caught five real defects between them. And the design-token rules — chroma means something,
`ink-faint` is placeholder only, never recolour `plate-*` by hex, colour alone never encodes a
state — live in a 6.7 KB README that is not read at session start.

## Proposed outcome

A session starting in this repository is told, before it does anything, how to verify its own
work and which mistakes this project keeps making. The verification commands are named with
their healthy output, so a session can check itself without asking. The design-token rules reach
a session that touches the design folder without anyone pasting them in.

## Affected users and systems

`AGENTS.md`, which is and remains the single project instruction file. A new `.claude/rules/`
directory. Every role in [`docs/agents/team.md`](../../../docs/agents/team.md). The two scripts
under `docs/design/ailiftcoach/tools/`.

## Constraints

- **`CLAUDE.md` must not be created.** Claude Code's documented default
  (`claude-md-or-agents-md`) reads *either* file, not both: with a `CLAUDE.md` present it reads
  CLAUDE.md only and silently ignores `AGENTS.md`. Creating one would switch off all six Always
  rules and all seven pointers with no error and nothing visible in the diff.
- **The setting that loads both cannot be committed.** It is read from user, `--settings` or
  managed settings and is ignored in project and local settings files, so it cannot be a project
  convention.
- `.claude/rules/` does **not** count toward the check that suppresses `AGENTS.md`, which is why
  path-scoped knowledge can live there safely.
- `AGENTS.md` targets under 200 lines, per the same documentation. It is 20 today.
- No application code exists yet, so there are no build, test or lint commands to document.
- The standing constraints apply: [`docs/product/requirements.md`](../../../docs/product/requirements.md),
  [`docs/adr/`](../../../docs/adr/), and `docs/design/ailiftcoach/system/`.

## Open questions

1. **Do the design-token rules belong in `.claude/rules/` or in a skill?** The documentation
   says a path-scoped fact belongs in a rule and a multi-step procedure belongs in a skill. The
   token rules are facts, but "render and check contrast before committing" is a procedure, so
   this change may need both.
2. **Can a rule in `.claude/rules/` be scoped to a path, and how?** If it cannot, the token
   rules load in every session whether or not it touches design, which is the cost the 200-line
   target exists to avoid.
3. **Does "Things Claude gets wrong" belong in `AGENTS.md` at all?** It grows every time a
   mistake recurs, and `AGENTS.md` is the file every agent reads on every task. It may be better
   as its own rules file from the start.
