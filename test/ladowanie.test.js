/**
 * Model wieloplikowy (ADR 0041): powłoka + `data/`.
 *
 * Test uruchamia prawdziwy kod ładowania na artefakcie zbudowanym przez build,
 * podstawia `fetch` czytający z katalogu `data/` i sprawdza, że po dociągnięciu
 * strony renderer dostaje pełne dane, a wyszukiwarka działa po `teksty.json`.
 * Bez tego „działa u mnie” kończy się pustą stroną u czytelnika.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { zbuduj } from '../tools/build.mjs';

const katalog = fs.mkdtempSync(path.join(os.tmpdir(), 'srw-ladowanie-'));
const POWLOKA = path.join(katalog, 'index.html');
const DANE = path.join(katalog, 'data');

let przygotowane = false;
async function przygotuj() {
  if (przygotowane) return;
  await zbuduj({ out: POWLOKA });
  przygotowane = true;
}

/** Wyciąga z powłoki indeks i ustawia środowisko ładowania. */
function wczytajPowłokę() {
  const html = fs.readFileSync(POWLOKA, 'utf8');
  const b64 = html.match(/globalThis\.SRW_B64 = "([^"]+)"/)?.[1];
  assert.ok(b64, 'powłoka zawiera spakowany indeks');
  globalThis.atob ??= (s) => Buffer.from(s, 'base64').toString('binary');
  globalThis.SRW_B64 = b64;
  globalThis.SRW_TRYB = 'pliki';
  delete globalThis.SRW_DATA;
}

/** `fetch` czytający z katalogu `data/`, jak serwer statyczny. */
function podstawFetch() {
  globalThis.fetch = async (adres) => {
    const nazwa = String(adres).split('/data/').at(-1).replace(/^data\//, '').split('?')[0];
    const plik = path.join(DANE, nazwa);
    if (!fs.existsSync(plik)) return new Response('brak', { status: 404 });
    return new Response(fs.readFileSync(plik, 'utf8'), { status: 200 });
  };
}

test('powłoka startuje z indeksu i nie niesie ciał stron', async () => {
  await przygotuj();
  wczytajPowłokę();
  podstawFetch();
  const ladowanie = await import('../src/srw/ladowanie.js');
  const dane = await ladowanie.zaladujDane();

  assert.ok(Object.keys(dane.strony).length > 300, 'indeks ma strony');
  const strona = dane.strony['wing-gundam-zero'];
  assert.ok(strona, 'strona jest w indeksie');
  assert.equal(strona.html, undefined, 'ciało strony nie jedzie w powłoce');
  assert.ok(strona.tytul, 'metadane są dostępne bez dociągania');
  assert.ok(strona.obraz, 'miniatura listy jest w indeksie');
  assert.ok(Array.isArray(dane.coNowego) && dane.coNowego.length > 0, 'dziennik dociągnięty na starcie');
});

test('dociągnięta strona renderuje pełną treść', async () => {
  await przygotuj();
  wczytajPowłokę();
  podstawFetch();
  const ladowanie = await import('../src/srw/ladowanie.js');
  await ladowanie.zaladujDane();
  const przed = globalThis.SRW_DATA.strony['wing-gundam-zero'];
  assert.equal(przed.html, undefined);

  const wynik = await ladowanie.dociagnijStrone('wing-gundam-zero');
  assert.ok(wynik.html.length > 1000, 'html po dociągnięciu');
  const { renderEncja } = await import('../src/srw/render-entity.js');
  const html = renderEncja('wing-gundam-zero');
  assert.match(html, /Wing Gundam Zero/);
  assert.match(html, /Ilustracje/);
  // Drugie wejście nie bije do sieci — ciało już jest w pamięci.
  const licznik = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('zbędne pobranie'); };
  await ladowanie.dociagnijStrone('wing-gundam-zero');
  globalThis.fetch = licznik;
});

test('wyszukiwarka dociąga indeks tekstowy dopiero przy zapytaniu', async () => {
  await przygotuj();
  wczytajPowłokę();
  podstawFetch();
  const ladowanie = await import('../src/srw/ladowanie.js');
  await ladowanie.zaladujDane();
  assert.equal(ladowanie.czyTekstyWczytane(), false);
  assert.equal(globalThis.SRW_DATA.strony['setsuna-f-seiei'].tekst, undefined);

  await ladowanie.dociagnijTeksty();
  assert.equal(ladowanie.czyTekstyWczytane(), true);
  const { renderSzukanie } = await import('../src/srw/render-search.js');
  const html = renderSzukanie('Setsuna');
  assert.match(html, /#\/postac\/setsuna-f-seiei/, 'trafienie po treści strony');
});

test('brak pliku ciała kończy się czytelnym błędem, a nie pustą stroną', async () => {
  await przygotuj();
  wczytajPowłokę();
  podstawFetch();
  const ladowanie = await import('../src/srw/ladowanie.js');
  await ladowanie.zaladujDane();
  const zapas = fs.readFileSync(path.join(DANE, 'cybuster.json'), 'utf8');
  fs.rmSync(path.join(DANE, 'cybuster.json'));
  try {
    await assert.rejects(() => ladowanie.dociagnijStrone('cybuster'), /HTTP 404/);
  } finally {
    fs.writeFileSync(path.join(DANE, 'cybuster.json'), zapas);
  }
});

test('tryb jednoplikowy niczego nie dociąga', async () => {
  const jednoplik = fs.mkdtempSync(path.join(os.tmpdir(), 'srw-jeden-'));
  const plik = path.join(jednoplik, 'index.html');
  await zbuduj({ out: plik, single: true });
  const html = fs.readFileSync(plik, 'utf8');
  const daneJs = html.match(/globalThis\.SRW_DATA = (\{[\s\S]*?\});\n/);
  assert.ok(daneJs, 'dane wstrzyknięte w całości');
  delete globalThis.SRW_TRYB;
  delete globalThis.SRW_B64;
  globalThis.SRW_DATA = JSON.parse(daneJs[1]);
  globalThis.fetch = () => { throw new Error('tryb jednoplikowy nie może dociągać'); };
  const ladowanie = await import('../src/srw/ladowanie.js');
  await ladowanie.zaladujDane();
  assert.equal(ladowanie.czyTrybPlikow(), false);
  assert.equal(ladowanie.czyTekstyWczytane(), true);
  assert.ok(globalThis.SRW_DATA.strony['wing-gundam-zero'].html.length > 1000);
});
