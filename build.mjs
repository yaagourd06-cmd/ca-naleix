#!/usr/bin/env node
// Static site generator for Ca n'Aleix.
// Content lives in /content (JSON), markup in /src/templates, assets in /src/assets.
// Output goes to /dist, ready for GitHub Pages. No dependencies: `node build.mjs`.

import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, extname, basename, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { layout } from './src/templates/layout.mjs';
import { home } from './src/templates/home.mjs';
import { legal } from './src/templates/legal.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const readJson = async (p) => JSON.parse(await readFile(join(ROOT, p), 'utf8'));

const site = await readJson('content/site.json');
if (process.env.SITE_URL) site.siteUrl = process.env.SITE_URL.replace(/\/?$/, '/');
const strings = Object.fromEntries(await Promise.all(site.langs.map(async (l) => [l, await readJson(`content/${l}.json`)])));

// ---------------------------------------------------------------- validation
// Fail the build if a language is missing a string that the data references.
function validate() {
  const errors = [];
  for (const [lang, t] of Object.entries(strings)) {
    const need = (cond, msg) => cond || errors.push(`[${lang}] ${msg}`);
    site.amenities.forEach((a) => need(t.amenities[a], `amenity "${a}" has no label`));
    site.places.forEach((p) => need(t.surroundings.places[p.id], `place "${p.id}" has no text`));
    site.places.forEach((p) => need(t.surroundings.tabs[p.tab], `tab "${p.tab}" has no label`));
    site.gallery.forEach((g) => need(t.gallery.alts[g], `gallery image "${g}" has no alt text`));
    site.reviews.forEach((r) => need(t.reviews.items[r.id], `review "${r.id}" has no text`));
    site.houses.forEach((h) => need(t.houses.items[h.id] && t.booking.houseOptions[h.id], `house "${h.id}" is missing texts`));
    site.gallery.concat(site.houses.map((h) => h.image)).forEach((k) => need(site.images[k], `image "${k}" not in catalogue`));
  }
  if (errors.length) {
    console.error(`Content errors:\n  ${errors.join('\n  ')}`);
    process.exit(1);
  }
}
validate();

// -------------------------------------------------------------------- assets
const hash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 10);

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,>])\s*/g, '$1')
    .replace(/:\s+/g, ':')
    .replace(/;}/g, '}')
    .trim();
}

const ASSETS = [
  { src: 'src/assets/css/main.css', transform: minifyCss },
  { src: 'src/assets/js/boot.js' },
  { src: 'src/assets/js/main.js' },
  { src: 'src/assets/img/favicon.svg' },
  { src: 'src/assets/img/icons.svg' },
];

const manifest = {};
await rm(DIST, { recursive: true, force: true });
await mkdir(join(DIST, 'assets'), { recursive: true });
for (const a of ASSETS) {
  let body = await readFile(join(ROOT, a.src), 'utf8');
  if (a.transform) body = a.transform(body);
  const name = basename(a.src);
  const ext = extname(name);
  const hashed = `${basename(name, ext)}.${hash(body)}${ext}`;
  manifest[name] = hashed;
  await writeFile(join(DIST, 'assets', hashed), body);
}

// --------------------------------------------------------------------- pages
const PAGES = [
  { id: 'home', render: home },
  { id: 'legal', render: (ctx) => legal(ctx, 'legal') },
  { id: 'privacy', render: (ctx) => legal(ctx, 'privacy') },
  { id: 'cookies', render: (ctx) => legal(ctx, 'cookies') },
];

const outFile = (path) => (path === '' || path.endsWith('/') ? `${path}index.html` : path);

async function renderPage(page, lang, { rootOverride, file: forcedFile } = {}) {
  const t = strings[lang];
  const file = forcedFile || outFile(t.paths[page.id]);
  const depth = posix.dirname(file) === '.' ? 0 : posix.dirname(file).split('/').length;
  // The 404 page can be served from any depth, so it uses absolute paths.
  const root = rootOverride ?? '../'.repeat(depth);
  const ctx = {
    site,
    t,
    lang,
    page: page.pageId || page.id,
    isHome: page.id === 'home',
    noindex: Boolean(page.noindex),
    year: new Date().getFullYear(),
    asset: (name) => `${root}assets/${manifest[name]}`,
    pageUrl: (id, l) => `${root}${strings[l].paths[id]}` || './',
    absUrl: (id, l) => `${site.siteUrl}${strings[l].paths[id]}`,
  };
  const html = layout(ctx, page.render(ctx));
  await mkdir(dirname(join(DIST, file)), { recursive: true });
  await writeFile(join(DIST, file), html);
  return file;
}

const written = [];
for (const lang of site.langs) for (const page of PAGES) written.push(await renderPage(page, lang));

// ------------------------------------------------------------ crawler files
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${PAGES.flatMap((p) =>
  site.langs.map(
    (l) => `  <url>
    <loc>${site.siteUrl}${strings[l].paths[p.id]}</loc>
${site.langs.map((x) => `    <xhtml:link rel="alternate" hreflang="${x}" href="${site.siteUrl}${strings[x].paths[p.id]}"/>`).join('\n')}
  </url>`
  )
).join('\n')}
</urlset>
`;
await writeFile(join(DIST, 'sitemap.xml'), sitemap);
await writeFile(
  join(DIST, 'robots.txt'),
  site.indexable ? `User-agent: *\nAllow: /\nSitemap: ${site.siteUrl}sitemap.xml\n` : 'User-agent: *\nDisallow: /\n'
);
await writeFile(join(DIST, '.nojekyll'), '');

// 404: served by GitHub Pages at any URL depth, so links are absolute.
const notFoundPage = {
  id: 'notfound',
  pageId: 'home',
  noindex: true,
  render: (ctx) => ({
    title: `404 · ${site.name}`,
    description: "Aquesta pàgina no existeix a la web de Ca n'Aleix, casa rural a Verdú. · Esta página no existe.",
    body: `<section class="section legal"><div class="wrap wrap--narrow">
<h1 class="section-title">404</h1>
<p class="prose">Aquesta pàgina no existeix. · Esta página no existe.</p>
<p><a class="link-arrow" href="${ctx.pageUrl('home', 'ca')}">${site.name}</a></p>
</div></section>`,
  }),
};
await renderPage(notFoundPage, site.defaultLang, { rootOverride: new URL(site.siteUrl).pathname, file: '404.html' });

const files = await readdir(DIST, { recursive: true });
console.log(`Built ${written.length} pages + ${Object.keys(manifest).length} assets → dist/ (${files.length} files)`);
