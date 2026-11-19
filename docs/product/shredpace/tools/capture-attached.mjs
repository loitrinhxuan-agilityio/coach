// STATUS: superseded by capture-profile.mjs. Kept for the attach pattern only.
//
// This does work: it attaches to a running, signed-in Chrome over its debugging
// port and captures. But an attached real browser has no per-context
// deviceScaleFactor or isMobile, so Playwright cannot emulate viewport or pixel
// density: captures come back at the window's own size and 1x (observed:
// 1425x1245 instead of 1440x900 at 2x), which does not match the rest of the set.
//
// capture-profile.mjs LAUNCHES the signed-in profile instead of attaching, which
// restores full emulation. Prefer it. See README.md, "How the signed-in sets
// were captured".
//
// Capture the signed-in ShredPace dashboard by attaching to an already-running
// Chrome over its local debugging port, so the existing session is reused and no
// token is ever read, copied or written to disk.
//
//   node capture-attached.mjs <outDir> <manifest.json> [--cdp http://127.0.0.1:9222]
//                             [--viewports desktop,phone] [--schemes dark,light]
//
// This script only navigates and screenshots. It never clicks, types, submits a
// form, or changes a setting, so nothing in the account is modified.

import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const outDir = path.resolve(process.argv[2]);
const manifest = JSON.parse(readFileSync(process.argv[3], 'utf8'));

const argOf = (flag, dflt) => {
  const i = process.argv.indexOf(flag);
  return i === -1 ? dflt : process.argv[i + 1];
};
const cdpUrl = argOf('--cdp', 'http://127.0.0.1:9222');
const schemes = argOf('--schemes', 'dark,light').split(',').filter(Boolean);
const wantViewports = argOf('--viewports', 'desktop,phone').split(',').filter(Boolean);
const settleMs = Number(argOf('--settle', '2000'));

const ALL_VIEWPORTS = {
  desktop: { name: 'desktop', width: 1440, height: 900, mobile: false },
  tablet: { name: 'tablet', width: 834, height: 1112, mobile: true },
  phone: { name: 'phone', width: 390, height: 844, mobile: true },
};
// An attached real browser has no per-context deviceScaleFactor, so it is
// forced through CDP to match the 2x captures of the public set.
const dsf = Number(argOf('--dsf', '2'));
const viewports = wantViewports.map(v => ALL_VIEWPORTS[v]);

const sleep = ms => new Promise(r => setTimeout(r, ms));

mkdirSync(outDir, { recursive: true });

// Hash routes that carry an id, discovered from the pages as they are captured.
const ID_ROUTE = /^#(session|goal|habit|benchmark|metric|ache|after|body\/scan|food\/usual|plan\/week)\/.+/;
const discovered = new Map();

const browser = await chromium.connectOverCDP(cdpUrl);
const context = browser.contexts()[0];
if (!context) throw new Error('No browser context found over CDP.');

const page = await context.newPage();
const cdpSession = await context.newCDPSession(page);
const results = [];

async function capture(entry, vp, scheme, n, total) {
  const label = `${entry.slug}__${vp.name}__${scheme}`;
  const file = path.join(outDir, `${label}.png`);
  try {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });

    // A goto differing only by hash does not reload, so reset in between.
    await page.goto('about:blank');
    await page.goto(entry.url, { waitUntil: 'load', timeout: 45000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.evaluate(() => (document.fonts ? document.fonts.ready : null)).catch(() => {});
    await sleep(settleMs);

    const meta = await page.evaluate(() => ({
      title: document.title,
      url: location.href,
      h: Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0),
      chars: document.body ? document.body.innerText.length : 0,
      theme: document.documentElement.getAttribute('data-theme') || null,
      signedIn: !!document.querySelector('[href="#today"], [href="#sessions"], [href="#more"]'),
      hashLinks: [...new Set(
        [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')),
      )],
    }));

    for (const h of meta.hashLinks) {
      if (ID_ROUTE.test(h) && !discovered.has(h)) discovered.set(h, true);
    }

    // Force the pixel density just before capture. Playwright still performs the
    // full-page capture itself, which is what keeps tall pages from repeating.
    await cdpSession.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: dsf,
      mobile: !!vp.mobile,
    });

    const buf = await page.screenshot({ fullPage: true, type: 'png', scale: 'device' });
    writeFileSync(file, buf);
    const px = { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };

    results.push({
      slug: entry.slug,
      group: entry.group || null,
      requested: entry.url,
      resolved: meta.url,
      viewport: vp.name,
      scheme,
      file: path.basename(file),
      pageHeight: meta.h,
      pixelWidth: px.w,
      pixelHeight: px.h,
      title: meta.title,
      appTheme: meta.theme,
      textChars: meta.chars,
      signedIn: meta.signedIn,
      bytes: buf.length,
      sha256: createHash('sha256').update(buf).digest('hex'),
    });
    console.log(
      `[${n}/${total}] ${label}  ${px.w}x${px.h}px  ${(buf.length / 1024).toFixed(0)}KB  ` +
      `${meta.signedIn ? 'signed-in' : 'SIGNED OUT'}  "${meta.title}"`,
    );
  } catch (err) {
    const message = String((err && err.message) || err).split('\n')[0];
    results.push({ slug: entry.slug, viewport: vp.name, scheme, error: message });
    console.log(`[${n}/${total}] ${label}  FAILED: ${message}`);
  }
}

try {
  // Confirm the attached profile really is signed in before sweeping.
  await page.goto('https://shredpace.com/#today', { waitUntil: 'load' });
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await sleep(settleMs);
  const check = await page.evaluate(() => ({
    signedIn: !!document.querySelector('[href="#today"], [href="#sessions"], [href="#more"]'),
    chars: document.body ? document.body.innerText.length : 0,
  }));
  if (!check.signedIn) {
    console.log('The attached browser is NOT signed in to ShredPace. Nothing captured.');
    process.exitCode = 3;
  } else {
    console.log(`Attached and signed in (${check.chars} chars on Today).\n`);

    const total = manifest.length * viewports.length * schemes.length;
    let n = 0;
    for (const vp of viewports) {
      for (const scheme of schemes) {
        for (const entry of manifest) await capture(entry, vp, scheme, ++n, total);
      }
    }

    // Second pass: the id-bearing routes found while sweeping.
    const extra = [...discovered.keys()].sort().map((h, i) => ({
      group: 'signedin-detail',
      slug: `d${String(i + 1).padStart(2, '0')}-${h.slice(1).replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 48)}`,
      url: `https://shredpace.com/${h}`,
    }));
    if (extra.length) {
      console.log(`\nDiscovered ${extra.length} id-bearing routes; capturing those.\n`);
      writeFileSync(path.join(outDir, 'discovered-routes.json'), JSON.stringify(extra, null, 2));
      const total2 = extra.length * viewports.length * schemes.length;
      let m = 0;
      for (const vp of viewports) {
        for (const scheme of schemes) {
          for (const entry of extra) await capture(entry, vp, scheme, ++m, total2);
        }
      }
    } else {
      console.log('\nNo id-bearing routes were linked with an href on the swept pages.');
    }
  }
} finally {
  await page.close().catch(() => {});
  // Disconnect only. The browser itself is the person's, and is left running.
  await browser.close().catch(() => {});
}

writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(results, null, 2));
const ok = results.filter(r => !r.error);
const bad = results.filter(r => r.error);
console.log(`\n${ok.length} captured, ${bad.length} failed -> ${outDir}`);
for (const b of bad) console.log(`  FAILED ${b.slug} ${b.viewport} ${b.scheme}: ${b.error}`);
