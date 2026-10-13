import test from 'node:test';
import assert from 'node:assert/strict';
import { parsujHash, TRASY_ZNAZWE } from '../src/srw/router.js';
import { hrefDlaSlug, hrefFiltru, slugify, SLUG_RE } from '../src/srw/links.js';

test('trasa główna i pusta', () => {
  assert.deepEqual(parsujHash(''), { nazwa: 'glowna', param: null, query: {} });
  assert.deepEqual(parsujHash('#/'), { nazwa: 'glowna', param: null, query: {} });
});

test('trasy encji z parametrem', () => {
  const t = parsujHash('#/epizod/demo-ep001');
  assert.equal(t.nazwa, 'epizod');
  assert.equal(t.param, 'demo-ep001');
});

test('filtry listy trafiają do query', () => {
  const t = parsujHash('#/mechy?seria=mobile-suit-gundam-1979');
  assert.equal(t.nazwa, 'mechy');
  assert.equal(t.query.seria, 'mobile-suit-gundam-1979');
});

test('wyszukiwanie z polskimi znakami i spacjami', () => {
  const t = parsujHash('#/szukaj?q=' + encodeURIComponent('amuro ray'));
  assert.equal(t.query.q, 'amuro ray');
});

test('nieznana trasa nie wywraca routera', () => {
  assert.equal(parsujHash('#/cokolwiek/x').nazwa, 'nieznana');
});

test('wszystkie zadeklarowane trasy są rozpoznawane', () => {
  for (const nazwa of TRASY_ZNAZWE) {
    assert.equal(parsujHash(`#/${nazwa}`).nazwa, nazwa);
  }
});

test('slugify i walidacja slugów', () => {
  assert.equal(slugify('RX-78-2 Gundam'), 'rx-78-2-gundam');
  assert.equal(slugify('Kōji Kabuto'), 'k-ji-kabuto'); // diakrytyki nie-ASCII są usuwane
  assert.ok(SLUG_RE.test('mazinger-z-1972'));
  assert.ok(!SLUG_RE.test('Mazinger Z'));
});

test('adresy stron i filtrów', () => {
  assert.equal(hrefDlaSlug('demo', 'gra'), '#/gra/demo');
  assert.equal(hrefDlaSlug('mazinger-z', 'mech'), '#/mech/mazinger-z');
  assert.equal(hrefFiltru('mech', 'seria', 'mazinger-z-1972'), '#/mechy?seria=mazinger-z-1972');
});
