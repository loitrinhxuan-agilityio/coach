// Build a capture manifest for every per-operation API reference page,
// taken from the published OpenAPI document.
import { writeFileSync } from 'node:fs';

const spec = await (await fetch('https://shredpace.com/api/openapi.json')).json();

const ops = [];
for (const [, methods] of Object.entries(spec.paths || {})) {
  for (const [method, op] of Object.entries(methods)) {
    if (op && op.operationId) ops.push({ id: op.operationId, method, summary: op.summary || null });
  }
}

// The docs site serves each operation under a HYPHENATED slug. The underscore
// form taken straight from operationId 302-redirects to /docs, which would make
// every capture an identical copy of the docs index.
const pad = String(ops.length).length;
const manifest = ops.map((op, i) => {
  const slug = op.id.replace(/_/g, '-');
  return {
    group: 'api',
    slug: `api-${String(i + 1).padStart(pad, '0')}-${slug}`,
    url: `https://shredpace.com/docs/api/${slug}`,
  };
});

// Verify every page is real: a redirect back to /docs means the slug is wrong.
console.log(`checking ${manifest.length} URLs...`);
const bad = [];
for (const entry of manifest) {
  const r = await fetch(entry.url, { redirect: 'manual' });
  if (r.status !== 200) bad.push({ ...entry, status: r.status, location: r.headers.get('location') });
}

writeFileSync('./manifest-api.json', JSON.stringify(manifest, null, 2));
console.log(`${manifest.length} API reference pages, ${manifest.length - bad.length} resolve directly`);
if (bad.length) {
  console.log(`${bad.length} do NOT resolve:`);
  for (const b of bad) console.log(`   ${b.status} -> ${b.location}   ${b.url}`);
} else {
  console.log('all verified, no redirects');
}
console.log(manifest.slice(0, 3).map(m => `  ${m.slug}  ${m.url}`).join('\n'));
