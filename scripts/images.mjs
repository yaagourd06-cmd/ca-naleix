#!/usr/bin/env node
// Turns the original photos in src/photos/<key>.jpg into optimised, responsive
// WebP files in src/assets/photos/ plus a manifest with their real sizes.
// Run it only when photos change (`npm run images`); the output is committed,
// so the normal build and CI need no image tooling.
//
// Requires sharp: `npm i -D sharp` (or a global install).

import { readdir, mkdir, rm, writeFile } from 'node:fs/promises';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require('sharp');
} catch {
  sharp = require(process.env.SHARP_PATH || '/opt/npm-tools/node_modules/sharp');
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src/photos');
const OUT = join(ROOT, 'src/assets/photos');

// Widths generated for every photo (never upscaled). The hero gets an extra size.
const WIDTHS = [480, 800, 1200, 1600];
const EXTRA = { facade: [2400] };
const QUALITY = 72;

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const manifest = {};
for (const file of (await readdir(SRC)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort()) {
  const key = basename(file, extname(file));
  const input = sharp(join(SRC, file)).rotate();
  const meta = await input.metadata();
  const widths = [...WIDTHS, ...(EXTRA[key] || [])].filter((w) => w <= meta.width);
  manifest[key] = { width: meta.width, height: meta.height, widths };
  for (const w of widths) {
    await input
      .clone()
      .resize({ width: w })
      .webp({ quality: QUALITY, effort: 5 })
      .toFile(join(OUT, `${key}-${w}.webp`));
  }
  console.log(`${key}: ${meta.width}×${meta.height} → ${widths.join(', ')}`);
}
await writeFile(join(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
