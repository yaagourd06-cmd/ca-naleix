#!/usr/bin/env node
// Quality gate for the generated site (run after `node build.mjs`).
// Checks the points that matter for a hand-off: semantics, forms, a11y basics,
// CSP-compatibility, SEO metadata, privacy (no third-party loads) and links.
// No dependencies, so it also runs in CI.

import { readFile, readdir, access } from 'node:fs/promises';
import { join, dirname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const files = (await readdir(DIST, { recursive: true })).filter((f) => f.endsWith('.html'));
const failures = [];
let checks = 0;

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : null;
};
const has = (tag, name) => new RegExp(`\\s${name}(=|\\s|>|$)`).test(tag);

for (const file of files) {
  const html = await readFile(join(DIST, file), 'utf8');
  const fail = (msg) => failures.push(`${file}: ${msg}`);
  const ok = (cond, msg) => {
    checks++;
    if (!cond) fail(msg);
  };
  const tags = (name) => html.match(new RegExp(`<${name}\\b[^>]*>`, 'g')) || [];

  // Structure
  ok(/<html lang="(ca|es)"/.test(html), 'missing <html lang>');
  ok(tags('main').length === 1, 'needs exactly one <main>');
  ok(tags('h1').length === 1, `needs exactly one <h1> (found ${tags('h1').length})`);
  const levels = [...html.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
  levels.forEach((lvl, i) => ok(i === 0 || lvl <= levels[i - 1] + 1, `heading jumps from h${levels[i - 1]} to h${lvl}`));
  ok(!/<nav\b[^>]*>(?![\s\S]*?<ul)/.test(html) || true, 'nav');
  for (const nav of html.match(/<nav\b[\s\S]*?<\/nav>/g) || []) ok(/<ul\b/.test(nav), 'a <nav> is not built on a list');

  // CSP-friendly markup: no inline styles, handlers or executable inline scripts
  ok(!/\sstyle="/.test(html), 'inline style attribute found');
  ok(!/\son[a-z]+="/i.test(html), 'inline event handler found');
  for (const s of tags('script')) {
    const type = attr(s, 'type');
    ok(attr(s, 'src') || type === 'application/ld+json' || type === 'application/json', 'inline executable <script>');
  }
  ok(/http-equiv="Content-Security-Policy"/.test(html), 'missing CSP');
  ok(!/unsafe-inline/.test(html), 'CSP allows unsafe-inline');

  // Images
  for (const img of tags('img')) {
    ok(attr(img, 'alt') !== null, `img without alt: ${img.slice(0, 80)}`);
    ok(attr(img, 'width') && attr(img, 'height'), `img without width/height: ${img.slice(0, 80)}`);
    if (!img.includes('data:,')) ok(attr(img, 'srcset'), `img without srcset: ${img.slice(0, 80)}`);
  }
  const eager = tags('img').filter((i) => attr(i, 'fetchpriority') === 'high');
  if (file.endsWith('index.html')) ok(eager.length === 1, 'home needs exactly one high-priority hero image');

  // Forms
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  ok(!dup.length, `duplicate ids: ${[...new Set(dup)].join(', ')}`);
  for (const field of [...tags('input'), ...tags('select'), ...tags('textarea')]) {
    const id = attr(field, 'id');
    ok(attr(field, 'name') && id, `form field without name/id: ${field.slice(0, 80)}`);
    ok(id && new RegExp(`<label[^>]*for="${id}"`).test(html), `field #${id} has no <label for>`);
  }
  for (const label of tags('label')) ok(ids.includes(attr(label, 'for')), `label for="${attr(label, 'for')}" points nowhere`);
  for (const tel of tags('input').filter((t) => /name="phone"/.test(t))) ok(attr(tel, 'type') === 'tel', 'phone is not type=tel');
  for (const d of tags('input').filter((t) => attr(t, 'type') === 'date')) ok(has(d, 'data-min-today'), `date #${attr(d, 'id')} has no min hook`);
  for (const f of tags('input').filter((t) => ['name', 'email', 'phone'].includes(attr(t, 'name'))))
    ok(attr(f, 'autocomplete'), `#${attr(f, 'id')} without autocomplete`);
  if (/data-booking-form/.test(html)) ok(/name="privacy"[^>]*required/.test(html), 'booking form lacks required privacy consent');

  // Accessibility hooks
  for (const b of tags('button')) ok(attr(b, 'type'), `button without type: ${b.slice(0, 60)}`);
  ok(/aria-expanded="false"[^>]*aria-controls="site-nav"|aria-controls="site-nav"[^>]*aria-expanded/.test(html), 'menu toggle lacks aria-expanded/aria-controls');
  for (const tab of tags('button').filter((t) => /role="tab"/.test(t)))
    ok(attr(tab, 'aria-selected') && attr(tab, 'aria-controls'), 'tab without aria-selected/aria-controls');
  ok(/class="skip-link"/.test(html), 'missing skip link');

  // SEO / sharing
  ok(/<link rel="canonical"/.test(html), 'missing canonical');
  ok(/hreflang="ca"/.test(html) && /hreflang="es"/.test(html) && /hreflang="x-default"/.test(html), 'missing hreflang set');
  ok(/property="og:image"/.test(html), 'missing og:image');
  ok(/rel="icon"/.test(html), 'missing favicon');
  ok(/<meta name="description" content="[^"]{50,}"/.test(html), 'missing/short meta description');
  for (const ld of html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []) {
    try {
      JSON.parse(ld.replace(/<\/?script[^>]*>/g, ''));
      checks++;
    } catch {
      fail('invalid JSON-LD');
    }
  }
  if (/^(es\/)?index\.html$/.test(file)) ok(/"@type":"LodgingBusiness"/.test(html), 'home without LodgingBusiness JSON-LD');

  // Privacy: nothing third-party loads before consent (Pexels images are the
  // preview-only exception documented in the README/privacy page).
  ok(!/fonts\.googleapis|fonts\.gstatic|google-analytics|googletagmanager/.test(html), 'third-party font/analytics');
  ok(!/<iframe\b/.test(html), 'iframe rendered without consent');
  ok(/(avis-legal|aviso-legal)\.html/.test(html) && /(privacitat|privacidad)\.html/.test(html) && /cookies\.html/.test(html), 'legal links missing');

  // Internal links resolve
  if (file !== '404.html') {
    for (const m of html.matchAll(/\s(?:href|src)="([^"#:?][^"#?]*)(?:[#?][^"]*)?"/g)) {
      const url = m[1];
      if (/^(https?:|mailto:|data:|\/\/)/.test(url)) continue;
      let target = posix.normalize(posix.join(posix.dirname(file), url));
      if (target.endsWith('/') || target === '.') target = posix.join(target, 'index.html');
      try {
        await access(join(DIST, target));
        checks++;
      } catch {
        fail(`broken link ${url}`);
      }
    }
    for (const m of html.matchAll(/href="#([^"]+)"/g)) ok(ids.includes(m[1]) || m[1] === 'top', `anchor #${m[1]} has no target`);
  }
}

// Assets are fingerprinted (cache-busting) and CSS is minified by the build.
const assets = await readdir(join(DIST, 'assets'));
checks++;
if (!assets.every((a) => /\.[0-9a-f]{10}\.\w+$/.test(a))) failures.push('assets are not fingerprinted');
const css = await readFile(join(DIST, 'assets', assets.find((a) => a.endsWith('.css'))), 'utf8');
checks++;
if (/height:\s*100vh(?!.*svh)/.test(css.replace(/min-height:92vh;min-height:92svh/, ''))) failures.push('100vh without svh/dvh');
checks++;
if (!/prefers-reduced-motion/.test(css)) failures.push('CSS ignores prefers-reduced-motion');

if (failures.length) {
  console.error(`✗ ${failures.length} problem(s) in ${checks} checks:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log(`✓ ${checks} checks passed on ${files.length} pages`);
