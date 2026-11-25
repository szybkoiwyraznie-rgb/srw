/**
 * Publiczny dziennik `content/co-nowego.md` (ADR 0005 pkt 4).
 * Testy walidują wyłącznie format wpisów i ich chronologię:
 * - każdy wpis ma nagłówek `## RRRR-MM-DD GG:MM` i co najmniej jedną pozycję,
 * - wpisy idą od najnowszego do najstarszego i nie powtarzają znacznika czasu.
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
