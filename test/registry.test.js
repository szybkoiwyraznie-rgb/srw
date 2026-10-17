import test from 'node:test';
import assert from 'node:assert/strict';
import { walidujStrone, zbudujRejestr, policzBacklinki } from '../src/srw/registry.js';

const strona = (pola) => ({
  typ: 'postac', slug: 'amuro-ray', tytul: 'Amuro Ray', tagi: [],
  body: '## Opis\n\ntekst\n', ...pola,
});

const ctxZ = (strony) => ({ bySlug: zbudujRejestr(strony).bySlug });

const seria = {
  typ: 'seria', slug: 'mobile-suit-gundam-1979', tytul: 'Gundam', tagi: [],
  body: '## Opis\n\ntekst\n',
};

test('poprawna strona nie generuje problemów', () => {
  const ctx = ctxZ([seria]);
  assert.deepEqual(walidujStrone(strona({ seria: 'mobile-suit-gundam-1979' }), ctx), []);
});

test('odsyłacz do nieistniejącej encji to problem', () => {
  const problemy = walidujStrone(strona({ seria: 'nie-ma' }), ctxZ([]));
  assert.ok(problemy.some((p) => /nie istnieje w bazie/.test(p)));
});

test('odsyłacz do złego typu to problem', () => {
  // wpis o tym slugu istnieje, ale jest postacią, nie serią
  const postacNaMiejscuSerii = strona({ slug: 'mobile-suit-gundam-1979' });
  const problemy = walidujStrone(strona({ seria: 'mobile-suit-gundam-1979' }), ctxZ([postacNaMiejscuSerii]));
  assert.ok(problemy.some((p) => /oczekiwano "seria"/.test(p)));
});

test('pochodzenie "wiedza" z adresami zatrzymuje wpis (ADR 0009)', () => {
  const problemy = walidujStrone(strona({ seria: 'mobile-suit-gundam-1979', pochodzenie: 'wiedza', zrodla: ['https://example.org/x'] }), ctxZ([seria]));
  assert.ok(problemy.some((p) => /"wiedza" \(niesprawdzona\) nie może mieć/.test(p)));
});

test('pochodzenie "zrodlo" bez sprawdzonych adresów zatrzymuje wpis (ADR 0009)', () => {
  const problemy = walidujStrone(strona({ seria: 'mobile-suit-gundam-1979', pochodzenie: 'zrodlo' }), ctxZ([seria]));
  assert.ok(problemy.some((p) => /"zrodlo" wymaga sprawdzonych/.test(p)));
});

test('źródło musi być adresem http(s)', () => {
  const p = strona({
    seria: 'mobile-suit-gundam-1979', pochodzenie: 'wiedza',
    zrodla: ['not-a-url'], body: '## Opis\n\ntekst\n\n## Źródła\n\n- x\n',
  });
  const problemy = walidujStrone(p, ctxZ([seria]));
  assert.ok(problemy.some((x) => /nie jest adresem http/.test(x)));
});

test('brak obowiązkowej sekcji to problem', () => {
  const problemy = walidujStrone(strona({ seria: 'mobile-suit-gundam-1979', body: 'tekst bez sekcji' }), ctxZ([seria]));
  assert.ok(problemy.some((p) => /brak obowiązkowej sekcji "## Opis"/.test(p)));
});

test('zły slug, zły typ, zły status to problemy', () => {
  const problemy = walidujStrone(strona({ slug: 'Amuro Ray', typ: 'postac', seria: 'mobile-suit-gundam-1979' }), ctxZ([seria]));
  assert.ok(problemy.some((p) => /nie przechodzi wzorca/.test(p)));

  const gra = { typ: 'gra', slug: 'demo', tytul: 'D', tagi: [], status: 'w-trakcie', body: '## Opis\n' };
  assert.ok(walidujStrone(gra, ctxZ([])).some((p) => /status "w-trakcie" poza/.test(p)));
});

test('epizod wymaga numeru i istniejącej gry', () => {
  const ep = {
    typ: 'epizod', slug: 'demo-ep001', tytul: 'Ep', tagi: [],
    body: '## Streszczenie\n\ntekst\n', gra: 'demo',
  };
  const problemy = walidujStrone(ep, ctxZ([]));
  assert.ok(problemy.some((p) => /wymaga liczbowego "numer"/.test(p)));
  assert.ok(problemy.some((p) => /"gra" → "demo" nie istnieje/.test(p)));
});

test('backlinki zbierają strony linkujące bez duplikatów', () => {
  const strony = [
    { slug: 'a', typ: 'postac', linki: ['x', 'y'] },
    { slug: 'b', typ: 'mech', linki: ['x'] },
    { slug: 'c', typ: 'seria', linki: ['x'] },
  ];
  const b = policzBacklinki(strony);
  assert.deepEqual(b.x.map((s) => s.slug), ['a', 'b', 'c']);
  assert.deepEqual(b.y.map((s) => s.slug), ['a']);
});
