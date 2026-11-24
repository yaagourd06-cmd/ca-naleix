import { e, join, icon } from './lib.mjs';

const CSP = [
  "default-src 'self'",
  "img-src 'self' data:",
  "style-src 'self'",
  "script-src 'self'",
  'frame-src https://www.openstreetmap.org',
  "form-action 'self' mailto:",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

function head(ctx, { title, description, jsonLd }) {
  const { site, t, page } = ctx;
  const alternates = site.langs
    .map((l) => `<link rel="alternate" hreflang="${l}" href="${e(ctx.absUrl(page, l))}">`)
    .join('\n');
  const og = ctx.photos.facade;
  return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${e(CSP)}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${e(title)}</title>
<meta name="description" content="${e(description)}">
<meta name="robots" content="${site.indexable && !ctx.noindex ? 'index, follow' : 'noindex, nofollow'}">
<link rel="canonical" href="${e(ctx.absUrl(page, t.lang))}">
${alternates}
<link rel="alternate" hreflang="x-default" href="${e(ctx.absUrl(page, site.defaultLang))}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${e(site.name)}">
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(description)}">
<meta property="og:url" content="${e(ctx.absUrl(page, t.lang))}">
<meta property="og:locale" content="${e(t.locale)}">
<meta property="og:image" content="${e(ctx.photoAbs('facade', 1200))}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="${Math.round((1200 * og.height) / og.width)}">
<meta property="og:image:alt" content="${e(t.hero.imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#2b2a24">
<link rel="icon" href="${ctx.asset('favicon.svg')}" type="image/svg+xml">
<link rel="stylesheet" href="${ctx.asset('main.css')}">
<script src="${ctx.asset('boot.js')}"></script>
<script src="${ctx.asset('main.js')}" defer></script>
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : ''}
</head>`;
}

function header(ctx) {
  const { t } = ctx;
  const home = ctx.pageUrl('home', t.lang);
  const anchor = (href) => (ctx.isHome ? href : `${home}${href}`);
  const other = ctx.site.langs.find((l) => l !== t.lang);
  const links = t.nav
    .map((n) => `<li class="nav__item"><a class="nav__link" href="${e(anchor(n.href))}">${e(n.label)}</a></li>`)
    .join('\n');
  return `<header class="site-header" data-header>
  <div class="site-header__inner wrap">
    <a class="brand" href="${e(ctx.isHome ? '#top' : home)}">
      ${icon(ctx, 'logo', 'brand__mark')}
      <span class="brand__name">${e(ctx.site.name)}</span>
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" data-nav-toggle>
      <span class="nav-toggle__label" data-label-open="${e(t.ui.menu)}" data-label-close="${e(t.ui.closeMenu)}">${e(t.ui.menu)}</span>
      ${icon(ctx, 'menu', 'icon nav-toggle__icon')}
    </button>
    <nav class="nav" id="site-nav" aria-label="${e(t.ui.menu)}">
      <ul class="nav__list">
${links}
        <li class="nav__item nav__item--lang"><a class="nav__link nav__link--lang" href="${e(ctx.pageUrl(ctx.page, other))}" hreflang="${other}" lang="${other}" aria-label="${e(t.ui.langSwitchLabel)}">${e(t.ui.langSwitch)}</a></li>
        <li class="nav__item nav__item--cta"><a class="button button--small" href="${e(anchor('#reserva'))}">${e(t.navCta)}</a></li>
      </ul>
    </nav>
  </div>
</header>`;
}

function footer(ctx) {
  const { site, t } = ctx;
  const a = site.address;
  const regs = site.houses
    .map((h) => `<li>${e(t.houses.items[h.id].name)} · ${e(h.registration)}</li>`)
    .join('');
  return `<footer class="site-footer">
  <div class="wrap site-footer__grid">
    <div class="site-footer__brand">
      <p class="site-footer__name">${e(site.name)}</p>
      <p>${e(t.footer.tagline)}</p>
    </div>
    <address class="site-footer__address">
      ${e(a.street)}<br>${e(a.postalCode)} ${e(a.locality)} (${e(a.region)})<br>
      <a href="mailto:${e(site.email)}">${e(site.email)}</a>
    </address>
    <div>
      <p class="site-footer__label">${e(t.houses.registration)}</p>
      <ul class="site-footer__list">${regs}</ul>
    </div>
    <nav class="site-footer__legal" aria-label="${e(t.footer.legal)}">
      <ul class="site-footer__list">
        <li><a href="${e(ctx.pageUrl('legal', t.lang))}">${e(t.footer.legal)}</a></li>
        <li><a href="${e(ctx.pageUrl('privacy', t.lang))}">${e(t.footer.privacy)}</a></li>
        <li><a href="${e(ctx.pageUrl('cookies', t.lang))}">${e(t.footer.cookies)}</a></li>
      </ul>
    </nav>
  </div>
  <div class="wrap site-footer__bottom">
    <p>© ${ctx.year} ${e(site.name)}</p>
    <p>${e(t.footer.demo)}</p>
  </div>
</footer>`;
}

export function layout(ctx, { title, description, jsonLd, body }) {
  const { t } = ctx;
  return `<!doctype html>
<html lang="${t.lang}" class="no-js">
${head(ctx, { title, description, jsonLd })}
<body id="top">
<a class="skip-link" href="#main">${e(t.ui.skip)}</a>
<p class="demo-bar">${e(t.ui.demo)}</p>
${header(ctx)}
<main id="main" tabindex="-1">
${body}
</main>
${footer(ctx)}
</body>
</html>
`;
}

export { join };
