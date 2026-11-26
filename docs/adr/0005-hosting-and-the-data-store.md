---
status: proposed
---

# Hosting and the data store: a static dashboard on CloudFront, the API on Lambda, Aurora DSQL behind it

Phase 1 runs as D-015 intends: the dashboard is static files in S3 behind CloudFront with no
server-side rendering; the API is API Gateway and Lambda, served from the same origin under `/api`;
sign-in is Cognito (email and password, Google linked later, D-009); the data store is Aurora DSQL;
and all of it is AWS CDK (`AGENTS.md`: infrastructure as code only). The region is free to choose —
D-012 found no residency requirement.

Four components this ADR's first draft left out are named here, because between them they carry the
only charge that is certainly non-zero and the whole operational surface: **Route 53** for DNS, an
**ACM** certificate, **CloudWatch Logs**, and **AWS Backup** for the database.

**D-014's two conditions are answered below, and answering them moved what this ADR is for.** The
cost table puts the stack at **about $1.65 a month against a $10 ceiling**, so cost is not the binding
constraint and the Lambda-over-ECS argument D-015 rested on is won by a margin wide enough to stop
being a trade-off. Idle latency is the opposite: **AWS publishes no figure for it**, and the delay
lands on the first set of a session, which is precisely D-004's product proof. So the live question in
this document is now whether to spend a few cents a month defeating scale-to-zero — the property the
stack was chosen for. That is the one thing the Owner has to decide here.

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

## Monthly cost per component

D-014 requires a monthly cost per component and says the Dev Lead "must verify current prices and say
so." Rates were read from the AWS pricing pages on **2026-11-26**. Where a page publishes no Ireland
figure the rate is marked as such, because most of these pages price their worked examples in US East
and say only that pricing varies by Region. Nothing below is quoted from memory.

**Usage assumed.** One Lifter; four training sessions a week (17 a month); every logged set a write;
one agent conversation per session; the dashboard opened about 30 times a month. That comes to roughly
1,500 API calls a month. The table uses **10,000 API calls and 10,000 Lambda invocations** — about
eight times the estimate — so these figures are a ceiling, not a guess.

| Component | What drives the bill | Monthly | Rate, and how firm it is |
|---|---|---|---|
| **Route 53 hosted zone** | one zone, flat | **$0.50** | $0.50 per zone for the first 25. Verified, no free tier, and *not prorated* |
| **Domain registration** | one `.com` | **~$1.10** | **Unverified.** The Route 53 pricing page publishes no `.com` figure and links a separate TLD price list |
| **Aurora DSQL** | DPUs, storage | **$0.00 expected, unmeasured** | $8/million DPU and $0.33/GB-month, with the first 100,000 DPUs and 1 GB free *each month*. US East figures; no Ireland rate published |
| **Lambda** | 10,000 inv. x 512 MB x 400 ms = ~2,000 GB-s | **$0.04**, or $0.00 inside the allowance | $0.0000166667/GB-s plus $0.20/million requests, US East |
| **API Gateway** (HTTP API) | 10,000 requests | **$0.01** | $1.00/million, from a worked example that names no region |
| **CloudFront** | ~40,000 requests, well under 1 GB out | **$0.00** | Inside the "Always free" 1 TB and 10,000,000 requests a month |
| **S3** | ~20 MB of static files | **$0.00** | Rounds below a cent; transfer out to CloudFront is free |
| **Cognito** | one monthly active user | **$0.00** | Essentials is free to 10,000 MAU, and the page says that allowance is available "indefinitely" |
| **CloudWatch Logs** | ~20 MB ingested | **$0.00** | Inside the 5 GB free tier |
| **ACM certificate** | one | **$0.00** | Free when used with CloudFront |
| **AWS Backup** (DSQL) | a few MB of backup storage | **~$0.00, unpriced** | Charged per GB-month; rate not verified. Non-zero in principle |
| | | **~$1.65** | against about $10 (D-014) |

Three things in that table matter more than its total.

- **The only certainly non-zero component is one this ADR had not named.** Every compute and storage
  line is free or rounds to a cent, while the DNS hosted zone is a flat $0.50 whether the product is
  touched or not. A cost table of the five components the first draft listed would have totalled about
  five cents and implied far more headroom than there is.
- **The budget is not a bet on free tiers.** API Gateway's free million calls is the one allowance
  that expires — new customers only, twelve months — and it does not matter, because at 10,000 calls
  the paid rate is a cent. Cognito's allowance is published as indefinite and CloudFront's as "always
  free". Noted separately, and as an account question rather than an architecture one: the AWS Free
  Tier page now describes a plan where the account "closes on its own 6 months after you open it or
  when your credits run out", so a newly opened account is not a long-term home for this.
- **One line can only be measured.** No documentation says how many DPUs a personal training log
  consumes; the decision log flagged this on 2026-11-18 and it is still open. The useful bound is that
  **$10 of DPU charges takes about 1.25 million chargeable DPUs a month, more than twelve times the
  free allowance** — not a plausible accident at 17 sessions a month, which is why DSQL is recorded as
  expected-zero rather than as a threat to the ceiling.

**What D-014 warned about is absent, and one reason is structural.** D-014 names load balancers, NAT
gateways and always-on database clusters as single components that can exceed $10 by themselves. None
appears here: CloudFront and API Gateway stand in for the load balancer, DSQL has no instance to leave
running, and **there is no NAT gateway because the Lambda is not in a VPC.** Aurora DSQL is reached
over its public endpoint with a SigV4 token, so the function needs no private networking to talk to
its own database. A NAT gateway by itself would cost several times this entire bill.

## Idle latency

D-014 asks how idle latency is handled, "since a slow first request would hurt the logging loop." The
honest answer is that **the figure does not exist in AWS's documentation** — and the situation is
worse than the decision log's earlier note that idle latency "is not documented for DSQL."

**Three delays stack on the first request of a session, not one.**

1. **The Lambda cold start.** The best understood and the cheapest to reduce: arm64, a small bundle,
   and no VPC. The last matters most, because a function placed in a VPC to reach its database pays
   ENI setup on every cold start *and* needs a NAT gateway. DSQL's public endpoint removes both.
   D-015 already lists cold starts as an accepted trade-off.
2. **The DSQL cluster state, which is two transitions rather than one.** A cluster runs
   `Active -> Idle -> Inactive`. The user guide says a cluster "becomes idle when it's idle long
   enough for Aurora DSQL to scale down running resources", that an idle one becomes `Inactive` "when
   there's been no activity on the cluster for a prolonged period", and that **"The first connection
   attempt to an Idle or Inactive cluster will be slower than usual."** Restoring from `Inactive`
   "depends on the cluster size". **AWS publishes no duration for either transition and no figure for
   either delay.** A Lifter training four times a week will meet an `Idle` cluster at nearly every
   session and an `Inactive` one after a holiday, so this is not an edge case: it is the ordinary path
   that D-004's product proof runs along.
3. **Connection establishment.** DSQL takes a SigV4 token per connection rather than a password; a
   session lasts at most an hour and a token defaults to fifteen minutes. No pooled connection
   survives between sessions, so every session pays connection setup and no amount of warm-pool
   trickery in the handler can hide it.

**The decision: this ADR states no latency figure, because none can be read from documentation.** It
sets a measurement and a fallback chosen in advance instead.

- **Measure before the logging loop is accepted.** First-request p50 and p95 after 15 minutes, 1 hour,
  24 hours and 7 days of idleness, recorded here as an amendment. That is the only way the number can
  come to exist, and by then the stack is deployed, so it is nearly free to collect.
- **Pick the fallback now, not after a bad measurement.** Three options, priced:

| Option | Monthly | What it buys |
|---|---|---|
| **Keep the cluster warm** — EventBridge Scheduler every 5 minutes into a 128 MB Lambda running `SELECT 1` | about **$0.01** of Lambda plus a few thousand trivial DPUs | Keeps DSQL `Active`, so delay 2 never happens. Defeats scale-to-zero in letter and costs cents in fact |
| **Provisioned concurrency on the API Lambda** | about **$10.80** for one 1 GB function | Removes delay 1 only, and spends the whole D-014 budget doing it. **Rejected on the number** |
| **Accept the delay** | $0.00 | Free, and lands on the first set of every session |

**The recommendation is the keep-warm ping, and it is the genuine trade-off in this document.** The
stack was chosen because nothing is paid while idle (D-015), and the remedy for its one serious
weakness is to pay a little precisely so that it is never idle. At about a cent a month against some
$8 of unused headroom the Owner is not choosing between cost and speed — the cost argument was won six
times over. They are being asked to accept that the architecture's advertised virtue is deliberately
switched off along the path the product's proof depends on.

## Considered options

- **Lambda or ECS.** Settled by D-015 and D-014: Lambda, because idle cost is the binding constraint.
  The accepted price is cold starts on the logging loop and a 30-second API Gateway ceiling, both of
  which D-015 lists as known trade-offs.
- **Aurora DSQL, or Postgres with row-level security.** ~~This is the live trade-off and the reason
  this ADR is worth reading.~~ **Settled by [ADR 0006](0006-phase-1-is-single-account.md), and no
  longer a trade-off.** Aurora DSQL has no row-level security — re-verified 2026-11-25 against the
  live `CREATE VIEW` page, so the earlier "unverified for November 2026" caveat is discharged. That
  used to matter because ADR 0002 made every record belong to an Account, so DSQL moved isolation
  into application code where the database could not catch an unscoped query, and a managed Postgres
  would have given defence in depth for that one property. Phase 1 is now single-account, so there is
  no cross-account isolation to enforce and the comparison has nothing to decide. **DSQL is carried on
  D-015's direction, as before.** If tenancy ever returns, this option reopens, and it is cheaper to
  decide then than to carry the apparatus now.
- **Scale to zero, or a ping that stops it.** The live trade-off, priced in the latency table above.
  Keeping the cluster `Active` costs roughly a cent a month and removes the one delay nobody can put a
  number to; leaving it to scale down is free and puts an undocumented wait in front of the first set
  of every session. Provisioned concurrency was the third option and is rejected on its price, not on
  its merits: $10.80 a month is the entire D-014 ceiling, and it would fix only the Lambda third of
  the problem.
- **The region.** Free (D-012). The earlier "must keep personal data in the EU" was an assumption
  drawn from ShredPace's sign-in region, not a requirement of this project.

## Consequences

- **The isolation ADR is no longer needed, and item 3 closes with nothing built.** This bullet
  previously made it a blocking dependency. [ADR 0006](0006-phase-1-is-single-account.md) makes Phase 1
  single-account, so there is no second Account for data to leak to, and item 3 of
  `development-preparation.md` has no subject. Aurora DSQL's lack of row-level security stops being a
  risk the architecture has to answer for. If tenancy ever returns, that ADR has to be written *before*
  it does.
- Cold starts land on the first request of a session, which is the logging loop D-004's product proof
  depends on. The latency answer D-014 asks for is therefore part of this decision, not a detail.
- CloudFront fronts two origins (S3 and API Gateway) with a path split on `/api`, so the CDN
  configuration becomes part of the API's behaviour. ShredPace's own documentation notes a consequence
  of this class: its CDN drops `Authorization` on GET requests, which is why it directs plain HTTP
  callers to a custom header instead. ADR 0001 sends a Key as a header, so the header name must be
  checked against CloudFront's behaviour before it is published.
- **`/api` must not be cached — a confidentiality requirement, not a performance one.** A new
  CloudFront behaviour defaults to a caching policy (`CachingOptimized`). If `/api` gets one and the
  credential — the Key header, or the Cognito session — is not part of the cache key, a `GET` such as
  `/api/today` cached for a signed-in request can be served to **an unauthenticated requester**, who
  then reads the Lifter's training data without any credential at all. It happens inside the CDN,
  before any application code runs, so nothing below it can intervene. The decision: `/api` uses
  `CachingDisabled`, and credentials reach the origin through an origin-request policy, never through
  the cache key. It sits beside the header-forwarding check above so the Independent Reviewer can
  verify both together. *(This bullet originally argued the leak would cross an account boundary.
  Under ADR 0006 there is one Account, so the boundary it crosses is authenticated-to-anonymous — a
  different reason for the same decision.)*
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

Under D-026 none of this justifies the stack; D-015 does. The **cost and latency** questions that
stood between this document and approval are answered above: cost at about $1.65 a month against a $10
ceiling, and latency as a measurement obligation plus a fallback priced in advance, because no
published figure exists. What is left for the Owner is the fallback choice and the approval itself.
The isolation question that stood here originally was removed by ADR 0006, not answered.
