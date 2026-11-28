# Intent: the spine — one Lifter, one Key, one read

Author: Dev Lead, for the Owner's review. Status: draft.

PRD stories **4, 9, 10, 11** and **166** (Phase 1, D-010). Capability **C2** — Agent access and the
capability boundary — plus **C12a**, the error contract. **Change 1 of 13** in the build order set by
[`../README.md`](../README.md).

This is the first application code in the repository. Nothing here existed before it.

## Problem

An Agent cannot reach this product at all. There is no endpoint, no credential, no operation and no
error shape — so every one of the twelve changes after this one has nowhere to put its first line of
code.

Story 9 is the call a conversation begins with: *"one call that tells me who I am, the account's
settings and the person's standing notes."* The merged agent guide already promises it under
**Know who you are talking to**, so the behaviour is specified in prose before this change starts.
What is missing is everything underneath it.

**Why this change carries five stories rather than one.** D-046 allows it and the shape of the work
requires it:

- **Story 10** (Keys stored only as hashes) and **story 11** (a Key cannot manage Keys, export,
  delete or consent) are not later work. ADR 0003 is explicit: *"Adding a capability model after ~25
  operations exist is a sweep across all of them with no way to prove the sweep was complete.
  Declaring it now costs one field per operation while there are no handlers."* The same holds for the
  Key store: a hash-only table is a migration once rows exist.
- **Story 4** (connect over MCP or REST with that Key) is the way in. Without it story 9 is a function
  nobody can call.
- **Story 166** (a clear error with the fix in one sentence) is folded in from change 2. The build
  order's own text says it *"must land before any other operation, or every change invents its own
  error shape and the contract becomes a retrofit"* — and then scheduled it second, after an
  operation. This change is that operation. Folding it in takes Phase 1 from fourteen changes to
  **thirteen**.

**Three things in these stories are not buildable as written, and all three are already on record.**

1. **Story 9 promises standing notes, and nothing in Phase 1 creates one.** Stories 8 and 149 author
   them and neither is among D-010's fifty. This is assumption 4 of
   [`mvp-scope.md`](../../../docs/product/mvp-scope.md) — *"Standing notes (story 9) will be empty
   until the stories that create them (8 and 149) are built"* — which the Owner has never confirmed individually.
   This change proceeds on it and lists it below.
2. **Nothing in Phase 1 mints a Key.** Story 2 — create a key, shown exactly once — is Phase 2. ADR
   0003 covers it with *"Keys are created by script"*, so the script is implied by an accepted record
   rather than being new scope, but no story budgets it. It is `scripts/mint-key.ts` here.
3. **Story 4 says "any assistant", and that is not within this product's gift.** Anthropic's
   documentation (read 2026-11-27) states that a remote MCP server may authenticate with OAuth, with a
   static credential, or not at all — but that the static-credential path in claude.ai and Claude
   Desktop is *"in beta and available to a limited set of organizations"*. Claude Code's `--header` is
   documented without that qualification. The consequence does not fall on this change; it falls on
   D-004 and is recorded under Open questions.

## Proposed outcome

An Agent holding a valid Key can call one operation over either surface and get a correct answer, and
the shape every later operation inherits is fixed and tested.

**Done means all six:**

1. The operation registry holds exactly one entry — `get_account` — carrying its path, method,
   principals, input and output schemas, error codes and the prose an Agent needs (ADR 0004).
2. `get_account` returns the Account's `time_zone` and `display_unit`, `standing_notes: []`, and the
   **name** of the asking Key. It never returns `cognito_sub`, the Key string, the hash, or any
   indication that other Keys exist. Written test-first against the in-memory repository.
3. Both surfaces — `GET /api/account` and the `get_account` MCP tool — are derived from that single
   registry entry **at runtime**, and a test proves they name the same operation with the same schema.
4. A request with no Key, or a Key that does not match a stored hash, is refused. No plaintext Key
   exists anywhere in the schema, and a test asserts it.
5. The migration creating `keys` and `settings` exists and passes a check for constructs Aurora DSQL
   does not accept.
6. CI is green on type check, lint, unit tests and the bundle-size budget.

**Done explicitly does not mean:** there is no deployed endpoint, no Aurora DSQL cluster, no real Key
and **no evidence that the database path works at all**. The repository test suite exercises an
in-memory fake. That is a deliberate trade — it keeps this change clear of ADR 0007's two unanswered
deploy questions — and it means change `9017`, the first deploy, is where this change is really
tested rather than a formality.

## Affected users and systems

- **The Agent**, for the first time. Nothing it can do today, it can do after this.
- **The Owner**, who mints the first Key with `scripts/mint-key.ts` — but only after `9017`, because
  the script needs a cluster.
- **New in the repository:** `api/` (registry, the operation, both surfaces, the repository seam,
  migrations), `infra/` (CDK), `scripts/mint-key.ts`, a root workspace, and a Gate 1 workflow in
  `.github/workflows/` — the first CI job that runs application tests rather than design checks.
- **Untouched:** `docs/design/ailiftcoach/` (no UI exists in this change, so the design-approval gate
  is not engaged), and every scope document.
- **Downstream:** the twelve changes after this inherit the registry, the error body, the naming
  convention, the repository seam and the retry helper. That is the reason to review this change
  harder than its size suggests.

## Constraints

The standing constraints apply as written and are not restated here:
[`requirements.md`](../../../docs/product/requirements.md) (I1, I5, R4, R5, S1, S2, S4, P2, P7),
[`docs/adr/`](../../../docs/adr/) 0001, 0003, 0004, 0005, 0006 and 0007, and `AGENTS.md`. Four bear on
this change in ways worth naming:

- **I5 and D-013 gate implementation on the Owner, not on this intent.** *"The Dev Lead proposes the
  Phase 1 contracts (about 25 operations); the Owner approves them before implementation."* The
  contract for `get_account` is approved in this change's `spec.md`, not here.
- **ADR 0004's schedule question stays open and stays out of the way.** The routes and the tool list
  are *live* surfaces and are derived at runtime, which needs no generator. The OpenAPI document and
  the guide's Part B are *files* and do; they arrive with change `0198`, the first change that needs
  one. No generator is built here, so D-010 is unchanged.
- **ADR 0005's `/api` rules are a confidentiality requirement.** `CachingDisabled`, credentials
  through an origin-request policy and never through the cache key. The same policy covers `/mcp`.
- **ADR 0007 gates the deploy, not the code.** Two of its six open questions — who runs
  `cdk bootstrap`, and which GitHub identity the Dev Lead acts under — block `9017` and nothing in
  this change.

### Decided for this change, and binding on the twelve that follow

Settled with the Owner on 2026-11-27 and recorded here because later changes inherit them. The first
two are decision-log rows that change **`9016`** must land before this change's `spec.md`:

| | Decision |
|---|---|
| Language | TypeScript on **Node 22**, Lambda **arm64**, CDK in TypeScript (`9016`) |
| Region | **`ap-southeast-1`** — the nearest region running Aurora DSQL; DPU $9.00/M and storage $0.40/GB-month against Ohio's $8.00 and $0.33, read 2026-11-27, and inside the free 100,000 DPU and 1 GB each month either way (`9016`) |
| Operation | `get_account`, `GET /api/account` — the glossary's own word for what it returns |
| Naming | `snake_case` for operations and wire fields on both surfaces |
| Errors | `{ error: { code, fix, field?, request_id } }`. **`fix` is a constant string per code** and never interpolates request content: an LLM reads it, so echoing input is prompt injection as well as a leak |
| Versioning | No `/v1`. Revisit on the trigger in S8 and D-012 |
| Idempotency | `Idempotency-Key` on writes; reads carry none |
| Principals | `["agent", "lifter"]` declared; only the Agent path implemented. The JWT-verification detail ADR 0006 hands to ADR 0003 moves to change `0202` |
| Key | `alc_live_` + 32 random bytes. Stored as a `sha256` unique index beside a UUID key, a name and `created_at` — no `last_used_at`, no `revoked_at` (stories 5 and 6 are Phase 2; D-026) |
| Key lookup | By the hash itself. No salt and no KDF: a 256-bit random secret is not a password, and a slow hash would sit on the logging loop's critical path |
| Transport | `Authorization: Bearer` on both surfaces, with a post-deploy assertion in `9017` that the header survived CloudFront — ADR 0005 records that ShredPace's CDN drops it on GET |
| MCP | Streamable HTTP at `/mcp`, built to revision **`2025-11-25`**, POST-only, JSON responses, `405` on GET, no session id. That is conformant to the revisions Anthropic documents following, and a short step from the current `2026-07-28` |
| Settings row | Seeded by the migration with `cognito_sub` NULL, `display_unit` `'kg'`, `time_zone` `'Asia/Ho_Chi_Minh'`. NULL closes the Lifter path by construction until `create-lifter.ts` opens it in `0202`. A missing row is a 500, never a default |
| Connections | One module-scope DSQL connection, token re-minted at ten minutes, one automatic reconnect before a request is allowed to fail |
| Concurrency | One `withTransaction` helper owns OCC retries — three attempts, jitter, a log line each. A handler that catches a database error is a review finding (P7) |
| Migrations | Forward-only, applied by a CDK custom resource, recorded in a table. ADR 0007's diff cannot show what a migration does, which is what its question 6 is about |
| Logging | `request_id`, operation, principal kind, Key UUID, duration, outcome. Never the Key, the hash, `cognito_sub`, an email or any body. **14-day retention set explicitly** — the CDK default never expires |
| Layout | npm workspaces: `api/`, `infra/`, `scripts/`; `web/` arrives with `0142`. `test/visual/screenshots/` stays where change 9005 put it |
| Tooling | Biome for lint and format; esbuild via `NodejsFunction`; a bundle-size budget as a failing test, since ADR 0005 names a small bundle as a free cold-start mitigation |
| Method | Written **test-first**. A partial answer to item 8 of `development-preparation.md`, in practice rather than by rewriting the agent documents |
| Not built | No rate limiting (story 167 is Phase 2), no CORS (the dashboard is same-origin behind CloudFront), **no keep-warm ping** (ADR 0005's; this change creates the only stack it could live in, and `9017` owns it), and **no stored secret anywhere**: OIDC to deploy, SigV4 to the database, one Key held by the Owner |

## Open questions

1. **Does your organisation have the request-headers beta, and what happens to D-004 if not?** This
   is the one that matters. D-004's product proof is *"the Owner logs a real leg session through their
   assistant"* and story 14 is *"so that I never type in the gym"* — which needs the phone or desktop
   app, not a terminal. Static-credential connectors there are beta and gated; Claude Code's are not.
   If the **Request headers** section is absent from the Add custom connector dialog, Phase 1's exit
   test is unreachable as written and the choice is yours: pull OAuth forward from Phase 2, demonstrate
   the proof on desktop only, or amend what the proof means. **It does not block this change**, and it
   should not be discovered at change 11.
2. **Confirm assumption 4 of `mvp-scope.md` explicitly.** This change returns `standing_notes: []`
   forever in Phase 1 on the strength of an assumption the Owner has not individually confirmed.
   Confirming it in the decision log would close the question rather than leaving it to be
   rediscovered when story 8 is scheduled.
3. **ADR 0007's two deploy questions.** Who runs `cdk bootstrap`, and which GitHub identity the Dev
   Lead acts under — the second because an identity shared with the Owner makes *Prevent self-review*
   deadlock the environment gate. These gate `9017`, not this change, but `9017` is where this change
   is first proved.
4. **Does `9016` merge before this change's `spec.md`?** The recommendation is yes. Approving the
   language and the region inside the pull request that depends on them collapses two approvals into
   one click, which is the pattern D-016 and ADR 0007 are careful to avoid everywhere else.
