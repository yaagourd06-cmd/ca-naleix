import { e, fill } from './lib.mjs';

export function legal(ctx, kind) {
  const { site, t } = ctx;
  const page = t.legalPages[kind];
  const vars = {
    email: site.email,
    registration: site.houses.map((h) => `${t.houses.items[h.id].name}: ${h.registration}`).join(' · '),
  };
  const body = `<article class="section legal">
  <div class="wrap wrap--narrow">
    <h1 class="section-title">${e(page.title)}</h1>
    ${page.body.map((p) => `<p class="prose">${fill(p, vars)}</p>`).join('\n    ')}
    <p><a class="link-arrow" href="${e(ctx.pageUrl('home', t.lang))}">${e(t.ui.backHome)}</a></p>
  </div>
</article>`;
  return {
    title: `${page.title} · ${site.name}`,
    description: page.body[0].replace(/\{\w+\}/g, '').slice(0, 155),
    body,
  };
}
