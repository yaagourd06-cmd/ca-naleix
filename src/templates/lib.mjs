// Small helpers shared by every template. No dependencies.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape text for HTML content and attributes. */
export const e = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

/** Replace {placeholders} in a string with values (escaped). */
export const fill = (text, vars = {}) =>
  e(text).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? e(vars[k]) : m));

/** Same as fill, but values are trusted HTML (already escaped by the caller). */
export const fillHtml = (text, vars = {}) =>
  e(text).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

/** Join template parts, dropping falsy values. */
export const join = (parts) => parts.filter(Boolean).join('\n');

const PEXELS = 'https://images.pexels.com/photos';

/** Build a cropped Pexels CDN URL at an exact size. */
export function pexelsUrl(id, w, h) {
  return `${PEXELS}/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;
}

/**
 * Responsive <img> with explicit width/height (no CLS), srcset and sizes.
 * `ratio` can override the catalogue ratio to crop differently per use.
 */
export function img(site, key, opts) {
  const meta = site.images[key];
  if (!meta) throw new Error(`Unknown image "${key}"`);
  const [rw, rh] = opts.ratio || meta.ratio;
  const widths = opts.widths || [480, 800, 1200];
  const h = (w) => Math.round((w * rh) / rw);
  const srcset = widths.map((w) => `${pexelsUrl(meta.pexels, w, h(w))} ${w}w`).join(', ');
  const base = widths[Math.min(1, widths.length - 1)];
  const attrs = [
    `src="${e(pexelsUrl(meta.pexels, base, h(base)))}"`,
    `srcset="${e(srcset)}"`,
    `sizes="${e(opts.sizes || '100vw')}"`,
    `width="${base}"`,
    `height="${h(base)}"`,
    `alt="${e(opts.alt)}"`,
    opts.eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"',
    'decoding="async"',
    opts.cls ? `class="${e(opts.cls)}"` : '',
  ];
  return `<img ${attrs.filter(Boolean).join(' ')}>`;
}

/** Inline reference to a symbol of the external SVG sprite. */
export const icon = (ctx, name, cls = 'icon') =>
  `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="${ctx.asset('icons.svg')}#i-${name}"></use></svg>`;
