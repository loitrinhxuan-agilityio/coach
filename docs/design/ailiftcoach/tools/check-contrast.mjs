// Check every colour pair the design system actually uses, in every theme,
// against WCAG 2.1 contrast minimums.
//
//   node check-contrast.mjs [path/to/tokens.json]
//
// Exits non-zero if any pair fails, so it can gate a change to the palette.
//
// The pair list is written by hand on purpose: a token pair only matters if the
// interface really puts that foreground on that background. Add a row when you
// introduce a new combination; a token that never meets another is not a pair.

import { readFileSync } from 'node:fs';
import path from 'node:path';

const tokensPath = path.resolve(process.argv[2]
  || new URL('../system/tokens.json', import.meta.url).pathname);
const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));

const themes = tokens.color.themes.map(t => t.id);
const first = themes[0];

// name -> { theme: "#rrggbb" }
const byName = new Map();
for (const t of tokens.color.tokens) {
  const v = typeof t.value === 'string'
    ? Object.fromEntries(themes.map(th => [th, t.value]))   // one value = every theme
    : Object.fromEntries(themes.map(th => [th, t.value[th] ?? t.value[first]]));
  byName.set(t.name, v);
}

const srgb = hex => {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h.slice(0, 6);
  return [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16) / 255);
};
const luminance = hex => {
  const [r, g, b] = srgb(hex).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

// min 4.5 = body text · 3.0 = large text (24px+), graphics, borders, focus rings
const PAIRS = [
  // body text on every surface it sits on
  ['ink', 'surface-page', 4.5, 'body text on the page ground'],
  ['ink', 'surface-card', 4.5, 'body text on a card'],
  ['ink', 'surface-sunken', 4.5, 'text in a well (table head, code)'],
  ['ink', 'surface-raised', 4.5, 'text in a menu or popover'],

  ['ink-muted', 'surface-page', 4.5, 'labels and captions on the page'],
  ['ink-muted', 'surface-card', 4.5, 'labels and captions on a card'],
  ['ink-muted', 'surface-sunken', 4.5, 'column heads on a table head'],

  // interaction
  ['accent', 'surface-page', 4.5, 'a link on the page ground'],
  ['accent', 'surface-card', 4.5, 'a link on a card'],
  ['accent', 'accent-soft', 4.5, 'the selected nav row'],
  ['accent-ink', 'accent', 4.5, 'text on an accent fill'],
  ['accent', 'surface-card', 3.0, 'the focus ring'],

  // status pills: text on its own soft fill, and that fill readable on a card
  ['state-ok', 'state-ok-soft', 4.5, 'an ok pill'],
  ['state-ok', 'surface-card', 4.5, 'ok text directly on a card'],
  ['state-caution', 'state-caution-soft', 4.5, 'a caution pill'],
  ['state-caution', 'surface-card', 4.5, 'caution text directly on a card'],
  ['state-alert', 'state-alert-soft', 4.5, 'an alert pill'],
  ['state-alert', 'surface-card', 4.5, 'alert text directly on a card'],

  // the You said provenance chip
  ['series-2', 'series-2-soft', 4.5, 'the You said chip'],

  // data series as graphics on the card they are drawn on
  ['series-1', 'surface-card', 3.0, 'first data series'],
  ['series-2', 'surface-card', 3.0, 'second data series'],
  ['series-3', 'surface-card', 3.0, 'third data series'],
  ['series-4', 'surface-card', 3.0, 'fourth data series'],

  // Controls must be identifiable. Every control in this system carries a visible
  // label, so the label is what has to pass — not the hairline around it.
  ['accent', 'surface-sunken', 4.5, 'the Copy control label, in a command well'],
  ['ink-muted', 'surface-card', 4.5, 'a secondary control label (the date pager)'],
];

// Recorded, not silently skipped. Each of these was measured, found below the
// number you might reach for, and judged exempt for a stated reason.
const ACCEPTED = [
  ['ink-faint', 'surface-card',
    'placeholder and disabled text only; WCAG exempts inactive controls'],

  // WCAG 1.4.11 covers visual information REQUIRED to identify a component or
  // understand content. These rules identify nothing: remove every one of them
  // and the interface still reads, because text and spacing carry the structure.
  // They are deliberately quiet — "rules over boxes" is the system's own rule,
  // and a hairline at 3:1 would read as a border and rebuild the boxes.
  ['line-strong', 'surface-card',
    'a decorative rule: separates, identifies nothing, exempt from 1.4.11'],
  ['line-strong', 'surface-page',
    'a decorative card edge: the surface change already separates them'],
  ['line', 'surface-card',
    'the default hairline between rows: decorative'],
];

let failures = 0;
let checked = 0;

for (const theme of themes) {
  console.log(`\n${theme.toUpperCase()}`);
  for (const [fg, bg, min, why] of PAIRS) {
    const f = byName.get(fg), b = byName.get(bg);
    if (!f || !b) {
      console.log(`  MISSING TOKEN  ${fg} on ${bg}`);
      failures++;
      continue;
    }
    const r = ratio(f[theme], b[theme]);
    const ok = r >= min;
    checked++;
    if (!ok) failures++;
    console.log(
      `  ${ok ? 'pass' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  (needs ${min})  ` +
      `${fg} on ${bg}  — ${why}`,
    );
  }
}

console.log('\nAccepted exceptions');
for (const [fg, bg, why] of ACCEPTED) {
  const r = ratio(byName.get(fg)[first], byName.get(bg)[first]);
  console.log(`  ${r.toFixed(2)}:1  ${fg} on ${bg} — ${why}`);
}

console.log(`\n${checked} pairs checked across ${themes.length} themes, ${failures} failing`);
process.exit(failures ? 1 : 0);
