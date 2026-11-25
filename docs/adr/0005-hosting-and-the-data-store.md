---
status: proposed
---

# Hosting and the data store: a static dashboard on CloudFront, the API on Lambda, Aurora DSQL behind it

Phase 1 runs as D-015 intends: the dashboard is static files in S3 behind CloudFront with no
server-side rendering; the API is API Gateway and Lambda, served from the same origin under `/api`;
sign-in is Cognito (email and password, Google linked later, D-009); the data store is Aurora DSQL;
and all of it is AWS CDK (`AGENTS.md`: infrastructure as code only). The region is free to choose —
D-012 found no residency requirement.

**This ADR is incomplete and cannot be approved as it stands.** D-014 and D-022 both require the
proposal to show a **monthly cost per component** and **how idle latency is handled**, and neither is
in this document. They are the Dev Lead's to supply. What is recorded here is the shape and the one
trade-off inside it that deserves the Owner's attention.

## Why

- **It is the Owner's own stated direction** (D-015), and the constraints it has to live inside are
  already fixed: AWS, about $10 a month (D-014), infrastructure as code, and the agent deploys rather
  than the Owner clicking in the console.
- **Nothing is paid while idle.** D-015 chose Lambda over ECS for exactly this, and Phase 1 has one
  Lifter whose usage is a few sessions a week, so an always-on container would spend the whole budget
  on doing nothing.
- **Same origin removes a class of problem.** With `/api` on the same host as the dashboard there is
  no CORS configuration, and the browser needs no cross-origin credential handling.
- **Static hosting fits a dashboard that an Agent writes to.** The pages read the API after load, so
  there is nothing for SSR to render that matters, and D-015 already ruled it out.

## Considered options

- **Lambda or ECS.** Settled by D-015 and D-014: Lambda, because idle cost is the binding constraint.
  The accepted price is cold starts on the logging loop and a 30-second API Gateway ceiling, both of
  which D-015 lists as known trade-offs.
- **Aurora DSQL, or Postgres with row-level security.** This is the live trade-off and the reason this
  ADR is worth reading. **Aurora DSQL has no row-level security** (recorded in `decision-log.md`,
  confirmed against the official SQL-support page and a January 2026 test, unverified for November
  2026). Under ADR 0002 every record belongs to an Account, so choosing DSQL moves account isolation
  entirely into application code — the database will not catch an unscoped query. A managed Postgres
  would give defence in depth for that one property, at a cost that has not been compared against the
  $10 ceiling and against DSQL's zero idle cost. **DSQL is carried here because it is D-015's
  direction, not because the comparison was made.** If the Owner wants the database to enforce
  isolation, this is the decision point, and it is cheaper to change now than after the first
  migration.
- **The region.** Free (D-012). The earlier "must keep personal data in the EU" was an assumption
  drawn from ShredPace's sign-in region, not a requirement of this project.

## Consequences

- **The isolation ADR becomes a blocking dependency, not a parallel one.** With no row-level security,
  item 3 of `development-preparation.md` has to say how an unscoped query is made *impossible* rather
  than merely avoided, and the Independent Reviewer needs a mechanical check. That ADR is still
  unwritten and no handler should be built before it exists.
- Cold starts land on the first request of a session, which is the logging loop D-004's product proof
  depends on. The latency answer D-014 asks for is therefore part of this decision, not a detail.
- CloudFront fronts two origins (S3 and API Gateway) with a path split on `/api`, so the CDN
  configuration becomes part of the API's behaviour. ShredPace's own documentation notes a consequence
  of this class: its CDN drops `Authorization` on GET requests, which is why it directs plain HTTP
  callers to a custom header instead. ADR 0001 sends a Key as a header, so the header name must be
  checked against CloudFront's behaviour before it is published.
- **`/api` must not be cached, and that is an account-isolation requirement rather than a performance
  one.** A new CloudFront behaviour defaults to a caching policy (`CachingOptimized`). If `/api` gets
  one and the credential — the Key header, or the Cognito session — is not part of the cache key, then
  a `GET` such as `/api/today` cached for one Account can be served to another. That crosses the
  account boundary **inside the CDN, before any application code runs**, so the scoping ADR 0002
  relies on never executes, and with no row-level security in Aurora DSQL nothing further down catches
  it either. The decision: `/api` uses `CachingDisabled`, and credentials reach the origin through an
  origin-request policy, never through the cache key. This belongs beside the header-forwarding check
  above so the isolation ADR can require it and the Independent Reviewer can verify it.
- Cognito's admin-created users start with a temporary password, which is what D-009's first-sign-in
  story is built around, and it suits Accounts created by script (D-003).

## Evidence

ShredPace runs this exact topology in production, which is evidence that the shape is viable for this
product class at this scale. Observed at `shredpace.com` on 2026-11-25:

- `GET /` returns `server: AmazonS3` with `via: ... .cloudfront.net (CloudFront)`, a versioned bucket
  (`x-amz-version-id`), `x-amz-server-side-encryption: AES256`, HSTS, and a strict
  `content-security-policy` of `default-src 'none'; script-src 'self'`.
- `GET /api/today` on the same origin returns `apigw-requestid`, so `/api` is API Gateway behind the
  same CloudFront distribution.
- That CSP's `connect-src` is `'self' https://cognito-idp.eu-west-1.amazonaws.com
  https://auth.shredpace.com` — Cognito in `eu-west-1` with a custom hosted-UI domain.
- `GET /config.json` ships runtime configuration rather than baking it into the build:
  `{"region":"eu-west-1","userPoolId":"…","clientId":"…","cognitoDomain":"auth.shredpace.com",…}`
  together with feature flags (`billing.on`, `earlyPro.on`, `agentOnly.on`) served as static JSON
  from the CDN. That is a pattern worth considering separately and is not decided here.

What was **not** observed: the database. Nothing externally visible names a data store, so this ADR's
Aurora DSQL choice rests on D-015 alone and gains no support from the research. Its `409` "two writes
at once: retry" and `422 too_many_rows` (limit 3,000) hint at optimistic concurrency over an
account-scoped aggregate, but that is **inference from error text**, not evidence, and it is not a
basis for any decision here.

Under D-026 none of this justifies the stack; D-015 does, and the open cost, latency and
isolation questions above are what stand between this document and approval.
