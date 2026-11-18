---
status: accepted
---

# Agents connect with a Key first; OAuth comes after v1

In v1 an Agent connects to Rung's REST API and MCP server with a Key sent as a header, and there is no OAuth authorisation server. ShredPace also offers a one-click OAuth connector, but OAuth 2.1 with dynamic client registration is a large build, and a Key is enough to get the core loop working.

## Considered options

- **OAuth in v1.** Rejected for now. It is the way to connect from claude.ai and Claude Desktop, whose custom connectors sign in with OAuth, so it would make Rung usable there the way ShredPace is.
- **Keys only (chosen).** Works from Claude Code, Cursor and any bot over REST or MCP.

## Consequences

- A Lifter cannot add Rung as a custom connector in claude.ai or Claude Desktop in v1, unless their organisation has Claude's beta for fixed request headers.
- OAuth is the first item after v1. It will add a second way to authenticate an Agent, so Keys, and the rule that an Agent can never manage Keys, must stay independent of it.
