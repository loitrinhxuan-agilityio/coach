# Plan: the spine (from `spec.md` 2026-11-27)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development`
> (recommended) or `superpowers:executing-plans` to implement this plan task by task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** One operation an Agent can call with a Key, over HTTP and MCP, with the shape every later
operation inherits.

**Architecture:** One registry entry describes the operation; both surfaces are built from it at run
time, so they cannot drift. An operation is a pure function from a validated input and a principal to
an output or a typed error — it does not know its transport and does not open a connection. A
repository interface separates the operation from Aurora DSQL, and the tests run against a working
in-memory implementation of that interface.

**Tech Stack:** TypeScript on Node 22 (D-048), Lambda arm64, AWS CDK, Biome, Vitest, `pg` against
Aurora DSQL, esbuild via `NodejsFunction`.

**Spec:** [`spec.md`](spec.md) — the plan argues from it; read both.

**Not accepted yet.** Neither [`intent.md`](intent.md) nor `spec.md` has been merged, and
`intent/README.md` makes the Owner's merge the acceptance. Nothing below may be built until both are
accepted and `9016` has merged.

## Global Constraints

Every task's requirements implicitly include these. Values copied from the spec.

- **TypeScript on Node 22, Lambda arm64**, CDK in TypeScript (D-048). `strict: true` and
  `noUncheckedIndexedAccess`.
- **Region `ap-southeast-1`** (D-049).
- **`snake_case`** for operation names and every wire field, on both surfaces.
- **No `/v1`** in any path.
- **Four values never appear in any response:** `cognito_sub`, the Key string, the Key hash, any
  indication that other Keys exist.
- **Never logged:** the Key, the hash, `cognito_sub`, an email address, any request or response body.
- **Every log group sets 14-day retention explicitly.**
- **`fix` strings are constants.** No interpolation, ever.
- **No `last_used_at` and no `revoked_at`** on `keys` (stories 5 and 6 are Phase 2).
- **Vocabulary** comes from `GLOSSARY.md`: Lifter, Account, Agent, Key, Lifter-only operation,
  Standing note. Never *user*, *record*, *entity*, *payload*, *token*, *API key*.
- **Commit after every task**, message `Change 0009: <what the task delivered>`.

## Review Focus

Five input classes the spec implies and does not pin. Each has a test assigned to the task that owns
the code, written in that task's step style.

1. **`authorization: bearer <key>` in lower case.** RFC 7235 makes the header name and the scheme
   token case-insensitive, so a correct client can send this. Refusing it would be our bug. → Task 5.
2. **An `Authorization` header that is not Bearer** — `Basic …`, or the bare Key with no scheme.
   Expected: `key_missing` with its fix, not a 500 and not a crash in the parser. → Task 5.
3. **A valid Key when the settings row is missing.** R11 says `internal`, never a default. The
   failure mode is a 200 carrying `undefined` fields. → Task 6.
4. **A malformed or non-JSON POST body on `/mcp`.** Expected: the R8 error body, not a stack trace,
   an empty 502, or a JSON-RPC envelope we never defined. → Task 9.
5. **An oversized `Authorization` value** (8 KB of junk). Expected: refused as `key_unknown` without
   the value reaching a log line and without unbounded work. → Task 5, with the log assertion in
   Task 7.

## Files that change

| File | Why |
|---|---|
| `package.json`, `tsconfig.base.json`, `biome.json`, `vitest.config.ts` | **new** — workspace root (Task 1) |
| `api/src/errors/{types,catalogue}.ts` | **new** — story 166's contract (Task 2) |
| `api/src/registry/{types,index}.ts` | **new** — the one entry (Task 3) |
| `api/src/repository/{types,memory}.ts` | **new** — the seam and the fake (Task 4) |
| `api/src/auth/{authenticate,capability}.ts` | **new** — who, then may-they (Task 5) |
| `api/src/operations/get-account.ts` | **new** — the operation (Task 6) |
| `api/src/logging/line.ts` | **new** — one line per request (Task 7) |
| `api/src/surfaces/http/router.ts` | **new** — routes from the registry (Task 8) |
| `api/src/surfaces/mcp/server.ts` | **new** — Streamable HTTP, POST only (Task 9) |
| `api/migrations/0001_init.sql`, `tools/check-dsql-sql.mjs` | **new** — schema and its guard (Task 10) |
| `api/src/db/{connection,with-transaction}.ts`, `api/src/repository/dsql.ts` | **new** — the real one (Task 11) |
| `infra/` | **new** — the CDK stack (Task 12) |
| `scripts/mint-key.ts` | **new** — ADR 0003's script (Task 13) |
| `.github/workflows/test.yml` | **new** — Gate 1 (Task 1) |

---

### Task 1: Workspace, test runner and the Gate 1 workflow

**Requirements:** R17 (the CI half)

**Files:**
- Create: `package.json`, `tsconfig.base.json`, `biome.json`, `vitest.config.ts`,
  `api/package.json`, `api/tsconfig.json`, `.github/workflows/test.yml`
- Test: `api/src/smoke.test.ts`

**Interfaces:**
- Produces: `npm test`, `npm run typecheck`, `npm run lint` at the workspace root; every later task
  uses these three commands and nothing else.

Vitest is a Dev Lead choice, not an Owner decision — it is reversible in a day and D-048 covers only
the language. It is named here so no task has to pick one.

- [ ] **Step 1: Write the failing test** — `api/src/smoke.test.ts`:

```ts
test('the workspace runs typescript under test', () => {
  const n: number = 1
  expect(n).toBe(1)
})
```

- [ ] **Step 2: Run `npm test`** — Expected: FAIL, no test runner configured.
- [ ] **Step 3: Create the workspace** — root `package.json` with `workspaces: ["api", "infra"]`,
      `"type": "module"`, scripts `test`, `typecheck`, `lint`. `tsconfig.base.json` with
      `strict: true`, `noUncheckedIndexedAccess: true`, `target: "es2023"`, `module: "nodenext"`.
      Biome configured for lint and format.
- [ ] **Step 4: Run `npm test`, `npm run typecheck`, `npm run lint`** — Expected: all PASS.
- [ ] **Step 5: Create `.github/workflows/test.yml`** — Node 22, runs those three commands on
      `pull_request` and on push to `main`.
- [ ] **Step 6: Commit.**

---

### Task 2: The error catalogue — story 166

**Requirements:** R8

**Files:**
- Create: `api/src/errors/types.ts`, `api/src/errors/catalogue.ts`
- Test: `api/src/errors/catalogue.test.ts`

**Interfaces:**
- Produces: `type ErrorCode = 'key_missing' | 'key_unknown' | 'lifter_only' | 'invalid_request' |
  'not_found' | 'internal'`; `class OperationError extends Error { code: ErrorCode; field?: string }`;
  `errorBody(code: ErrorCode, requestId: string, field?: string): { error: {...} }`;
  `statusFor(code: ErrorCode): number`.

- [ ] **Step 1: Write the failing tests** — `catalogue.test.ts`:

```ts
test('every code has a fix sentence', ...)            // each ErrorCode -> non-empty string
test('no fix string interpolates anything', ...)      // no '${', '{{', '%s' in any fix
test('every code maps to a status', ...)              // the six -> 401,401,403,400,404,500
test('errorBody shape', ...)                          // keys exactly: code, fix, field, request_id
test('field defaults to null, never undefined', ...)
```

- [ ] **Step 2: Run the tests** — Expected: FAIL, module not found.
- [ ] **Step 3: Implement the catalogue** — the six codes with the exact `fix` sentences from the
      spec's table, copied verbatim. The sentences are product copy: they conform to the design
      system's content fundamentals and must not be reworded here.
- [ ] **Step 4: Run the tests** — Expected: PASS.
- [ ] **Step 5: Commit.**

---

### Task 3: The registry and its entry type

**Requirements:** R1

**Files:**
- Create: `api/src/registry/types.ts`, `api/src/registry/index.ts`
- Test: `api/src/registry/registry.test.ts`

**Interfaces:**
- Consumes: `ErrorCode` from Task 2.
- Produces: `type OperationEntry = { name, method, path, principals: PrincipalKind[], input, output,
  errors: ErrorCode[], summary }`; `type PrincipalKind = 'agent' | 'lifter'`;
  `const registry: readonly OperationEntry[]`; `function entryByName(name: string): OperationEntry |
  undefined`.

- [ ] **Step 1: Write the failing tests**:

```ts
test('the registry holds exactly one entry', ...)
test('get_account declares both principals', ...)        // ['agent','lifter']
test('every error a code names exists in the catalogue', ...)
test('the path carries no version segment', ...)         // no '/v1'
test('every name and field is snake_case', ...)
```

- [ ] **Step 2: Run the tests** — Expected: FAIL.
- [ ] **Step 3: Implement the entry type and the single `get_account` entry** — `method: 'GET'`,
      `path: '/api/account'`, `summary` as the spec gives it. Input is an empty object schema; output
      is the R2 body. The entry type carries an optional `idempotent` marker so the first write
      cannot forget it (S4).
- [ ] **Step 4: Run the tests** — Expected: PASS.
- [ ] **Step 5: Commit.**

---

### Task 4: The repository seam and the in-memory implementation

**Requirements:** the repository seam — design, enabling R2 and R3

**Files:**
- Create: `api/src/repository/types.ts`, `api/src/repository/memory.ts`
- Test: `api/src/repository/memory.test.ts`

**Interfaces:**
- Produces: `interface Repository { findKeyByHash(hash: string): Promise<KeyRow | null>;
  getSettings(): Promise<SettingsRow | null> }`; `type KeyRow = { id: string; name: string }` —
  deliberately **not** carrying the hash back out; `type SettingsRow = { time_zone: string;
  display_unit: 'kg' }`; `function memoryRepository(seed?: Partial<Seed>): Repository`.

- [ ] **Step 1: Write the failing tests**:

```ts
test('an unknown hash returns null', ...)
test('a seeded Key is found by its hash', ...)
test('KeyRow does not carry the hash', ...)         // assert 'hash' not in the returned object
test('getSettings returns null when no row was seeded', ...)
```

- [ ] **Step 2: Run the tests** — Expected: FAIL.
- [ ] **Step 3: Implement** — a working implementation, not a mock: tests describe behaviour, never
      call order.
- [ ] **Step 4: Run the tests** — Expected: PASS.
- [ ] **Step 5: Commit.**

---

### Task 5: Authentication, then the capability check

**Requirements:** R5, R6, R7, R10

**Files:**
- Create: `api/src/auth/authenticate.ts`, `api/src/auth/capability.ts`
- Test: `api/src/auth/auth.test.ts`

**Interfaces:**
- Consumes: `Repository` (Task 4), `OperationError` (Task 2), `OperationEntry` (Task 3).
- Produces: `authenticate(headers: Record<string,string|undefined>, repo: Repository):
  Promise<Principal>` where `type Principal = { kind: PrincipalKind; key_id: string; agent_name: string }`
  — the registry's `PrincipalKind` (Task 3), not a second union;
  `assertMayCall(entry: OperationEntry, principal: Principal): void`.

Authentication answers *who*; the capability check answers *may they*. ADR 0003's point is that these
are different questions, so they are different functions and are tested separately.

- [ ] **Step 1: Write the failing tests**:

```ts
test('no Authorization header -> key_missing', ...)
test('lower-case "authorization: bearer <key>" is accepted', ...)   // Review Focus 1
test('"Basic abc" -> key_missing', ...)                             // Review Focus 2
test('a bare key with no scheme -> key_missing', ...)               // Review Focus 2
test('a Bearer value matching no stored hash -> key_unknown', ...)
test('an 8 KB Authorization value -> key_unknown, no throw', ...)   // Review Focus 5
test('a valid Key yields a principal carrying key_id and agent_name', ...)
test('an entry without "agent" in principals -> lifter_only', ...)  // test-only entry fixture
test('a Cognito-shaped JWT -> key_unknown', ...)                    // R7: no lifter verifier yet
```

- [ ] **Step 2: Run the tests** — Expected: FAIL.
- [ ] **Step 3: Implement `authenticate`** — read the header case-insensitively, split the scheme
      case-insensitively, `sha256` the credential with `node:crypto`, one repository read by hash.
- [ ] **Step 4: Implement `assertMayCall`** — default deny: throw `lifter_only` unless the entry's
      `principals` includes the principal's kind. Export the test-only `OperationEntry` fixture from
      the test file, not from `registry/index.ts` — the registry holds exactly one entry (Task 3).
- [ ] **Step 5: Run the tests** — Expected: PASS.
- [ ] **Step 6: Commit.**

---

### Task 6: The `get_account` operation

**Requirements:** R2, R3, R11 (the missing-row path)

**Files:**
- Create: `api/src/operations/get-account.ts`
- Test: `api/src/operations/get-account.test.ts`

**Interfaces:**
- Consumes: `Repository` (Task 4), `Principal` (Task 5), `OperationError` (Task 2).
- Produces: `getAccount(ctx: { repo: Repository; principal: Principal }): Promise<AccountBody>`;
  `type AccountBody = { agent: { name: string }; settings: { time_zone: string; display_unit: 'kg' };
  standing_notes: [] }`.

- [ ] **Step 1: Write the failing tests**:

```ts
test('returns the body the spec fixes', ...)            // deep-equal the R2 example
test('agent.name is the name of the Key that called', ...)
test('standing_notes is present and is an empty array', ...)  // not null, not absent
test('the body contains none of the four forbidden fields', ...)
  // serialise, assert absent by name: cognito_sub, key, hash, keys
test('a missing settings row raises internal', ...)     // Review Focus 3
```

- [ ] **Step 2: Run the tests** — Expected: FAIL.
- [ ] **Step 3: Implement** — no transport, no SQL, no connection. `standing_notes` is a literal
      `[]`; the stories that fill it are not in Phase 1.
- [ ] **Step 4: Run the tests** — Expected: PASS.
- [ ] **Step 5: Commit.**

---

### Task 7: The log line

**Requirements:** R16

**Files:**
- Create: `api/src/logging/line.ts`
- Test: `api/src/logging/line.test.ts`

**Interfaces:**
- Produces: `logRequest(fields: { request_id: string; operation: string; principal_kind: string;
  key_id?: string; duration_ms: number; outcome: 'ok' | ErrorCode }): void` — one JSON line on
  stdout.

- [ ] **Step 1: Write the failing tests**:

```ts
test('emits one JSON line with exactly the six fields', ...)
test('a Key, a hash, a cognito_sub, an email and a body never appear', ...)
  // pass them in adjacent fields; assert the serialised line contains none
test('an 8 KB Authorization value never reaches the line', ...)   // Review Focus 5
```

- [ ] **Step 2: Run the tests** — Expected: FAIL.
- [ ] **Step 3: Implement** — build the line from a fixed field list, never by spreading an input
      object. That is what makes the second test hold as the codebase grows.
- [ ] **Step 4: Run the tests** — Expected: PASS.
- [ ] **Step 5: Commit.**

---

### Task 8: The HTTP surface

**Requirements:** R4

**Files:**
- Create: `api/src/surfaces/http/router.ts`
- Test: `api/src/surfaces/http/router.test.ts`

**Interfaces:**
- Consumes: the registry (Task 3), `authenticate`/`assertMayCall` (Task 5), `getAccount` (Task 6),
  `errorBody`/`statusFor` (Task 2), `logRequest` (Task 7).
- Produces: `handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2>`.

- [ ] **Step 1: Write the failing tests**:

```ts
test('the route table is built from the registry', ...)  // one route, GET /api/account
test('a valid Key gets 200 and the R2 body', ...)
test('no Key gets 401 and the key_missing body', ...)
test('every error response carries a request_id', ...)
test('an unknown path gets 404 and the not_found body', ...)
test('one log line is emitted per request, success or failure', ...)
```

- [ ] **Step 2: Run the tests** — Expected: FAIL.
- [ ] **Step 3: Implement** — walk the registry to build the routes; take `request_id` from API
      Gateway's `requestContext.requestId` when present, else `crypto.randomUUID()`. The boundary
      catches `OperationError` and renders it through `errorBody`; nothing else composes a message.
- [ ] **Step 4: Run the tests** — Expected: PASS.
- [ ] **Step 5: Commit.**

---

### Task 9: The MCP surface

**Requirements:** R4, R15

**Files:**
- Create: `api/src/surfaces/mcp/server.ts`
- Test: `api/src/surfaces/mcp/server.test.ts`

**Interfaces:**
- Consumes: the same five modules as Task 8.
- Produces: `mcpHandler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2>` serving
  `POST /mcp`.

Hand-rolled JSON-RPC over Streamable HTTP rather than the MCP SDK: three methods are needed
(`initialize`, `tools/list`, `tools/call`), responses are plain JSON with no stream, and ADR 0005
names a small bundle as a free cold-start mitigation. The trade-off is in Risks.

- [ ] **Step 1: Write the failing tests**:

```ts
test('tools/list is derived from the registry', ...)     // one tool, named get_account
test('the tool schema equals the registry entry schema', ...)  // R4: the two surfaces agree
test('tools/call get_account with a valid Key returns the R2 body', ...)
test('GET /mcp returns 405', ...)
test('DELETE /mcp returns 405', ...)
test('initialize reports protocol revision 2025-11-25', ...)
test('a malformed JSON body returns the R8 error body', ...)   // Review Focus 4
test('an unknown tool name returns not_found, not a crash', ...)
```

- [ ] **Step 2: Run the tests** — Expected: FAIL.
- [ ] **Step 3: Implement** — parse the JSON-RPC envelope, dispatch the three methods, return the
      same error object the HTTP surface returns.
- [ ] **Step 4: Run the tests** — Expected: PASS.
- [ ] **Step 5: Commit.**

---

### Task 10: The migration and its guard

**Requirements:** R9, R10, R11, R12

**Files:**
- Create: `api/migrations/0001_init.sql`, `tools/check-dsql-sql.mjs`
- Test: `tools/check-dsql-sql.test.mjs`, `api/migrations/migration.test.ts`

**Interfaces:**
- Produces: the schema every later task reads; `node tools/check-dsql-sql.mjs api/migrations` exits
  non-zero on a rejected construct.

- [ ] **Step 1: Write the failing tests**:

```ts
test('keys has exactly: id, key_sha256, name, created_at', ...)   // parsed from the SQL
test('no column stores a Key in plain text', ...)
test('keys has no last_used_at and no revoked_at', ...)
test('key_sha256 carries a unique index', ...)            // R10: lookup is one indexed read
test('settings seeds one row: cognito_sub NULL, kg, Asia/Ho_Chi_Minh', ...)
test('the checker rejects a FOREIGN KEY, a SERIAL and a CREATE TRIGGER', ...)
test('the checker accepts 0001_init.sql', ...)
```

- [ ] **Step 2: Run the tests** — Expected: FAIL.
- [ ] **Step 3: Write `0001_init.sql`** — `keys` with a UUID primary key and a unique index on
      `key_sha256`; `settings` with the single seeded row; a `migrations` table recording what has
      run. Forward-only.
- [ ] **Step 4: Write the checker** — a list of constructs Aurora DSQL rejects, matched against the
      SQL. It is a guard, not a proof: see Risks.
- [ ] **Step 5: Run the tests and `npm run lint`** — Expected: PASS.
- [ ] **Step 6: Commit.**

---

### Task 11: Aurora DSQL — connection, retries, repository

**Requirements:** R13, R14

**Files:**
- Create: `api/src/db/connection.ts`, `api/src/db/with-transaction.ts`, `api/src/repository/dsql.ts`
- Test: `api/src/db/db.test.ts`

**Interfaces:**
- Consumes: `Repository` (Task 4) — `dsqlRepository()` implements the same interface.
- Produces: `getConnection(now?: () => number): Promise<Client>`;
  `withTransaction<T>(fn: (c: Client) => Promise<T>): Promise<T>`.

No Aurora DSQL exists at this point and none is created. These tests use a fake clock and a fake
driver; what they prove is the lifecycle logic, not that DSQL accepts it.

- [ ] **Step 1: Write the failing tests**:

```ts
test('a token older than ten minutes is re-minted', ...)        // fake clock
test('a dead connection is reconnected once, then the error surfaces', ...)
test('an OCC failure retries three times with growing jitter', ...)
test('a non-concurrency error is not retried', ...)
test('dsqlRepository satisfies the Repository interface', ...)   // same suite as Task 4's fake
```

- [ ] **Step 2: Run the tests** — Expected: FAIL.
- [ ] **Step 3: Implement the connection module** — module-scope client, SigV4 auth token from the
      AWS SDK's DSQL signer (confirm the exact package at install; its role is minting the token
      `pg` uses as the password), re-minted at ten minutes.
- [ ] **Step 4: Implement `withTransaction`** — three attempts, jittered backoff, one log line per
      retry. Handlers never catch database errors (P7).
- [ ] **Step 5: Implement `dsqlRepository`** — run Task 4's test suite against both implementations.
- [ ] **Step 6: Run the tests** — Expected: PASS.
- [ ] **Step 7: Commit.**

---

### Task 12: The CDK stack and the bundle budget

**Requirements:** R17 (the bundle half), ADR 0005 infrastructure rules

**Files:**
- Create: `infra/bin/app.ts`, `infra/lib/spine-stack.ts`
- Test: `infra/test/spine-stack.test.ts`

**Interfaces:**
- Produces: a synthesizable stack. Nothing is deployed — `9017` does that.

- [ ] **Step 1: Write the failing tests** — `aws-cdk-lib/assertions` against the synthesized
      template:

```ts
test('both Lambdas are arm64 on nodejs22.x', ...)
test('every log group sets a 14-day retention', ...)
test('the /api and /mcp behaviours use CachingDisabled', ...)
test('an origin-request policy forwards the Authorization header', ...)
test('the stack declares no secret and no stored credential', ...)
test('the API bundle is under 1 MB', ...)              // measured from the esbuild output
```

- [ ] **Step 2: Run the tests** — Expected: FAIL.
- [ ] **Step 3: Implement the stack** — `NodejsFunction` (esbuild) for the API and the migration
      runner, an HTTP API, a DSQL cluster, a CloudFront distribution with the two behaviours, log
      groups with explicit retention, and the migration custom resource. Region `ap-southeast-1`.
- [ ] **Step 4: Run the tests and `npx cdk synth`** — Expected: PASS, and a template on stdout.
- [ ] **Step 5: Commit.**

---

### Task 13: `mint-key.ts`

**Requirements:** R18

**Files:**
- Create: `scripts/mint-key.ts`
- Test: `scripts/mint-key.test.ts`

**Interfaces:**
- Consumes: `Repository` (Task 4) — the test runs it against the in-memory implementation.
- Produces: the only way a Key comes into existence in Phase 1 (ADR 0003).

- [ ] **Step 1: Write the failing tests**:

```ts
test('the Key is alc_live_ followed by 32 random bytes, base64url', ...)
test('only the sha256 is written; the Key is not', ...)
test('the Key is printed once, to stdout, and to no file', ...)
test('a duplicate name exits non-zero and writes nothing', ...)
```

- [ ] **Step 2: Run the tests** — Expected: FAIL.
- [ ] **Step 3: Implement** — `crypto.randomBytes(32).toString('base64url')`, printed with a line
      saying it cannot be shown again.
- [ ] **Step 4: Run the tests** — Expected: PASS.
- [ ] **Step 5: Commit.**

## Risks

- **The riskiest task is 11, and its tests cannot reduce the risk.** Everything about Aurora DSQL is
  exercised against a fake driver, so Task 11 proves the lifecycle logic and nothing about the
  database. `9017` is where it is first true.
- **Task 10's checker will miss something.** There is no local Aurora DSQL, so the guard is a list of
  known-rejected constructs. It catches the mistakes we can name, not the ones we cannot.
- **Hand-rolling MCP (Task 9) was chosen over the SDK.** Three methods, no stream, a smaller bundle,
  and no dependency pinned to a protocol revision we did not choose. The cost is that every later
  revision change is ours to make, and the test asserting revision `2025-11-25` is the tripwire.
- **Rejected: local Postgres as a test double.** It reproduces none of P7's constraints — no
  optimistic concurrency, no transaction limits, no 60-minute connection life — so a green local
  suite would look like database coverage while proving none of it.
- **Rejected: building the OpenAPI/Part B emitter now.** ADR 0004's rule is satisfied by deriving the
  two live surfaces at run time; the file emitters wait for `0198`, which keeps the generator out of
  D-010.
- **One spec correction this plan implies:** the spec's illustrative `request_id` is `"01JF…"`, a
  ULID. Task 8 uses API Gateway's request id or `crypto.randomUUID()`, both UUIDs. The spec's example
  should be changed to a UUID rather than a dependency added to match an illustration.

## Proof

Done when all four pass from the repository root:

```bash
npm run typecheck
npm run lint
npm test
npx cdk synth --app "npx tsx infra/bin/app.ts"
```

`npm test` must report every test named in this plan. Two of them are the ones to read first: the test
in Task 9 asserting the MCP tool's schema equals the registry entry's schema — that is R4, the reason
the registry exists — and the test in Task 6 asserting the four forbidden fields are absent from the
serialised body.

What these commands do **not** prove is stated once, here, so nobody mistakes a green run for a
working spine: **no endpoint is deployed, no Aurora DSQL cluster exists, no real Key has ever been
minted, and not one line of SQL has reached a database.** Change `9017` is the proof of those.
