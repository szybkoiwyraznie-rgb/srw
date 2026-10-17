/**
 * Strona dowolnej encji (gra, postać, mech, broń, seria).
 *
 * Jedna wspólna rama, różne infoboksy — bo wszystkie te encje mają ten sam
 * kształt: metryka u góry, opis w treści, powiązania pod spodem. Sekcje
 * „Powiązania" i „Wymienione w" NIE są pisane ręcznie w treści — powstają
 * z odsyłaczy, więc nie da się ich rozjechać z resztą bazy.
 */

import { escapeHtml } from './markdown.js';
import { hrefDlaSlug, hrefFiltru, hrefListy } from './links.js';
import { dajStrone, listaStron, backlinkiStrony, odsylaczeWychodzace, dajDane } from './data.js';
import {
  nazwaTypu, chipsyTagow, klasaPoziomu, opisPoziomu, linkStrony,
  stanPusty, nieZnalesc, naglowekStrony, stopkaCzasu, numerEpizodu, KOLEJNOSC_TYPOW, odmiana,
} from './render.js';

export function renderEncja(slug) {
  const strona = dajStrone(slug);
  if (!strona) return nieZnalesc(slug);

  const wychodzace = odsylaczeWychodzace(strona);
  const przychodzace = backlinkiStrony(slug);

  return `
${naglowekStrony({
  tytul: escapeHtml(strona.tytul),
  typ: strona.typ,
  podtytul: podtytul(strona),
})}
${strona.obraz ? `<figure class="obraz"><img src="${escapeHtml(strona.obraz)}" alt="${escapeHtml(strona.tytul)}" loading="lazy"><figcaption>${escapeHtml(strona.tytul)}${strona.obraz_zrodlo ? ` — ${escapeHtml(strona.obraz_zrodlo)}` : ''}</figcaption></figure>` : ''}
<div class="uklad-encja">
  <div class="tresc-encja ${klasaPoziomu(strona.pochodzenie)}" title="${opisPoziomu(strona.pochodzenie)}">
    ${strona.html}
    ${sekcjaListy(strona)}
    ${sekcjaPowiazan('Powiązania', wychodzace, { pomijaj: [] })}
    ${sekcjaPrzychodzacych(przychodzace)}
    ${stopkaCzasu(strona.czas)}
  </div>
  <aside class="infoboks">
    ${infoboks(strona)}
    ${chipsyTagow(strona.tagi)}
  </aside>
</div>`;
}

function podtytul(s) {
  if (s.typ === 'mech' || s.typ === 'postac') {
    const seria = s.seria ? dajStrone(s.seria) : null;
    return seria ? `z serii ${linkStrony(seria)}` : '';
  }
  if (s.typ === 'seria') {
    const czesci = [];
    if (s.rodzaj) czesci.push(String(s.rodzaj).toUpperCase());
    if (s.rok) czesci.push(String(s.rok));
    if (s.odcinki) czesci.push(`${s.odcinki} odc.`);
    return czesci.join(' · ');
  }
  if (s.typ === 'bron') return s.klasa ? `klasa: ${escapeHtml(s.klasa)}` : '';
  return '';
}

/** Pola infoboksu per typ — metryka, nie narracja. */
function infoboks(s) {
  const wiersze = [];
  const dodaj = (etykieta, wartosc) => { if (wartosc) wiersze.push(`<dt>${etykieta}</dt><dd>${wartosc}</dd>`); };

  if (s.typ === 'gra') {
    dodaj('Tytuł japoński', s.tytul_ja ? escapeHtml(s.tytul_ja) : '');
    dodaj('Tytuł angielski', s.tytul_en ? escapeHtml(s.tytul_en) : '');
    dodaj('Platforma', s.platforma ? escapeHtml(s.platforma) : '');
    dodaj('Rok', s.rok ? escapeHtml(String(s.rok)) : '');
    dodaj('Status', s.status ? escapeHtml(s.status) : '');
  }
  if (s.typ === 'seria') {
    dodaj('Tytuł japoński', s.tytul_ja ? escapeHtml(s.tytul_ja) : '');
    dodaj('Tytuł angielski', s.tytul_en ? escapeHtml(s.tytul_en) : '');
    dodaj('Rodzaj', s.rodzaj ? escapeHtml(String(s.rodzaj).toUpperCase()) : '');
    dodaj('Rok', s.rok ? escapeHtml(String(s.rok)) : '');
    dodaj('Odcinki', s.odcinki ? escapeHtml(String(s.odcinki)) : '');
  }
  if (s.typ === 'postac') {
    dodaj('Seria', s.seria ? linkStrony(dajStrone(s.seria)) : '');
    dodaj('Rola', s.rola ? escapeHtml(s.rola) : '');
    dodaj('Seiyū', s.seiyuu ? escapeHtml(s.seiyuu) : '');
  }
  if (s.typ === 'mech') {
    dodaj('Seria', s.seria ? linkStrony(dajStrone(s.seria)) : '');
    dodaj('Typ', s.typ_mecha ? escapeHtml(s.typ_mecha) : '');
    dodaj('Piloci', linkListy(s.piloci));
  }
  if (s.typ === 'bron') {
    dodaj('Klasa', s.klasa ? escapeHtml(s.klasa) : '');
    dodaj('Nosi ją', linkListy(s.mechy));
  }
  if (s.typ === 'epizod') {
    dodaj('Gra', s.gra ? linkStrony(dajStrone(s.gra)) : '');
    dodaj('Numer', s.numer ? numerEpizodu(s.numer) : '');
    dodaj('Trasa', s.trasa ? escapeHtml(s.trasa) : '');
    dodaj('Rozegrano', s.rozegrano ? escapeHtml(s.rozegrano) : '');
  }

  if (wiersze.length === 0) return '';
  return `<dl class="infoboks-lista">${wiersze.join('')}</dl>`;
}

function linkListy(slugi) {
  if (!Array.isArray(slugi) || slugi.length === 0) return '';
  return slugi.map((x) => {
    const p = dajStrone(x);
    return p ? linkStrony(p) : escapeHtml(x);
  }).join('<br>');
}

/** Listy zależne od typu: epizody gry, obsada serii, arsenał mecha. */
function sekcjaListy(s) {
  const czesci = [];

  if (s.typ === 'gra') {
    const epizody = listaStron('epizod').filter((e) => e.gra === s.slug).sort((a, b) => (a.numer ?? 0) - (b.numer ?? 0));
    if (epizody.length) {
      czesci.push(`<section class="blok-lista">
        <h2>Rozegrane epizody (${epizody.length})</h2>
        <ol class="lista-epizodow">${epizody.map((e) => `
          <li>
            <a href="${hrefDlaSlug(e.slug, 'epizod')}">
              <span class="mono">${numerEpizodu(e.numer)}</span> ${escapeHtml(e.tytul)}
              ${e.trasa ? `<span class="trasa">trasa: ${escapeHtml(e.trasa)}</span>` : ''}
            </a>
            ${e.rozegrano ? `<span class="meta">${escapeHtml(e.rozegrano)}</span>` : ''}
          </li>`).join('')}</ol>
      </section>`);
    }
  }

  if (s.typ === 'seria') {
    for (const typ of ['postac', 'mech', 'bron']) {
      const pozycje = listaStron(typ).filter((p) => p.seria === s.slug);
      if (pozycje.length) {
        czesci.push(sekcjaPowiazan(`Z tej serii: ${nazwaTypu(typ, 'wiele').toLowerCase()}`, new Map([[typ, pozycje.sort((a, b) => String(a.tytul).localeCompare(String(b.tytul), 'pl'))]]), { pomijaj: [] }));
      }
    }
  }

  if (s.typ === 'mech' && Array.isArray(s.bronie) && s.bronie.length) {
    const bronie = s.bronie.map(dajStrone).filter(Boolean);
    czesci.push(sekcjaPowiazan('Arsenał', new Map([['bron', bronie]]), { pomijaj: [] }));
  }

  return czesci.join('');
}

/**
 * Sekcja „Powiązania" — odsyłacze wychodzące pogrupowane po typie.
 * `pomijaj` pozwala nie dublować listy (np. arsenału mecha).
 */
export function sekcjaPowiazan(tytul, grupy, { pomijaj = [] } = {}) {
  const wpisy = [...grupy.entries()]
    .filter(([typ, lista]) => lista.length > 0 && !pomijaj.includes(typ))
    .sort((a, b) => KOLEJNOSC_TYPOW.indexOf(a[0]) - KOLEJNOSC_TYPOW.indexOf(b[0]));
  if (wpisy.length === 0) return '';
  return `<section class="blok-powiazan">
    <h2>${tytul}</h2>
    ${wpisy.map(([typ, lista]) => `
      <div class="grupa-powiazan">
        <h3>${nazwaTypu(typ, 'wiele')}</h3>
        <ul class="lista-horyzontalna">
          ${lista.map((p) => `<li>${linkStrony(p)}</li>`).join('')}
        </ul>
      </div>`).join('')}
  </section>`;
}

/** Sekcja „Wymienione w" — z czego ta strona jest osiągalna (backlinki). */
function sekcjaPrzychodzacych(przychodzace) {
  if (!przychodzace || przychodzace.length === 0) return '';
  const grupy = new Map();
  for (const p of przychodzace) {
    if (!grupy.has(p.typ)) grupy.set(p.typ, []);
    grupy.get(p.typ).push(p);
  }
  const sortuj = (lista) => lista.sort((a, b) => (a.numer ?? 0) - (b.numer ?? 0) || String(a.tytul).localeCompare(String(b.tytul), 'pl'));
  const wpisy = [...grupy.entries()]
    .sort((a, b) => KOLEJNOSC_TYPOW.indexOf(a[0]) - KOLEJNOSC_TYPOW.indexOf(b[0]))
    .map(([typ, lista]) => [typ, sortuj(lista)]);

  return `<section class="blok-powiazan blok-przychodzacych">
    <h2>Wymienione w</h2>
    ${wpisy.map(([typ, lista]) => `
      <div class="grupa-powiazan">
        <h3>${nazwaTypu(typ, 'wiele')} <span class="licznik">${lista.length}</span></h3>
        <ul class="lista">${lista.map((p) => `
          <li>
            <a href="${hrefDlaSlug(p.slug, p.typ)}">${typ === 'epizod' ? `<span class="mono">${numerEpizodu(p.numer)}</span> ` : ''}${escapeHtml(p.tytul)}</a>
            ${p.rozegrano ? `<span class="meta">${escapeHtml(p.rozegrano)}</span>` : ''}
          </li>`).join('')}</ul>
      </div>`).join('')}
  </section>`;
}
