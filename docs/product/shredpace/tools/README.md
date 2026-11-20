# Capture tools

Scripts that screenshot <https://shredpace.com> page by page. They produced the 205 captures
described in `../evidence/screenshots/README.md`.

The **images** live under `../evidence/`, which is gitignored, so they stay on the capturing
machine. Only these scripts are tracked.

## Setup

They drive the **installed Google Chrome** through `playwright-core`, so no browser download is
needed:

```bash
npm install playwright-core
```

Set `CHROME_BIN` if Chrome is not at the macOS default path.

## Use

Capture a set of pages:

```bash
node capture.mjs <outDir> <manifest.json> --viewports desktop,phone --schemes dark,light
```

Rebuild the API manifest from the published OpenAPI document (it also verifies every URL resolves
without a redirect):

```bash
node gen-api-manifest.mjs
```

Build `README.md` and `contact-sheet.html` over the captured sets:

```bash
node gen-index.mjs ../evidence/screenshots
```

## Files

| File | What it is |
|---|---|
| `capture.mjs` | Public sweep: launches a clean browser. Produced the 205 public and API images |
| `capture-profile.mjs` | Signed-in sweep: launches an already signed-in profile. Produced the 212 dashboard images |
| `gen-api-manifest.mjs` | Builds and verifies the 109 API reference URLs |
| `gen-index.mjs` | Writes the README and the filterable contact sheet |
| `manifest-public.json` | 9 app hash routes, 15 docs pages, the 404 board |
| `manifest-api.json` | The 109 per-operation API reference pages |
| `manifest-signedin.json` | The 28 dashboard routes |
| `capture-attached.mjs` | Superseded: attaches instead of launching, and loses emulation. See its header |

The manifest of id-bearing detail routes (`#session/{id}`, `#goal/{id}` …) is **deliberately not
committed**: those are real record ids from a live account. Rebuild it per account from the
Shredpace MCP connector, as described below.

## Three traps these scripts exist to avoid

**1. Full-page capture needs Playwright, not raw CDP.** Driving `Page.captureScreenshot` with
`captureBeyondViewport` (or with a `clip` taller than the viewport) silently *repeats a band of the
document* on tall pages. The first landing-page capture contained the hero section twice. The DOM
was correct; the capture was not. Resizing the viewport to the full content height did not fix it.
Playwright's own `fullPage` implementation is correct, which is why these scripts use it.

**2. API reference slugs are hyphenated, not the OpenAPI `operationId`.** `/docs/api/get_account`
**302-redirects to `/docs`**, and so does any unknown page. A manifest built straight from the
OpenAPI ids therefore yields 109 byte-identical copies of the docs index, each named after a
different operation, all returning HTTP 200. The real pages are `/docs/api/get-account`.
`gen-api-manifest.mjs` checks every URL with `redirect: "manual"` and reports anything that is not
a direct 200.

**3. Attaching to a browser loses viewport and pixel-density emulation.** `connectOverCDP` gives a
context built from a real window, which has no per-context `deviceScaleFactor` or `isMobile`.
`setViewportSize` does not take and `scale: "device"` yields 1x, so captures come back at the
window's own size — 1425x1245 where 1440x900 at 2x was asked for. Forcing
`Emulation.setDeviceMetricsOverride` through a CDP session does not fix it either, because
Playwright re-applies its own emulation around the screenshot. Launching the profile
(`launchPersistentContext`) instead of attaching restores all of it, which is why
`capture-profile.mjs` exists and `capture-attached.mjs` is superseded.

## Capturing the signed-in dashboard

The account is Google-federated and holds its session as AWS Cognito tokens in `localStorage` (no
cookies). The working method separates **sign-in** from **capture**:

```bash
# 1. Plain Chrome on a scratch profile, with the debug port. NOT Playwright.
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --user-data-dir=/tmp/sp-profile --remote-debugging-port=9222 \
  --no-first-run "https://shredpace.com/#signin"

# 2. Sign in with Google in that window, by hand. Then close it.

# 3. Launch that same profile and sweep.
node capture-profile.mjs <outDir> manifest-signedin.json --profile /tmp/sp-profile
```

Each step avoids a block that defeats the obvious approach:

| Approach | Outcome |
|---|---|
| Playwright signs in | Google refuses OAuth in an automation-launched browser |
| Email sign-in instead | Not applicable to a Google-federated account |
| Debug port on the **default** profile | Chrome 136+ refuses: *"requires a non-default data directory"* |
| Debug port on a **scratch** profile | Allowed |
| Handing the session to a local receiver | Chrome blocks HTTPS pages reaching `http://127.0.0.1` |
| **Attaching** to the signed-in browser | Captures at the window's own size and 1x (see trap 3) |
| **Launching** the signed-in profile | Full emulation; matches the public set |

**No session token is ever read, copied or written.** The session stays in the profile directory.
Delete that directory when the sweep is done. No token-handling script is committed here on
purpose: a tool whose job is moving auth tokens out of a browser does not belong in a repository.

### Detail routes need ids from the API, not the page

Most detail links in the DOM carry no `href`, so sweeping pages discovers only a few. Get the real
ids from the Shredpace MCP connector instead — `list_sessions`, `list_goals`, `list_habits`,
`list_benchmarks`, `search_metrics`, `list_pain`, `list_saved_meals` — and build a manifest of
`#session/{id}`, `#after/{id}`, `#goal/{id}`, `#habit/{id}`, `#metric/{id}`, `#ache/{area}/{side}`
and `#food/usual/{id}`. Keep that manifest out of the repository.

### What the sweep will not do

It only navigates and screenshots: it never clicks, types, submits or changes a setting. So the
Connect screen's key-creation flow is out of reach (reaching it creates an API key), and themes
other than the account's own are not switched.

## Note on phone layouts

An earlier note in `../review/handoff.md` records that the browser used "would not narrow below
desktop width", which is why 12 phone boards were left as reconstructions. That was a limitation of
that browser, not of the app: under device emulation the phone layouts render correctly, as every
`__phone__` image in the public set shows.
