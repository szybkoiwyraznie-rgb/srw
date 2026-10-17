/**
 * Szukanie: proste dopasowanie tekstowe po tytułach, tagach i treści stron.
 *
 * Bez indeksu i bez zależności — baza jest mała (rośnie o epizod na jakiś
 * czas), więc przeszukanie całości po stronie przeglądarki jest natychmiastowe
 * i działa też z pliku na dysku.
 */

import { escapeHtml } from './markdown.js';
import { hrefDlaSlug } from './links.js';
import { dajDane } from './data.js';
import { nazwaTypu, stanPusty, numerEpizodu } from './render.js';

export function renderSzukanie(q) {
  const fraza = String(q ?? '').trim();
  if (fraza === '') {
    return `<div class="naglowek-strony"><h1>Szukaj</h1>
      <p class="podtytul">Wpisz frazę w polu u góry — szukamy w tytułach, tagach i treści wszystkich stron.</p></div>`;
  }

  const wyniki = szukaj(fraza);

  if (wyniki.length === 0) {
    return `<div class="naglowek-strony"><h1>Szukaj: ${escapeHtml(fraza)}</h1></div>` +
      stanPusty('Nic nie znaleziono.', 'Spróbuj krótszej frazy albo sprawdź pisownię nazwy (nazwy japońskie bywają zapisywane różnie).');
  }

  return `
<div class="naglowek-strony">
  <h1>Szukaj: ${escapeHtml(fraza)}</h1>
  <p class="podtytul">${wyniki.length} ${wyniki.length === 1 ? 'wynik' : 'wyników'} · posortowane od najtrafniejszych</p>
</div>
<ul class="lista-duza lista-wynikow">
  ${wyniki.map(({ strona, trafienie }) => `
    <li>
      <a href="${hrefDlaSlug(strona.slug, strona.typ)}">
        ${strona.typ === 'epizod' ? `<span class="mono">${numerEpizodu(strona.numer)}</span> ` : ''}
        ${podkresl(strona.tytul, fraza)}
      </a>
      <span class="meta">${nazwaTypu(strona.typ)}${strona.seria ? '' : ''}</span>
      ${trafienie ? `<p class="fragment">…${podkresl(trafienie, fraza)}…</p>` : ''}
    </li>`).join('')}
</ul>`;
}

/** Zwraca [{strona, trafienie}] — trafienie to fragment tekstu wokół dopasowania. */
export function szukaj(fraza) {
  const igła = fraza.toLowerCase();
  const wyniki = [];
  for (const strona of Object.values(dajDane().strony)) {
    const tytul = String(strona.tytul ?? '');
    const tagi = (strona.tagi ?? []).join(' ');
    const tekst = String(strona.tekst ?? '');

    let waga = 0;
    if (tytul.toLowerCase().includes(igła)) waga += 100;
    if (tagi.toLowerCase().includes(igła)) waga += 30;
    const indeks = tekst.toLowerCase().indexOf(igła);
    if (indeks >= 0) waga += 10;
    if (waga === 0) continue;

    wyniki.push({
      strona,
      waga,
      trafienie: indeks >= 0 ? fragment(tekst, indeks, igła.length) : '',
    });
  }
  return wyniki
    .sort((a, b) => b.waga - a.waga || String(a.strona.tytul).localeCompare(String(b.strona.tytul), 'pl'))
    .slice(0, 60);
}

function fragment(tekst, indeks, dlugosc) {
  const od = Math.max(0, indeks - 70);
  const do_ = Math.min(tekst.length, indeks + dlugosc + 110);
  return escapeHtml(tekst.slice(od, do_).replace(/\s+/g, ' ').trim());
}

function podkresl(tekst, fraza) {
  const bezpieczny = escapeHtml(tekst);
  const igła = escapeHtml(fraza).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!igła) return bezpieczny;
  return bezpieczny.replace(new RegExp(igła, 'gi'), (m) => `<mark>${m}</mark>`);
}
