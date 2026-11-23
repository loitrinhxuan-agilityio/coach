# ShredPace research — kept outside this repository

**This folder is not in the repository.** It holds the reverse-engineered reference for
ShredPace, a different product, and it lives on the Owner's machine only. If you have cloned
this repository, this file is the only thing here.

AI Lift Coach is **not affiliated with ShredPace**.

## Why it is not here

It is reference material about a product this one does not own. D-026 removed its claim on
scope: it is evidence for how a feature should behave *when that feature is built*, never a
checklist to complete. A repository about to hold application code does not need 99 files of
another product's internals. See **D-040** in
[`../decision-log.md`](../decision-log.md) and
[`../../../intent/process/9003-untrack-shredpace/`](../../../intent/process/9003-untrack-shredpace/).

Nothing was deleted and no history was rewritten. The folder is present in every commit up to
the one that untracked it.

## What was in it

Links elsewhere in this repository may point at these paths and will not resolve in a clone:

| Path | What it held |
|---|---|
| `spec/` | Features, product rules, the 109 API operations, screens and routes, platform notes, changelog |
| `observations/signed-in.md` | What the signed-in dashboard actually showed |
| `prototype/` | 59 reconstructed screen boards and the scripts that regenerate them |
| `review/` | The coverage audit, open questions, and the handoff listing what was never observed |
| `tools/` | The capture tooling and its manifests |
| `evidence/` | The captures themselves — already untracked before this change, and never in git |

## Recovering it

```bash
git restore --source d45f52c -- docs/product/shredpace
```

That brings the whole folder back into your working tree without changing history. Use
`git show d45f52c:docs/product/shredpace/README.md` to read the original index on its own.

## What survives in the repository

The *analysis* drawn from this research is tracked and stands without it:
`docs/design/ailiftcoach/system/ux-patterns.md` records what the design system took, adapted and
refused, and the product decisions it informed are in the decision log. Its opening citation of
417 captures refers to material that is no longer here.
