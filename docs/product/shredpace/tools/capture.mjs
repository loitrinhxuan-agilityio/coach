// Full-page screenshot sweep of a site, across viewports and colour schemes.
//
//   node capture2.mjs <outDir> <manifest.json> [--schemes dark,light]
//                     [--viewports desktop,phone] [--settle 1200]
//                     [--storage storageState.json]
//
// manifest.json: [{ "group": "app", "slug": "landing", "url": "https://…/#landing" }, ...]
//
// Uses playwright-core driving the installed Google Chrome, so no browser
// download is needed. Playwright's fullPage screenshot is used because raw CDP
// captureBeyondViewport repeats a band of the document on very tall pages.

import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
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
const schemes = argOf('--schemes', 'dark,light').split(',').filter(Boolean);
const wantViewports = argOf('--viewports', 'desktop,phone').split(',').filter(Boolean);
const settleMs = Number(argOf('--settle', '1200'));
const storagePath = argOf('--storage', null);

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

const results = [];
const total = manifest.length * viewports.length * schemes.length;
let n = 0;

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--disable-extensions'],
});

try {
  for (const vp of viewports) {
    for (const scheme of schemes) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.dsf,
        isMobile: vp.mobile,
        hasTouch: vp.mobile,
        colorScheme: scheme,
        reducedMotion: 'reduce',
        ...(storagePath && existsSync(storagePath) ? { storageState: storagePath } : {}),
      });
      const page = await context.newPage();

      for (const entry of manifest) {
        n++;
        const label = `${entry.slug}__${vp.name}__${scheme}`;
        const file = path.join(outDir, `${label}.png`);
        try {
          // A goto that differs only by hash does not reload, so reset first.
          await page.goto('about:blank');
          const resp = await page.goto(entry.url, { waitUntil: 'load', timeout: 45000 });
          await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
          await page.evaluate(() => (document.fonts ? document.fonts.ready : null)).catch(() => {});
          await sleep(settleMs);

          const meta = await page.evaluate(() => ({
            title: document.title,
            url: location.href,
            h: Math.max(
              document.documentElement.scrollHeight,
              document.body ? document.body.scrollHeight : 0,
            ),
            h1: (document.querySelector('h1') || {}).innerText || null,
            chars: document.body ? document.body.innerText.length : 0,
            signedIn: !!document.querySelector('[href="#today"], [href="#more"]'),
          }));

          const buf = await page.screenshot({ fullPage: true, type: 'png', scale: 'device' });
          writeFileSync(file, buf);

          // Real PNG dimensions from the IHDR chunk, so a short capture is visible.
          const px = { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };

          results.push({
            slug: entry.slug,
            group: entry.group || null,
            requested: entry.url,
            resolved: meta.url,
            status: resp ? resp.status() : null,
            viewport: vp.name,
            scheme,
            file: path.basename(file),
            pageHeight: meta.h,
            pixelWidth: px.w,
            pixelHeight: px.h,
            title: meta.title,
            h1: meta.h1,
            textChars: meta.chars,
            signedIn: meta.signedIn,
            bytes: buf.length,
            sha256: createHash('sha256').update(buf).digest('hex'),
          });
          console.log(
            `[${n}/${total}] ${label}  ${px.w}x${px.h}px  ${(buf.length / 1024).toFixed(0)}KB  ` +
            `${resp ? resp.status() : '?'}  "${meta.title}"`,
          );
        } catch (err) {
          const message = String((err && err.message) || err).split('\n')[0];
          results.push({ slug: entry.slug, viewport: vp.name, scheme, error: message });
          console.log(`[${n}/${total}] ${label}  FAILED: ${message}`);
        }
      }

      await context.close();
    }
  }
} finally {
  await browser.close();
}

writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(results, null, 2));

const ok = results.filter(r => !r.error);
const bad = results.filter(r => r.error);
console.log(`\n${ok.length} captured, ${bad.length} failed -> ${outDir}`);
for (const b of bad) console.log(`  FAILED ${b.slug} ${b.viewport} ${b.scheme}: ${b.error}`);
