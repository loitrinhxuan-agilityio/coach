# Platform and delivery

## Hosting

Static site on **Amazon S3 behind CloudFront**.

```
server: AmazonS3
via: 1.1 …cloudfront.net (CloudFront)
x-amz-cf-pop: HIO52-P5
alt-svc: h3=":443"; ma=86400
```

The SPA shell is **1 027 bytes**; everything else is in the client bundle. `cache-control:
no-cache, must-revalidate` on the shell, so deploys take effect immediately.
Observed `last-modified` on the shell: **2026-11-15**.

| Asset | Size |
|---|---|
| `next.js` (app bundle) | 4 764 734 B (~4.76 MB), minified, **no sourcemap** (`next.js.map` → 404) |
| `auth.js` | 96 325 B |
| `theme-boot.js` | 782 B |
| `fonts.css` | 1 553 B |

## Auth

**AWS Cognito**, `eu-west-1`, with a dedicated `auth.shredpace.com` host. Sign-in is email or
Google (per the landing page). Agents authenticate separately with `gtk_`-prefixed API keys, or
OAuth for MCP — metadata at `/.well-known/oauth-protected-resource/mcp`.

The CSP `connect-src` pins the entire set of hosts the page may talk to:

```
connect-src 'self' https://cognito-idp.eu-west-1.amazonaws.com https://auth.shredpace.com
```

So the API is same-origin (`/api`), and there are **no third-party analytics, telemetry or
tag-manager endpoints** — nothing else is reachable.

## Security headers

A notably strict set for a consumer app:

| Header | Value |
|---|---|
| `content-security-policy` | `default-src 'none'`; `script-src 'self'`; `img-src 'self' data:`; `frame-ancestors 'none'`; `base-uri 'none'`; **`form-action 'none'`** |
| `x-frame-options` | `DENY` |
| `strict-transport-security` | `max-age=31536000; includeSubDomains` |
| `referrer-policy` | `no-referrer` |
| `x-content-type-options` | `nosniff` |
| `permissions-policy` | `camera=(), microphone=(), geolocation=()` — all three denied |
| `x-amz-server-side-encryption` | `AES256` |

`default-src 'none'` with an explicit allowlist per directive is the restrictive form, not the
permissive one. `form-action 'none'` means no HTML form can post anywhere — all writes go
through `fetch`. Camera is denied despite the product reading meal photos and scale
screenshots, which implies **uploads happen in the agent's client, not in this page**.

## PWA

Installable, standalone display, `start_url: ./#today`.

```json
{ "name": "Shredpace", "id": "./", "scope": "./",
  "start_url": "./#today", "display": "standalone",
  "background_color": "#0e0e10", "theme_color": "#0e0e10" }
```

Icons: SVG (any size), 192, 512, plus a **maskable** 512. Apple-specific meta is present
(`apple-mobile-web-app-capable`, `black-translucent` status bar, apple-touch-icon), and the
bundle carries a three-step "Add to Home Screen" walkthrough for iOS Safari.

## Theming

The shell boots with `data-theme="ember" data-mode="dark"` and a blocking `theme-boot.js` —
the standard trick to avoid a flash of the wrong theme. Themes are first-class (an
`Appearance` screen, `#settings/appearance`), and the bundle contains full light and dark
colour tables per theme, including `studio` — the default look for new accounts, in which the
dashboard is read-only and the user's agent does the writing.

Typography is **Archivo** (italic, condensed `font-stretch: 78%`, weight 800, uppercase) for
display text.

## Discoverability

The site is deliberately invisible to search engines and deliberately visible to agents:

- `<meta name="robots" content="noindex, nofollow">` on the shell
- `/robots.txt` returns the SPA's 404 page, not a robots file
- `/llms.txt` is a full, hand-written agent guide
- `/api/openapi.json` is public and unauthenticated
- `/api/skill.md` is the agent's full API guide
- `/docs` serves one reference page per operation, each also available as `.md`

Agent-facing documentation is a first-class surface here, not an afterthought.
