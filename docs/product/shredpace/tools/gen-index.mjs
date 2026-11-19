// Build a README and a browsable contact sheet over the captured screenshots.
//
//   node gen-index.mjs <screenshotsRoot>
//
// Reads each subfolder's index.json (written by capture2.mjs) and emits
// README.md plus contact-sheet.html next to them.

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2]);

const folders = readdirSync(root)
  .filter(f => statSync(path.join(root, f)).isDirectory())
  .filter(f => existsSync(path.join(root, f, 'index.json')))
  .sort();

const sets = folders.map(folder => ({
  folder,
  rows: JSON.parse(readFileSync(path.join(root, folder, 'index.json'), 'utf8')),
}));

const human = n => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${(n / 1024).toFixed(0)} KB`);

// ------------------------------------------------------------------ README

let md = `# ShredPace screen captures\n\n`;
md += `Full-page screenshots of <https://shredpace.com>, captured ${new Date().toISOString().slice(0, 10)}.\n\n`;
md += `This folder is **gitignored** (see the repository \`.gitignore\`): the images stay on the capturing\n`;
md += `machine and are never committed.\n\n`;

md += `## What is here\n\n`;
md += `| Set | Pages | Images | Size | Viewports | Themes |\n|---|---|---|---|---|---|\n`;
for (const { folder, rows } of sets) {
  const ok = rows.filter(r => !r.error);
  const pages = new Set(ok.map(r => r.slug)).size;
  const bytes = ok.reduce((a, r) => a + (r.bytes || 0), 0);
  const vps = [...new Set(ok.map(r => r.viewport))].join(', ');
  const ths = [...new Set(ok.map(r => r.scheme))].join(', ');
  md += `| \`${folder}/\` | ${pages} | ${ok.length} | ${human(bytes)} | ${vps} | ${ths} |\n`;
}

const allRows = sets.flatMap(s => s.rows);
const failed = allRows.filter(r => r.error);
md += `\n**${allRows.filter(r => !r.error).length} images in total**`;
md += failed.length ? `, ${failed.length} failed.\n\n` : `, none failed.\n\n`;

md += `## Naming\n\n`;
md += `\`{slug}__{viewport}__{theme}.png\` — for example \`01-landing__phone__dark.png\`.\n\n`;
md += `Viewports are desktop 1440x900 and phone 390x844, both captured at a device scale factor of 2,\n`;
md += `so a phone image is 780 px wide. Every image is the **full scrollable page**, not just the viewport.\n\n`;

md += `## Page list\n\n`;
for (const { folder, rows } of sets) {
  md += `### \`${folder}/\`\n\n`;
  md += `| Slug | Page | URL | Height |\n|---|---|---|---|\n`;
  const seen = new Set();
  for (const r of rows) {
    if (r.error || seen.has(r.slug)) continue;
    seen.add(r.slug);
    const url = (r.resolved || r.requested || '').replace('https://shredpace.com', '');
    md += `| \`${r.slug}\` | ${(r.title || '').replace(/\|/g, '\\|')} | \`${url}\` | ${r.pageHeight}px |\n`;
  }
  md += `\n`;
}

if (failed.length) {
  md += `## Failures\n\n`;
  for (const f of failed) md += `- \`${f.slug}\` ${f.viewport}/${f.scheme}: ${f.error}\n`;
  md += `\n`;
}

md += `## How the signed-in sets were captured\n\n`;
md += `The account signs in through Google and holds its session as AWS Cognito tokens in\n`;
md += `localStorage (no cookies), which defeats the obvious approaches. What works is splitting\n`;
md += `sign-in from capture:\n\n`;
md += `1. Launch **plain Chrome** on a scratch \`--user-data-dir\`, with \`--remote-debugging-port\`.\n`;
md += `2. The person signs in with Google themselves, in that window.\n`;
md += `3. Close it, then let **Playwright launch that same profile** and sweep.\n\n`;
md += `Both halves matter, and each avoids a different block:\n\n`;
md += `| Approach | Outcome |\n|---|---|\n`;
md += `| Playwright signs in | Google refuses OAuth in an automation-launched browser |\n`;
md += `| Email sign-in instead | Not applicable: the account is Google-federated |\n`;
md += `| Debug port on the **default** profile | Chrome 136+ refuses: *"requires a non-default data directory"* |\n`;
md += `| Debug port on a **scratch** profile | **Allowed** |\n`;
md += `| *Attaching* to the signed-in browser | Works, but an attached browser has no per-context\n`;
md += `  deviceScaleFactor or isMobile, so captures come back at the window's own size and 1x |\n`;
md += `| *Launching* the signed-in profile | **Full emulation**: 2x, exact viewports, phone layouts |\n\n`;
md += `**No session token was ever read, copied or written.** The session stays inside the profile\n`;
md += `directory, which is deleted after the sweep.\n\n`;
md += `Phone layouts render correctly throughout, so an earlier note that a browser "would not narrow\n`;
md += `below desktop width" — which left 12 phone boards as reconstructions — is not a real constraint.\n\n`;

md += `## Still not captured\n\n`;
md += `- \`#benchmark/{id}\` — the account has **no benchmarks**, so the screen has nothing to render.\n`;
md += `- The **Free-plan locked** Coach and Programs screens: the account is Pro.\n`;
md += `- **Checkout, payment and card-failure** screens.\n`;
md += `- The connector **consent page**, and the Connect screen's key-creation flow: reaching it means\n`;
md += `  clicking "Add another agent", which creates an API key. The sweep never clicks.\n`;
md += `- Themes other than **Studio**: switching theme would change the account's own setting.\n`;
md += `- A brand-new account's first-run state.\n\n`;

md += `## Reproducing\n\n`;
md += `The capture scripts drive the installed Google Chrome through \`playwright-core\`:\n\n`;
md += '```bash\n';
md += `node capture2.mjs <outDir> <manifest.json> --viewports desktop,phone --schemes dark,light\n`;
md += '```\n\n';
md += `Two things the scripts deliberately handle:\n\n`;
md += `- **Full-page capture uses Playwright, not raw CDP.** Driving \`Page.captureScreenshot\` with\n`;
md += `  \`captureBeyondViewport\` repeats a band of the document on tall pages, which silently produced\n`;
md += `  a landing-page image containing the hero section twice.\n`;
md += `- **API reference slugs are hyphenated.** \`/docs/api/{operationId}\` taken straight from the\n`;
md += `  OpenAPI document uses underscores and 302-redirects to \`/docs\`, so every capture would have\n`;
md += `  been an identical copy of the docs index. The real pages are \`/docs/api/get-account\` etc.\n`;

writeFileSync(path.join(root, 'README.md'), md);

// ------------------------------------------------------------ contact sheet

let html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ShredPace captures</title>
<style>
:root{color-scheme:dark light;--bg:#101014;--fg:#f4f4f5;--muted:#a1a1aa;--line:#2a2a31;--accent:#ff5b1f}
@media (prefers-color-scheme:light){:root{--bg:#faf9f7;--fg:#1c1917;--muted:#57534e;--line:#e0dcd5}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 ui-sans-serif,-apple-system,system-ui,sans-serif}
header{padding:28px max(16px,4vw) 12px;border-bottom:1px solid var(--line)}
h1{margin:0 0 6px;font-size:26px}
.sub{color:var(--muted)}
nav{padding:12px max(16px,4vw);border-bottom:1px solid var(--line);display:flex;gap:16px;flex-wrap:wrap}
nav button{background:none;border:1px solid var(--line);color:var(--fg);padding:6px 14px;border-radius:999px;cursor:pointer;font:inherit}
nav button[aria-pressed=true]{background:var(--accent);border-color:var(--accent);color:#0b0b0c}
section{padding:24px max(16px,4vw)}
h2{font-size:18px;margin:0 0 14px;color:var(--muted);font-weight:600}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:18px}
figure{margin:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#0000000d}
figure a{display:block;max-height:300px;overflow:hidden}
figure img{width:100%;display:block}
figcaption{padding:8px 10px;font-size:12px;color:var(--muted);border-top:1px solid var(--line);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
figcaption b{color:var(--fg);font-weight:600}
</style></head><body>
<header><h1>ShredPace captures</h1>
<div class="sub">${allRows.filter(r => !r.error).length} full-page screenshots &middot; ${new Date().toISOString().slice(0, 10)}</div></header>
<nav id="filters"></nav>
`;

for (const { folder, rows } of sets) {
  html += `<section data-folder="${folder}"><h2>${folder}</h2><div class="grid">\n`;
  for (const r of rows) {
    if (r.error) continue;
    html += `<figure data-vp="${r.viewport}" data-theme="${r.scheme}">`
      + `<a href="${folder}/${r.file}" target="_blank" rel="noopener">`
      + `<img loading="lazy" src="${folder}/${r.file}" alt="${(r.title || r.slug).replace(/"/g, '&quot;')}"></a>`
      + `<figcaption><b>${r.slug}</b><br>${r.viewport} &middot; ${r.scheme} &middot; ${r.pageHeight}px</figcaption>`
      + `</figure>\n`;
  }
  html += `</div></section>\n`;
}

html += `<script>
const sheet = document.getElementById('filters');
const state = { viewport: 'all', theme: 'all' };
const groups = { viewport: ['all','desktop','phone'], theme: ['all','dark','light'] };
for (const [key, vals] of Object.entries(groups)) {
  for (const v of vals) {
    const b = document.createElement('button');
    b.textContent = key + ': ' + v;
    b.setAttribute('aria-pressed', String(state[key] === v));
    b.onclick = () => {
      state[key] = v;
      for (const other of sheet.querySelectorAll('button')) {
        const [k, val] = other.textContent.split(': ');
        other.setAttribute('aria-pressed', String(state[k] === val));
      }
      for (const f of document.querySelectorAll('figure')) {
        const okVp = state.viewport === 'all' || f.dataset.vp === state.viewport;
        const okTh = state.theme === 'all' || f.dataset.theme === state.theme;
        f.style.display = okVp && okTh ? '' : 'none';
      }
    };
    sheet.appendChild(b);
  }
}
</script></body></html>`;

writeFileSync(path.join(root, 'contact-sheet.html'), html);

console.log(`README.md and contact-sheet.html written to ${root}`);
for (const { folder, rows } of sets) {
  console.log(`  ${folder}: ${rows.filter(r => !r.error).length} images`);
}
