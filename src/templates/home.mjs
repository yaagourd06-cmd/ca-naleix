import { e, fill, fillHtml, join, img, icon } from './lib.mjs';

const mainHouse = (site) => site.houses[0];

function hero(ctx) {
  const { site, t } = ctx;
  const q = t.hero.quick;
  return `<section class="hero" aria-labelledby="hero-title">
  <div class="hero__media">
    ${img(ctx, 'facade', {
      alt: t.hero.imageAlt,
      max: 2400,
      sizes: '100vw',
      eager: true,
      cls: 'hero__img',
    })}
  </div>
  <div class="hero__content wrap">
    <p class="eyebrow">${e(t.hero.eyebrow)}</p>
    <h1 class="hero__title" id="hero-title">${e(t.hero.title)}</h1>
    <p class="hero__lead">${e(t.hero.lead)}</p>
    <div class="hero__actions">
      <a class="button" href="#reserva">${e(t.hero.ctaPrimary)}</a>
      <a class="button button--ghost" href="#casa">${e(t.hero.ctaSecondary)}</a>
    </div>
  </div>
  <p class="seal" aria-label="${e(`${t.ui.from} ${site.price.from} € ${t.ui.perNight}`)}">
    <span class="seal__from" aria-hidden="true">${e(t.ui.from)}</span>
    <span class="seal__price" aria-hidden="true">${site.price.from}<span class="seal__currency">€</span></span>
    <span class="seal__unit" aria-hidden="true">${e(t.ui.perNight)}</span>
  </p>
  <form class="quick wrap" action="#reserva" method="get" aria-labelledby="quick-title">
    <h2 class="quick__title" id="quick-title">${e(q.title)}</h2>
    <div class="quick__field">
      <label for="quick-checkin">${e(q.checkIn)}</label>
      <input id="quick-checkin" name="checkin" type="date" data-min-today>
    </div>
    <div class="quick__field">
      <label for="quick-checkout">${e(q.checkOut)}</label>
      <input id="quick-checkout" name="checkout" type="date" data-min-today>
    </div>
    <div class="quick__field quick__field--small">
      <label for="quick-guests">${e(q.guests)}</label>
      <input id="quick-guests" name="guests" type="number" inputmode="numeric" min="1" max="16" value="2">
    </div>
    <button class="button quick__submit" type="submit">${e(q.submit)}</button>
  </form>
</section>`;
}

function house(ctx) {
  const { site, t } = ctx;
  const h = mainHouse(site);
  const stats = t.stats
    .map((s) => `<li class="stats__item"><span class="stats__value">${h[s.key]}</span><span class="stats__label">${e(s.label)}</span></li>`)
    .join('\n');
  const list = (items) => items.map((i) => `<li>${e(i)}</li>`).join('');
  const amenities = site.amenities
    .map((a) => `<li class="amenity">${icon(ctx, a, 'icon amenity__icon')}<span>${e(t.amenities[a])}</span></li>`)
    .join('\n');
  return `<section class="section house" id="casa" aria-labelledby="casa-title">
  <div class="wrap house__grid">
    <div class="house__text reveal">
      <p class="kicker">${e(t.house.kicker)}</p>
      <h2 class="section-title" id="casa-title">${e(t.house.title)}</h2>
      ${t.house.body.map((p) => `<p class="prose">${e(p)}</p>`).join('\n      ')}
      <ul class="stats" role="list">
${stats}
      </ul>
    </div>
    <div class="house__collage reveal" aria-hidden="false">
      ${img(ctx, 'door', { alt: t.house.imageAlt, sizes: '(min-width: 64em) 22vw, 45vw', cls: 'house__img house__img--tall' })}
      ${img(ctx, 'bedroom', { alt: t.gallery.alts.bedroom, sizes: '(min-width: 64em) 22vw, 45vw', cls: 'house__img house__img--offset' })}
    </div>
  </div>
  <div class="wrap house__details">
    <div class="detail-card reveal">
      <h3 class="detail-card__title">${e(t.house.roomsTitle)}</h3>
      <ul class="ticks">${list(t.house.rooms)}</ul>
    </div>
    <div class="detail-card reveal">
      <h3 class="detail-card__title">${e(t.house.spacesTitle)}</h3>
      <ul class="ticks">${list(t.house.spaces)}</ul>
    </div>
  </div>
  <div class="wrap">
    <h3 class="subhead reveal">${e(t.house.amenitiesTitle)}</h3>
    <ul class="amenities reveal" role="list">
${amenities}
    </ul>
  </div>
</section>`;
}

function history(ctx) {
  const { t } = ctx;
  const items = t.history.items
    .map(
      (it, i) => `<li class="timeline__item reveal">
        <p class="timeline__year" aria-hidden="true">${e(it.year)}</p>
        <h3 class="timeline__title"><span class="visually-hidden">${e(it.year)}. </span>${e(it.title)}</h3>
        <p class="timeline__text">${e(it.text)}</p>
        <span class="timeline__index" aria-hidden="true">0${i + 1}</span>
      </li>`
    )
    .join('\n');
  return `<section class="section section--dark history" id="historia" aria-labelledby="historia-title">
  <div class="wrap">
    <p class="kicker kicker--light">${e(t.history.kicker)}</p>
    <h2 class="section-title" id="historia-title">${e(t.history.title)}</h2>
    <ol class="timeline" role="list">
${items}
    </ol>
  </div>
</section>`;
}

function gallery(ctx) {
  const { site, t } = ctx;
  const total = site.gallery.length;
  const items = site.gallery
    .map((key, i) => {
      const big = ctx.photo(key, Math.max(...ctx.photos[key].widths));
      const alt = t.gallery.alts[key];
      return `<li class="gallery__item gallery__item--${key}">
        <a class="gallery__link" href="${e(big)}" data-lightbox="${i}" data-full="${e(big)}" data-alt="${e(alt)}">
          ${img(ctx, key, { alt, sizes: '(min-width: 64em) 33vw, (min-width: 40em) 50vw, 100vw', cls: 'gallery__img' })}
          <span class="visually-hidden">${e(t.ui.openPhoto)} · ${fill(t.ui.photoOf, { n: i + 1, total })}</span>
        </a>
      </li>`;
    })
    .join('\n');
  return `<section class="section gallery" id="galeria" aria-labelledby="galeria-title">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="kicker">${e(t.gallery.kicker)}</p>
      <h2 class="section-title" id="galeria-title">${e(t.gallery.title)}</h2>
      <p class="section-note">${e(t.gallery.note)}</p>
    </div>
    <ul class="gallery__grid" role="list">
${items}
    </ul>
  </div>
  <dialog class="lightbox" aria-label="${e(t.gallery.title)}" data-lightbox-dialog data-counter="${e(t.ui.photoOf)}">
    <figure class="lightbox__figure">
      <img class="lightbox__img" src="data:," alt="" width="1800" height="1200" data-lightbox-img>
      <figcaption class="lightbox__caption"><span data-lightbox-caption></span> <span class="lightbox__counter" data-lightbox-counter></span></figcaption>
    </figure>
    <button class="lightbox__btn lightbox__btn--prev" type="button" data-lightbox-prev aria-label="${e(t.ui.prev)}">${icon(ctx, 'chevron-left')}</button>
    <button class="lightbox__btn lightbox__btn--next" type="button" data-lightbox-next aria-label="${e(t.ui.next)}">${icon(ctx, 'chevron-right')}</button>
    <button class="lightbox__btn lightbox__btn--close" type="button" data-lightbox-close aria-label="${e(t.ui.close)}">${icon(ctx, 'close')}</button>
  </dialog>
</section>`;
}

function houses(ctx) {
  const { site, t } = ctx;
  const cards = site.houses
    .map((h) => {
      const c = t.houses.items[h.id];
      return `<li class="house-card reveal">
        ${img(ctx, h.image, { alt: c.alt, max: 1200, sizes: '(min-width: 48em) 45vw, 100vw', cls: 'house-card__img' })}
        <div class="house-card__body">
          <h3 class="house-card__title">${e(c.name)}</h3>
          <p>${e(c.text)}</p>
          <p class="house-card__meta">${icon(ctx, 'people')} ${fill(t.ui.upTo, { n: h.capacity })} · ${h.bedrooms} ${e(t.stats[1].label)} · ${h.bathrooms} ${e(t.stats[3].label)}</p>
        </div>
      </li>`;
    })
    .join('\n');
  const total = site.houses.reduce((s, h) => s + h.capacity, 0);
  return `<section class="section houses" id="cases" aria-labelledby="cases-title">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="kicker">${e(t.houses.kicker)}</p>
      <h2 class="section-title" id="cases-title">${e(t.houses.title)}</h2>
      <p class="section-lead">${e(t.houses.lead)}</p>
    </div>
    <ul class="houses__grid" role="list">
${cards}
    </ul>
    <p class="houses__cta reveal"><span class="houses__total">${total}</span> ${e(t.ui.people)} · <a class="link-arrow" href="#reserva" data-select-house="both">${e(t.houses.groupCta)} ${icon(ctx, 'arrow')}</a></p>
  </div>
</section>`;
}

function surroundings(ctx) {
  const { site, t } = ctx;
  const s = t.surroundings;
  const tabs = Object.keys(s.tabs);
  const tabButtons = tabs
    .map(
      (k, i) =>
        `<button class="tabs__tab" type="button" role="tab" id="tab-${k}" aria-controls="panel-${k}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${e(s.tabs[k])}</button>`
    )
    .join('\n');
  const panels = tabs
    .map((k) => {
      const places = site.places
        .filter((p) => p.tab === k)
        .map((p) => {
          const txt = s.places[p.id];
          const badge = p.km ? fill(t.ui.km, { km: p.km }) : p.when ? e(s.months[p.when]) : '';
          return `<li class="place">
            <p class="place__name">${e(txt.name)}${badge ? ` <span class="place__badge">${badge}</span>` : ''}</p>
            <p class="place__text">${e(txt.text)}</p>
          </li>`;
        })
        .join('\n');
      return `<div class="tabs__panel" id="panel-${k}" data-tab-panel="tab-${k}">
          <h3 class="tabs__heading">${e(s.tabs[k])}</h3>
          <ul class="places" role="list">
${places}
          </ul>
        </div>`;
    })
    .join('\n');
  return `<section class="section surroundings" id="entorn" aria-labelledby="entorn-title">
  <div class="surroundings__media">
    ${img(ctx, 'vineyard', { alt: s.imageAlt, sizes: '(min-width: 64em) 50vw, 100vw', cls: 'surroundings__img' })}
    ${img(ctx, 'arch', { alt: s.image2Alt, sizes: '(min-width: 64em) 18vw, 40vw', cls: 'surroundings__inset' })}
  </div>
  <div class="surroundings__content">
    <p class="kicker">${e(s.kicker)}</p>
    <h2 class="section-title" id="entorn-title">${e(s.title)}</h2>
    <p class="section-lead">${e(s.lead)}</p>
    <div class="tabs" data-tabs>
      <div class="tabs__list" role="tablist" aria-label="${e(s.title)}" hidden data-tablist>
${tabButtons}
      </div>
${panels}
    </div>
  </div>
</section>`;
}

function reviews(ctx) {
  const { site, t } = ctx;
  const items = site.reviews
    .map(
      (r) => `<li class="review reveal">
        <figure class="review__figure">
          <blockquote class="review__quote"><p>${e(t.reviews.items[r.id])}</p></blockquote>
          <figcaption class="review__author">${e(r.author)} <span class="review__source">· ${e(r.source)}</span></figcaption>
        </figure>
      </li>`
    )
    .join('\n');
  return `<section class="section section--sand reviews" id="opinions" aria-labelledby="opinions-title">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="kicker">${e(t.reviews.kicker)}</p>
      <h2 class="section-title" id="opinions-title">${e(t.reviews.title)}</h2>
      <p class="section-note">${fill(t.reviews.note, { source: site.reviews[0].source })}</p>
    </div>
    <ul class="reviews__list" role="list" tabindex="0" aria-label="${e(t.reviews.title)}">
${items}
    </ul>
  </div>
</section>`;
}

function booking(ctx) {
  const { site, t } = ctx;
  const b = t.booking;
  const f = b.fields;
  const capacities = Object.fromEntries(site.houses.map((h) => [h.id, h.capacity]));
  capacities.both = site.houses.reduce((s, h) => s + h.capacity, 0);
  const options = Object.entries(b.houseOptions)
    .map(([v, label], i) => `<option value="${v}"${i === 0 ? ' selected' : ''} data-capacity="${capacities[v]}">${e(label)}</option>`)
    .join('');
  const privacyLink = `<a href="${e(ctx.pageUrl('privacy', t.lang))}">${e(f.privacyLink)}</a>`;
  const messages = { ...b.errors, successTitle: b.success.title };
  return `<section class="section booking" id="reserva" aria-labelledby="reserva-title">
  <div class="wrap booking__grid">
    <div class="booking__intro reveal">
      <p class="kicker">${e(b.kicker)}</p>
      <h2 class="section-title" id="reserva-title">${e(b.title)}</h2>
      <p class="section-lead">${e(b.lead)}</p>
      <div class="price-card">
        <p class="price-card__from">${e(t.ui.from)}</p>
        <p class="price-card__price">${site.price.from} €</p>
        <p class="price-card__unit">${e(t.ui.perNight)}</p>
        <p class="price-card__note">${e(b.priceNote)}</p>
      </div>
      <h3 class="subhead subhead--small">${e(b.contactTitle)}</h3>
      <p><a class="link-arrow" href="mailto:${e(site.email)}">${icon(ctx, 'mail')} ${e(site.email)}</a></p>
    </div>
    <form class="booking-form reveal" action="mailto:${e(site.email)}" method="post" enctype="text/plain" data-booking-form>
      <script type="application/json" data-form-messages>${JSON.stringify(messages).replace(/</g, '\\u003c')}</script>
      <div class="form-row">
        <div class="field">
          <label class="field__label" for="bk-name">${e(f.name)}</label>
          <input class="field__input" id="bk-name" name="name" type="text" autocomplete="name" required maxlength="120">
        </div>
      </div>
      <div class="form-row form-row--2">
        <div class="field">
          <label class="field__label" for="bk-email">${e(f.email)}</label>
          <input class="field__input" id="bk-email" name="email" type="email" autocomplete="email" required maxlength="160">
        </div>
        <div class="field">
          <label class="field__label" for="bk-phone">${e(f.phone)} <span class="field__hint">${e(f.phoneHint)}</span></label>
          <input class="field__input" id="bk-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="30">
        </div>
      </div>
      <div class="form-row">
        <div class="field">
          <label class="field__label" for="bk-house">${e(f.house)}</label>
          <select class="field__input" id="bk-house" name="house" required data-house-select>${options}</select>
        </div>
      </div>
      <div class="form-row form-row--2">
        <div class="field">
          <label class="field__label" for="bk-checkin">${e(f.checkIn)}</label>
          <input class="field__input" id="bk-checkin" name="checkin" type="date" required data-min-today aria-describedby="bk-dates-error">
        </div>
        <div class="field">
          <label class="field__label" for="bk-checkout">${e(f.checkOut)}</label>
          <input class="field__input" id="bk-checkout" name="checkout" type="date" required data-min-today aria-describedby="bk-dates-error">
        </div>
      </div>
      <p class="field__error" id="bk-dates-error" aria-live="polite"></p>
      <div class="form-row form-row--2">
        <div class="field">
          <label class="field__label" for="bk-adults">${e(f.adults)}</label>
          <input class="field__input" id="bk-adults" name="adults" type="number" inputmode="numeric" min="1" max="${capacities.both}" value="2" required aria-describedby="bk-guests-error">
        </div>
        <div class="field">
          <label class="field__label" for="bk-children">${e(f.children)}</label>
          <input class="field__input" id="bk-children" name="children" type="number" inputmode="numeric" min="0" max="${capacities.both}" value="0" aria-describedby="bk-guests-error">
        </div>
      </div>
      <p class="field__error" id="bk-guests-error" aria-live="polite"></p>
      <div class="form-row">
        <div class="field">
          <label class="field__label" for="bk-message">${e(f.message)}</label>
          <textarea class="field__input field__input--area" id="bk-message" name="message" rows="4" maxlength="1500" placeholder="${e(f.messagePlaceholder)}"></textarea>
        </div>
      </div>
      <div class="check">
        <input class="check__input" id="bk-privacy" name="privacy" type="checkbox" value="accepted" required>
        <label class="check__label" for="bk-privacy">${fillHtml(f.privacy, { link: privacyLink })}</label>
      </div>
      <p class="form-status" role="status" aria-live="polite" data-form-status></p>
      <button class="button button--block" type="submit">${e(f.submit)}</button>
      <div class="form-success" hidden tabindex="-1" data-form-success>
        <p class="form-success__title">${e(b.success.title)}</p>
        <p>${e(b.success.text)}</p>
      </div>
    </form>
  </div>
</section>`;
}

function faq(ctx) {
  const { site, t } = ctx;
  const items = t.faq.items
    .map(
      (it) => `<li class="faq__item"><details class="faq__details">
        <summary class="faq__q">${e(it.q)}</summary>
        <p class="faq__a">${fill(it.a, site.schedule)}</p>
      </details></li>`
    )
    .join('\n');
  return `<section class="section section--sand faq" id="faq" aria-labelledby="faq-title">
  <div class="wrap faq__grid">
    <div class="reveal">
      <p class="kicker">${e(t.faq.kicker)}</p>
      <h2 class="section-title" id="faq-title">${e(t.faq.title)}</h2>
    </div>
    <ul class="faq__list reveal" role="list">
${items}
    </ul>
  </div>
</section>`;
}

function location(ctx) {
  const { site, t } = ctx;
  const l = t.location;
  const { lat, lng } = site.geo;
  const d = 0.008;
  const map = `https://www.openstreetmap.org/export/embed.html?bbox=${(lng - d).toFixed(5)}%2C${(lat - d / 2).toFixed(5)}%2C${(lng + d).toFixed(5)}%2C${(lat + d / 2).toFixed(5)}&layer=mapnik&marker=${lat}%2C${lng}`;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const distances = site.places
    .filter((p) => p.km)
    .sort((a, b) => a.km - b.km)
    .map((p) => `<li class="distances__item"><span>${e(t.surroundings.places[p.id].name)}</span><span class="distances__km">${fill(t.ui.km, { km: p.km })}</span></li>`)
    .join('\n');
  const a = site.address;
  return `<section class="section location" id="on-som" aria-labelledby="on-som-title">
  <div class="wrap location__grid">
    <div class="reveal">
      <p class="kicker">${e(l.kicker)}</p>
      <h2 class="section-title" id="on-som-title">${e(l.title)}</h2>
      <address class="location__address">${icon(ctx, 'pin')} ${e(a.street)}, ${e(a.postalCode)} ${e(a.locality)} (${e(a.region)})</address>
      <p><a class="link-arrow" href="${e(directions)}" rel="noopener" target="_blank">${e(l.directions)} ${icon(ctx, 'arrow')}</a></p>
      <h3 class="subhead subhead--small">${e(l.distancesTitle)}</h3>
      <ul class="distances" role="list">
${distances}
      </ul>
    </div>
    <div class="map reveal" data-map data-map-src="${e(map)}" data-map-title="${e(l.mapTitle)}">
      <div class="map__consent">
        ${icon(ctx, 'map', 'icon map__icon')}
        <p>${e(l.mapConsent)}</p>
        <button class="button button--small" type="button" data-map-load>${e(l.mapButton)}</button>
      </div>
    </div>
  </div>
</section>`;
}

function jsonLd(ctx) {
  const { site, t } = ctx;
  const h = mainHouse(site);
  const a = site.address;
  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    '@id': `${site.siteUrl}#lodging`,
    name: site.name,
    description: t.meta.description,
    url: ctx.absUrl('home', t.lang),
    image: ctx.photoAbs('facade', 1600),
    email: site.email,
    priceRange: `${t.ui.from} ${site.price.from} € ${t.ui.perNight}`,
    currenciesAccepted: site.price.currency,
    paymentAccepted: 'Cash, Credit Card',
    checkinTime: site.schedule.checkInFrom,
    checkoutTime: site.schedule.checkOutUntil,
    petsAllowed: true,
    numberOfRooms: h.bedrooms,
    availableLanguage: site.owner.languages,
    address: {
      '@type': 'PostalAddress',
      streetAddress: a.street,
      postalCode: a.postalCode,
      addressLocality: a.locality,
      addressRegion: a.region,
      addressCountry: a.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
    amenityFeature: site.amenities.map((k) => ({ '@type': 'LocationFeatureSpecification', name: t.amenities[k], value: true })),
  };
}

export function home(ctx) {
  return {
    title: ctx.t.meta.title,
    description: ctx.t.meta.description,
    jsonLd: jsonLd(ctx),
    body: join([hero(ctx), house(ctx), history(ctx), gallery(ctx), houses(ctx), surroundings(ctx), reviews(ctx), booking(ctx), faq(ctx), location(ctx)]),
  };
}
