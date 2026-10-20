/**
 * Strona główna bazy: liczby, ostatnie zmiany i wejścia w działy.
 *
 * Odpowiada na pytanie „co się dzieje w tym projekcie”, a nie tylko pełni
 * funkcję menu. Kafle pod nagłówkiem są jedynym miejscem, z którego wchodzi
 * się w cztery działy fabularne — nagłówek prowadzi do pozostałych działów.
 */

import { escapeHtml } from './markdown.js';
import { hrefDlaSlug } from './links.js';
import { statystyki, dajDane } from './data.js';
import { nazwaTypu } from './render.js';
import { listaDziennika } from './render-whatsnew.js';

/** Ile najnowszych wpisów dziennika pokazuje strona główna (reszta w „Co nowego”). */
const WPISY_NA_GLOWNEJ = 8;

export function renderGlowna() {
  const s = statystyki();

  return `
<section class="hero">
  <h1>SRW Database</h1>
  <p class="hero-opis">Światy <em>Super Robot Wars</em>: postacie, mechy, wydarzenia i historie łączące bohaterów różnych serii anime.</p>
  <div class="hero-liczby">
    ${kafelek('scena', s.scena, '#/sceny')}
    ${kafelek('epizod', s.epizod, '#/epizody')}
    ${kafelek('postac', s.postac, '#/postacie')}
    ${kafelek('mech', s.mech, '#/mechy')}
  </div>
</section>

<section class="blok dwie-kolumny dwie-kolumny-nierowne">
  <div>
    <h2>Co nowego</h2>
    ${listaDziennika(WPISY_NA_GLOWNEJ)}
    <p class="wiecej"><a href="#/co-nowego">Cały dziennik zmian →</a></p>
  </div>
  <div>
    <h2>Ostatnio dodane</h2>
    ${listaOstatnich()}
  </div>
</section>

<section class="blok">
  <h2>Jak czytać tę bazę</h2>
  <p>Kolory rozróżniają informacje i interpretacje:
  <span class="legenda poziom-skrypt">białe tło — wydarzenia i informacje z gry</span>,
  <span class="legenda poziom-zrodlo">niebieskie tło — informacje potwierdzone w źródłach</span>,
  <span class="legenda poziom-wiedza">zielone tło — niezweryfikowany kontekst i interpretacje</span>.</p>
</section>`;
}

function kafelek(typ, liczba, href) {
  return `<a class="kafelek" href="${href}">
    <span class="kafelek-liczba">${liczba}</span>
    <span class="kafelek-etykieta">${nazwaTypu(typ, 'wiele')}</span>
  </a>`;
}

function listaOstatnich() {
  const strony = Object.values(dajDane().strony)
    .filter((p) => p.typ !== 'epizod')
    .sort((a, b) => String(b.czas?.zaktualizowano ?? '').localeCompare(String(a.czas?.zaktualizowano ?? '')))
    .slice(0, 10);
  if (strony.length === 0) return '<p class="pusto">Baza jest pusta.</p>';
  return `<ul class="lista">${strony.map((p) => `
    <li>
      <a href="${hrefDlaSlug(p.slug, p.typ)}">${escapeHtml(p.tytul)}</a>
      <span class="meta">${nazwaTypu(p.typ)}${p.czas?.zaktualizowano ? ` · ${escapeHtml(p.czas.zaktualizowano).slice(0, 10)}` : ''}</span>
    </li>`).join('')}</ul>`;
}
