/**
 * Strona główna bazy: stan rozgrywki, liczby, ostatnie zmiany, wejścia
 * w działy. Ma odpowiadać na pytanie „co się dzieje w tym projekcie",
 * a nie tylko pełnić funkcję menu.
 */

import { escapeHtml } from './markdown.js';
import { hrefDlaSlug, hrefListy } from './links.js';
import { statystyki, listaStron, listaEpizodow, dajDane } from './data.js';
import { nazwaTypu, numerEpizodu } from './render.js';

export function renderGlowna() {
  const s = statystyki();
  const epizody = listaEpizodow();

  return `
<section class="hero">
  <h1>SRW Database</h1>
  <p class="hero-opis">Prywatny dziennik rozgrywki i baza wiedzy o <em>Super Robot Wars</em>.
  Baza rośnie w tempie grania: każdy rozegrany epizod przynosi skrypt, a ze skryptu — postacie,
  mechy z ich uzbrojeniem i wątki, z których każdy prowadzi do swojej serii anime.</p>
  <div class="hero-liczby">
    ${kafelek('scena', s.scena, '#/sceny')}
    ${kafelek('epizod', s.epizod, '#/epizody')}
    ${kafelek('postac', s.postac, '#/postacie')}
    ${kafelek('mech', s.mech, '#/mechy')}
  </div>
</section>

<section class="blok dwie-kolumny">
  <div>
    <h2>Ostatnio dodane</h2>
    ${listaOstatnich()}
  </div>
  <div>
    <h2>Najnowsze epizody</h2>
    ${epizody.length === 0
      ? '<p class="pusto">Jeszcze nic nie zostało rozegrane.</p>'
      : `<ul class="lista">${epizody.slice(-8).reverse().map((e) => `
          <li>
            <a href="${hrefDlaSlug(e.slug, 'epizod')}"><span class="mono">${numerEpizodu(e.numer)}</span> ${escapeHtml(e.tytul)}</a>
            ${e.rozegrano ? `<span class="meta">${escapeHtml(e.rozegrano)}</span>` : ''}
          </li>`).join('')}</ul>`}
  </div>
</section>

<section class="blok">
  <h2>Jak czytać tę bazę</h2>
  <p>Każda treść ma kolor tła według poziomu wiarygodności (ADR 0010):
  <span class="legenda poziom-skrypt">białe tło — dostawa właściciela</span>,
  <span class="legenda poziom-zrodlo">niebieskie tło — źródła sprawdzone</span>,
  <span class="legenda poziom-wiedza">zielone tło — wiedza i analiza modelu</span>.
  Dostawa właściciela ma najwyższy priorytet; rozbieżności z innymi źródłami są opisane osobno.</p>
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
