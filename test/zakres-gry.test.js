/**
 * Zakres gry na fragmencie (ADR 0020).
 *
 * Baza obejmuje więcej niż jedną grę, a ta sama postać czy mech mogą w każdym
 * tytule wyglądać i zachowywać się inaczej. Fragment treści albo ilustracja
 * mają więc jawny zakres: `gra=<slug>` albo `gra=wspolne`. Te testy pilnują
 * składni, widocznej etykiety oraz tego, że strona obejmująca kilka gier nie
 * zostawia fragmentu bez zakresu.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown, parsujAtrybutyBloku } from '../src/srw/markdown.js';
import { walidujStrone, wytnijBloki, zbudujRejestr } from '../src/srw/registry.js';

const gry = {
  'srw-oe': { typ: 'gra', slug: 'srw-oe', tytul: 'Super Robot Wars OE', tagi: [], body: '' },
  'srw-alpha': { typ: 'gra', slug: 'srw-alpha', tytul: 'Super Robot Wars Alpha', tagi: [], body: '' },
};
const resolver = (slug) => (gry[slug] ? { href: `#/gra/${slug}`, tytul: gry[slug].tytul, typ: 'gra' } : null);
const ctx = () => ({ bySlug: zbudujRejestr(Object.values(gry)).bySlug });

test('atrybuty bloku są parsowane, także w cudzysłowie', () => {
  assert.deepEqual([...parsujAtrybutyBloku(' gra=srw-oe')], [['gra', 'srw-oe']]);
  assert.deepEqual([...parsujAtrybutyBloku(' gra="srw-oe" inne=x')], [['gra', 'srw-oe'], ['inne', 'x']]);
  assert.equal(parsujAtrybutyBloku('').size, 0);
});

test('blok z grą pokazuje nazwę tytułu z odsyłaczem i zapisuje zakres w DOM', () => {
  const { html, problemy } = renderMarkdown('{{menu gra=srw-oe\n\nTekst.\n}}', { resolveLink: resolver, wymagajPoziomu: true });
  assert.deepEqual(problemy, []);
  assert.match(html, /data-gra="srw-oe"/);
  assert.match(html, /data-gra-nazwa="Super Robot Wars OE"/);
  assert.match(html, /<p class="zakres-gry"><a href="#\/gra\/srw-oe">Super Robot Wars OE<\/a><\/p>/);
});

test('blok wspólny nie udaje gry i nie linkuje do żadnego tytułu', () => {
  const { html, problemy } = renderMarkdown('{{zrodlo gra=wspolne\n\nTekst.\n}}', { resolveLink: resolver });
  assert.deepEqual(problemy, []);
  assert.match(html, /data-gra="wspolne"/);
  assert.match(html, /<span title="Informacje wspólne dla wszystkich tytułów">Wspólne<\/span>/);
  assert.doesNotMatch(html, /<a href/);
});

test('blok bez zakresu zostaje bez etykiety', () => {
  const { html, problemy } = renderMarkdown('{{skrypt\n\nTekst.\n}}', { resolveLink: resolver });
  assert.deepEqual(problemy, []);
  assert.doesNotMatch(html, /zakres-gry/);
  assert.doesNotMatch(html, /data-gra/);
});

test('nieznana gra, zły typ celu i nieznany atrybut to problemy', () => {
  const nieznana = renderMarkdown('{{menu gra=nie-ma\n\nX.\n}}', { resolveLink: resolver });
  assert.ok(nieznana.problemy.some((p) => /nieznana gra "nie-ma"/.test(p)));

  const zlyTyp = renderMarkdown('{{menu gra=srw-oe\n\nX.\n}}', {
    resolveLink: () => ({ href: '#/postac/amuro', tytul: 'Amuro', typ: 'postac' }),
  });
  assert.ok(zlyTyp.problemy.some((p) => /oczekiwano "gra"/.test(p)));

  const atrybut = renderMarkdown('{{menu gra=srw-oe jezyk=pl\n\nX.\n}}', { resolveLink: resolver });
  assert.ok(atrybut.problemy.some((p) => /nieznany atrybut "jezyk"/.test(p)));
});

test('wytnijBloki widzi zakres w treści strony', () => {
  const bloki = wytnijBloki('{{menu gra=srw-oe\n\nX.\n}}\n\n{{zrodlo gra=wspolne\n\nY.\n}}');
  assert.equal(bloki.length, 2);
  assert.equal(bloki[0].atrybuty.get('gra'), 'srw-oe');
  assert.equal(bloki[1].atrybuty.get('gra'), 'wspolne');
});

const strona = (pola) => ({
  typ: 'postac', slug: 'amuro-ray', tytul: 'Amuro Ray', tagi: [],
  body: '## Opis\n\n{{skrypt\n\ntekst\n}}\n', ...pola,
});

test('strona jednej gry nie wymaga zakresu w każdym bloku', () => {
  const problemy = walidujStrone(strona({ gry: ['srw-oe'] }), ctx());
  assert.deepEqual(problemy, []);
});

test('strona obejmująca kilka gier wymaga zakresu w każdym bloku', () => {
  const problemy = walidujStrone(strona({ gry: ['srw-oe', 'srw-alpha'] }), ctx());
  assert.ok(problemy.some((p) => /strona obejmuje 2 gry — blok \{\{skrypt\}\} wymaga zakresu/.test(p)));

  const zZakresem = walidujStrone(strona({
    gry: ['srw-oe', 'srw-alpha'],
    body: '## Opis\n\n{{skrypt gra=srw-oe\n\ntekst\n}}\n\n{{zrodlo gra=wspolne\n\nwspólne\n}}\n',
  }), ctx());
  assert.deepEqual(zZakresem, []);
});

test('zakres musi wskazywać grę z pola "gry" i istnieć w bazie', () => {
  const obca = walidujStrone(strona({
    gry: ['srw-oe'],
    body: '## Opis\n\n{{menu gra=srw-alpha\n\ntekst\n}}\n',
  }), ctx());
  assert.ok(obca.some((p) => /grę spoza pola "gry"/.test(p)));

  const nieistniejaca = walidujStrone(strona({
    gry: ['srw-oe'],
    body: '## Opis\n\n{{menu gra=nie-ma\n\ntekst\n}}\n',
  }), ctx());
  assert.ok(nieistniejaca.some((p) => /"gra" nie istnieje w bazie/.test(p)));
});

test('zakres wspólny jest dozwolony na każdej stronie', () => {
  const problemy = walidujStrone(strona({
    gry: ['srw-oe', 'srw-alpha'],
    body: '## Opis\n\n{{zrodlo gra=wspolne\n\ntekst\n}}\n',
  }), ctx());
  assert.deepEqual(problemy, []);
});
