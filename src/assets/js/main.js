// Progressive enhancements for Ca n'Aleix. The page is fully usable without JS:
// every module below only improves what is already rendered in the HTML.
// No inline handlers anywhere, so the CSP can forbid 'unsafe-inline'.

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const todayIso = () => new Date().toLocaleDateString('sv-SE'); // yyyy-mm-dd, local time
const format = (str, vars) => str.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

/* ---------------------------------------------------------------- header */
function initHeader() {
  const header = $('[data-header]');
  const toggle = $('[data-nav-toggle]');
  const nav = toggle && document.getElementById(toggle.getAttribute('aria-controls'));
  if (!header || !toggle || !nav) return;
  const label = $('.nav-toggle__label', toggle);

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    header.classList.toggle('is-open', open);
    label.textContent = open ? label.dataset.labelClose : label.dataset.labelOpen;
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (ev) => {
    if (ev.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
  const desktop = window.matchMedia('(min-width: 60em)');
  desktop.addEventListener('change', () => setOpen(false));

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* --------------------------------------------------------------- reveal */
function initReveal() {
  const items = $$('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  items.forEach((el) => io.observe(el));
}

/* ---------------------------------------------------------------- dates */
function initDates() {
  const today = todayIso();
  $$('[data-min-today]').forEach((input) => {
    input.min = today;
  });
  // Keep each "check-out" at least one day after its "check-in".
  [['#quick-checkin', '#quick-checkout'], ['#bk-checkin', '#bk-checkout']].forEach(([a, b]) => {
    const inEl = $(a);
    const outEl = $(b);
    if (!inEl || !outEl) return;
    inEl.addEventListener('change', () => {
      if (!inEl.value) return;
      const next = new Date(`${inEl.value}T12:00:00`);
      next.setDate(next.getDate() + 1);
      outEl.min = next.toLocaleDateString('sv-SE');
      if (outEl.value && outEl.value < outEl.min) outEl.value = outEl.min;
    });
  });
}

/* --------------------------------------------------------------- booking */
function initBooking() {
  const form = $('[data-booking-form]');
  if (!form) return;
  const msgs = JSON.parse($('[data-form-messages]', form).textContent);
  const house = $('[data-house-select]', form);
  const checkIn = $('#bk-checkin', form);
  const checkOut = $('#bk-checkout', form);
  const adults = $('#bk-adults', form);
  const children = $('#bk-children', form);
  const datesError = $('#bk-dates-error', form);
  const guestsError = $('#bk-guests-error', form);
  const status = $('[data-form-status]', form);
  const success = $('[data-form-success]', form);
  form.noValidate = true; // JS shows its own accessible messages; without JS the browser validates.

  // Prefill from the hero quick search (?checkin=&checkout=&guests=).
  const params = new URLSearchParams(window.location.search);
  if (params.get('checkin')) checkIn.value = params.get('checkin');
  if (params.get('checkout')) checkOut.value = params.get('checkout');
  if (params.get('guests')) adults.value = params.get('guests');
  if (Number(adults.value) > 8) house.value = 'both';
  if (params.get('checkin')) checkIn.dispatchEvent(new Event('change'));

  // "Ask for both houses" links preselect the option.
  $$('[data-select-house]').forEach((link) =>
    link.addEventListener('click', () => {
      house.value = link.dataset.selectHouse;
      validateGuests();
    })
  );

  const setError = (input, el, message) => {
    input.setCustomValidity(message);
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    el.textContent = message;
  };

  function validateDates() {
    let message = '';
    if (checkIn.value && checkIn.value < todayIso()) message = msgs.past;
    else if (checkIn.value && checkOut.value && checkOut.value <= checkIn.value) message = msgs.dates;
    setError(checkOut, datesError, message);
    checkIn.setCustomValidity(message === msgs.past ? message : '');
    return !message;
  }

  function validateGuests() {
    const max = Number(house.selectedOptions[0].dataset.capacity);
    const total = Number(adults.value || 0) + Number(children.value || 0);
    const message = total > max ? format(msgs.capacity, { n: total, max }) : '';
    setError(adults, guestsError, message);
    return !message;
  }

  [checkIn, checkOut].forEach((el) => el.addEventListener('change', validateDates));
  [house, adults, children].forEach((el) => el.addEventListener('input', validateGuests));

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const ok = [validateDates(), validateGuests(), form.checkValidity()].every(Boolean);
    $$('.field__input, .check__input', form).forEach((el) =>
      el.setAttribute('aria-invalid', el.validity.valid ? 'false' : 'true')
    );
    if (!ok) {
      status.textContent = msgs.required;
      const firstInvalid = $(':invalid:not(fieldset)', form);
      if (firstInvalid) firstInvalid.focus();
      return;
    }
    // Preview build: nothing is sent. The production build posts to a form
    // endpoint (see README) instead of showing this confirmation.
    status.textContent = '';
    success.hidden = false;
    success.focus();
  });
}

/* ------------------------------------------------------------------ tabs */
function initTabs() {
  $$('[data-tabs]').forEach((root) => {
    const list = $('[data-tablist]', root);
    const tabs = $$('[role="tab"]', list);
    const panels = $$('[data-tab-panel]', root);
    list.hidden = false;
    root.classList.add('is-enhanced');
    panels.forEach((panel) => {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', panel.dataset.tabPanel);
      panel.tabIndex = 0;
    });

    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab, false));
      tab.addEventListener('keydown', (ev) => {
        const keys = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
        if (!(ev.key in keys)) return;
        ev.preventDefault();
        select(tabs[(keys[ev.key] + tabs.length) % tabs.length], true);
      });
    });
    select(tabs[0], false);
  });
}

/* -------------------------------------------------------------- lightbox */
function initLightbox() {
  const dialog = $('[data-lightbox-dialog]');
  const links = $$('[data-lightbox]');
  if (!dialog || !links.length || typeof dialog.showModal !== 'function') return;
  const image = $('[data-lightbox-img]', dialog);
  const caption = $('[data-lightbox-caption]', dialog);
  const counter = $('[data-lightbox-counter]', dialog);
  let index = 0;
  let opener = null;

  const show = (i) => {
    index = (i + links.length) % links.length;
    const link = links[index];
    const thumb = $('img', link);
    image.src = link.dataset.full;
    image.alt = link.dataset.alt;
    image.width = thumb.naturalWidth || thumb.width;
    image.height = thumb.naturalHeight || thumb.height;
    caption.textContent = link.dataset.alt;
    counter.textContent = format(dialog.dataset.counter, { n: index + 1, total: links.length });
  };

  links.forEach((link, i) =>
    link.addEventListener('click', (ev) => {
      ev.preventDefault();
      opener = link;
      show(i);
      dialog.showModal();
    })
  );
  $('[data-lightbox-prev]', dialog).addEventListener('click', () => show(index - 1));
  $('[data-lightbox-next]', dialog).addEventListener('click', () => show(index + 1));
  $('[data-lightbox-close]', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowRight') show(index + 1);
    if (ev.key === 'ArrowLeft') show(index - 1);
  });
  dialog.addEventListener('click', (ev) => {
    if (ev.target === dialog) dialog.close(); // click on the backdrop
  });
  dialog.addEventListener('close', () => {
    if (opener) opener.focus();
  });
}

/* ------------------------------------------------------------------- map */
function initMap() {
  $$('[data-map]').forEach((box) => {
    const button = $('[data-map-load]', box);
    button.addEventListener('click', () => {
      const frame = document.createElement('iframe');
      frame.src = box.dataset.mapSrc;
      frame.title = box.dataset.mapTitle;
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer';
      frame.className = 'map__frame';
      box.replaceChildren(frame);
      box.classList.add('is-loaded');
    });
  });
}

initHeader();
initReveal();
initDates();
initBooking();
initTabs();
initLightbox();
initMap();
