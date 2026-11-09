/**
 * Publiczny dziennik `content/co-nowego.md` (ADR 0005 pkt 4, ADR 0018).
 *
 * Testy pilnują trzech rzeczy:
 * - każdy wpis ma nagłówek `## RRRR-MM-DD GG:MM` i przynajmniej jedną pozycję treści,
 * - wpisy idą od najnowszego do najstarszego i nie powtarzają znacznika czasu,
 * - dziennik opisuje bazę, a nie interfejs ani inne technikalia
 *   (ADR 0018, adnotacja z 2026-10-22).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const tekst = fs.readFileSync('content/co-nowego.md', 'utf8');
const linie = tekst.split('\n');

function wpisy() {
  const wynik = [];
  let biezacy = null;
  for (const linia of linie) {
    if (linia.startsWith('## ')) {
      biezacy = { naglowek: linia.slice(3).trim(), tresc: [] };
      wynik.push(biezacy);
    } else if (biezacy && linia.trim()) {
      biezacy.tresc.push(linia.trim());
    }
  }
  return wynik;
}

test('każdy wpis dziennika ma poprawny znacznik czasu i niepustą treść', () => {
  const lista = wpisy();
  assert.ok(lista.length > 50, 'dziennik zawiera historię zmian bazy');
  for (const wpis of lista) {
    assert.match(wpis.naglowek, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/, `nagłówek „${wpis.naglowek}”`);
    assert.ok(wpis.tresc.length > 0, `wpis ${wpis.naglowek} nie ma treści`);
    assert.ok(
      wpis.tresc.some((linia) => linia.startsWith('- ')),
      `wpis ${wpis.naglowek} nie ma pozycji listy`,
    );
  }
});

test('wpisy idą od najnowszego i mają unikalne znaczniki czasu', () => {
  const naglowki = wpisy().map((wpis) => wpis.naglowek);
  const unikalne = new Set(naglowki);
  assert.equal(unikalne.size, naglowki.length, 'powtórzony znacznik czasu w dzienniku');
  const posortowane = [...naglowki].sort().reverse();
  assert.deepEqual(naglowki, posortowane, 'kolejność wpisów musi być malejąca');
});

test('dziennik nie opisuje interfejsu ani technikaliów (ADR 0018)', () => {
  const technikalia = new RegExp([
    // interfejs i sposób wyświetlania
    'chmur[aęy] tagów', 'kafelk', 'filtr[a-ząćęłńóśźż]*\\b', 'interfejs', 'miniatur',
    'na pełnym ekranie', 'układ stron', 'wydajnoś', 'rozmiar artefaktu', 'plik witryny',
    // budowa stron i danych
    'odsyłacz', 'podsekcj', 'kotwic', 'kolumn', 'etykiet', 'rekord', 'własną stronę',
    'pole danych', 'numer sceny',
    // struktura bazy i formatowanie (adnotacja ADR 0018 z 2026-11-09)
    'wpis[a-ząćęłńóśźż]*', '\\bmenu\\b',
    'źródł[a-ząćęłńóśźż]*', 'tabel[a-ząćęłńóśźż]*', 'widok[a-ząćęłńóśźż]*',
    'ilustracj[a-ząćęłńóśźż]*', 'galeri[a-ząćęłńóśźż]*', 'formatow[a-ząćęłńóśźż]*',
    'profil[a-ząćęłńóśźż]*', '\\btag(?:i|u|iem|ów|ach|ami|owi)?\\b',
    '\\bopis\\b|\\bopisy\\b|\\bopisem\\b|\\bopisów\\b|\\bopisie\\b|\\bopisami\\b|\\bopisach\\b',
    '\\bstron[ay]\\b|\\bstronie\\b|\\bstronach\\b|\\bstronom\\b|\\bstronami\\b',
    'nowe strony', 'nowe hasła', 'nowe opisy', 'nowe profile', 'nowi piloci', 'nowe postacie',
    'nowe jednostki',
    // praca nad bazą zamiast treści bazy
    'audyt', 'dostaw[ay]\\b', 'właściciel', 'poprawki językowe', 'składni[aęi]', 'literówk',
    'wikipedi', 'odsyła linkiem', 'potwierdzon[aey] źródłowo', 'sprawdzone źródło',
    'dawny domysł', 'sub-pilot',
  ].join('|'), 'i');
  // „Bloku” w znaczeniu struktury strony pilnuje osobny wzorzec bez flagi i —
  // nazwa umiejętności „Blok” z gry jest częścią fabuły i zostaje.
  const blokStrukturalny = /(?<![\p{L}])blok(?:i|iem|ów|ach|owi|u)?(?![\p{L}])/u;
  for (const wpis of wpisy()) {
    for (const linia of wpis.tresc) {
      assert.doesNotMatch(linia, technikalia, `wpis ${wpis.naglowek} opisuje proces, nie fabułę`);
      assert.doesNotMatch(linia, blokStrukturalny, `wpis ${wpis.naglowek} opisuje blok strony, nie fabułę`);
    }
  }
});
