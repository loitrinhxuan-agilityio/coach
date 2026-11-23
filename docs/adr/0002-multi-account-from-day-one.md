---
status: accepted
---

# The data model is multi-account from the first migration, though Phase 1 has one user

Phase 1 is used by the Owner alone (decision D-001 in `docs/product/decision-log.md`), and Accounts are created by a script, not by sign-up. Every record still belongs to an Account from the start, and Keys, consent and deletion are per Account, as in ShredPace (decision D-003). Moving a single-user schema to multi-tenant later would touch every table, and the consent, deletion and per-key rate-limit stories already assume many Accounts.

## Amended 2026-11-23 (D-028)

This record keeps its decision: the schema is multi-account from the first migration. Its *justification* is
narrowed to one reason — **the Sample account has to be a second Account.** "Follow the ShredPace app" is no longer
a reason for anything structural (D-026), and the consent, deletion and per-key rate-limit stories are features for
a second person the Owner is not building for, so they no longer carry this decision either.

## Considered options

- **Single-user v1.** Cheaper now. Rejected because the rewrite later is costly and the consent and deletion rules would have to be built twice.
- **Multi-account data model, Accounts created by script (chosen).** Costs some design effort early. Phase 1 has no sign-up, invitation flow, marketing page or legal review. The Sample account is a second Account in the same system.
