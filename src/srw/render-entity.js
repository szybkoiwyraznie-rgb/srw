/**
 * Strona dowolnej encji (gra, postać, mech, hasło, seria).
 *
 * Jedna wspólna rama, różne infoboksy — bo wszystkie te encje mają ten sam
 * kształt: metryka u góry, opis w treści, powiązania pod spodem. Boks
 * „Powiązania" NIE jest pisany ręcznie w treści — powstaje z odsyłaczy,
 * więc nie da się go rozjechać z resztą bazy.
 *
 * „Powiązania" to wszystkie relacje strony w jednym boksie (ADR 0038):
 * strony, do których ta odsyła, i strony, które odsyłają tutaj. Kierunek
 * odsyłacza nie tworzy drugiej listy — każda powiązana strona stoi raz.
 *
 * Jedna pozycja — jedno miejsce (ADR 0036): to, co strona pokazuje już
 * w metryce albo na własnej liście („Rozegrane epizody", „Z tej serii…"),
 * nie wraca drugi raz w kolumnie bocznej.
 */

import { escapeHtml } from './markdown.js';
import { hrefDlaSlug, hrefFiltru, hrefListy } from './links.js';
import { dajStrone, listaStron, listaEpizodow, backlinkiStrony, odsylaczeWychodzace, dajDane } from './data.js';
import { sortujSceny } from './registry.js';
import {
  nazwaTypu, chipsyTagow, linkStrony,
  stanPusty, nieZnalesc, naglowekStrony, numerEpizodu, KOLEJNOSC_TYPOW, odmiana,
} from './render.js';

export function renderEncja(slug) {
  const strona = dajStrone(slug);
  if (!strona) return nieZnalesc(slug);

  const listy = wlasneListy(strona);
  // To, co stoi już w metryce albo na liście w treści, nie wraca w „Powiązaniach".
  const pokazane = new Set([
    ...listy.flatMap((l) => l.pozycje.map((p) => p.slug)),
    ...slugiMetryki(strona),
  ]);

  return `
${naglowekStrony({
  tytul: escapeHtml(strona.tytul),
  typ: strona.typ,
  podtytul: podtytul(strona),
})}
${strona.obraz ? `<figure class="obraz"><button type="button" class="ilustracja-otworz" data-pelny-ekran><img src="${escapeHtml(strona.obraz)}" alt="${escapeHtml(strona.tytul)}" loading="lazy"></button><figcaption>${escapeHtml(strona.tytul)}${strona.obraz_zrodlo ? ` — ${escapeHtml(strona.obraz_zrodlo)}` : ''}</figcaption></figure>` : ''}
<div class="uklad-strona">
  <div class="kolumna-glowna tresc-encja">
    ${strona.html}
    ${sekcjaListy(strona, listy)}
  </div>
  <aside class="kolumna-boczna" aria-label="Informacje o ${escapeHtml(nazwaTypu(strona.typ).toLowerCase())}">
    <div class="panel-boczny">
      ${infoboks(strona)}
      ${chipsyTagow(strona.tagi)}
    </div>
    ${boksPowiazan(powiazaniaStrony(strona, pokazane))}
  </aside>
</div>`;
}

function podtytul(s) {
  if (s.typ === 'mech' || s.typ === 'postac') {
    const seria = s.seria ? dajStrone(s.seria) : null;
    const czesci = [];
    // Pseudonim (ADR 0037): pod nim postać mówi w skrypcie, więc stoi tuż przy tytule.
    if (s.typ === 'postac' && s.pseudonim) czesci.push(`„${escapeHtml(s.pseudonim)}”`);
    if (seria) czesci.push(`z serii ${linkStrony(seria)}`);
    return czesci.join(' · ');
  }
  if (s.typ === 'seria') {
    const czesci = [];
    if (s.rodzaj) czesci.push(String(s.rodzaj).toUpperCase());
    if (s.rok) czesci.push(String(s.rok));
    if (s.odcinki) czesci.push(`${s.odcinki} odc.`);
    return czesci.join(' · ');
  }
  return '';
}

/** Pola infoboksu per typ — metryka, nie narracja. */
function infoboks(s) {
  const wiersze = [];
  const dodaj = (etykieta, wartosc) => { if (wartosc) wiersze.push(`<dt>${etykieta}</dt><dd>${wartosc}</dd>`); };

  // Zakres gry (ADR 0020): od razu widać, w których tytułach występuje encja.
  if (s.typ !== 'gra' && Array.isArray(s.gry) && s.gry.length > 0) {
    const gry = s.gry.map((slug) => dajStrone(slug)).filter(Boolean);
    if (gry.length > 0) dodaj(gry.length === 1 ? 'Gra' : 'Gry', gry.map(linkStrony).join('<br>'));
  }

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
    dodaj('Pseudonim', s.pseudonim ? escapeHtml(s.pseudonim) : '');
    dodaj('Rola', s.rola ? escapeHtml(s.rola) : '');
    dodaj('Seiyū', s.seiyuu ? escapeHtml(s.seiyuu) : '');
  }
  if (s.typ === 'mech') {
    dodaj('Seria', s.seria ? linkStrony(dajStrone(s.seria)) : '');
    dodaj('Typ', s.typ_mecha ? escapeHtml(s.typ_mecha) : '');
    dodaj('Piloci', linkListy(s.piloci));
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

/**
 * Strony, do których odsyła już metryka — te same pola, które `infoboks`
 * pokazuje jako odsyłacze (Gra/Gry, Seria, Piloci).
 */
function slugiMetryki(s) {
  const slugi = [];
  if (s.typ !== 'gra' && Array.isArray(s.gry)) slugi.push(...s.gry);
  if ((s.typ === 'postac' || s.typ === 'mech') && s.seria) slugi.push(s.seria);
  if (s.typ === 'mech' && Array.isArray(s.piloci)) slugi.push(...s.piloci);
  return slugi.filter((slug) => dajStrone(slug));
}

function linkListy(slugi) {
  if (!Array.isArray(slugi) || slugi.length === 0) return '';
  return slugi.map((x) => {
    const p = dajStrone(x);
    return p ? linkStrony(p) : escapeHtml(x);
  }).join('<br>');
}

/**
 * Listy, które strona składa z pól innych stron: epizody gry (pole `gra`)
 * oraz postacie i mechy serii (pole `seria`). Jedno źródło dla sekcji
 * w treści i dla pomijania powtórzeń w kolumnie bocznej.
 */
function wlasneListy(s) {
  if (s.typ === 'gra') {
    const epizody = listaStron('epizod').filter((e) => e.gra === s.slug).sort((x, y) => (x.numer ?? 0) - (y.numer ?? 0));
    return epizody.length ? [{ typ: 'epizod', pozycje: epizody }] : [];
  }
  if (s.typ === 'seria') {
    return ['postac', 'mech']
      .map((typ) => ({
        typ,
        pozycje: listaStron(typ).filter((p) => p.seria === s.slug)
          .sort((x, y) => String(x.tytul).localeCompare(String(y.tytul), 'pl')),
      }))
      .filter((l) => l.pozycje.length > 0);
  }
  return [];
}

/** Listy zależne od typu: epizody gry, postacie i mechy serii. */
function sekcjaListy(s, listy) {
  return listy.map(({ typ, pozycje }) => {
    if (s.typ === 'gra') {
      return `<section class="blok-lista">
        <h2>Rozegrane epizody (${pozycje.length})</h2>
        <ol class="lista-epizodow">${pozycje.map((e) => `
          <li>
            <a href="${hrefDlaSlug(e.slug, 'epizod')}">
              <span class="mono">${numerEpizodu(e.numer)}</span> ${escapeHtml(e.tytul)}
              ${e.trasa ? `<span class="trasa">trasa: ${escapeHtml(e.trasa)}</span>` : ''}
            </a>
            ${e.rozegrano ? `<span class="meta">${escapeHtml(e.rozegrano)}</span>` : ''}
          </li>`).join('')}</ol>
      </section>`;
    }
    return sekcjaPowiazan(`Z tej serii: ${nazwaTypu(typ, 'wiele').toLowerCase()}`, new Map([[typ, pozycje]]), { pomijaj: [] });
  }).join('');
}

/**
 * Lista odsyłaczy pogrupowana po typie — „Z tej serii…" na stronie serii
 * i „W tym epizodzie" na stronie epizodu. `pomijaj` wyłącza całe grupy.
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

/**
 * Wszystkie strony powiązane z tą, pogrupowane po typie (ADR 0038).
 *
 * Relacja to odsyłacz w którąkolwiek stronę: pole albo wikilink stąd
 * (`linki`) albo skądś tutaj (`backlinki`). Para stron, które odsyłają do
 * siebie nawzajem, jest jedną relacją, więc strona trafia na listę raz.
 * `pokazane` to strony, które widać już w metryce albo na własnej liście.
 */
export function powiazaniaStrony(strona, pokazane = new Set()) {
  const zajete = new Set([strona.slug, ...pokazane]);
  const grupy = new Map();
  const dodaj = (p) => {
    if (zajete.has(p.slug)) return;
    zajete.add(p.slug);
    if (!grupy.has(p.typ)) grupy.set(p.typ, []);
    grupy.get(p.typ).push(p);
  };
  for (const lista of odsylaczeWychodzace(strona).values()) lista.forEach(dodaj);
  backlinkiStrony(strona.slug).forEach(dodaj);

  for (const [typ, lista] of grupy) grupy.set(typ, uporzadkuj(typ, lista));
  return grupy;
}

/** Fabuła idzie w kolejności rozgrywki (gra, epizod, scena), reszta alfabetycznie. */
function uporzadkuj(typ, lista) {
  const alfabetycznie = (a, b) => String(a.tytul).localeCompare(String(b.tytul), 'pl');
  if (typ !== 'epizod' && typ !== 'scena') return [...lista].sort(alfabetycznie);

  const kolejnosc = new Map(listaEpizodow().map((e, i) => [e.slug, i]));
  const miejsce = (p) => kolejnosc.get(typ === 'epizod' ? p.slug : p.epizod) ?? Number.MAX_SAFE_INTEGER;
  // Sceny jednego epizodu porządkuje numer sceny (1-2 przed 1-10), stąd najpierw sortujSceny.
  const wstepnie = typ === 'scena' ? sortujSceny(lista) : [...lista];
  return wstepnie.sort((a, b) => miejsce(a) - miejsce(b));
}

/** Tyle pozycji boks „Powiązania" pokazuje od razu; resztę odsłania przycisk „Rozwiń" (ADR 0039). */
export const LIMIT_POWIAZAN = 50;

/** Klasa pozycji, grupy albo podpisu, które czekają na „Rozwiń"; ukrywa je CSS, nie skrypt. */
const PONAD_LIMIT = 'ponad-limit';

/**
 * Boks „Powiązania" w kolumnie bocznej: grupy po typie, przy każdej liczba stron.
 *
 * Długi boks jest zwinięty do `LIMIT_POWIAZAN` pozycji liczonych w kolejności
 * wyświetlania, przez wszystkie grupy. Pozostałe są w HTML-u od razu (odsyłacze
 * nie znikają ze strony), tylko niewidoczne do kliknięcia „Rozwiń". Licznik przy
 * nagłówku grupy zawsze podaje pełną liczbę stron.
 */
export function boksPowiazan(grupy) {
  const wpisy = [...grupy.entries()]
    .filter(([, lista]) => lista.length > 0)
    .sort((a, b) => KOLEJNOSC_TYPOW.indexOf(a[0]) - KOLEJNOSC_TYPOW.indexOf(b[0]));
  if (wpisy.length === 0) return '';

  const razem = wpisy.reduce((suma, [, lista]) => suma + lista.length, 0);
  const ukrytych = Math.max(0, razem - LIMIT_POWIAZAN);
  let wolnych = LIMIT_POWIAZAN;
  const grupyHtml = wpisy.map(([typ, lista]) => {
    const widocznych = Math.min(wolnych, lista.length);
    wolnych -= widocznych;
    return `
      <div class="grupa-powiazan${widocznych === 0 ? ` ${PONAD_LIMIT}` : ''}">
        <h3>${nazwaTypu(typ, 'wiele')} <span class="licznik">${lista.length}</span></h3>
        ${typ === 'epizod' || typ === 'scena' ? listaFabuly(typ, lista, widocznych) : `<ul class="lista-horyzontalna">
          ${lista.map((p, i) => `<li${i >= widocznych ? ` class="${PONAD_LIMIT}"` : ''}>${linkStrony(p)}</li>`).join('')}
        </ul>`}
      </div>`;
  }).join('');

  return `<section class="blok-powiazan"${ukrytych ? ' data-zwiniety' : ''}>
    <h2>Powiązania</h2>
    ${grupyHtml}${ukrytych ? `
    <button type="button" class="rozwin-powiazania" data-rozwin-powiazania aria-expanded="false">
      <span data-etykieta>Rozwiń</span> <span class="licznik">jeszcze ${ukrytych}</span>
    </button>` : ''}
  </section>`;
}

/**
 * Sceny i epizody: jedna pozycja w wierszu, z numerem — tytuły są długie,
 * a kolejność znaczy. Gdy lista obejmuje więcej niż jedną grę, każda gra
 * dostaje podpis: „01 Epizod 1" istnieje w każdej z nich. `widocznych` to
 * liczba pozycji mieszczących się w limicie boksu; dalsze czekają na „Rozwiń".
 */
function listaFabuly(typ, lista, widocznych = lista.length) {
  const graPozycji = (p) => (typ === 'scena' ? dajStrone(p.epizod)?.gra : p.gra) ?? null;
  const gry = new Map();
  for (const p of lista) {
    const gra = graPozycji(p);
    if (!gry.has(gra)) gry.set(gra, []);
    gry.get(gra).push(p);
  }
  // Numer pozycji w kolejności wyświetlania — grupowanie po grze mogło ją zmienić.
  let pokazanych = 0;
  const wiersz = (p) => {
    const ukryta = pokazanych >= widocznych;
    pokazanych += 1;
    const numer = typ === 'epizod' ? numerEpizodu(p.numer) : String(p.numer_sceny ?? '');
    return `
          <li${ukryta ? ` class="${PONAD_LIMIT}"` : ''}><a class="link-strony" href="${hrefDlaSlug(p.slug, p.typ)}">${numer ? `<span class="mono">${escapeHtml(numer)}</span> ` : ''}${escapeHtml(p.tytul)}</a></li>`;
  };
  return [...gry.entries()].map(([slugGry, pozycje]) => {
    const gra = slugGry ? dajStrone(slugGry) : null;
    // Gra, której żadna pozycja nie mieści się w limicie, chowa się razem z podpisem.
    const ukryta = pokazanych >= widocznych ? ` ${PONAD_LIMIT}` : '';
    const podpis = gry.size > 1 && gra ? `<p class="gra-fabuly${ukryta}">${escapeHtml(gra.tytul)}</p>` : '';
    return `${podpis}<ul class="lista-fabuly${ukryta}">${pozycje.map(wiersz).join('')}</ul>`;
  }).join('\n        ');
}
