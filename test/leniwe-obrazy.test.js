/**
 * Leniwe ładowanie ilustracji (ADR 0032).
 *
 * Testy w Node nie mają DOM ani IntersectionObserver, więc podstawiamy
 * atrapy o tym samym kontrakcie: `img` z atrybutami, klasami, stylem
 * i prostokątem oraz obserwator, którego wpisy wywołujemy ręcznie.
 * Dzięki temu sprawdzamy decyzje modułu, nie zachowanie przeglądarki.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  MARGINES_WCZYTANIA, MARGINES_ZWOLNIENIA,
  adresObrazu, przygotujObraz, wczytajObraz, zwolnijObraz, wPoluWidzenia, wlaczLeniweObrazy,
} from '../src/srw/leniwe-obrazy.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Atrapa elementu <img>: atrybuty, klasy, styl i prostokąt w oknie. */
function obrazAtrapa(src, prostokat = { top: 0, bottom: 200, left: 0, right: 200, width: 200, height: 200 }) {
  const atrybuty = new Map(src ? [['src', src]] : []);
  const klasy = new Set();
  return {
    dataset: {},
    style: {},
    klasy,
    prostokat,
    getAttribute: (nazwa) => atrybuty.get(nazwa) ?? null,
    setAttribute: (nazwa, wartosc) => atrybuty.set(nazwa, String(wartosc)),
    removeAttribute: (nazwa) => atrybuty.delete(nazwa),
    hasAttribute: (nazwa) => atrybuty.has(nazwa),
    classList: {
      add: (k) => klasy.add(k),
      remove: (k) => klasy.delete(k),
      contains: (k) => klasy.has(k),
    },
    getBoundingClientRect: () => prostokat,
  };
}

/** Atrapa okna z IntersectionObserver, który zapamiętuje swoje wywołania. */
function oknoAtrapa(obrazy, { bezObserwatora = false } = {}) {
  const obserwatory = [];
  const okno = { innerHeight: 800, innerWidth: 1200, obserwatory };
  if (bezObserwatora) return okno;
  okno.IntersectionObserver = class {
    constructor(wywolanie, opcje) {
      this.wywolanie = wywolanie;
      this.opcje = opcje;
      this.cele = [];
      this.rozlaczony = false;
      obserwatory.push(this);
    }

    observe(cel) { this.cele.push(cel); }

    disconnect() { this.rozlaczony = true; }

    zglos(wpisy) { this.wywolanie(wpisy); }
  };
  okno.korzen = { querySelectorAll: () => obrazy };
  return okno;
}

const korzenZ = (obrazy) => ({ querySelectorAll: () => obrazy });

test('adres ilustracji przeżywa zwolnienie obrazu', () => {
  const obraz = obrazAtrapa('https://media.example/alex.png');
  przygotujObraz(obraz);
  assert.equal(obraz.dataset.zrodlo, 'https://media.example/alex.png');

  zwolnijObraz(obraz);
  assert.equal(obraz.getAttribute('src'), null, 'bitmapa oddana przeglądarce');
  assert.equal(adresObrazu(obraz), 'https://media.example/alex.png', 'adres nadal znany');
  assert.ok(obraz.classList.contains('obraz-zwolniony'));

  wczytajObraz(obraz);
  assert.equal(obraz.getAttribute('src'), 'https://media.example/alex.png');
  assert.equal(obraz.classList.contains('obraz-zwolniony'), false);
});

test('zwolnienie przypina wymiary, wczytanie je zdejmuje', () => {
  const obraz = obrazAtrapa('a.png', { top: 0, bottom: 240, left: 0, right: 180, width: 180.4, height: 240.2 });
  zwolnijObraz(obraz);
  assert.equal(obraz.style.width, '180px');
  assert.equal(obraz.style.height, '240px');

  wczytajObraz(obraz);
  assert.equal(obraz.style.width, '');
  assert.equal(obraz.style.height, '');
});

test('obraz nigdy niewyrysowany nie dostaje przypiętego zera', () => {
  const obraz = obrazAtrapa('a.png', { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 });
  zwolnijObraz(obraz);
  assert.equal(obraz.style.width, undefined, 'bez wymiarów nie ma czego przypinać');
  assert.equal(obraz.getAttribute('src'), null);
});

test('pole widzenia liczy się z marginesem w obie strony', () => {
  const widok = { wysokosc: 800, szerokosc: 1200 };
  const widoczny = obrazAtrapa('a.png', { top: 100, bottom: 300, left: 0, right: 200, width: 200, height: 200 });
  const tuzPonizej = obrazAtrapa('b.png', { top: 1000, bottom: 1200, left: 0, right: 200, width: 200, height: 200 });
  const daleko = obrazAtrapa('c.png', { top: 4000, bottom: 4200, left: 0, right: 200, width: 200, height: 200 });

  assert.equal(wPoluWidzenia(widoczny, widok, MARGINES_WCZYTANIA), true);
  assert.equal(wPoluWidzenia(tuzPonizej, widok, MARGINES_WCZYTANIA), true, 'pas wczytania sięga poza ekran');
  assert.equal(wPoluWidzenia(daleko, widok, MARGINES_WCZYTANIA), false);
  assert.ok(MARGINES_ZWOLNIENIA > MARGINES_WCZYTANIA, 'histereza: zwalniamy dalej, niż wczytujemy');
});

test('start trasy wczytuje tylko obrazy w polu widzenia', () => {
  const widoczny = obrazAtrapa('w.png', { top: 10, bottom: 210, left: 0, right: 200, width: 200, height: 200 });
  const daleki = obrazAtrapa('d.png', { top: 5000, bottom: 5200, left: 0, right: 200, width: 200, height: 200 });
  const okno = oknoAtrapa([widoczny, daleki]);

  const odepnij = wlaczLeniweObrazy(korzenZ([widoczny, daleki]), okno);

  assert.equal(widoczny.getAttribute('src'), 'w.png');
  assert.equal(daleki.getAttribute('src'), null, 'obraz spoza ekranu nie zajmuje pamięci');
  assert.equal(daleki.dataset.zrodlo, 'd.png');
  assert.equal(okno.obserwatory.length, 2, 'osobny obserwator wczytywania i zwalniania');
  assert.equal(okno.obserwatory[0].opcje.rootMargin, `${MARGINES_WCZYTANIA}px`);
  assert.equal(okno.obserwatory[1].opcje.rootMargin, `${MARGINES_ZWOLNIENIA}px`);
  assert.deepEqual(okno.obserwatory[0].cele, [widoczny, daleki]);

  odepnij();
  assert.ok(okno.obserwatory.every((o) => o.rozlaczony), 'poprzednia trasa nie zostawia obserwatorów');
});

test('przewinięcie wczytuje obraz, oddalenie oddaje pamięć', () => {
  const obraz = obrazAtrapa('x.png', { top: 5000, bottom: 5200, left: 0, right: 200, width: 200, height: 200 });
  const okno = oknoAtrapa([obraz]);
  wlaczLeniweObrazy(korzenZ([obraz]), okno);
  const [wczytujacy, zwalniajacy] = okno.obserwatory;

  assert.equal(obraz.getAttribute('src'), null);
  wczytujacy.zglos([{ target: obraz, isIntersecting: true }]);
  assert.equal(obraz.getAttribute('src'), 'x.png', 'wejście w pas wczytania przywraca obraz');

  zwalniajacy.zglos([{ target: obraz, isIntersecting: false }]);
  assert.equal(obraz.getAttribute('src'), null, 'wyjście poza pas zwalnia bitmapę');
  assert.equal(adresObrazu(obraz), 'x.png');

  // Obraz wciąż w zasięgu nie jest ruszany przez obserwator zwalniania.
  wczytujacy.zglos([{ target: obraz, isIntersecting: true }]);
  zwalniajacy.zglos([{ target: obraz, isIntersecting: true }]);
  assert.equal(obraz.getAttribute('src'), 'x.png');
});

test('bez IntersectionObserver wszystkie ilustracje po prostu się wczytują', () => {
  const daleki = obrazAtrapa('d.png', { top: 9000, bottom: 9200, left: 0, right: 200, width: 200, height: 200 });
  const okno = oknoAtrapa([daleki], { bezObserwatora: true });
  const odepnij = wlaczLeniweObrazy(korzenZ([daleki]), okno);
  assert.equal(daleki.getAttribute('src'), 'd.png', 'starsza przeglądarka widzi pełną stronę');
  assert.equal(typeof odepnij, 'function');
});

test('witryna podpina leniwe obrazy po każdym renderze, a podgląd zna zwolniony adres', () => {
  const main = fs.readFileSync(path.join(ROOT, 'src/srw/main.js'), 'utf8');
  assert.match(main, /import \{ wlaczLeniweObrazy \} from '\.\/leniwe-obrazy\.js';/);
  assert.match(main, /odepnijObrazy\?\.\(\);\s*\n\s*odepnijObrazy = wlaczLeniweObrazy\(app, globalThis\);/);

  const podglad = fs.readFileSync(path.join(ROOT, 'src/srw/podglad.js'), 'utf8');
  assert.match(podglad, /adresObrazu\(miniatura\)/);
  assert.doesNotMatch(podglad, /miniatura\.currentSrc \|\| miniatura\.src/, 'podgląd nie polega na samym src');

  const css = fs.readFileSync(path.join(ROOT, 'src/srw/style.css'), 'utf8');
  assert.match(css, /\.obraz-zwolniony \{/, 'zwolniony obraz ma własną ramkę zastępczą');
});
