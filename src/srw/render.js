/**
 * Wspólne elementy renderowania: szkielet strony (nagłówek, nawigacja,
 * stopka), chipsy tagów, plakietki pochodzenia, stany puste, 404.
 *
 * Renderery zwracają HTML (string) — montuje je main.js w #app.
 */

import { escapeHtml } from './markdown.js';
import { hrefDlaSlug, hrefListy } from './links.js';
import { statystyki, dajDane } from './data.js';

export const NAZWY_TYPOW = {
  gra: { jeden: 'Gra', wiele: 'Gry', },
  epizod: { jeden: 'Epizod', wiele: 'Epizody', },
  scena: { jeden: 'Scena', wiele: 'Sceny', },
  postac: { jeden: 'Postać', wiele: 'Postacie', },
  mech: { jeden: 'Mech', wiele: 'Mechy', },
  seria: { jeden: 'Seria', wiele: 'Serie', },
};

/** Kolejność sekcji „Powiązania" na stronie encji. */
export const KOLEJNOSC_TYPOW = ['scena', 'epizod', 'gra', 'postac', 'mech', 'seria'];

/** Poziomy wiarygodności (ADR 0010): kolor tła treści, nie plakietka. */
export const NAZWY_POCHODZENIA = {
  skrypt: { etykieta: 'dostawa właściciela', opis: 'Dostawa właściciela: skrypt epizodu (dialogi, nazwy, sceny). Najwyższy priorytet.' },
  menu: { etykieta: 'dostawa właściciela', opis: 'Dostawa właściciela: szczegóły o mechach, pilotach i broniach. Najwyższy priorytet.' },
  zrodlo: { etykieta: 'źródła sprawdzone', opis: 'Uzupełnienie z zewnętrznych źródeł, sprawdzone przy zapisie (ADR 0009). Drugi poziom.' },
  wiedza: { etykieta: 'wiedza i analiza modelu', opis: 'Wiedza i analiza modelu bez potwierdzenia. Najniższy poziom wiarygodności.' },
};

/** Gradacja (zasada właściciela): gra → epizod → scena to główny ciąg fabularny. Scena jest jednostką, z której wszystko się składa. */
export const NAV = [
  { id: 'glowna', etykieta: 'Baza', href: '#/' },
  { id: 'gry', etykieta: 'Gry', href: '#/gry' },
  { id: 'epizody', etykieta: 'Epizody', href: '#/epizody' },
  { id: 'sceny', etykieta: 'Sceny', href: '#/sceny' },
  { id: 'postacie', etykieta: 'Postacie', href: '#/postacie' },
  { id: 'mechy', etykieta: 'Mechy', href: '#/mechy' },
  { id: 'serie', etykieta: 'Serie', href: '#/serie' },
  { id: 'tagi', etykieta: 'Tagi', href: '#/tagi' },
  { id: 'co-nowego', etykieta: 'Co nowego', href: '#/co-nowego' },
];

export function nazwaTypu(typ, liczba = 'jeden') {
  return NAZWY_TYPOW[typ]?.[liczba] ?? typ;
}

export function rama(aktywna, tytul, tresc) {
  const d = statystyki();
  return `
<header class="naglowek">
  <div class="naglowek-wnetrze">
    <a class="logo" href="#/"><span class="logo-srw">SRW</span><span class="logo-db">Database</span></a>
    <nav class="nawigacja" aria-label="Nawigacja główna">
      ${NAV.map((n) => `<a class="${n.id === aktywna ? 'aktywna' : ''}" href="${n.href}">${n.etykieta}</a>`).join('')}
    </nav>
    <form class="szukaj" role="search" action="#/szukaj" onsubmit="const q=this.elements.q.value.trim(); if(q) location.hash='#/szukaj?q='+encodeURIComponent(q); return false;">
      <input type="search" name="q" placeholder="Szukaj w bazie…" aria-label="Szukaj w bazie">
    </form>
  </div>
</header>
<main class="tresc" id="tresc">
${tresc}
</main>
<footer class="stopka">
  <p>SRW Database — prywatny dziennik rozgrywki i zbiór wiedzy ·
  ${d.gra} ${odmiana(d.gra, ['gra', 'gry', 'gier'])},
  ${d.epizod} ${odmiana(d.epizod, ['epizod', 'epizody', 'epizodów'])},
  ${d.postac} ${odmiana(d.postac, ['postać', 'postacie', 'postaci'])},
  ${d.mech} ${odmiana(d.mech, ['mech', 'mechy', 'mechów'])},
  ${d.scena} ${odmiana(d.scena, ['scena', 'sceny', 'scen'])},
  ${d.seria} ${odmiana(d.seria, ['seria', 'serie', 'serii'])}${d.relacje ? ` · ${d.relacje} ${odmiana(d.relacje, ['powiązanie', 'powiązania', 'powiązań'])}` : ''}</p>
  <p class="stopka-meta">baza zbudowana ${escapeHtml(dajDane().zbudowano ?? '—')} · <a href="#/o-bazie">o bazie</a></p>
</footer>`;
}

export function tytulStrony(tytul) {
  if (globalThis.document) globalThis.document.title = `${tytul} — SRW Database`;
}

export function chipsyTagow(tagi) {
  if (!tagi || tagi.length === 0) return '';
  return `<div class="chipsy">${tagi.map((t) => `<a class="chip" href="#/tag/${encodeURIComponent(t)}">${escapeHtml(t)}</a>`).join('')}</div>`;
}

/** Klasa tła treści wg poziomu wiarygodności (ADR 0010). */
export function klasaPoziomu(pochodzenie) {
  return NAZWY_POCHODZENIA[pochodzenie] ? `poziom poziom-${pochodzenie}` : 'poziom poziom-brak';
}

/** Tytuł (tooltip) opisujący poziom; bez ikon i plakietek. */
export function opisPoziomu(pochodzenie) {
  const n = NAZWY_POCHODZENIA[pochodzenie];
  return n ? escapeHtml(n.opis) : '';
}

/** Link do strony encji z ikoną typu. */
export function linkStrony(strona, { zTypem = false } = {}) {
  if (!strona) return '';
  return `<a class="link-strony" href="${hrefDlaSlug(strona.slug, strona.typ)}">${escapeHtml(strona.tytul)}${zTypem ? ` <span class="typ">${nazwaTypu(strona.typ)}</span>` : ''}</a>`;
}

export function stanPusty(komunikat, podpowiedz = '') {
  return `<div class="stan-pusty">
    <p class="komunikat">${komunikat}</p>
    ${podpowiedz ? `<p class="podpowiedz">${podpowiedz}</p>` : ''}
  </div>`;
}

export function nieZnalesc(czego) {
  return stanPusty(
    `Nie znaleziono: ${escapeHtml(czego)}`,
    '<a href="#/">Wróć na stronę główną</a>',
  );
}

/** Nagłówek strony z „okruszkiem" powrotu do listy. */
export function naglowekStrony({ tytul, typ, podtytul = '', badge = '' }) {
  const lista = typ ? `<a class="okruszek" href="${hrefListy(typ)}">${nazwaTypu(typ, 'wiele')}</a>` : '';
  return `<div class="naglowek-strony">
    ${lista}
    <h1>${tytul} ${badge}</h1>
    ${podtytul ? `<p class="podtytul">${podtytul}</p>` : ''}
  </div>`;
}

export function odmiana(n, [jeden, kilka, wiele]) {
  if (n === 1) return jeden;
  const reszta = n % 10;
  const setki = n % 100;
  if (reszta >= 2 && reszta <= 4 && !(setki >= 12 && setki <= 14)) return kilka;
  return wiele;
}

export function stopkaCzasu(czas) {
  if (!czas || (!czas.utworzono && !czas.zaktualizowano)) return '';
  const czesci = [];
  if (czas.utworzono) czesci.push(`Utworzono ${escapeHtml(czas.utworzono)}`);
  if (czas.zaktualizowano && czas.zaktualizowano !== czas.utworzono) {
    czesci.push(`ostatnia aktualizacja ${escapeHtml(czas.zaktualizowano)}`);
  }
  return `<footer class="stopka-czasu meta">${czesci.join(' · ')}</footer>`;
}

export function nazwaMiesiaca(miesiac) {
  const NAZWY = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
    'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
  const m = String(miesiac ?? '').match(/^(\d{4})-(\d{2})$/);
  if (!m) return String(miesiac ?? '');
  return `${NAZWY[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
}

/** Format numeru epizodu: 7 → „07". */
export function numerEpizodu(n) {
  const v = Number(n);
  return Number.isFinite(v) ? String(v).padStart(2, '0') : String(n ?? '');
}
