/**
 * Dymny test powłoki (ADR 0041): uruchamia **prawdziwy** skrypt artefaktu
 * w maszynie wirtualnej Node z minimalnym DOM-em i sprawdza, że witryna
 * startuje z indeksu, a treść strony dociąga się z `data/`.
 *
 * Ten test łapie to, czego nie widzą testy modułów: kolejność startu
 * (dane przed routerem), dekodowanie indeksu gzip+base64 i to, że trasa
 * strony naprawdę czeka na swoje ciało.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { zbuduj } from '../tools/build.mjs';

const katalog = fs.mkdtempSync(path.join(os.tmpdir(), 'srw-powloka-'));
const POWLOKA = path.join(katalog, 'index.html');
const DANE = path.join(katalog, 'data');

let skrypt = '';
test('build powłoki', async () => {
  await zbuduj({ out: POWLOKA });
  const html = fs.readFileSync(POWLOKA, 'utf8');
  skrypt = html.match(/<script>\n([\s\S]*?)\n<\/script>/)[1];
  assert.ok(skrypt.includes("SRW_TRYB = 'pliki'"));
});

/** Minimalny DOM: tylko to, czego dotyka start i render listy/strony. */
function zbudujSrodowisko() {
  const nasluchy = new Map();
  const element = () => ({
    innerHTML: '',
    dataset: {},
    classList: { add() {}, remove() {} },
    setAttribute() {},
    getAttribute() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    removeEventListener() {},
    scrollTop: 0,
  });
  const app = element();
  const document = {
    documentElement: { setAttribute() {} },
    getElementById(id) { return id === 'app' ? app : null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement() { return element(); },
    addEventListener(typ, fn) { nasluchy.set(typ, fn); },
    removeEventListener() {},
  };
  const location = { hash: '#/', href: 'http://localhost:3000/' };
  const komunikaty = [];
  const srodowisko = {
    document,
    location,
    console: { log() {}, warn() {}, error: (...a) => komunikaty.push(a.join(' ')) },
    scrollTo() {},
    addEventListener(typ, fn) { nasluchy.set(typ, fn); },
    removeEventListener() {},
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    URL,
    URLSearchParams,
    Blob,
    Response,
    DecompressionStream,
    setTimeout,
    clearTimeout,
    fetch: async (adres) => {
      const nazwa = String(adres).split('/data/').at(-1).replace(/^data\//, '').split('?')[0];
      const plik = path.join(DANE, nazwa);
      if (!fs.existsSync(plik)) return new Response('brak', { status: 404 });
      return new Response(fs.readFileSync(plik, 'utf8'), { status: 200 });
    },
  };
  srodowisko.globalThis = srodowisko;
  srodowisko.window = srodowisko;
  return { srodowisko, app, nasluchy, komunikaty };
}

/** Czeka, aż warunek będzie prawdziwy (render jest asynchroniczny). */
async function czekajNa(warunek, opis) {
  for (let i = 0; i < 200; i += 1) {
    if (warunek()) return;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error(`nie doczekano: ${opis}`);
}

test('powłoka startuje i pokazuje stronę główną z indeksu', async () => {
  const { srodowisko, app, komunikaty } = zbudujSrodowisko();
  const kontekst = vm.createContext(srodowisko);
  vm.runInContext(skrypt, kontekst, { filename: 'powloka.js' });
  await czekajNa(() => app.innerHTML.includes('SRW Database'), 'strona główna');
  assert.match(app.innerHTML, /SRW Database/);
  assert.deepEqual(komunikaty, [], 'start bez błędów w konsoli');
});

test('trasa strony dociąga ciało z data/ i renderuje treść', async () => {
  const { srodowisko, app, nasluchy, komunikaty } = zbudujSrodowisko();
  const kontekst = vm.createContext(srodowisko);
  vm.runInContext(skrypt, kontekst, { filename: 'powloka.js' });
  await czekajNa(() => app.innerHTML.includes('SRW Database'), 'strona główna');

  srodowisko.location.hash = '#/mech/wing-gundam-zero';
  nasluchy.get('hashchange')();
  // Strona główna też wymienia „Wing Gundam Zero” (ostatnie zmiany), więc
  // czekamy na element charakterystyczny tylko dla ciała strony.
  await czekajNa(() => app.innerHTML.includes('Ilustracje'), 'strona mecha');
  assert.match(app.innerHTML, /Wing Gundam Zero/);
  assert.match(app.innerHTML, /galeria-encji|Ilustracja 1/, 'galeria z ciała strony');
  assert.deepEqual(komunikaty, []);
});

test('brak pliku ciała daje komunikat, nie pustą stronę', async () => {
  const zapas = fs.readFileSync(path.join(DANE, 'cybuster.json'), 'utf8');
  fs.rmSync(path.join(DANE, 'cybuster.json'));
  try {
    const { srodowisko, app, nasluchy } = zbudujSrodowisko();
    const kontekst = vm.createContext(srodowisko);
    vm.runInContext(skrypt, kontekst, { filename: 'powloka.js' });
    await czekajNa(() => app.innerHTML.includes('SRW Database'), 'strona główna');

    srodowisko.location.hash = '#/mech/cybuster';
    nasluchy.get('hashchange')();
    await czekajNa(() => app.innerHTML.includes('Nie udało się wczytać'), 'komunikat błędu');
    assert.match(app.innerHTML, /HTTP 404/);
    assert.match(app.innerHTML, /build:single/, 'podpowiedź o wersji jednoplikowej');
  } finally {
    fs.writeFileSync(path.join(DANE, 'cybuster.json'), zapas);
  }
});

test('Gelgoog z Co nowego czeka na treść i renderuje obie ilustracje w galerii', async () => {
  const { srodowisko, app, nasluchy } = zbudujSrodowisko();
  const fetch = srodowisko.fetch;
  let zakonczPobieranie;
  let url;
  srodowisko.fetch = async (adres) => {
    if (String(adres).includes('/gelgoog.json')) {
      url = new URL(adres);
      await new Promise((r) => { zakonczPobieranie = r; });
    }
    return fetch(adres);
  };
  vm.runInContext(skrypt, vm.createContext(srodowisko));
  await czekajNa(() => app.innerHTML.includes('#/mech/gelgoog'), 'link Gelgoog na stronie głównej');
  srodowisko.location.hash = '#/mech/gelgoog';
  nasluchy.get('hashchange')();
  assert.match(app.innerHTML, /Wczytywanie treści/);
  assert.ok(url.searchParams.get('v'), 'wersja danych zabezpiecza przed starym JSON-em z cache');
  zakonczPobieranie();
  await czekajNa(() => app.innerHTML.includes('boks-ilustracje'), 'galeria Gelgooga');
  const galeria = app.innerHTML.split('id="boks-ilustracje"')[1].split('<div class="fragment')[0];
  assert.equal((galeria.match(/<img /g) ?? []).length, 2);
  assert.match(galeria, /Geloog%20Standard\.png/);
  assert.match(galeria, /Geloog%20Standard%202\.png/);
});

test('wadliwy JSON i błąd wyszukiwania pokazują komunikat zamiast pustego widoku', async () => {
  const { srodowisko, app, nasluchy } = zbudujSrodowisko();
  const fetch = srodowisko.fetch;
  srodowisko.fetch = async (adres) => {
    if (String(adres).includes('/gelgoog.json')) return new Response('{}');
    if (String(adres).includes('/teksty.json')) return new Response('', { status: 503 });
    return fetch(adres);
  };
  vm.runInContext(skrypt, vm.createContext(srodowisko));
  await czekajNa(() => app.innerHTML.includes('#/mech/gelgoog'), 'strona główna');
  srodowisko.location.hash = '#/mech/gelgoog';
  nasluchy.get('hashchange')();
  await czekajNa(() => app.innerHTML.includes('nieprawidłowe dane strony'), 'błąd danych');
  srodowisko.location.hash = '#/szukaj?q=Gelgoog';
  nasluchy.get('hashchange')();
  await czekajNa(() => app.innerHTML.includes('HTTP 503'), 'błąd wyszukiwania');
  assert.match(app.innerHTML, /Odśwież stronę/);
});

test('opóźniona odpowiedź nie nadpisuje nowej trasy', async () => {
  const { srodowisko, app, nasluchy } = zbudujSrodowisko();
  const fetch = srodowisko.fetch;
  let zwolnij;
  srodowisko.fetch = async (adres) => {
    if (String(adres).includes('/gelgoog.json')) await new Promise((r) => { zwolnij = r; });
    return fetch(adres);
  };
  vm.runInContext(skrypt, vm.createContext(srodowisko));
  await czekajNa(() => app.innerHTML.includes('#/mech/gelgoog'), 'strona główna');
  srodowisko.location.hash = '#/mech/gelgoog';
  nasluchy.get('hashchange')();
  srodowisko.location.hash = '#/o-bazie';
  nasluchy.get('hashchange')();
  await czekajNa(() => app.innerHTML.includes('O bazie'), 'nowa trasa');
  zwolnij();
  await new Promise((r) => setTimeout(r, 30));
  assert.doesNotMatch(app.innerHTML, /id="boks-ilustracje"/);
});
