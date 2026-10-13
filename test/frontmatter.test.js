import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter } from '../src/srw/frontmatter.js';

test('parsuje wartości skalarne, liczby i boole', () => {
  const { data, body } = parseFrontmatter(`---\ntyp: gra\nrok: 2013\nstatus: w-toku\nukonczona: false\n---\ntreść\n`);
  assert.equal(data.typ, 'gra');
  assert.equal(data.rok, 2013);
  assert.equal(data.ukonczona, false);
  assert.equal(body.trim(), 'treść');
});

test('parsuje tablice inline i blokowe', () => {
  const inline = parseFrontmatter(`---\ntagi: [demo, szkielet]\n---\n`).data;
  assert.deepEqual(inline.tagi, ['demo', 'szkielet']);

  const blok = parseFrontmatter(`---\nmechy:\n  - rx-78-2-gundam\n  - mazinger-z\n---\n`).data;
  assert.deepEqual(blok.mechy, ['rx-78-2-gundam', 'mazinger-z']);

  const pusta = parseFrontmatter(`---\ntagi: []\n---\n`).data;
  assert.deepEqual(pusta.tagi, []);
});

test('parsuje obiekt jednopoziomowy (parametry per gra)', () => {
  const { data } = parseFrontmatter(`---\nw_gre:\n  demo: 4200\n  inne: 3800\n---\n`);
  assert.deepEqual(data.w_gre, { demo: 4200, inne: 3800 });
});

test('wartość z dwukropkiem wymaga cudzysłowu', () => {
  assert.throws(() => parseFrontmatter(`---\ntytul: Gra: część druga\n---\n`), /ujmij w cudzysłów/);
  const { data } = parseFrontmatter(`---\ntytul: "Gra: część druga"\n---\n`);
  assert.equal(data.tytul, 'Gra: część druga');
});

test('zduplikowany klucz to błąd, nie ciche nadpisanie', () => {
  assert.throws(() => parseFrontmatter(`---\nslug: a\nslug: b\n---\n`), /zduplikowany klucz/);
});

test('brak frontmattera zwraca null i całe ciało', () => {
  const { data, body } = parseFrontmatter('## Tytuł\n\ntekst\n');
  assert.equal(data, null);
  assert.match(body, /## Tytuł/);
});

test('zbyt głębokie wcięcie jest błędem', () => {
  assert.throws(
    () => parseFrontmatter(`---\nw_gre:\n  demo:\n    hp: 1\n---\n`),
    /zbyt głębokie wcięcie|nierozpoznana linia/,
  );
});
