---
status: accepted
---

# Phase 1 is single-account, and tenancy is deferred behind a surrogate-key constraint

Phase 1 has one Lifter and no Sample account. There is no `account` table and no `account_id` column:
the Lifter is a Cognito user, their preferences are one row, and everything else is their logged
history. Tenancy is deferred, and the one thing that keeps deferring it cheap — **surrogate UUID
primary keys everywhere** — is recorded here as a binding constraint rather than a preference.

**This ADR supersedes ADR 0002.** Accepted by the Owner on 2026-11-26, after the Independent Reviewer
raised that rewriting the review instructions while ADR 0002 was still accepted would leave the
isolation review switched off under an architecture that still required it. The Owner took the first
of the two remedies the review offered: accept this ADR now, so `requirements.md` and `REVIEW.md`
match the architecture in the same commit. [ADR 0002](0002-multi-account-from-day-one.md) becomes
`superseded by ADR-0006` and keeps its own text as the record of what was decided on the day.

## Why

- **ADR 0002's last justification was removed, not weakened.** D-028 narrowed it to exactly one
  reason: "the Sample account has to be a second Account." The Owner has since decided there is no
  Sample account. Nothing is left holding it up.
- **D-026 forbids building for a candidate.** "Phase 1 is the only committed scope. Every other
  feature is a candidate." A second Account is a candidate — D-005 says whether the product is ever
  public "does not matter to the Owner and is not a goal either way", and D-012 says revisit *if*
  anyone else ever holds an Account. The same principle struck ShredPace as a structural reason
  (D-026) and the docs site as a reason for the registry (ADR 0004). It applies here.
- **Multi-tenancy is the project's largest source of security risk, and it is self-inflicted.**
  `REVIEW.md` calls an unscoped query the highest-value finding in this repository. That bug class
  exists *only* because of tenancy. With one Account the worst a forgotten predicate does is show a
  set the Lifter deleted.
- **Deferring is cheap, which was checked rather than assumed.** On Aurora DSQL a primary key is
  immutable and clusters the table, so an earlier draft of this reasoning claimed the retrofit would
  mean rebuilding every table. That is only true if `account_id` must join the primary key. It need
  not: tenancy needs `account_id` on the row and in every predicate. With surrogate UUID keys the
  retrofit is `ADD COLUMN`, backfill, `CREATE INDEX ASYNC`, and a `CHECK ... NOT VALID` plus an async
  `VALIDATE` — all supported, no rebuild.

## Considered options

- **Keep multi-account and write a fresh justification.** Rejected. Every candidate justification is
  either a feature for a second person the Owner is not building for (which D-028 already struck) or
  the retrofit-cost argument above, which does not survive checking.
- **Keep multi-account with composite primary keys and composite foreign keys.** This is the
  strongest version of the rejected option and deserves recording, because it is the only design that
  delivers what S3 actually asked for. With `PRIMARY KEY (account_id, session_id)` and a child's
  `FOREIGN KEY (account_id, session_id)`, a set *physically cannot* reference another Account's
  session — the database refuses, rather than a reviewer noticing. Rejected because it buys that
  guarantee for a tenancy Phase 1 does not have, and because the composite key is immutable, so it is
  the one choice that would make deferral expensive.
- **Single-account, tenancy deferred (chosen).** Costs the ability to open sign-up without a
  migration first.

## Consequences

- **`requirements.md` S3 is withdrawn, not deleted** — the row stays, because other documents cite it
  by number. It has no subject either way: there is no second Account for
  data to leak to. `REVIEW.md`'s Security pass loses "an unscoped query is the highest-value finding
  in this repository" and is rewritten around what remains — credentials and PII in logs and errors.
- **Sign-up is structurally impossible until tenancy returns.** A second person signing in gets `403`
  from the subject check below. Opening sign-up is not a feature toggle; it requires this migration
  first. This is the accepted price of the decision.
- **Authorisation degenerates to an equality check, which has to be explicit.** A Cognito user pool is
  a container, so "any valid token from the pool" would mean every user who ever exists in it shares
  one training log. The `settings` row stores the one permitted `cognito_sub`; every other verified
  token gets `403`. Phase 1 is otherwise safe only because nobody has created a second pool user.
- **One provisioning script owns both sides.** It creates the Cognito user, reads back the `sub`, and
  writes the `settings` row in the same run, so the two cannot drift. Re-running it is the documented
  recovery after a pool or stack rebuild, which would otherwise mint a new `sub` and lock the Owner
  out of their own data.
- **Any further identity provider links to the existing Cognito user**, never creates a second. A
  Google sign-in that creates its own user would make one Lifter two `sub`s, each holding half a
  history, and merging them afterwards is a data migration. Google is deferred (D-009); the rule is
  recorded now because the damage happens on first use.
- **Aurora holds no personal data.** No email, no name — Cognito is the only record of the person, and
  the database holds an opaque subject identifier plus training data. Export and deletion get simpler,
  S7 stays cleanly true, and test fixtures committed to a public repository cannot leak identity.
- **There is no `lifter` table.** Under S7 every attribute a Lifter profile would hold — bodyweight,
  measurements, check-ins, pain, meals — is health data and out of Phase 1. The Lifter is a Cognito
  identity, two settings, and facts derived from their log. If a later phase brings body data or
  goals, it arrives as its own tables, never as columns retrofitted onto a profile.
- **Surrogate UUID primary keys everywhere; no natural or composite primary keys.** This is the price
  of the decision and the reason deferral stays cheap. It also matches AWS's documented default
  recommendation for Aurora DSQL.
- **The word *Account* survives as a concept with no table.** ADR 0001 and ADR 0003 both lean on it,
  and `GLOSSARY.md` defines a Key as acting on one Account. `GLOSSARY.md` gains one line saying that
  in Phase 1 there is exactly one and it has no table.
- **ADR 0003 is unaffected.** Lifter versus Agent is about what a principal may do, not about
  tenancy. A Key still cannot mint Keys, export, or delete.
- **ADR 0005's cache rule survives with a different reason.** `/api` must still use `CachingDisabled`,
  but because a cached response could reach an unauthenticated requester, not because it could cross
  an account boundary.

## Evidence

Aurora DSQL constraints verified against AWS documentation on 2026-11-25, which corrected two things
this repository believed:

- **Row-level security is still unsupported**, now confirmed rather than inferred from a January 2026
  test. The live statement is on the `CREATE VIEW` page: "Aurora DSQL does not currently support
  row-level security." So S3's premise was sound; the requirement is removed because tenancy is, not
  because the constraint changed.
- **Foreign key constraints have been supported since 2026-08-26**, which the decision log's
  architecture notes had already half-caught. This is what makes the composite-foreign-key option
  above real rather than hypothetical.
- A primary key "can't be changed or added later" and clusters the table; `ALTER TABLE` supports
  `ADD COLUMN` and `ADD CONSTRAINT ... NOT VALID` with async `VALIDATE`, but has no `SET NOT NULL` and
  no `ADD PRIMARY KEY`. Together these are why the surrogate-key constraint is binding.

`security_barrier` and `security_invoker` views are supported and were considered as an RLS substitute.
They were rejected: a view cannot know "the current Account" without session state, and DSQL pools at
transaction level, so session state is not something to lean on.
