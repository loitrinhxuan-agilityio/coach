# Architecture

**This file is an index, not a source of truth.** Architecture is decided through ADRs and
approved by the Owner before any dependent implementation starts (D-022, `AGENTS.md`), so
[`docs/adr/`](../adr/) is authoritative and this page only lists what has been accepted.

Nothing architectural should be written here. If a decision is worth recording, it is worth
an ADR.

## Accepted

| ADR | Decision |
|---|---|
| [0001](../adr/0001-key-based-agent-access-first.md) | Agents connect with a Key first; OAuth comes after v1 |
| [0002](../adr/0002-multi-account-from-day-one.md) | The data model is multi-account from the first migration |

## Not yet written

Five ADRs block the start of application development, and none exists
([`../agents/development-preparation.md`](../agents/development-preparation.md), item 1):
hosting and the data store; how a person and an Agent's Key are each authorised; how one
account's data is kept from another's without row-level security; the Phase 1 REST and MCP
contracts; and the deployment and approval process. The identity provider they all depend on
is unchosen.
