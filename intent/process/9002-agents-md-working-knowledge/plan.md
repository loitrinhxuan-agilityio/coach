# Plan: the working knowledge an agent needs at session start (from `spec.md` 2026-11-23)

**The plan pass found the spec wrong about its own central deliverable.** The spec has
`AGENTS.md` naming two commands with their healthy output. One of those commands **cannot run
from a clean checkout**, and the string the spec gives for it is missing a required argument.
Both were verified by running them, not by reading them. The plan therefore changes five more
files than the spec allowed for, and says so rather than smuggling them in.

## Files that change

| File | Why |
|---|---|
| `.claude/rules/design-system.md` | **new** — the four traps, path-scoped. As specified. |
| `AGENTS.md` | **edit** — `## Commands` and `## Architecture`. As specified, with corrected command strings. |
| `docs/design/ailiftcoach/tools/package.json` | **new, not in the spec** — declares `playwright-core`, without which `audit-rendered.mjs` cannot start. |
| `.gitignore` | **edit, not in the spec** — `node_modules/`, or `npm install` puts a dependency tree in the next commit. |
| `docs/design/ailiftcoach/README.md` | **edit, not in the spec** — line 80 documents `node tools/audit-rendered.mjs`, which is wrong twice over. |
| `docs/product/decision-log.md` | **edit** — D-039, amending D-033's branch convention. |
| `docs/design/ailiftcoach/tools/package-lock.json` | **new, found during implementation** — `npm install` writes it, and it belongs in git so an install is reproducible and CI can use it later. |
| `.claude/rules/` | **new directory**, tracked: `.gitignore` excludes only `.claude/worktrees/`. |
| `intent/process/9002-agents-md-working-knowledge/plan.md` | this file. |

### What was actually wrong

```
$ node docs/design/ailiftcoach/tools/audit-rendered.mjs
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'playwright-core'
```

There is no `package.json` anywhere under `docs/design/`, and Node resolves an import from the
*script's* directory, not the working directory. The script's own usage line reads
`node audit-rendered.mjs <prototypes dir> [--schemes light,dark]` — so it also takes a
**required positional argument** that neither the spec nor `docs/design/ailiftcoach/README.md`
supplies.

`check-contrast.mjs` is fine: no dependencies, ran today, exit 0,
`50 pairs checked across 2 themes, 0 failing`.

This also means a claim already in the repository is misleading. `README.md` presents both
scripts as runnable, and the design PR's description says either can gate a change. One of them
has never been runnable from a checkout — it only ever ran from a scratchpad copy that happened
to have `playwright-core` beside it.

## Order of work

1. **Make the command real, or drop it.** Add `docs/design/ailiftcoach/tools/package.json`
   (`type: module`, `playwright-core` — npm has 1.65.1), add `node_modules/` to `.gitignore`,
   install, and run
   `node docs/design/ailiftcoach/tools/audit-rendered.mjs docs/design/ailiftcoach/prototypes`.
   **This is first because everything else depends on the answer.** If it still cannot run, the
   command does not go into `AGENTS.md` at all, and step 4 documents one command rather than two.
2. Fix the two command lines in `docs/design/ailiftcoach/README.md` to what actually works.
3. Write `.claude/rules/design-system.md`. Then **parse its frontmatter explicitly** and confirm
   it yields exactly one key, `paths` — do not eyeball it, because malformed YAML is ignored
   silently and the rule would load in every session instead.
4. Add `## Commands` and `## Architecture` to `AGENTS.md`, using the strings verified in step 1.
5. Record D-039: a change's branch is per *stage*, not per change, since a chain with gated
   stages needs a pull request per stage. Amends D-033.
6. Run both commands and paste the output into the pull request.

## Risks

- **The rule's loading cannot be proved before merge.** A rule loads at launch, or on the first
  Read, Write or Edit of a matching file. A rule added part-way through a session is not
  guaranteed to load in that session, so R2 is unprovable here and has to be checked in a fresh
  session afterwards. The plan states this rather than claiming a Proof it cannot produce.
- **`playwright-core` may not be sufficient.** Unlike `playwright`, it ships no browser binaries
  and expects to find one. It worked earlier from a scratchpad, so a browser is discoverable on
  this machine — but that is a property of this machine, not of the repository. Step 1 settles it.
- **`npm install` inside the repository.** Without the `.gitignore` change first, the next
  `git add -A` commits a dependency tree. Order matters: gitignore before install.
- **`AGENTS.md` is read by every agent on every task**, so these fifteen lines cost context in
  every session. That is the trade the Commands section is worth and the traps are not, which is
  why only one of them goes in this file.
- **Riskiest step: 1.** It is the only one that can fail, and it is the only one whose failure
  changes what the other steps do.

## Proof

| Check | Expected | State |
|---|---|---|
| `node docs/design/ailiftcoach/tools/check-contrast.mjs` | exit 0, `50 pairs checked across 2 themes, 0 failing` | **verified today** |
| `node .../audit-rendered.mjs docs/design/ailiftcoach/prototypes` | exit 0, `34 renders, 0 below contrast` | **currently fails to start**; step 1 decides |
| `wc -l AGENTS.md` | under 200 | 20 now, ~35 after |
| `git ls-files \| grep -c '^CLAUDE.md$'` | `0` | holds — the intent's load-bearing constraint |
| Frontmatter of the rule parses | exactly one key, `paths` | step 3 |
| `git ls-files \| grep node_modules` | empty | step 1 |
| A fresh session opening a design prototype receives the rule | the four traps in context | **not provable before merge** |

## Departures from this plan, recorded during implementation

Two, both found by checking rather than by reasoning:

1. **`package-lock.json` is a sixth unplanned file.** `npm install` writes it and it belongs in
   git, so an install is reproducible and the CI of D-029 can use it. Added to the table above.
2. **The rule's glob was narrowed from one pattern to three.** As specified,
   `docs/design/ailiftcoach/**/*.{html,md,json}` matched **inside `node_modules`** — opening
   `playwright-core/lib/vite/traceViewer/index.html` would have loaded the design rule. The glob
   now names `*.md` at the design root, `prototypes/**/*.html` and `system/**/*.{md,json,html}`:
   36 files, none of them a dependency. Caught by listing what the glob matched, which is the only
   way it would have been caught at all.

## Result

| Check | Result |
|---|---|
| `check-contrast.mjs` | **exit 0**, `50 pairs checked across 2 themes, 0 failing` |
| `audit-rendered.mjs docs/design/ailiftcoach/prototypes` | **exit 0**, `34 screen renders audited, 0 text elements below contrast` — it runs now |
| `npm install --prefix docs/design/ailiftcoach/tools` | playwright-core 1.65.1, 1 package, 814 ms |
| `wc -l AGENTS.md` | **50**, against a target of 200 |
| `git ls-files \| grep -c '^CLAUDE.md$'` | **0** |
| Rule frontmatter | parsed: exactly one key, `paths`, three globs |
| `git ls-files \| grep node_modules` | **empty** |
| A session opening a design file receives the rule | **verified.** Reading `system/components/StatTile/README.md` loaded `.claude/rules/design-system.md` in full, in the same session the rule was written in — so it does not even need a fresh session. The glob, the frontmatter and the on-demand trigger all work as documented. |
