# ShredPace: reference for the AI Lift Coach (source of truth)

Reverse-engineered inventory of <https://shredpace.com>, captured **2026-11-17** and extended on
**2026-11-18** with the publisher's full agent guide, changelog and docs pages.

ShredPace is an exercise tracker with no coaching UI of its own on the input side: **the user's
own AI agent is the trainer**. The agent logs sets over an API or MCP server while the person
trains; the website is the dashboard that shows the result.

## Contents

The folder is sorted by what a file is for. Read `spec/` to learn what ShredPace does, `observations/` for
what the live dashboard actually showed, and `review/` for our own judgement of how complete this is.

### `spec/`: what ShredPace does (our research reference)

| File | What's in it |
|---|---|
| [product.md](spec/product.md) | Positioning, the three-step onboarding, pricing and plan gating |
| [features.md](spec/features.md) | Complete feature inventory by domain |
| [screens-and-routes.md](spec/screens-and-routes.md) | 44 screens, 54 boards, the full hash-route table |
| [api-surface.md](spec/api-surface.md) | All 109 API operations across 70 paths |
| [product-rules.md](spec/product-rules.md) | **The behaviour under the screens**: progression, nutrition formulas, thresholds, gating, quotas, consent versions |
| [platform.md](spec/platform.md) | Hosting, auth, PWA, security headers, theming |
| [design-tokens.md](spec/design-tokens.md) | The 7 themes, their palettes, typefaces and radii, extracted from the bundle |
| [changelog.md](spec/changelog.md) | **Dated release timeline**: 19 entries, 2 Oct to 17 Nov 2026; the product is about 46 days old |

### `observations/`: what the live dashboard showed

| File | What's in it |
|---|---|
| [signed-in.md](observations/signed-in.md) | About 30 signed-in routes, read over six visits on an account that filled up with test data; corrections to earlier guesses |

### `review/`: our judgement of the capture

| File | What's in it |
|---|---|
| [coverage-audit.md](review/coverage-audit.md) | **Does the PRD cover every desktop feature?** Every screen and all 109 operations checked; 30 missing features found and added to the PRD |
| [open-questions.md](review/open-questions.md) | **Read this**: the 147-board discrepancy and what could not be observed |
| [handoff.md](review/handoff.md) | **Start here when resuming**: what is left, exactly what to do in the account to unlock it, how to resume the capture, and how to regenerate and republish |

### `prototype/` and `evidence/`

| Folder | What's in it |
|---|---|
| [prototype/](prototype/README.md) | The two prototypes (a 59-board canvas and a router-accurate interactive app), what in them is real versus reconstructed, the 59 `.dc.html` boards, the generator and build scripts, and `check.sh` to detect drift from the published artifact |
| `evidence/` | Unmodified captures: `openapi.json`, `llms.txt`, `skill.md`, `changelog.md`, `docs/` (123 pages), the minified router, `themes.json`, 904 UI strings, `fonts.css`, the SPA shell. **Not tracked in git**, see [evidence/README.md](evidence/README.md) |

This folder is **reference material about another product**. Coach's own designs belong in
[`docs/design/`](../../design/), and the requirements in [`issues/prd.md`](../../../issues/prd.md).

## How this was captured

Everything here comes from publicly reachable, unauthenticated endpoints. No account was
created and no credentials were used.

| Source | Weight |
|---|---|
| `GET /api/openapi.json` (186 KB, OpenAPI 3.1) | **Authoritative** — publisher's own spec |
| `GET /llms.txt` (13.5 KB) | **Authoritative** — publisher's own agent guide |
| `GET /api/skill.md` (167 KB) | **Authoritative** — the publisher's full agent guide; the source of most rules in [10](spec/product-rules.md) |
| `GET /docs/changelog.md` (43 KB) | **Authoritative** — dated releases |
| `GET /docs/**.md` (123 pages) | **Authoritative** — human docs and one reference page per operation |
| `GET /` landing page, rendered | **Authoritative** — publisher's own marketing copy |
| `next.js` client bundle (4.76 MB, minified, no sourcemap) | **Inferred** — read from minified code |

Claims traceable to the first six are observations. Claims from the bundle are inferences
from minified identifiers and are marked as such where it matters.

## Scope limit

The dashboard is behind AWS Cognito. Until 2026-11-18 only the public landing page and the sign-in
screen had been rendered. On that date the account owner signed in and about 30 routes were read
**read-only on an almost-empty account** — see [signed-in.md](observations/signed-in.md).
Empty and first-run states are therefore observed; **populated states, the Free-plan locked screens
and several themes are not**, and those statements remain read from the router and registries in the
bundle. See [open-questions.md](review/open-questions.md).
