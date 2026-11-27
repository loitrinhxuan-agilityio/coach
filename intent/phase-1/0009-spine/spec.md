# Spec: the spine — one Lifter, one Key, one read

From: [`intent.md`](intent.md), committed 2026-11-27 and **not yet merged, so not yet accepted**.
Status: draft.

> `intent/README.md` says the Owner's merge of an intent *is* the acceptance into Stage 2, and that
> `spec.md` is written in Stage 2 *from the accepted intent*. This spec was written before that merge
> at the Owner's request, so it runs one gate ahead of itself. Nothing here may be built until both
> the intent and this spec are accepted, and I5 makes the contract below the Owner's to approve.

## Requirements

Numbered, testable, and traceable to the intent's six done-criteria (D1–D6).

### The operation

**R1 — One registry entry exists.** (D1) The operation registry exports exactly one operation. Its
entry carries `name`, `method`, `path`, `principals`, `input` schema, `output` schema, `errors`, the
MCP protocol revision it is served under, and the prose an Agent reads. A test asserts the registry
has one entry and that it type-checks against the registry's own entry type.

**R2 — `get_account` returns exactly this body.** (D2)

```json
{
  "agent":          { "name": "Claude Desktop" },
  "settings":       { "time_zone": "Asia/Ho_Chi_Minh", "display_unit": "kg" },
  "standing_notes": []
}
```

`agent.name` is the name of the Key the request arrived with — the glossary defines a Key as *"a
credential that **names one Agent**"*, so the field is named for what it means rather than where it is
stored. `display_unit` is an enum whose only Phase 1 member is `"kg"` (R5). `standing_notes` is always
`[]` in Phase 1 and is **present, never omitted**: the stories that write them (8 and 149) are not in
scope, and an absent key would teach every Agent that the field is optional, which stops being true
the day story 8 lands.

**R3 — Four things never appear in any response.** (D2) `cognito_sub`, the Key string, the Key hash,
and any indication that other Keys exist. A test serialises the response for a fixture Account and
asserts each is absent by name — an assertion that will keep working as the body grows.

**R4 — Both surfaces come from the one entry.** (D3) `GET /api/account` and the `get_account` MCP tool
are built at run time from the registry. A test asserts the HTTP route table and the MCP tool list are
derived from the same entry and agree on name, input schema and output schema. No file is generated;
the OpenAPI document and the guide's Part B are files and wait for change `0198`.

### Access

**R5 — A request without a recognised Key is refused.** (D4) No credential → `key_missing`. A
credential that matches no stored hash → `key_unknown`. Both are HTTP `401` and both return the error
body of R8. The two codes are distinguishable because they are different faults for the Agent to fix;
neither reveals whether any particular Key exists.

**R6 — The capability boundary is enforced in the API and is tested.** (D1) Every entry declares
`principals`; the default is deny. `get_account` declares `["agent", "lifter"]`. A Key presented to an
operation that does not list `agent` is refused with `lifter_only` and HTTP `403`. Phase 1 has **no
real Lifter-only operation** — ADR 0003 says the set is "nearly empty" because Keys are created by
script, there is no export and no consent gate — so this is proved against a **test-only registry
entry**, and that fixture is part of the requirement rather than an accident of the test file.

**R7 — Only the Agent principal is implemented.** (D4) The `lifter` principal is declared but has no
verifier; a Cognito token presented to any operation is refused with `key_unknown`, because nothing in
this change can validate one. The JWT-verification detail ADR 0006 hands to ADR 0003 arrives with
change `0202`.

**R8 — Every failure returns one body shape.** (D1)

```json
{ "error": { "code": "key_unknown",
             "fix":  "Use the Key the Lifter gave you, exactly as it was issued.",
             "field": null,
             "request_id": "01JF…" } }
```

`fix` is a **constant per code**. A test asserts that no `fix` string contains an interpolation
marker and that every code in the registry has one. `field` names a field from our own schema or is
`null`; it never carries a value from the request. Phase 1's catalogue:

| Code | HTTP | `fix` |
|---|---|---|
| `key_missing` | 401 | Send the Key in an `Authorization: Bearer` header on every call. |
| `key_unknown` | 401 | Use the Key the Lifter gave you, exactly as it was issued. |
| `lifter_only` | 403 | Only the Lifter can do this, signed in on the website. Tell them so rather than retrying. |
| `invalid_request` | 400 | Check the named field against the operation's schema and send the call again. |
| `not_found` | 404 | Ask the product what exists before acting on it. |
| `internal` | 500 | Try once more. If it fails again, give the Lifter the request id. |

### Storage

**R9 — Keys are stored only as hashes.** (D4) The `keys` table holds a UUID primary key, the
`sha256` of the Key as a unique indexed column, a name, and `created_at`. There is no plaintext
column, no `last_used_at` and no `revoked_at` (stories 5 and 6 are Phase 2). A test asserts the
migration's column list matches that set exactly, so adding a column is a deliberate act.

**R10 — Lookup is by hash, in one indexed read.** (D4) No salt and no password KDF: the secret is 256
bits of randomness, so a slow hash buys nothing against brute force and would sit on the critical path
of the logging loop.

**R11 — The settings row exists from the first migration.** (D5) One row: `cognito_sub` NULL,
`time_zone` `'Asia/Ho_Chi_Minh'`, `display_unit` `'kg'`. A missing row raises `internal`, never a
default — absent settings mean a broken deployment and a default would hide it. NULL `cognito_sub`
closes the Lifter path by construction until `create-lifter.ts` opens it in change `0202`.

**R12 — The migration passes the DSQL-construct check.** (D5) Forward-only, applied by a CDK custom
resource, recorded in a migrations table. A check over the SQL rejects constructs Aurora DSQL does not
accept before the file can be committed.

**R13 — Transactions retry on optimistic-concurrency failure, in one place.** (D6) A single
`withTransaction` helper retries three times with jittered backoff and logs each retry. A handler that
catches a database error fails review (P7).

**R14 — One connection per container, refreshed.** (D6) A module-scope connection; the SigV4 token
re-minted when older than ten minutes; one automatic reconnect before a request is allowed to fail,
because a frozen Lambda container can wake holding a connection the server has dropped.

### The surfaces and the build

**R15 — MCP is Streamable HTTP, POST only.** (D3) `/mcp` accepts `POST` and answers `GET` and
`DELETE` with `405`. Responses are JSON, never a held-open stream — API Gateway's 30-second ceiling
makes a long-lived stream unusable. The server declares protocol revision `2025-11-25`.

**R16 — One log line per request.** (D6) `request_id`, operation, principal kind, Key UUID, duration,
outcome. A test asserts the serialised line contains none of: the Key, the hash, `cognito_sub`, an
email address, or any request or response body. Every log group the stack creates sets 14-day
retention explicitly.

**R17 — CI is green.** (D6) Type check, Biome, unit tests, and a bundle-size budget of **1 MB** for the
API Lambda, enforced as a failing test. The budget is a starting line, not a law: it is reviewed at
`9017` against the measured cold start, which is the first evidence anyone will have.

## Design

### Layout

```
api/
  registry/        the operation entry type, the one entry, and the derivations
  operations/      get_account: input -> output, no transport, no SQL
  surfaces/http/   routes built from the registry; maps error code -> status
  surfaces/mcp/    tool list built from the registry; Streamable HTTP handler
  repository/      the seam: an interface, a DSQL implementation, an in-memory fake
  db/              migrations, withTransaction, connection and token lifecycle
  logging/         the one log line
infra/             CDK: Lambda, HTTP API, CloudFront behaviours, DSQL, log groups
scripts/           mint-key.ts
```

An operation is a pure function from a validated input and a principal to an output or a typed error.
It does not know it is HTTP, it does not know it is MCP, and it does not open a connection. That is
what lets R4 be a test rather than a convention.

### The registry entry

One object per operation, holding everything both surfaces and both documents need:

```ts
{
  name: 'get_account',
  method: 'GET',
  path: '/api/account',
  principals: ['agent', 'lifter'],
  input: EmptySchema,
  output: AccountSchema,
  errors: ['key_missing', 'key_unknown', 'lifter_only', 'internal'],
  summary: "Who you are talking to: the Account settings and the Lifter's standing notes.",
}
```

The HTTP surface walks the registry and registers a route per entry. The MCP surface walks the same
array and emits a tool per entry, using `summary` as the tool description and the same schemas. `0198`
will walk it a third time to emit the guide's Part B. The drift ADR 0004 is about becomes impossible
rather than discouraged, because there is nothing to keep in step.

### Authenticating a request

One middleware, shared by both surfaces, ahead of every operation:

1. Read `Authorization`. Absent or not `Bearer` → `key_missing`.
2. `sha256` the presented value, read `keys` by that hash. No row → `key_unknown`.
3. Attach the principal `{ kind: 'agent', key_id, agent_name }` to the request.
4. The dispatcher refuses the call if the entry's `principals` does not include the principal's kind
   → `lifter_only`.

Step 4 is deliberately separate from step 2: authentication answers *who*, the capability check
answers *may they*, and ADR 0003's whole point is that those are different questions.

### The repository seam

An interface with two implementations — Aurora DSQL, and an in-memory fake the tests run against. The
fake is not a mock: it is a working implementation of the same interface, so tests describe behaviour
rather than call order. **It is also the honest limit of this change**: a green suite proves the shape
and nothing about Aurora DSQL, which is why `9017` exists and why R12's SQL check is a guard rather
than a proof.

### Error mapping

Operations throw a typed error carrying a code. One boundary layer turns a code into the R8 body plus
a status, identically on both surfaces — the MCP surface returns the same object as the tool's error
content. Neither surface composes its own message, so there is exactly one place where an error's
wording lives, and it is the registry.

## Conformance

| Constraint | How this satisfies it |
|---|---|
| **I1** — an Agent connects with a Key over MCP or REST, no OAuth | Both surfaces, one middleware, Bearer Key (R4, R5, R15) |
| **I5 / D-013** — the Owner approves the contracts | R2 and R8 are the contract, put here for approval, not assumed |
| **R4 (product)** — our own API shapes, ShredPace is reference only | Names drawn from `GLOSSARY.md`, not from ShredPace's operation list |
| **R5 (product)** — kilograms only in Phase 1 | `display_unit` is an enum of one member, `"kg"` |
| **S1** — Keys stored only as hashes; a Key cannot manage Keys, export, delete or consent | R9, R10, and the declared capability boundary at R6 |
| **S2** — single-account; one settings row; surrogate UUID keys | R11, and `keys` has a UUID primary key (R9) |
| **S4** — a retry never records the same set twice | No write in this change; `Idempotency-Key` is reserved in the registry's entry type so the first write cannot forget it |
| **P2** — infrastructure as code only | The migration runs from a CDK custom resource; nothing is applied by hand (R12) |
| **P7** — DSQL optimistic concurrency, transaction limits, 60-minute connections | R13 and R14 |
| **ADR 0001** | The Key is the Agent's credential and travels as a header |
| **ADR 0003** | `principals` on every entry, default deny, checked in the API and never in the dashboard (R6) |
| **ADR 0004** | One registry, both live surfaces derived from it; file surfaces deferred to `0198` (R4) |
| **ADR 0005** | `/api` and `/mcp` on `CachingDisabled` with credentials through an origin-request policy; arm64; no VPC; bundle budget (R17) |
| **ADR 0006** | No `account` table, no `account_id`; one settings row; UUID primary keys |
| **ADR 0007** | Nothing deploys here; the stack is code only |
| **Brand — content fundamentals** | See below |

### Brand conformance, and the honest limit of it

This change has **no screen**, so the visual half of
[`docs/design/ailiftcoach/system/README.md`](../../../docs/design/ailiftcoach/system/README.md) —
tokens, type, spacing, the five principles about chroma and geometry — does not apply and is not
claimed. Saying otherwise would be decoration.

The **content fundamentals do apply**, and they govern every string this change ships: the six `fix`
sentences and the operation's `summary`, which is what an Agent reads before it calls anything.

- *"Name things as a lifter does… never **record**, **entity**, **payload**."* The catalogue says
  "the Key the Lifter gave you", not "the credential in your payload". `not_found`'s fix says "ask the
  product what exists", not "the entity was not found".
- *"State the rule, not the vibe."* Every `fix` is an instruction the Agent can act on — "Send the Key
  in an `Authorization: Bearer` header on every call" — not a restatement of the fault. This is why
  the field is called `fix` and not `message`.
- *"The dashboard reports; the agent acts."* `lifter_only`'s fix tells the Agent to *say so rather
  than retrying*, which is the same instruction the merged agent guide already gives under **What your
  key cannot do**. The wording is deliberately close to it.
- *"An empty state says what will fill it."* `standing_notes: []` is this change's only empty state.
  It is carried in the operation's `summary` rather than the data, because a JSON array cannot hold a
  sentence.

## Areas of concern

1. **The glossary says a Key is never a "Token", and the wire calls it one.** `Authorization: Bearer`
   is OAuth 2.1's scheme name, and it is what every HTTP and MCP client supports without
   configuration. The exception is bounded: the scheme name is RFC vocabulary on the wire, and no
   field name, error code, log key, document or sentence in this product calls a Key a token. I have
   **not** recorded this in `GLOSSARY.md`, because a wire format is an implementation detail and the
   glossary must stay free of those.
2. **"Principal" is load-bearing and is not in the glossary.** ADR 0003, `REVIEW.md` and this spec all
   use it; nothing defines it. I propose adding it — *"**Principal**: who a request acts as — a Lifter
   signed in, or an Agent holding a Key. Every operation declares which principals may call it."* —
   but adding a word to the project's canonical vocabulary is the Owner's call, so it is proposed here
   rather than committed.
3. **The response field changed from the intent.** The intent said the response carries "the name of
   the asking Key"; this spec calls it `agent.name`. Same value, better name, and flagged because a
   spec silently redefining its intent is how the chain stops meaning anything.
4. **`lifter_only` is tested against a fixture, not a real operation.** Phase 1 has no Lifter-only
   operation. The alternative — leaving the path untested until one exists — would mean the first
   genuinely restricted operation is also the first test of the mechanism protecting it.
5. **The DSQL-construct check is a heuristic.** There is no local Aurora DSQL, so R12 is a list of
   constructs known to be rejected, not a proof of acceptance. It will miss something. `9017` is where
   the migration first meets a real cluster.
6. **The bundle budget is a guess until it is measured.** 1 MB is chosen to fail loudly if a heavy
   dependency arrives, not because anyone has measured the cold start it implies.

## Open questions from the intent

1. **The request-headers beta, and D-004.** *Carried forward, unchanged.* Nothing in this spec can
   settle it; it is a fact about the Owner's organisation and a scope decision if the answer is no. It
   does not block this change and is not a precondition for building it.
2. **Confirm assumption 4 — standing notes always empty.** *Answered here in design, carried for
   confirmation.* R2 makes the field present and empty, which is correct whether or not the assumption
   is ever confirmed; confirming it would close the question rather than leave it to resurface when
   story 8 is scheduled.
3. **ADR 0007's two deploy questions.** *Carried forward.* They gate `9017` and nothing here.
4. **Does `9016` merge before this spec?** *Answered: it must.* This spec names TypeScript, Node 22
   and `ap-southeast-1` as settled. Until `9016` merges, those are three decisions with no record, and
   approving this spec would approve them by implication — the single-click approval D-016 and ADR
   0007 are built to prevent.
