// Audit the RENDERED pages, not the token file: for every element that paints
// text, read its computed colour and the background it actually sits on, and
// check the contrast. Run in both themes.
//
//   node audit-rendered.mjs <prototypes dir> [--schemes light,dark]
//
// check-contrast.mjs proves the palette is sound in the abstract. This proves
// the pages use it correctly — it catches a literal colour that only reads in
// one theme, a token defined only inside a [data-theme] block, and text placed
// on a surface nobody checked it against.
//
// Exits non-zero on any failure.

import { chromium } from 'playwright-core';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const CHROME = process.env.CHROME_BIN
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const dir = path.resolve(process.argv[2] || new URL('../prototypes', import.meta.url).pathname);
const argOf = (f, d) => { const i = process.argv.indexOf(f); return i === -1 ? d : process.argv[i + 1]; };
const schemes = argOf('--schemes', 'light,dark').split(',').filter(Boolean);

// Every view, including the hash-routed ones, so nothing hides behind a picker.
// The hashes are read out of each file's own `data-view` attributes rather than
// listed here, so a new screen is audited the moment it exists.
const VIEWS = [];
for (const f of readdirSync(dir).filter(x => x.endsWith('.html')).sort()) {
  const url = 'file://' + path.join(dir, f);
  const src = readFileSync(path.join(dir, f), 'utf8');
  const hashes = [...new Set([...src.matchAll(/\bdata-view="([^"]+)"/g)].map(m => m[1]))];
  if (hashes.length > 1) for (const h of hashes) VIEWS.push([`${f}#${h}`, `${url}#${h}`]);
  else VIEWS.push([f, url]);
}

const PROBE = () => {
  const px = s => parseFloat(s) || 0;
  const parse = s => {
    const m = /rgba?\(([^)]+)\)/.exec(s || '');
    if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = c => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const ratio = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };

  // The background an element's text actually lands on: walk up, compositing
  // any translucent layers, until something opaque.
  const effectiveBg = el => {
    const stack = [];
    let n = el;
    while (n && n !== document.documentElement.parentNode) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) { stack.push(c); if (c.a >= 0.999) break; }
      n = n.parentElement;
    }
    let base = parse(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
    return base;
  };

  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const direct = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!direct) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;            // not painted
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || px(cs.opacity) < 0.1) continue;

    const fgRaw = parse(cs.color);
    if (!fgRaw) continue;
    const bg = effectiveBg(el);
    const fg = fgRaw.a < 0.999 ? over(fgRaw, bg) : fgRaw;

    const size = px(cs.fontSize);
    const weight = parseInt(cs.fontWeight, 10) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const min = large ? 3 : 4.5;
    const got = ratio(fg, bg);
    if (got + 0.005 < min) {
      out.push({
        text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 46),
        cls: (el.className && el.className.toString().slice(0, 40)) || el.tagName.toLowerCase(),
        size: Math.round(size * 10) / 10, weight,
        ratio: Math.round(got * 100) / 100, min,
        fg: cs.color, bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
      });
    }
  }
  return out;
};

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] });
let failures = 0, screens = 0;

try {
  for (const scheme of schemes) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    console.log(`\n=== ${scheme.toUpperCase()} ===`);

    for (const [name, url] of VIEWS) {
      await page.goto('about:blank');
      await page.goto(url, { waitUntil: 'load', timeout: 45000 });
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await page.evaluate(() => (document.fonts ? document.fonts.ready : null)).catch(() => {});
      await new Promise(r => setTimeout(r, 700));

      const bad = await page.evaluate(PROBE);
      screens++;
      if (!bad.length) { console.log(`  ok    ${name}`); continue; }
      failures += bad.length;
      console.log(`  FAIL  ${name}  (${bad.length})`);
      for (const b of bad.slice(0, 8)) {
        console.log(`          ${b.ratio}:1 needs ${b.min}  ${b.size}px/${b.weight}  .${b.cls}`);
        console.log(`          "${b.text}"   ${b.fg} on ${b.bg}`);
      }
      if (bad.length > 8) console.log(`          … and ${bad.length - 8} more`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(`\n${screens} screen renders audited, ${failures} text elements below contrast`);
process.exit(failures ? 1 : 0);
