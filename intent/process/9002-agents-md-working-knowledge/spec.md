# Spec: the working knowledge an agent needs at session start

From: `intent.md`, accepted 2026-11-23 (PR #4). Status: draft.

**The three open questions are answered below, from Claude Code's documented behaviour rather
than from judgement — and two of the answers make this change smaller than the intent assumed.**
No skill is needed, and "Things Claude gets wrong" does not belong in `AGENTS.md`.

## Requirements

| # | Requirement | How it is checked |
|---|---|---|
| R1 | A session that has opened no design file is told how to verify design work, and what healthy output looks like. | `AGENTS.md` has a Commands section naming both scripts with their expected output. |
| R2 | A session that opens any file under `docs/design/ailiftcoach/` is given the four recurring traps without being asked for them. | Open a design file in a fresh session; the rule loads. |
| R3 | No `CLAUDE.md` is created, and `AGENTS.md` remains the only project instruction file. | `git ls-files` shows no `CLAUDE.md`. |
| R4 | `AGENTS.md` stays under 200 lines. | `wc -l AGENTS.md`. It is 20 today and ends at about 35. |
| R5 | The traps are stated operatively, as rules. The **token** rules are referenced, not restated, so visual matters keep one authority. | The rule file contains no copy of the token table; it links `system/README.md`. |
| R6 | The rule's frontmatter carries `paths` and nothing else. | Inspection. `paths` is the only field Claude Code reads from a rule. |

## Design

### `AGENTS.md` gains two sections, about fifteen lines

```markdown
## Commands

- Palette contrast: `node docs/design/ailiftcoach/tools/check-contrast.mjs`
  Healthy: "50 pairs, 0 failing". Exits non-zero on a failure.
- Rendered contrast: `node docs/design/ailiftcoach/tools/audit-rendered.mjs`
  Healthy: "34 renders, 0 below contrast". Exits non-zero on a failure.

Run both before reporting any design task complete, and paste the output. There are no
build, test or lint commands yet; there is no application code.

## Architecture

No application code exists. The design sources are at `docs/design/ailiftcoach/`
(prototypes as self-contained HTML, the token system under `system/`). The
reverse-engineered reference for another product is at `docs/product/shredpace/` and is
evidence, never a scope commitment.
```

Verification belongs in `AGENTS.md` rather than in the rule, because "how do I check my own
work" is a fact that holds in **every** session, which is the documented test for the
always-loaded file.

### `.claude/rules/design-system.md` — new, path-scoped

```markdown
---
paths:
  - "docs/design/ailiftcoach/**/*.{html,md,json}"
---
```

Its body carries the four traps as rules, and **points at** the token authority rather than
copying it:

1. **A `<span>` carrying `margin`, `height` or a background needs `display: block`.** Three
   bugs: invisible progress bars, run-together settings rows, run-together numbered steps.
2. **A standalone file lacks what the artifact skeleton supplies.** It needs its own
   `<meta name="viewport">`, its own `[hidden] { display: none !important }`, and it cannot
   carry a doctype — so it renders in quirks mode, where a table does not inherit colour and
   table cells must set theirs explicitly. Three bugs, including every dark table specimen
   rendering invisible.
3. **Example figures must survive arithmetic.** Meals sum to totals, totals match tiles, bar
   widths match value over target, and a feed's day counts reconcile with its tiles. Where a
   feed is truncated, the page says so. Six instances, every one caught by checking rather
   than reading.
4. **Colour never encodes a state on its own, and `ink-faint` is placeholder and disabled text
   only** — never content. The wording carries the distinction.

Then: *the token rules are in `docs/design/ailiftcoach/system/README.md` under "Using the
tokens", which is authoritative. Read it before changing anything visual. Never recolour by
find-and-replace on hex: two `plate-*` values share hex with state tokens.*

## Conformance

- **`CLAUDE.md` is not created** — the intent's load-bearing constraint. The documented default
  `claude-md-or-agents-md` would make Claude Code read `CLAUDE.md` only and ignore `AGENTS.md`.
- **`.claude/rules/` does not count** toward the check that suppresses `AGENTS.md`, so the two
  coexist safely. Verified in the documentation, not assumed.
- **`.gitignore` excludes `.claude/worktrees/` only**, so `.claude/rules/` is tracked and ships
  with the code as the playbook requires. No `.gitignore` change is needed.
- **Design system authority (R5).** `docs/design/ailiftcoach/system/` is authoritative on
  visual matters. The rule therefore carries only the traps — which exist nowhere in operative
  form today, being narrative prose in READMEs — and links the token rules rather than copying
  them. This is the one deliberate decision against carrying the knowledge inline, and it is
  made to avoid the duplication the documentation audit already flagged.
- **`AGENTS.md` under 200 lines** (R4). Documented target; the file ends at roughly 35.
- No application code, so no build, test or lint commands are documented (intent constraint).

## Areas of concern

1. **Malformed frontmatter degrades silently.** If the rule's YAML is malformed, Claude Code
   ignores the frontmatter and loads the rule **as if it had no `paths`** — so it loads in every
   session, with no error. Nothing here catches that, because there is no CI. This is a concrete
   instance of what D-029 exists to fix.
2. **The rule only fires on Read, Write or Edit of a matching file.** A session that reasons
   about the design without opening a file is not covered. The traps that bit hardest were all
   caught while editing files, so the coverage is good but not total.
3. **One trap is broader than its scope.** "Example figures must survive arithmetic" also
   applies to figures in product documents, which this glob does not match. Widening the glob
   would load the whole rule for every document; leaving it is a known gap.
4. **An unverified size limit.** The documentation reportedly caps on-demand files at 40,000
   characters on a 200K context window, above which only the start is received. That figure
   came back as a model summary rather than verbatim page text, so this spec does not design to
   it. The rule will be roughly 2 KB, which is far below any plausible cap.
5. **D-033 does not survive its own first use.** It says the branch is `change/NNNN-slug`, one
   per change — but a chain with three gated stages needs three pull requests, so it is one
   branch per *stage*. This spec is on `change/9002-spec`. The convention needs amending, and I
   would rather surface that than quietly invent a second pattern.

## Open questions from the intent

**1. Do the design-token rules belong in `.claude/rules/` or in a skill? → A rule, and no
skill.** The documented criterion is to move an entry out of the always-loaded file when it "is
a multi-step procedure or only matters for one part of the codebase," with procedures going to
skills and path-scoped facts to rules. The traps are facts about one part of the codebase, so
they are a rule. The procedure the intent anticipated — "render and check contrast before
committing" — turns out to be **two commands**, which the Commands section in `AGENTS.md`
already covers. A skill would add a file and buy nothing. Revisit if that procedure ever grows
past listing two commands.

**2. Can a rule be scoped to a path, and how? → Yes, documented.** YAML frontmatter with a
`paths` field, taking a list of globs or a comma-separated string, with brace expansion, and
patterns relative to the directory containing `.claude`. The rule loads when Claude uses Read,
Write or Edit on a matching file. **`paths` is the only field Claude Code reads from a rule**, so
the file gets no `name` and no `description`; adding them would be silently ignored.

**3. Does "Things Claude gets wrong" belong in `AGENTS.md`? → No.** Checked against the
documented test, which is whether something is a fact to hold in *every* session. All four traps
concern writing HTML, CSS or example data inside the design folder, so none of them qualifies:
they are path-scoped facts and belong in the rule. This is why `AGENTS.md` grows by about
fifteen lines rather than forty, and why it keeps its character as a rules-and-pointers file.
