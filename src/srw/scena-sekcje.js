/**
 * Podział strony sceny na boksy i kotwice między nimi (decyzja właściciela 2026-10-22).
 *
 * Scena jest jedynym typem strony, którego treść składa się z kilku niezależnych
 * części: dosłownej treści skryptu, analizy, nawiązań do oryginału i wątków.
 * Wszystkie stoją w jednym pliku pod nagłówkami `##`, więc build rozcina ciało
 * strony na sekcje i renderuje każdą osobno — dopiero wtedy można je rozłożyć
 * na dwie kolumny.
 *
 * Podsekcje analizy (`###`) prowadzą do odpowiadających im miejsc treści sceny.
 * Powiązanie jest jawne (frontmatter `sekcje_analizy`), bo tytuły po obu stronach
 * są redagowane niezależnie i kolejność nie zawsze się zgadza.
 */

import { BLOK_OTWARCIA_RE } from './markdown.js';
import { slugify } from './links.js';

/** Tytuły sekcji sceny w kolejności czytania. */
export const SEKCJE_SCENY = ['Treść sceny', 'Analiza', 'Nawiązania do oryginalnych odcinków', 'Wątki w scenie'];

/**
 * Dzieli ciało strony sceny na sekcje `##` wraz z otaczającym je blokiem
 * poziomu wiarygodności. Nagłówki wewnątrz `:::skrypt` są dosłownym tekstem
 * skryptu i nie zaczynają nowej sekcji.
 */
export function podzielScene(body) {
  const sekcje = [];
  let otwarcie = null;
  let wSkrypcie = false;
  let biezaca = null;

  const zamknij = () => {
    if (!biezaca) return;
    biezaca.tresc = biezaca.linie.join('\n').replace(/^\n+|\n+$/g, '');
    delete biezaca.linie;
    sekcje.push(biezaca);
    biezaca = null;
  };

  for (const linia of String(body ?? '').split('\n')) {
    const t = linia.trim();

    if (/^:::/.test(t)) {
      wSkrypcie = !wSkrypcie;
      if (biezaca) biezaca.linie.push(linia);
      continue;
    }
    if (wSkrypcie) {
      if (biezaca) biezaca.linie.push(linia);
      continue;
    }

    if (BLOK_OTWARCIA_RE.test(t)) { otwarcie = t; continue; }
    if (t === '}}') { otwarcie = null; continue; }

    const h = linia.match(/^##\s+(.+?)\s*$/);
    if (h) {
      zamknij();
      biezaca = { tytul: h[1], otwarcie, linie: [] };
      continue;
    }
    if (biezaca) biezaca.linie.push(linia);
  }
  zamknij();
  return sekcje;
}

/** Nagłówki `##`–`####` w treści sekcji, w kolejności wystąpienia. */
function naglowki(tresc) {
  const wynik = [];
  for (const linia of String(tresc ?? '').split('\n')) {
    const m = linia.match(/^(#{2,4})\s+(.+?)\s*$/);
    if (m) wynik.push({ poziom: m[1].length, tytul: m[2] });
  }
  return wynik;
}

/**
 * Dzieli ciało strony na boksy: każdy nagłówek `##` otwiera nowy boks,
 * a zmiana bloku poziomu bez nagłówka (np. `{{zrodlo}}` → `{{wiedza}}`)
 * domyka poprzedni, bo blok ma własne tło i nie dzieli boksy z innym.
 *
 * Zwraca `[{ tytul, bloki: [{ otwarcie, tresc }] }]`; `tytul` bywa `null`,
 * gdy blok nie ma nagłówka. Nagłówki wewnątrz `:::skrypt` są dosłownym
 * tekstem skryptu i nie zaczynają boksy.
 */
export function podzielNaBoksy(body) {
  const boksy = [];
  let boks = null;
  let blok = null;
  let otwarcie = null;
  let wSkrypcie = false;

  const zamknijBlok = () => {
    if (!blok) return;
    blok.tresc = blok.linie.join('\n').replace(/^\n+|\n+$/g, '');
    delete blok.linie;
    if (boks && blok.tresc !== '') boks.bloki.push(blok);
    blok = null;
  };
  const zamknijBoks = () => {
    zamknijBlok();
    if (!boks) return;
    if (boks.bloki.length > 0) boksy.push(boks);
    boks = null;
  };

  for (const linia of String(body ?? '').split('\n')) {
    const t = linia.trim();

    if (/^:::/.test(t)) {
      wSkrypcie = !wSkrypcie;
      if (blok) blok.linie.push(linia);
      continue;
    }
    if (wSkrypcie) {
      if (blok) blok.linie.push(linia);
      continue;
    }

    if (BLOK_OTWARCIA_RE.test(t)) {
      otwarcie = t;
      if (boks && boks.bloki.length > 0) zamknijBoks();
      if (!boks) boks = { tytul: null, bloki: [] };
      zamknijBlok();
      blok = { otwarcie, linie: [] };
      continue;
    }
    if (t === '}}') { otwarcie = null; zamknijBlok(); continue; }

    const h = linia.match(/^##\s+(.+?)\s*$/);
    if (h) {
      zamknijBoks();
      boks = { tytul: h[1], bloki: [] };
      blok = { otwarcie, linie: [linia] };
      continue;
    }
    if (blok) blok.linie.push(linia);
  }
  zamknijBoks();
  return boksy;
}

/** Identyfikator kotwicy z tytułu; powtórki dostają numer na końcu. */
function unikalnyId(baza, uzyte) {
  const n = (uzyte.get(baza) ?? 0) + 1;
  uzyte.set(baza, n);
  return n === 1 ? baza : `${baza}-${n}`;
}

/** Klucz tytułu i numeru jego wystąpienia; separator nie może wejść do Markdown. */
function kluczWystapienia(tytul, numer) {
  return `${tytul}\u0000${numer}`;
}

/** Wszystkie nagłówki z sekcji o danym tytule, także gdy sama sekcja się powtarza. */
function naglowkiSekcji(sekcje, tytul) {
  return sekcje.filter((s) => s.tytul === tytul).flatMap((s) => naglowki(s.tresc));
}

/**
 * Plan kotwic sceny.
 *
 * Mapy używają klucza „tytuł + numer wystąpienia”, więc powtórzone tytuły
 * zarówno w treści, jak i analizie zachowują osobne identyfikatory i cele.
 * Każda podsekcja `###` analizy musi mieć dokładnie jeden wpis w
 * `sekcje_analizy`; `problemy` zbiera braki, nadmiary i błędne cele.
 */
export function zaplanujScene(sekcje, mapa = []) {
  const problemy = [];

  const uzyteTresci = new Map();
  const uzyteIdTresci = new Map();
  const kotwiceTresci = new Map();
  const kolejnoscTresci = [];
  for (const h of naglowkiSekcji(sekcje, 'Treść sceny')) {
    const n = (uzyteTresci.get(h.tytul) ?? 0) + 1;
    uzyteTresci.set(h.tytul, n);
    const id = unikalnyId(`tresc-${slugify(h.tytul)}`, uzyteIdTresci);
    kotwiceTresci.set(kluczWystapienia(h.tytul, n), id);
    kolejnoscTresci.push({ tytul: h.tytul, poziom: h.poziom, numer: n, id });
  }

  const podsekcjeAnalizy = [];
  const liczbyAnalizy = new Map();
  const uzyteIdAnalizy = new Map();
  const kotwiceAnalizy = new Map();
  const linkiAnalizy = new Map();
  for (const h of naglowkiSekcji(sekcje, 'Analiza').filter((x) => x.poziom === 3)) {
    const n = (liczbyAnalizy.get(h.tytul) ?? 0) + 1;
    liczbyAnalizy.set(h.tytul, n);
    const klucz = kluczWystapienia(h.tytul, n);
    const id = unikalnyId(`analiza-${slugify(h.tytul)}`, uzyteIdAnalizy);
    kotwiceAnalizy.set(klucz, id);
    podsekcjeAnalizy.push({ tytul: h.tytul, numer: n, klucz });
  }

  const zuzyteAnalizy = new Map();
  const zuzyteTresci = new Map();
  const zmapowaneAnalizy = new Set();
  for (const wpis of Array.isArray(mapa) ? mapa : []) {
    const czesci = String(wpis).split(/\s*(?:→|->)\s*/);
    if (czesci.length !== 2 || czesci.some((c) => c.trim() === '')) {
      problemy.push(`sekcje_analizy: "${wpis}" nie jest parą "podsekcja analizy → podsekcja treści"`);
      continue;
    }
    const [zAnalizy, zTresci] = czesci.map((c) => c.trim());
    if (!liczbyAnalizy.has(zAnalizy)) {
      problemy.push(`sekcje_analizy: „${zAnalizy}” nie jest podsekcją analizy`);
      continue;
    }

    const numerAnalizy = (zuzyteAnalizy.get(zAnalizy) ?? 0) + 1;
    zuzyteAnalizy.set(zAnalizy, numerAnalizy);
    const kluczAnalizy = kluczWystapienia(zAnalizy, numerAnalizy);
    if (!kotwiceAnalizy.has(kluczAnalizy)) {
      problemy.push(`sekcje_analizy: „${zAnalizy}” wskazano częściej, niż występuje w analizie`);
      continue;
    }
    // Błędny cel już jest pełnym błędem tej pary — nie dokładamy do niego
    // drugiego komunikatu o braku mapowania tej samej podsekcji.
    zmapowaneAnalizy.add(kluczAnalizy);

    if (!kolejnoscTresci.some((h) => h.tytul === zTresci)) {
      problemy.push(`sekcje_analizy: „${zTresci}” nie jest podsekcją treści sceny`);
      continue;
    }
    const numerTresci = (zuzyteTresci.get(zTresci) ?? 0) + 1;
    zuzyteTresci.set(zTresci, numerTresci);
    const id = kotwiceTresci.get(kluczWystapienia(zTresci, numerTresci));
    if (!id) {
      problemy.push(`sekcje_analizy: „${zTresci}” wskazano częściej, niż występuje w treści sceny`);
      continue;
    }
    linkiAnalizy.set(kluczAnalizy, id);
  }

  for (const podsekcja of podsekcjeAnalizy) {
    if (zmapowaneAnalizy.has(podsekcja.klucz)) continue;
    const dopisek = (liczbyAnalizy.get(podsekcja.tytul) ?? 0) > 1
      ? ` (wystąpienie ${podsekcja.numer})`
      : '';
    problemy.push(`sekcje_analizy: podsekcja analizy „${podsekcja.tytul}”${dopisek} nie ma mapowania do treści sceny`);
  }

  return {
    kotwiceTresci, kotwiceAnalizy, linkiAnalizy, kolejnoscTresci, podsekcjeAnalizy, problemy,
  };
}

/**
 * Funkcja `atrybutyNaglowka` dla renderera: nadaje identyfikatory nagłówkom
 * treści sceny i zamienia tytuły podsekcji analizy w odsyłacze do jej miejsca.
 * `stan` jest współdzielony między powtórzonymi sekcjami tej samej sceny.
 */
export function kotwiceSekcji(tytulSekcji, plan, { hrefStrony = '', stan = null } = {}) {
  const licznik = (nazwa) => {
    if (!stan) return new Map();
    if (!(stan[nazwa] instanceof Map)) stan[nazwa] = new Map();
    return stan[nazwa];
  };
  const licznikiTresci = licznik('tresc');
  const licznikiAnalizy = licznik('analiza');

  return (poziom, tytul, html) => {
    if (tytulSekcji === 'Treść sceny') {
      const n = (licznikiTresci.get(tytul) ?? 0) + 1;
      licznikiTresci.set(tytul, n);
      const id = plan.kotwiceTresci.get(kluczWystapienia(tytul, n));
      return id ? { id } : null;
    }
    if (tytulSekcji === 'Analiza' && poziom === 3) {
      const n = (licznikiAnalizy.get(tytul) ?? 0) + 1;
      licznikiAnalizy.set(tytul, n);
      const klucz = kluczWystapienia(tytul, n);
      const id = plan.kotwiceAnalizy.get(klucz);
      if (!id) return null;
      const cel = plan.linkiAnalizy.get(klucz);
      const wewnetrzny = cel
        ? `<a class="skok-do-tresci" href="${hrefStrony || `#${cel}`}" data-cel="${cel}">${html}</a>`
        : html;
      return { id, wewnetrzny };
    }
    return null;
  };
}
