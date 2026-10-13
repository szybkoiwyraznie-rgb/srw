/**
 * Rejestr stron i walidacje schematów (ADR 0003).
 *
 * Czysty moduł (bez DOM/fs): używają go build (walidacja przed emisją
 * artefaktu), testy integralności i przeglądarka (backlinki, tagi, listy).
 *
 * Zasada: baza jest tak dobra, jak mocno strzeżone są jej niezmienniki.
 * Każda reguła zwraca PROBLEM (string), który build/test raportuje.
 *
 * Świadoma oszczędność: NIE ma zamkniętych list sekcji ani obowiązkowego
 * słownika tagów. Schemat pilnuje tylko tego, bez czego graf się rozjeżdża
 * (istnienie encji, poprawność odsyłaczy, źródła dla wiedzy spoza skryptu).
 */

import { SLUG_RE, hrefDlaSlug, slugify } from './links.js';

export const TYPY_STRON = ['gra', 'epizod', 'postac', 'mech', 'bron', 'seria'];

/** Typy encji odnoszące się do serii anime/mangi. */
export const TYPY_Z_SERIA = ['postac', 'mech'];

/** Poziom pochodzenia informacji. Hierarchia: skrypt > menu gry > wiedza. */
export const POCHODZENIA = ['skrypt', 'menu', 'wiedza'];

/** Klasy broni (swobodne, ale z sensowną listą startową). */
export const KLASY_BRONI = [
  'bron-biala', 'strzelecka', 'beam', 'rakietowa', 'specjalna', 'obrona', 'wsparcie',
];

export const RODZAJE_SERII = ['tv', 'ova', 'film', 'manga', 'gra', 'powiesc', 'inne'];

export const STATUSY_GRY = ['planowana', 'w-toku', 'ukończona', 'porzucona'];

export const ROLE_POSTACI = ['pilot', 'wsparcie', 'dowodztwo', 'antagonista', 'postac', 'inne'];

/** Sekcje wymagane w treści strony, zależnie od typu. */
export const SEKCJE_WYMAGANE = {
  gra: [],
  epizod: ['Streszczenie'],
  postac: ['Opis'],
  mech: ['Opis'],
  bron: ['Opis'],
  seria: ['Opis'],
};

/**
 * Pola odsyłaczy: nazwa pola → typ celu i kształt wartości.
 * `wiele: false` to pojedynczy slug (np. `seria` postaci), `true` — tablica.
 */
export const POLA_RELACJI = {
  gra: { typ: 'gra', wiele: false },
  seria: { typ: 'seria', wiele: false },
  postacie: { typ: 'postac', wiele: true },
  mechy: { typ: 'mech', wiele: true },
  bronie: { typ: 'bron', wiele: true },
  serie: { typ: 'seria', wiele: true },
  gry: { typ: 'gra', wiele: true },
  piloci: { typ: 'postac', wiele: true },
};

const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Wyciąga tytuły sekcji h2 z ciała markdown. */
export function wytnijSekcje(body) {
  return [...String(body).matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());
}

/** Waliduje jedną stronę; zwraca listę problemów (pusta = OK). */
export function walidujStrone(strona, ctx) {
  const p = [];
  const gdzie = strona?.slug ?? strona?.plik ?? '(bez sluga)';

  if (!strona || typeof strona !== 'object') return [`strona: brak obiektu (${gdzie})`];
  if (!TYPY_STRON.includes(strona.typ)) p.push(`${gdzie}: nieznany typ "${strona.typ}"`);
  if (!SLUG_RE.test(strona.slug ?? '')) p.push(`${gdzie}: slug "${strona.slug}" nie przechodzi wzorca ${SLUG_RE}`);
  if (typeof strona.tytul !== 'string' || strona.tytul.trim() === '') p.push(`${gdzie}: brak tytułu`);
  if (strona.utworzono !== undefined && !DATA_RE.test(String(strona.utworzono))) {
    p.push(`${gdzie}: utworzono "${strona.utworzono}" nie jest datą YYYY-MM-DD`);
  }
  if (strona.pochodzenie !== undefined && !POCHODZENIA.includes(strona.pochodzenie)) {
    p.push(`${gdzie}: pochodzenie "${strona.pochodzenie}" poza ${POCHODZENIA.join('/')}`);
  }
  if (!Array.isArray(strona.tagi)) {
    if (strona.tagi !== undefined) p.push(`${gdzie}: tagi muszą być tablicą`);
  } else if (strona.tagi.some((t) => typeof t !== 'string' || !SLUG_RE.test(t))) {
    p.push(`${gdzie}: tagi muszą być slugami (małe litery, myślniki)`);
  }

  // Odsyłacze: każde pole-relacja musi wskazywać istniejącą stronę właściwego typu.
  for (const [pole, { typ, wiele }] of Object.entries(POLA_RELACJI)) {
    const wartosc = strona[pole];
    if (wartosc === undefined || wartosc === null) continue;
    if (wiele && !Array.isArray(wartosc)) { p.push(`${gdzie}: "${pole}" musi być tablicą slugów`); continue; }
    if (!wiele && typeof wartosc !== 'string') { p.push(`${gdzie}: "${pole}" musi być pojedynczym slugiem`); continue; }
    for (const cel of wiele ? wartosc : [wartosc]) {
      const stronaCelu = ctx.bySlug.get(cel);
      if (!stronaCelu) p.push(`${gdzie}: "${pole}" → "${cel}" nie istnieje w bazie`);
      else if (stronaCelu.typ !== typ) p.push(`${gdzie}: "${pole}" → "${cel}" ma typ "${stronaCelu.typ}", oczekiwano "${typ}"`);
    }
  }

  // Źródła: wiedza spoza skryptu MUSI mieć dokąd odesłać (ADR 0004).
  const zrodla = strona.zrodla ?? [];
  if (!Array.isArray(zrodla)) p.push(`${gdzie}: "zrodla" musi być tablicą`);
  if (strona.pochodzenie === 'wiedza' && zrodla.length === 0) {
    p.push(`${gdzie}: pochodzenie "wiedza" wymaga sekcji "## Źródła" z linkami (ADR 0004)`);
  }
  for (const z of zrodla) {
    if (typeof z !== 'string' || !/^https?:\/\//.test(z)) {
      p.push(`${gdzie}: źródło "${z}" nie jest adresem http(s)`);
    }
  }

  const sekcje = wytnijSekcje(strona.body ?? '');
  for (const s of SEKCJE_WYMAGANE[strona.typ] ?? []) {
    if (!sekcje.includes(s)) p.push(`${gdzie}: brak obowiązkowej sekcji "## ${s}"`);
  }
  if (zrodla.length > 0 && !sekcje.includes('Źródła')) {
    p.push(`${gdzie}: pole "zrodla" wypełnione, ale brak sekcji "## Źródła"`);
  }

  if (strona.typ === 'epizod') {
    if (!Number.isInteger(strona.numer) || strona.numer < 1) p.push(`${gdzie}: epizod wymaga liczbowego "numer" ≥ 1`);
    const gra = ctx.bySlug.get(strona.gra);
    if (!gra) p.push(`${gdzie}: "gra" → "${strona.gra}" nie istnieje w bazie`);
    else if (gra.typ !== 'gra') p.push(`${gdzie}: "gra" → "${strona.gra}" ma typ "${gra.typ}"`);
    if (strona.rozegrano !== undefined && !DATA_RE.test(String(strona.rozegrano))) {
      p.push(`${gdzie}: rozegrano "${strona.rozegrano}" nie jest datą YYYY-MM-DD`);
    }
    if (strona.skrypt !== undefined && typeof strona.skrypt !== 'string') p.push(`${gdzie}: "skrypt" musi być ścieżką`);
    const bronie = strona.bronie;
    if (bronie !== undefined && !Array.isArray(bronie)) p.push(`${gdzie}: "bronie" musi być tablicą`);
  }

  if (strona.typ === 'gra') {
    if (strona.status !== undefined && !STATUSY_GRY.includes(strona.status)) {
      p.push(`${gdzie}: status "${strona.status}" poza ${STATUSY_GRY.join('/')}`);
    }
  }

  if (strona.typ === 'seria') {
    if (strona.rodzaj !== undefined && !RODZAJE_SERII.includes(strona.rodzaj)) {
      p.push(`${gdzie}: rodzaj "${strona.rodzaj}" poza ${RODZAJE_SERII.join('/')}`);
    }
    if (strona.rok !== undefined && !Number.isInteger(strona.rok)) p.push(`${gdzie}: "rok" musi być liczbą`);
  }

  if (TYPY_Z_SERIA.includes(strona.typ)) {
    const seria = ctx.bySlug.get(strona.seria);
    if (!seria) p.push(`${gdzie}: "seria" → "${strona.seria}" nie istnieje w bazie`);
    else if (seria.typ !== 'seria') p.push(`${gdzie}: "seria" → "${strona.seria}" ma typ "${seria.typ}"`);
  }

  if (strona.typ === 'bron') {
    if (strona.klasa !== undefined && !KLASY_BRONI.includes(strona.klasa)) {
      p.push(`${gdzie}: klasa "${strona.klasa}" poza listą startową (dopisz nową do KLASY_BRONI, jeśli potrzebna)`);
    }
  }

  if (strona.typ === 'postac') {
    if (strona.rola !== undefined && !ROLE_POSTACI.includes(strona.rola)) {
      p.push(`${gdzie}: rola "${strona.rola}" poza ${ROLE_POSTACI.join('/')}`);
    }
  }

  return p;
}

/** Buduje rejestr slug→strona; wykrywa duplikaty (jedna przestrzeń nazw). */
export function zbudujRejestr(strony) {
  const bySlug = new Map();
  const duplikaty = [];
  for (const s of strony) {
    if (bySlug.has(s.slug)) duplikaty.push(`${s.slug} (${bySlug.get(s.slug).plik} oraz ${s.plik})`);
    else bySlug.set(s.slug, s);
  }
  return { bySlug, duplikaty };
}

/** Resolver wikilinków dla renderera markdown. */
export function resolverLinkow(bySlug) {
  return (slug) => {
    const strona = bySlug.get(slug);
    if (!strona) return null;
    return { href: hrefDlaSlug(strona.slug, strona.typ), tytul: strona.tytul, typ: strona.typ };
  };
}

/** Backlinki: slug → posortowane [{slug, typ}] stron linkujących. */
export function policzBacklinki(strony) {
  const backlinki = {};
  for (const s of strony) {
    for (const cel of s.linki ?? []) {
      if (!backlinki[cel]) backlinki[cel] = [];
      if (!backlinki[cel].some((x) => x.slug === s.slug)) backlinki[cel].push({ slug: s.slug, typ: s.typ });
    }
  }
  for (const k of Object.keys(backlinki)) backlinki[k].sort((a, b) => a.slug.localeCompare(b.slug, 'pl'));
  return backlinki;
}

/** Indeks tagów: tag → posortowane slugi. */
export function policzTagi(strony) {
  const tagi = {};
  for (const s of strony) {
    for (const t of s.tagi ?? []) {
      if (!tagi[t]) tagi[t] = [];
      tagi[t].push(s.slug);
    }
  }
  for (const k of Object.keys(tagi)) tagi[k].sort();
  return tagi;
}

/** Agregaty widoczne na stronie głównej i w stopce. */
export function policzStatystyki(strony) {
  const s = { gra: 0, epizod: 0, postac: 0, mech: 0, bron: 0, seria: 0, relacje: 0 };
  for (const p of strony) {
    if (Object.prototype.hasOwnProperty.call(s, p.typ)) s[p.typ] += 1;
    s.relacje += odsylaczeStrony(p).length;
  }
  return s;
}

/** Wszystkie odsyłacze strony (pola-relacje + wikilinki z treści) bez duplikatów. */
export function odsylaczeStrony(strona) {
  const zbior = new Set();
  for (const [pole, { wiele }] of Object.entries(POLA_RELACJI)) {
    const wartosc = strona[pole];
    if (wiele && Array.isArray(wartosc)) for (const cel of wartosc) zbior.add(cel);
    if (!wiele && typeof wartosc === 'string' && wartosc !== '') zbior.add(wartosc);
  }
  for (const cel of strona.linki ?? []) zbior.add(cel);
  zbior.delete(strona.slug);
  return [...zbior];
}

export { slugify };
