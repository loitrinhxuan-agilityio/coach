# Evidence (not tracked in git)

Unmodified captures from <https://shredpace.com>, taken 2026-11-17 and 2026-11-18. The files are the
publisher's own material (agent guide, 123 docs pages, OpenAPI spec, minified client bundle, UI strings), so
they are kept on the machine that captured them and are listed in the repository's `.gitignore` rather than
published with it.

Everything under `../spec/`, `../observations/` and `../review/` was written from these files and quotes them
sparingly. Links from those notes into `evidence/` are dead on a fresh clone until the files are re-fetched.

## Re-fetching

| File | Source |
|---|---|
| `openapi.json` | `GET https://shredpace.com/api/openapi.json` (186 KB, OpenAPI 3.1) |
| `llms.txt` | `GET https://shredpace.com/llms.txt` |
| `skill.md` | `GET https://shredpace.com/api/skill.md` (the full agent guide, no key needed) |
| `changelog.md` | `GET https://shredpace.com/docs/changelog.md` |
| `docs/` | `GET https://shredpace.com/docs/<page>.md` for the 123 pages (109 are one reference page per API operation) |
| `index.html`, `manifest.webmanifest`, `fonts.css`, `theme-boot.js`, `router.min.js`, `themes.json`, `ui-strings.txt` | the public SPA shell and its client bundle; `ui-strings.txt` and `themes.json` were extracted from the bundle |
| `oauth-protected-resource-mcp.json` | `GET https://shredpace.com/.well-known/oauth-protected-resource/mcp` |
| `board-screen-map.md` | derived by us from the router; see `../spec/screens-and-routes.md` |

The captured `openapi.json` and `llms.txt` were checked against the live site on 2026-11-18 and matched
(sha256). The live site changes, so a fresh fetch may differ.
