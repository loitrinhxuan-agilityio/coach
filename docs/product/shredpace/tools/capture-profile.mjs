// Capture the signed-in dashboard by LAUNCHING a Chrome profile that is already
// signed in, rather than attaching to a running browser.
//
//   node capture-profile.mjs <outDir> <manifest.json> --profile <userDataDir>
//                            [--viewports desktop,phone] [--schemes dark,light]
//
// Why launch rather than attach: an attached real browser has no per-context
// deviceScaleFactor or isMobile, so viewport and pixel density cannot be
// emulated and captures come back at the window's own size and 1x. Launching
// the profile restores full emulation, so this output matches the public set.
//
// The person signs in beforehand, in a plain Chrome on this same profile
// (automation-launched browsers are refused by Google's sign-in). No token is
// read, copied or written: the session stays inside the profile directory.
//
// This script only navigates and screenshots. It never clicks, types, submits
// or changes a setting.

import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const CHROME = process.env.CHROME_BIN
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const outDir = path.resolve(process.argv[2]);
const manifest = JSON.parse(readFileSync(process.argv[3], 'utf8'));

const argOf = (flag, dflt) => {
  const i = process.argv.indexOf(flag);
  return i === -1 ? dflt : process.argv[i + 1];
};
const profileDir = path.resolve(argOf('--profile', './chrome-signin-profile'));
const schemes = argOf('--schemes', 'dark,light').split(',').filter(Boolean);
const wantViewports = argOf('--viewports', 'desktop,phone').split(',').filter(Boolean);
const settleMs = Number(argOf('--settle', '2200'));

const ALL_VIEWPORTS = {
  desktop: { name: 'desktop', width: 1440, height: 900, dsf: 2, mobile: false },
  tablet: { name: 'tablet', width: 834, height: 1112, dsf: 2, mobile: true },
  phone: { name: 'phone', width: 390, height: 844, dsf: 2, mobile: true },
};
const viewports = wantViewports.map(v => {
  if (!ALL_VIEWPORTS[v]) throw new Error(`unknown viewport: ${v}`);
  return ALL_VIEWPORTS[v];
});

const sleep = ms => new Promise(r => setTimeout(r, ms));
mkdirSync(outDir, { recursive: true });

const ID_ROUTE = /^#(session|goal|habit|benchmark|metric|ache|after|body\/scan|food\/usual|plan\/week)\/.+/;
const discovered = new Map();
const results = [];

async function sweep(vp, entries, counter) {
  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath: CHROME,
    headless: true,
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dsf,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    reducedMotion: 'reduce',
    args: ['--hide-scrollbars', '--disable-extensions'],
  });

  const page = context.pages()[0] || await context.newPage();

  try {
    // Confirm this profile is still signed in before capturing anything.
    await page.goto('https://shredpace.com/#today', { waitUntil: 'load', timeout: 45000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await sleep(settleMs);
    const check = await page.evaluate(() => ({
      chars: document.body ? document.body.innerText.length : 0,
      nav: !!document.querySelector('[href="#today"], [href="#sessions"], [href="#more"]'),
      signin: /sign in|continue with google/i.test(document.body ? document.body.innerText : ''),
    }));
    const signedIn = check.nav || (check.chars > 400 && !check.signin);
    console.log(`${vp.name}: ${signedIn ? 'signed in' : 'NOT SIGNED IN'} (${check.chars} chars, nav=${check.nav})`);
    if (!signedIn) throw new Error(`profile is not signed in at ${vp.name}`);

    for (const scheme of schemes) {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });

      for (const entry of entries) {
        const n = ++counter.n;
        const label = `${entry.slug}__${vp.name}__${scheme}`;
        const file = path.join(outDir, `${label}.png`);
        try {
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
            nav: !!document.querySelector('[href="#today"], [href="#sessions"], [href="#more"]'),
            hashLinks: [...new Set(
              [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')),
            )],
          }));

          for (const h of meta.hashLinks) if (ID_ROUTE.test(h)) discovered.set(h, true);

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
            signedIn: meta.nav,
            bytes: buf.length,
            sha256: createHash('sha256').update(buf).digest('hex'),
          });
          console.log(`[${n}] ${label}  ${px.w}x${px.h}px  ${(buf.length / 1024).toFixed(0)}KB  ${meta.chars} chars  "${meta.theme}"`);
        } catch (err) {
          const message = String((err && err.message) || err).split('\n')[0];
          results.push({ slug: entry.slug, viewport: vp.name, scheme, error: message });
          console.log(`[${n}] ${label}  FAILED: ${message}`);
        }
      }
    }
  } finally {
    await context.close();
  }
}

const counter = { n: 0 };

// Pass 1: the fixed routes.
for (const vp of viewports) await sweep(vp, manifest, counter);

// Pass 2: the id-bearing routes discovered while sweeping.
const extra = [...discovered.keys()].sort().map((h, i) => ({
  group: 'signedin-detail',
  slug: `d${String(i + 1).padStart(2, '0')}-${h.slice(1).replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 48)}`,
  url: `https://shredpace.com/${h}`,
}));

if (extra.length) {
  console.log(`\nDiscovered ${extra.length} id-bearing routes; capturing those.\n`);
  writeFileSync(path.join(outDir, 'discovered-routes.json'), JSON.stringify(extra, null, 2));
  for (const vp of viewports) await sweep(vp, extra, counter);
} else {
  console.log('\nNo id-bearing routes were linked with an href on the swept pages.');
}

writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(results, null, 2));
const ok = results.filter(r => !r.error);
const bad = results.filter(r => r.error);
console.log(`\n${ok.length} captured, ${bad.length} failed -> ${outDir}`);
for (const b of bad) console.log(`  FAILED ${b.slug} ${b.viewport} ${b.scheme}: ${b.error}`);
