# Product

## Positioning

> "An exercise tracker that your own AI agent runs. Connect an agent (Claude, ChatGPT, Grok, or
> any that can call an API or MCP server) and it logs every set as it happens, tracks progress
> and suggests what to lift next: the person's trainer."
> — `llms.txt`

Landing headline: **"YOUR AI IS NOW YOUR TRAINER"**, under the banner "WORKS WITH CLAUDE,
CHATGPT AND GROK".

Target user, stated on the landing page: *"anyone training 2–6 times a week, new or
experienced, who already talks to an AI."*

The inversion worth noting: the chat client is the primary input surface, not the website.
`llms.txt` is explicit — *"In the gym the chat is the interface."* The website is the scoreboard.

### Stated guardrails

Three claims carried on the landing page, directly under the primary CTA:

- Built on progressive overload, effort (RPE) and planned deloads
- Your data is yours: export any time, delete in one tap
- **Coaching, not medical advice: injuries and conditions go to a professional**

## Onboarding — three steps

1. **Create an account** — email or Google
2. **Connect your agent** — a connector in Claude, Grok or ChatGPT (one click in Claude and
   Grok), or an API key for anything else
3. **Train and talk** — between sets or after; it logs, coaches, and the dashboard keeps score

## Supported agent integrations

| Route | Mechanism | Notes |
|---|---|---|
| Claude | MCP, Streamable HTTP | One-click connector; OAuth or `X-Api-Key` |
| Grok | MCP | One-click connector |
| ChatGPT | OpenAPI action | Developer mode; 30-operation subset via `openapi.json?for=gpt` |
| Claude Code / Cursor | MCP | Documented separately |
| Anything else | Plain HTTP + `SKILL.md` | `X-Api-Key: gtk_…` header |

MCP endpoint: `https://shredpace.com/mcp` — Streamable HTTP, key as `X-Api-Key` or
`Authorization: Bearer`. OAuth metadata at `/.well-known/oauth-protected-resource/mcp`.
API keys are prefixed `gtk_`.

## Pricing and plan gating

Currently **early access: Pro is free for everyone.** The page promises at least 14 days'
notice before pricing starts.

**The price, from the Terms page (read 2026-11-18):** **Pro is $6.99 a month or $55.99 a year**, taken by
Stripe. Refunds are available within 14 days of a charge; a price change comes with at least 30 days' notice;
losing Pro deletes nothing. Free then shows the last 90 days of history and the coach as a preview, and
anything over its limits (3 metrics, 3 habits, one agent key) keeps working but cannot be added to.

| | Free ($0) | Pro ("Early Pro", free for now) |
|---|---|---|
| Logging | Unlimited, every activity | Everything in Free |
| Today, live comparisons, session summaries | Yes | Yes |
| Food, body readings, goals | Yes | Yes |
| Charts | **Last 90 days** (older data kept, not shown) | **Whole history, compared for life** |
| Agent keys | **One** | **Several** |
| Coach (stalls, step-backs, week's plan) | **No** | Yes |
| Programs | **No** | Yes |
| Adaptive food targets | **No** | Yes |
| CSV and JSON export | **No** | Yes |

### Gating as implemented in the bundle

Three screens are plan-gated, and the mechanism differs per screen (inferred from the router):

| Screen | Free behaviour | Pro behaviour |
|---|---|---|
| `coach` | `FreeCoachLocked` board — hard paywall | `ProCoach` / `PhoneProCoach` |
| `programs` | `FreeCoachLocked` board — hard paywall | `ProPrograms` / `PhoneProPrograms` |
| `progress` | **Reachable**, degraded to the 90-day window | `ProProgress` / `PhoneProProgress` |

`progress` is the only screen in the bundle's "allowed on free" set, which matches the pricing
table's "charts for the last 90 days" rather than a lock. Billing runs through **Stripe
Checkout** (hosted) — the bundle has `/billing/checkout`, `/billing/portal` and
`/billing/refresh`, and a `Billing` board on the `pro` screen.
