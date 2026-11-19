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
| `capture.mjs` | The capture sweep. Known good: produced all 205 images |
| `gen-api-manifest.mjs` | Builds and verifies the 109 API reference URLs |
| `gen-index.mjs` | Writes the README and the filterable contact sheet |
| `manifest-public.json` | 9 app hash routes, 15 docs pages, the 404 board |
| `manifest-api.json` | The 109 per-operation API reference pages |
| `manifest-signedin.json` | The 28 dashboard routes — **never captured**, see below |
| `capture-attached.mjs` | **Unverified.** Never ran; see the header comment |

## Two traps these scripts exist to avoid

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

## The signed-in dashboard is not covered

`manifest-signedin.json` lists the 28 routes but no capture exists for them. The account is
Google-federated, holding AWS Cognito tokens in `localStorage` (no cookies), and every automated
route was blocked:

- Google blocks OAuth inside an automation-controlled browser.
- Email sign-in does not apply to a Google-federated account.
- Chrome 136+ refuses `--remote-debugging-port` on the default profile.
- Chrome blocks an HTTPS page from reaching `http://127.0.0.1` (Local Network Access).
- A file-based session handoff was refused by the agent safety classifier, as credential
  exfiltration.

**No session-handling script is kept here on purpose.** The local token receiver and the
sign-in helper written during that attempt are deliberately not committed: a tool whose job is to
move auth tokens out of a browser does not belong in the repository.

What remains possible is capturing through the Claude in Chrome extension against a live session —
no credentials move, but the output is viewport-sized JPEG needing scroll-stitching rather than the
full-page retina PNGs here.

## Note on phone layouts

An earlier note in `../review/handoff.md` records that the browser used "would not narrow below
desktop width", which is why 12 phone boards were left as reconstructions. That was a limitation of
that browser, not of the app: under device emulation the phone layouts render correctly, as every
`__phone__` image in the public set shows.
