---
status: accepted
---

# A Lifter and an Agent are separate principals on one API, and some operations are Lifter-only

One API serves both a signed-in Lifter and an Agent holding a Key, and the two are different
principals. Every operation declares which principals may call it, the default is deny, and a set of
operations is **Lifter-only**: an Agent's Key is refused them even though it is a valid credential for
that Account. The check lives in the API, never in the dashboard.

This is a structural decision, not a feature. In Phase 1 the Lifter-only set is nearly empty — Keys
are created by script, there is no export (D-006 puts CSV later), no sign-up and no consent gate
(D-028). The decision is that the capability declaration exists from the first handler anyway.

**Accepted by the Owner on 2026-11-26** (D-043), together with ADR 0004. No part of this record
changed on acceptance: it is approved as written and reviewed. What it unblocks is the authorisation
work item 2 of `development-preparation.md` names, and the JWT-verification detail ADR 0006 hands to
this decision is still unwritten — acceptance does not supply it.

## Why

- **Revocation has to mean something.** Phase 2 adds the Keys page and revocation (D-010, stories 2,
  3, 5, 6, 195). If creating a Key were reachable with a Key, a leaked Key could mint replacements and
  outlive its own revocation, and the whole story would buy nothing.
- **It gives the Independent Reviewer a second mechanical property.** D-003 already asks them to
  verify "a Key cannot read another Account's data". "A Key cannot create a Key, export the Account or
  delete it" is checkable the same way, against a declaration rather than by reading handler bodies.
- **Retrofitting it means auditing every handler.** Adding a capability model after ~25 operations
  (D-013) exist is a sweep across all of them with no way to prove the sweep was complete. Declaring
  it now costs one field per operation while there are no handlers.
- **ADR 0001 and OAuth stay independent.** OAuth (the first item of Phase 2, D-011) adds a second way
  to *authenticate* an Agent. Keeping the principal separate from the credential means OAuth changes
  how an Agent proves itself, not what an Agent may do.

## Considered options

- **One principal, one permission set.** Simplest, and rejected: a Key becomes a complete account
  credential, so losing one is losing the Account, and revocation cannot be trusted.
- **A separate Agent-only API alongside the dashboard's API.** Rejected: the dashboard and the Agent
  read the same things, so it is two implementations of ~25 operations (D-013) and two places for
  isolation bugs to live.
- **Two principals on one API, with a Lifter-only set (chosen).** One implementation, one isolation
  story, and the difference between a person and their Agent is written down where it is enforced.

## Consequences

- Every operation in the registry (ADR 0004) carries a principal declaration. An operation that
  declares nothing is unreachable, so a forgotten declaration fails closed and shows up as a broken
  call rather than as a silent hole.
- An Agent cannot complete a data-subject request: export and deletion need the Lifter. That is the
  intended outcome, and it means those flows are dashboard work, never agent work.
- **It names the one exception to the Agent being the only writer.** The Agent guide merged by change
  0198 tells the Agent "you are the **only** thing that writes to this product — the website shows
  what you logged and nothing more." That holds for training data. The Lifter-only set is precisely
  the set it does not hold for, and it is the dashboard's only reason to write at all.
- When health consent arrives it joins this set. D-028 struck consent as a justification for the
  multi-account schema, so nothing here depends on it, but it must not become grantable by a Key.
- Billing is out of scope entirely (D-006), so no billing operation is in the set.

## Evidence

ShredPace runs this split in production. Observed at `shredpace.com` on 2026-11-25:

- `GET /api/today` with no credential answers `401` with
  `"sign in, or send a valid API key in X-Api-Key (MCP clients: or Authorization: Bearer)"` — one
  endpoint, three credential types, two principals.
- `docs/authentication.md` states a key gets `403` for `GET|POST /api/keys`,
  `POST /api/keys/{keyId}/revoke`, `GET /api/export`, `DELETE /api/me`,
  `POST /api/account/consent` and the Stripe billing operations, and that these are the account
  holder's on the dashboard.
- `docs/errors.md` gives `403` the reasons "not for keys" and `health_consent_required` with
  `"You can't agree for them."`

This is corroboration that the shape works, not a reason for it: under D-026 "follow the ShredPace
app" justifies nothing structural, and every reason above is this project's own. ShredPace calls these
operations the account owner's; this repository reserves **Owner** for the project's product owner, so
the term here is Lifter-only. The research folder is untracked (D-040), so the citations are live URLs
and the date they were read.
