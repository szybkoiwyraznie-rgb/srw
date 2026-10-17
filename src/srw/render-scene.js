/**
 * Strona sceny (ADR 0008): treść sceny z dosłownym skryptem, potem analiza.
 *
 * Scena należy do epizodu — okruszki i nawigacja prowadzą wewnątrz epizodu
 * (poprzednia / następna scena), a lista scen na stronie epizodu powstaje
 * z tych samych wpisów.
 */

import { escapeHtml } from './markdown.js';
import { hrefDlaSlug } from './links.js';
import { dajStrone, dajDane } from './data.js';
import { plakietkaPochodzenia, linkStrony, nieZnalesc, stopkaCzasu, numerEpizodu } from './render.js';
import { sortujSceny } from './registry.js';

/** Sceny jednego epizodu w kolejności numerycznej. */
export function scenyEpizodu(slugEpizodu) {
  const sceny = Object.values(dajDane().strony).filter((p) => p.typ === 'scena' && p.epizod === slugEpizodu);
  return sortujSceny(sceny);
}

export function renderScena(slug) {
  const s = dajStrone(slug);
  if (!s || s.typ !== 'scena') return nieZnalesc(slug);

  const epizod = dajStrone(s.epizod);
  const gra = epizod?.gra ? dajStrone(epizod.gra) : null;
  const sceny = scenyEpizodu(s.epizod);
  const i = sceny.findIndex((x) => x.slug === s.slug);
  const poprzednia = i > 0 ? sceny[i - 1] : null;
  const nastepna = i >= 0 && i < sceny.length - 1 ? sceny[i + 1] : null;

  const infoPozycje = [];
  const linkiListy = (slugi) => (slugi ?? []).map(dajStrone).filter(Boolean).map((p) => linkStrony(p)).join('<br>');
  if ((s.postacie ?? []).length) infoPozycje.push(`<dt>Postacie</dt><dd>${linkiListy(s.postacie)}</dd>`);
  if ((s.mechy ?? []).length) infoPozycje.push(`<dt>Mechy</dt><dd>${linkiListy(s.mechy)}</dd>`);
  if ((s.bronie ?? []).length) infoPozycje.push(`<dt>Bronie</dt><dd>${linkiListy(s.bronie)}</dd>`);

  return `
<div class="naglowek-epizodu">
  <div class="okruszki">
    <a href="#/epizody">Epizody</a>
    ${gra ? ` · <a href="${hrefDlaSlug(gra.slug, 'gra')}">${escapeHtml(gra.tytul)}</a>` : ''}
    ${epizod ? ` · <a href="${hrefDlaSlug(epizod.slug, 'epizod')}">Epizod ${numerEpizodu(epizod.numer)}</a>` : ''}
  </div>
  <h1><span class="numer-epizodu">Scena ${escapeHtml(s.numer_sceny)}</span> ${escapeHtml(s.tytul)}</h1>
  <p class="podtytul">
    ${epizod ? `w epizodzie ${linkStrony(epizod)}` : ''}
    ${plakietkaPochodzenia(s.pochodzenie)}
  </p>
</div>

<div class="uklad-encja">
  <div class="tresc-encja">
    ${s.html}
    ${stopkaCzasu(s.czas)}
  </div>
  <aside class="infoboks">
    ${infoPozycje.length ? `<dl class="infoboks-lista">${infoPozycje.join('')}</dl>` : ''}
    <nav class="nawigacja-epizodow">
      ${poprzednia ? `<a href="${hrefDlaSlug(poprzednia.slug, 'scena')}">← ${escapeHtml(poprzednia.numer_sceny)} ${escapeHtml(poprzednia.tytul)}</a>` : ''}
      ${nastepna ? `<a href="${hrefDlaSlug(nastepna.slug, 'scena')}">${escapeHtml(nastepna.numer_sceny)} ${escapeHtml(nastepna.tytul)} →</a>` : ''}
    </nav>
  </aside>
</div>`;
}

/** Sekcja „Sceny\" na stronie epizodu — agregacja wpisów scen (ADR 0008 pkt 4). */
export function sekcjaScen(slugEpizodu) {
  const sceny = scenyEpizodu(slugEpizodu);
  if (sceny.length === 0) return '';
  return `<section class="blok-sceny">
    <h2>Sceny</h2>
    <ul class="lista-scen">
      ${sceny.map((s) => `<li><a href="${hrefDlaSlug(s.slug, 'scena')}"><span class="numer-sceny">${escapeHtml(s.numer_sceny)}</span> <strong>${escapeHtml(s.tytul)}</strong></a>${s.streszczenie ? ` — ${escapeHtml(s.streszczenie)}` : ''}</li>`).join('')}
    </ul>
  </section>`;
}
