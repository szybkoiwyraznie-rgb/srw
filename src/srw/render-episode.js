/**
 * Strona epizodu — serce dziennika rozgrywki.
 *
 * Układ: metryka rozegrania → sceny epizodu (pełna szerokość) → treść
 * analityczna (streszczenie, wątki fabularne, komentarz) → obsada i sprzęt
 * wyciągnięte ze skryptu.
 *
 * Sceny stoją na samej górze, bo to przez nie czyta się epizod: każda misja
 * ma własną stronę z dosłowną treścią i analizą, a streszczenie prowadzi do
 * nich nagłówkami misji.
 */

import { escapeHtml } from './markdown.js';
import { hrefDlaSlug, hrefFiltru } from './links.js';
import { dajStrone, dajDane, backlinkiStrony } from './data.js';
import {
  nazwaTypu, chipsyTagow, linkStrony,
  nieZnalesc, numerEpizodu, odmiana,
} from './render.js';
import { sekcjaPowiazan } from './render-entity.js';
import { sekcjaScen } from './render-scene.js';

export function renderEpizod(slug) {
  const e = dajStrone(slug);
  if (!e || e.typ !== 'epizod') return nieZnalesc(slug);

  const gra = e.gra ? dajStrone(e.gra) : null;
  const poprzedni = sasiedni(e, -1);
  const nastepny = sasiedni(e, +1);

  const grupy = new Map();
  for (const [pole, typ] of [['postacie', 'postac'], ['mechy', 'mech'], ['pojecia', 'pojecie'], ['serie', 'seria']]) {
    const lista = (e[pole] ?? []).map(dajStrone).filter(Boolean);
    if (lista.length) grupy.set(typ, lista.sort((a, b) => String(a.tytul).localeCompare(String(b.tytul), 'pl')));
  }

  // Każdy boks to własny fragment treści — streszczenie, wątki i komentarz
  // nie dzielą już jednego wspólnego tła.
  const boksy = (e.boksy ?? []).map((b) => `<section class="sekcja-strony">
    ${b.html}
  </section>`).join('\n');

  return `
<div class="naglowek-epizodu">
  <div class="okruszki">
    <a href="#/epizody">Epizody</a>
    ${gra ? ` · <a href="${hrefDlaSlug(gra.slug, 'gra')}">${escapeHtml(gra.tytul)}</a>` : ''}
  </div>
  <h1><span class="numer-epizodu">Epizod ${numerEpizodu(e.numer)}</span> ${escapeHtml(e.tytul)}</h1>
  ${e.rozegrano || e.trasa ? `<p class="podtytul">${[
    e.rozegrano ? `rozegrano ${escapeHtml(e.rozegrano)}` : '',
    e.trasa ? `trasa: <strong>${escapeHtml(e.trasa)}</strong>` : '',
  ].filter(Boolean).join(' · ')}</p>` : ''}
</div>

${sekcjaScen(e.slug, { pelna: true })}

<div class="uklad-strona">
  <div class="kolumna-glowna tresc-encja">
    ${boksy || e.html}
  </div>
  <aside class="kolumna-boczna" aria-label="Informacje o epizodzie">
    <div class="panel-boczny">
      <dl class="infoboks-lista">
        ${gra ? `<dt>Gra</dt><dd><a href="${hrefDlaSlug(gra.slug, 'gra')}">${escapeHtml(gra.tytul)}</a></dd>` : ''}
        <dt>Numer</dt><dd>${numerEpizodu(e.numer)}</dd>
        ${e.trasa ? `<dt>Trasa</dt><dd>${escapeHtml(e.trasa)}</dd>` : ''}
        ${e.rozegrano ? `<dt>Rozegrano</dt><dd>${escapeHtml(e.rozegrano)}</dd>` : ''}
      </dl>
      ${chipsyTagow(e.tagi)}
      <nav class="nawigacja-epizodow">
        ${poprzedni ? `<a href="${hrefDlaSlug(poprzedni.slug, 'epizod')}">← ${numerEpizodu(poprzedni.numer)} ${escapeHtml(poprzedni.tytul)}</a>` : ''}
        ${nastepny ? `<a href="${hrefDlaSlug(nastepny.slug, 'epizod')}">${numerEpizodu(nastepny.numer)} ${escapeHtml(nastepny.tytul)} →</a>` : ''}
      </nav>
    </div>
    ${sekcjaPowiazan('W tym epizodzie', grupy, {})}
  </aside>
</div>`;
}

/** Sąsiedni epizod tej samej gry (kolejność wg numeru). */
function sasiedni(epizod, kierunek) {
  const rodzenstwo = Object.values(dajDane().strony)
    .filter((p) => p.typ === 'epizod' && p.gra === epizod.gra)
    .sort((a, b) => (a.numer ?? 0) - (b.numer ?? 0));
  const i = rodzenstwo.findIndex((p) => p.slug === epizod.slug);
  return i >= 0 ? rodzenstwo[i + kierunek] ?? null : null;
}
