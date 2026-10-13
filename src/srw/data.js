/**
 * Dostęp do danych bazy (SRW_DATA wstrzyknięte przez build — ADR 0001).
 *
 * Moduł celowo „głupi": zwraca bezpieczne puste struktury, gdy danych brak
 * (pusta baza ma renderować się poprawnie) i NIE waliduje nic — walidacje
 * robi build/testy przez registry.js.
 */

import { LISTY } from './links.js';

export function dajDane() {
  return globalThis.SRW_DATA ?? {
    zbudowano: '',
    strony: {},
    backlinki: {},
    tagi: {},
    statystyki: { gra: 0, epizod: 0, postac: 0, mech: 0, bron: 0, seria: 0, relacje: 0 },
    coNowego: [],
  };
}

export function dajStrone(slug) {
  return dajDane().strony[slug] ?? null;
}

export function listaStron(typ) {
  return Object.values(dajDane().strony).filter((s) => s.typ === typ);
}

/** Lista posortowana po tytule (locale pl). */
export function listaPosortowana(typ) {
  return listaStron(typ).sort((a, b) => String(a.tytul).localeCompare(String(b.tytul), 'pl'));
}

/** Epizody: sortowanie po grze, potem po numerze. */
export function listaEpizodow() {
  return listaStron('epizod').sort((a, b) => {
    const g = String(a.gra ?? '').localeCompare(String(b.gra ?? ''), 'pl');
    if (g !== 0) return g;
    return (a.numer ?? 0) - (b.numer ?? 0);
  });
}

/**
 * Lista przefiltrowana po polu-odsyłaczu (np. epizody jednej gry:
 * { typ: 'epizod', pole: 'gra', wartosc: 'demo' }).
 */
export function listaFiltrowana(typ, pole, wartosc) {
  if (!pole || !wartosc) return typ === 'epizod' ? listaEpizodow() : listaPosortowana(typ);
  const lista = listaStron(typ).filter((s) => {
    const v = s[pole];
    if (Array.isArray(v)) return v.includes(wartosc);
    return v === wartosc;
  });
  return typ === 'epizod' ? lista.sort((a, b) => (a.numer ?? 0) - (b.numer ?? 0)) : lista.sort((a, b) => String(a.tytul).localeCompare(String(b.tytul), 'pl'));
}

/** Backlinki strony → [{slug, typ, tytul}] (tytuł dociągany z rejestru). */
export function backlinkiStrony(slug) {
  const dane = dajDane();
  return (dane.backlinki[slug] ?? [])
    .map((b) => dane.strony[b.slug])
    .filter(Boolean);
}

/** Odsyłacze wychodzące strony, pogrupowane po typie celu. */
export function odsylaczeWychodzace(strona) {
  const dane = dajDane();
  const grupy = new Map();
  for (const cel of strona.linki ?? []) {
    const stronaCelu = dane.strony[cel];
    if (!stronaCelu) continue;
    if (!grupy.has(stronaCelu.typ)) grupy.set(stronaCelu.typ, []);
    if (!grupy.get(stronaCelu.typ).some((x) => x.slug === cel)) grupy.get(stronaCelu.typ).push(stronaCelu);
  }
  for (const lista of grupy.values()) lista.sort((a, b) => String(a.tytul).localeCompare(String(b.tytul), 'pl'));
  return grupy;
}

export function tagiMap() {
  return dajDane().tagi ?? {};
}

export function statystyki() {
  return dajDane().statystyki;
}

export function wpisyCoNowego() {
  return dajDane().coNowego ?? [];
}

/** Czy baza jest jeszcze w trybie demonstracyjnym (tylko gra "demo"). */
export function czyDemo() {
  const gry = listaStron('gra');
  return gry.length > 0 && gry.every((g) => g.slug === 'demo');
}

export { LISTY };
