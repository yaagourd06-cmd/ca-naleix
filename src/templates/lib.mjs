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

/**
 * Responsive <img> served from the site's own optimised WebP files.
 * Width/height come from the real photo, so the browser reserves space (no CLS).
 * `max` caps the largest candidate for small slots (thumbnails, cards).
 */
export function img(ctx, key, opts) {
  const meta = ctx.photos[key];
  if (!meta) throw new Error(`Unknown photo "${key}" (add src/photos/${key}.jpg and run npm run images)`);
  const widths = meta.widths.filter((w) => w <= (opts.max || 1600));
  const base = widths.includes(800) ? 800 : widths[widths.length - 1];
  const h = Math.round((base * meta.height) / meta.width);
  const attrs = [
    `src="${e(ctx.photo(key, base))}"`,
    `srcset="${e(widths.map((w) => `${ctx.photo(key, w)} ${w}w`).join(', '))}"`,
    `sizes="${e(opts.sizes || '100vw')}"`,
    `width="${base}"`,
    `height="${h}"`,
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
