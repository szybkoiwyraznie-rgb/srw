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

/**
 * Plan kotwic sceny.
 *
 * Zwraca `kotwiceTresci` (mapa „tytuł#numer wystąpienia” → id nagłówka w treści),
 * `kotwiceAnalizy` (tytuł `###` analizy → id nagłówka analizy) i
 * `linkiAnalizy` (tytuł `###` analizy → id celu w treści sceny).
 * `problemy` zbiera błędy mapy `sekcje_analizy`; build je zatrzymuje.
 */
export function zaplanujScene(sekcje, mapa = []) {
  const problemy = [];
  const tresc = sekcje.find((s) => s.tytul === 'Treść sceny');
  const analiza = sekcje.find((s) => s.tytul === 'Analiza');

  const uzyteTresci = new Map();
  const uzyteIdTresci = new Map();
  const kotwiceTresci = new Map();
  const kolejnoscTresci = [];
  for (const h of naglowki(tresc?.tresc)) {
    const n = (uzyteTresci.get(h.tytul) ?? 0) + 1;
    uzyteTresci.set(h.tytul, n);
    const id = unikalnyId(`tresc-${slugify(h.tytul)}`, uzyteIdTresci);
    kotwiceTresci.set(`${h.tytul}\u0000${n}`, id);
    kolejnoscTresci.push({ tytul: h.tytul, poziom: h.poziom, id });
  }

  const tytulyAnalizy = naglowki(analiza?.tresc).filter((h) => h.poziom === 3).map((h) => h.tytul);
  const uzyteAnalizy = new Map();
  const kotwiceAnalizy = new Map();
  const linkiAnalizy = new Map();
  for (const tytul of tytulyAnalizy) {
    kotwiceAnalizy.set(tytul, unikalnyId(`analiza-${slugify(tytul)}`, uzyteAnalizy));
  }

  const zuzyteTresci = new Map();
  for (const wpis of Array.isArray(mapa) ? mapa : []) {
    const czesci = String(wpis).split(/\s*(?:→|->)\s*/);
    if (czesci.length !== 2 || czesci.some((c) => c.trim() === '')) {
      problemy.push(`sekcje_analizy: "${wpis}" nie jest parą "podsekcja analizy → podsekcja treści"`);
      continue;
    }
    const [zAnalizy, zTresci] = czesci.map((c) => c.trim());
    if (!tytulyAnalizy.includes(zAnalizy)) {
      problemy.push(`sekcje_analizy: „${zAnalizy}” nie jest podsekcją analizy`);
      continue;
    }
    if (!kolejnoscTresci.some((h) => h.tytul === zTresci)) {
      problemy.push(`sekcje_analizy: „${zTresci}” nie jest podsekcją treści sceny`);
      continue;
    }
    const n = (zuzyteTresci.get(zTresci) ?? 0) + 1;
    zuzyteTresci.set(zTresci, n);
    const id = kotwiceTresci.get(`${zTresci}\u0000${n}`);
    if (!id) {
      problemy.push(`sekcje_analizy: „${zTresci}” wskazano częściej, niż występuje w treści sceny`);
      continue;
    }
    linkiAnalizy.set(zAnalizy, id);
  }

  return { kotwiceTresci, kotwiceAnalizy, linkiAnalizy, kolejnoscTresci, problemy };
}

/**
 * Funkcja `atrybutyNaglowka` dla renderera: nadaje identyfikatory nagłówkom
 * treści sceny i zamienia tytuły podsekcji analizy w odsyłacze do jej miejsca.
 */
export function kotwiceSekcji(tytulSekcji, plan, { hrefStrony = '' } = {}) {
  const liczniki = new Map();
  return (poziom, tytul, html) => {
    if (tytulSekcji === 'Treść sceny') {
      const n = (liczniki.get(tytul) ?? 0) + 1;
      liczniki.set(tytul, n);
      const id = plan.kotwiceTresci.get(`${tytul}\u0000${n}`);
      return id ? { id } : null;
    }
    if (tytulSekcji === 'Analiza' && poziom === 3) {
      const id = plan.kotwiceAnalizy.get(tytul);
      if (!id) return null;
      const cel = plan.linkiAnalizy.get(tytul);
      const wewnetrzny = cel
        ? `<a class="skok-do-tresci" href="${hrefStrony || `#${cel}`}" data-cel="${cel}">${html}</a>`
        : html;
      return { id, wewnetrzny };
    }
    return null;
  };
}
