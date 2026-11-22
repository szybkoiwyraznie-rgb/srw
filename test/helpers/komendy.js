/**
 * Odczyt tabel Komend Ducha (*Spirit Commands*) z archiwum dostaw.
 *
 * Reguła: stan opisuje **ostatni** blok, który w dostawach opisuje daną postać
 * (ADR 0044). Wcześniejsze bloki zostają w archiwum jako stan historyczny —
 * postacie dostają nowe komendy w miarę postępów w rozgrywce, więc tabela na
 * stronie zmienia się wraz z kolejną dostawą, a nie raz na zawsze.
 *
 * Moduł czytają testy; sam nie zawiera asercji.
 */
import fs from 'node:fs';
import path from 'node:path';

const KATALOG = 'dostawy/srw-oe';

/** Pliki dostaw w kolejności chronologicznej (prolog przed numerowanymi). */
export function plikiDostaw() {
  return fs.readdirSync(KATALOG)
    .filter((p) => /^dostawa_.*\.txt$/.test(p))
    .sort((a, b) => (a.includes('epizod_0') ? -1 : b.includes('epizod_0') ? 1 : a.localeCompare(b, 'pl', { numeric: true })));
}

/** Wiersze tabeli markdown zaczynające się od numeru slotu, bez skrajnych rurek. */
export function wierszeTabeli(tekst) {
  return tekst.split('\n')
    .filter((l) => /^\|\s*\d+\s*\|/.test(l))
    .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()).join('|'));
}

/**
 * Wiersz komendy bez różnic redakcyjnych: nazwa, poziom i koszt muszą się zgadzać
 * znak w znak, a w efekcie pomijamy doklejane w jednych dostawach, a w innych nie
 * „Efekt: 1 razy —” / „Efekt: 1 tura —” oraz interpunkcję myślników.
 */
export function kluczKomendy(wiersz) {
  const [slot, duch, poz, koszt, efekt] = wiersz.split('|');
  if (efekt === undefined) return null; // wiersz parametrów, nie komendy Ducha
  const opis = efekt
    .replace(/Efekt: 1 (?:razy|tura)\s*—\s*/g, '')
    .replace(/\s*—\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return [slot, duch, poz, koszt, opis].join('|');
}

/** Blok Komend Ducha z jednego fragmentu tekstu (albo null). */
export function blokDuchow(fragment) {
  const duchy = /\*\*Komendy Ducha[^\n]*\n([\s\S]*?)(?:\n\n|$)/.exec(fragment);
  if (!duchy) return null;
  const wiersze = wierszeTabeli(duchy[1]);
  return wiersze.length ? wiersze : null;
}

/**
 * Mapa „nazwa postaci → { plik, wiersze }” z ostatnim blokiem Komend Ducha.
 * Nazwa to nagłówek `###`/`####` w dostawie, czyli `tytul` strony postaci.
 */
export function ostatnieBlokiDuchow() {
  const ostatnie = new Map();
  for (const plik of plikiDostaw()) {
    const tekst = fs.readFileSync(path.join(KATALOG, plik), 'utf8').replace(/\r/g, '');
    for (const m of tekst.matchAll(/^#{3,4} ([^\n]+)\n([\s\S]*?)(?=^#{3,4} |$(?![\s\S]))/gm)) {
      const wiersze = blokDuchow(m[2]);
      if (wiersze) ostatnie.set(m[1].trim(), { plik, wiersze });
    }
  }
  return ostatnie;
}

/** Blok umiejętności pilota z jednego fragmentu tekstu (albo null). */
export function blokUmiejetnosci(fragment) {
  const sekcja = /(?:### Umiejętności|\*\*Umiejętności)[^\n]*\n([\s\S]*?)(?:\n\n|\n---|\n###|\n\}\}|$)/.exec(fragment);
  if (!sekcja) return null;
  const wiersze = wierszeTabeli(sekcja[1]);
  return wiersze.length ? wiersze : null;
}

/**
 * Mapa „nazwa postaci → { plik, wiersze }” z ostatnim blokiem umiejętności pilota.
 */
export function ostatnieBlokiUmiejetnosci() {
  const ostatnie = new Map();
  for (const plik of plikiDostaw()) {
    const tekst = fs.readFileSync(path.join(KATALOG, plik), 'utf8').replace(/\r/g, '');
    for (const m of tekst.matchAll(/^#{3,4} ([^\n]+)\n([\s\S]*?)(?=^#{3,4} |$(?![\s\S]))/gm)) {
      const wiersze = blokUmiejetnosci(m[2]);
      if (wiersze) ostatnie.set(m[1].trim(), { plik, wiersze });
    }
  }
  return ostatnie;
}

/**
 * Mapa „nazwa postaci → { plik, sp }” z ostatnią deklaracją puli SP podpilota.
 */
export function ostatniePuleSP() {
  const ostatnie = new Map();
  for (const plik of plikiDostaw()) {
    const tekst = fs.readFileSync(path.join(KATALOG, plik), 'utf8').replace(/\r/g, '');
    for (const m of tekst.matchAll(/^#{3,4} ([^\n]+)\n([\s\S]*?)(?=^#{3,4} |$(?![\s\S]))/gm)) {
      const sp = /Pula SP:\*?\*?\s*\*?\*?(\d+)/.exec(m[2]);
      if (sp) ostatnie.set(m[1].trim(), { plik, sp: Number(sp[1]) });
    }
  }
  return ostatnie;
}
