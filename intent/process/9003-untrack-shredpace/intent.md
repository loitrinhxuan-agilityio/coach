# Intent: the ShredPace research leaves the repository but stays on disk

Author: Owner, via the Dev Lead. Status: draft.

## Problem

`docs/product/shredpace/` is 99 tracked files — the reverse-engineered reference for another
product: its features, 109 API operations, its product rules, what its dashboard showed, 59
reconstructed boards and the scripts that regenerate them. The Owner wants it out of the
repository while keeping their own copy.

It is reference material about a product this one does not own, and D-026 already removed its
claim on scope: it is evidence for how a feature should behave when it is built, never a
checklist. A repository that is about to hold application code does not need 99 files of another
product's internals in it.

The 113 MB on disk is mostly `evidence/screenshots/`, which `.gitignore` already excludes, so
size is not the reason.

## Proposed outcome

Git stops tracking `docs/product/shredpace/`. The files stay on the Owner's machine, unchanged
and in place. A fresh clone of this repository does not contain the folder.

## Affected users and systems

Every clone of this repository, which will no longer have the folder. `.gitignore`. And **65
lines in six documents that reference it** — `README.md`, `docs/product/decision-log.md`,
`requirements.md`, `vision.md`, `issues/prd.md` and the design system's `ux-patterns.md`, which
was written from those captures and cites them as its source.

## Constraints

- **The local files are not touched.** `git rm -r --cached` only, never a delete.
- **History is not rewritten.** The folder stays in every commit up to this one, so the research
  remains recoverable from the repository's past and the audit trail is intact.
- The path is added to `.gitignore`, or the next `git add -A` silently re-adds all 99 files.

## Open questions

1. **What happens to the 65 inbound references?** They become dead links on a fresh clone, in the
   same way the six existing links into `evidence/` already are. The options are to leave them, to
   fix all six documents, or to keep one tracked `README.md` at the folder's path explaining that
   the research is local-only — which is the pattern `evidence/README.md` already uses as the
   single exception to its own ignore rule.
2. **Does `ux-patterns.md` still stand on its own?** It is the design system's record of what was
   taken, adapted and refused, and it opens by citing 417 captures that a fresh clone will not
   have. The analysis is the value, not the captures, but the citation will no longer resolve.
