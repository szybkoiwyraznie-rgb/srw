/**
 * Hasła świata dopisane po przeglądzie istniejących skryptów (2026-10-22).
 *
 * Każde z tych pojęć występuje wprost w materiale dostawy (ADR 0012), a opisy
 * trzymają się podziału na to, co mówi scenariusz, i to, co sprawdzono w źródle
 * (ADR 0009–0011). Strona bez otwartego źródła nie dostaje adresów.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { wczytajStrony } from '../tools/content-loader.mjs';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));

const haslo = (slug) => {
  const p = bySlug.get(slug);
  assert.ok(p, `brak hasła ${slug}`);
  return p;
};

test('nowe hasła świata są w bazie z tagiem rodzaju treści (ADR 0033)', () => {
  const oczekiwane = {
    'mobile-suit': 'technologia',
    newtype: 'zjawisko',
    jaburo: 'miejsce',
    'krzyz-zeonu': 'odznaczenie',
    'stacja-connect': 'miejsce',
  };
  for (const [slug, rodzaj] of Object.entries(oczekiwane)) {
    const p = haslo(slug);
    assert.equal(p.typ, 'pojecie', slug);
    assert.ok((p.tagi ?? []).includes(rodzaj), `${slug}: rodzaj treści jest tagiem`);
    assert.equal(p.kategoria, undefined, `${slug}: osobne pole kategoria już nie istnieje`);
    assert.match(p.body, /## Opis/, slug);
  }
});

test('hasła z kwerendy cytują otwarte strony i mają je w zrodla', () => {
  const zrodla = {
    'mobile-suit': 'https://gundam.fandom.com/wiki/Mobile_Weapon',
    newtype: 'https://gundam.fandom.com/wiki/Newtype',
    jaburo: 'https://gundam.fandom.com/wiki/Jaburo',
  };
  for (const [slug, url] of Object.entries(zrodla)) {
    const p = haslo(slug);
    assert.match(p.body, /\{\{zrodlo gra=wspolne/, slug);
    assert.ok(p.body.includes(url), `${slug}: adres nie stoi przy informacji`);
    assert.ok((p.zrodla ?? []).includes(url), `${slug}: brak adresu w zrodla`);
  }
});

test('Krzyż Zeonu stoi na kwestii Masha i pamięci modelu bez linków', () => {
  const p = haslo('krzyz-zeonu');
  assert.match(p.body, /Mash.*Krzyż Zeonu/);
  assert.match(p.body, /\{\{wiedza gra=wspolne/);
  assert.equal(p.zrodla, undefined, 'brak sprawdzonego źródła — bez adresów');
  assert.doesNotMatch(p.body, /https?:\/\//);
});

test('Stacja Connect opisuje tylko materiał scen', () => {
  const p = haslo('stacja-connect');
  assert.equal(p.zrodla, undefined, 'stacja jest autorska — bez źródeł zewnętrznych');
  assert.doesNotMatch(p.body, /https?:\/\//);
  assert.match(p.body, /hangar \[\[exart\|Exarta\]\]/);
});

test('scena 1-2 i epizod 1 wskazują nowe hasła w relacjach', () => {
  const scena = haslo('srw-oe-ep1-black-tri-stars');
  for (const slug of ['mobile-suit', 'newtype', 'jaburo', 'krzyz-zeonu', 'stacja-connect']) {
    assert.ok(scena.pojecia.includes(slug), `scena: ${slug}`);
  }
  const epizod = haslo('srw-oe-ep1');
  for (const slug of ['newtype', 'jaburo', 'krzyz-zeonu']) {
    assert.ok(epizod.pojecia.includes(slug), `epizod: ${slug}`);
  }
  const prolog = haslo('prolog-i-trening-w-connect');
  assert.ok(prolog.pojecia.includes('stacja-connect'), 'prolog dzieje się na stacji Connect');
});
