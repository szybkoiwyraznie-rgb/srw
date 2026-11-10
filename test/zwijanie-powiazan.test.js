/**
 * Boks „Powiązania” pokazuje 50 pozycji; resztę odsłania „Rozwiń” (ADR 0039).
 *
 * Zwinięcie nie może niczego zgubić: pozycje ponad limit są w HTML-u od razu,
 * tylko schowane klasą, a licznik grupy podaje pełną liczbę stron. To, że
 * żadna relacja nie znika, sprawdza `powtorzenia-list.test.js` — on czyta
 * odsyłacze boksu bez względu na to, czy są zwinięte.
 *
 * Kliknięcie zależy od DOM, którego testy w Node nie mają. Sprawdzamy więc
 * kontrakt znaczników, regułę arkusza stylów i przełącznik na atrapie elementu.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zbudujDane } from '../tools/build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
globalThis.SRW_DATA = await zbudujDane({ root: ROOT });
const DANE = globalThis.SRW_DATA;

const { renderEncja, boksPowiazan, LIMIT_POWIAZAN } = await import('../src/srw/render-entity.js');
const { przelaczPowiazania, podepnijZwijanie } = await import('../src/srw/zwijanie.js');

const TYPY_ENCJI = ['gra', 'postac', 'mech', 'pojecie', 'seria'];
const ENCJE = Object.values(DANE.strony).filter((s) => TYPY_ENCJI.includes(s.typ));

/** Rozbiór boksu „Powiązania”: pozycje w kolejności wyświetlania i to, co je chowa. */
function rozbierz(html) {
  const boks = html.match(/<section class="blok-powiazan"([^>]*)>\s*<h2>Powiązania<\/h2>([\s\S]*?)<\/section>/);
  if (!boks) return null;
  const grupy = boks[2].split(/(?=<div class="grupa-powiazan)/).slice(1).map((g) => ({
    ukryta: /^<div class="grupa-powiazan ponad-limit"/.test(g),
    licznik: Number(g.match(/<h3>[^<]*<span class="licznik">(\d+)<\/span><\/h3>/)?.[1]),
    pozycje: [...g.matchAll(/<li( class="ponad-limit")?>/g)].map((m) => Boolean(m[1])),
    // Lista fabuły dzieli się na gry; lista i podpis gry chowają się razem.
    listy: [...g.matchAll(/(?:<p class="gra-fabuly( ponad-limit)?">[^<]*<\/p>)?<ul class="lista-(?:fabuly|horyzontalna)( ponad-limit)?">([\s\S]*?)<\/ul>/g)]
      .map((m) => ({
        maPodpis: m[0].startsWith('<p'),
        podpisUkryty: Boolean(m[1]),
        ukryta: Boolean(m[2]),
        pozycje: [...m[3].matchAll(/<li( class="ponad-limit")?>/g)].map((x) => Boolean(x[1])),
      })),
  }));
  const przycisk = boks[2].match(/<button type="button" class="rozwin-powiazania" data-rozwin-powiazania aria-expanded="false">\s*<span data-etykieta>([^<]*)<\/span> <span class="licznik">jeszcze (\d+)<\/span>\s*<\/button>/);
  return {
    zwiniety: /\sdata-zwiniety(?=\s|$)/.test(boks[1]),
    grupy,
    pozycje: grupy.flatMap((g) => g.pozycje),
    etykieta: przycisk?.[1] ?? null,
    jeszcze: przycisk ? Number(przycisk[2]) : null,
    przyciskow: (boks[2].match(/<button/g) ?? []).length,
    klasPonadLimit: (boks[2].match(/ponad-limit/g) ?? []).length,
  };
}

/** Grupy do `boksPowiazan` z samych liczb: typ → tyle sztucznych stron. */
function sztuczneGrupy(liczby) {
  return new Map(Object.entries(liczby).map(([typ, ile]) => [
    typ,
    Array.from({ length: ile }, (_, i) => ({ slug: `${typ}-${i + 1}`, typ, tytul: `${typ} ${i + 1}` })),
  ]));
}

test('limit boksu „Powiązania” to 50 pozycji', () => {
  assert.equal(LIMIT_POWIAZAN, 50);
});

test('boks do 50 pozycji stoi w całości: bez przycisku i bez schowanych pozycji', () => {
  let sprawdzone = 0;
  for (const strona of ENCJE) {
    const boks = rozbierz(renderEncja(strona.slug));
    if (!boks || boks.pozycje.length > LIMIT_POWIAZAN) continue;
    assert.equal(boks.zwiniety, false, `${strona.slug}: krótki boks nie jest zwinięty`);
    assert.equal(boks.przyciskow, 0, `${strona.slug}: krótki boks nie ma przycisku`);
    assert.equal(boks.klasPonadLimit, 0, `${strona.slug}: krótki boks niczego nie chowa`);
    sprawdzone += 1;
  }
  assert.ok(sprawdzone > 0, 'żadna strona nie ma krótkiego boksu — test niczego nie sprawdza');
});

test('boks ponad 50 pozycji pokazuje pierwsze 50, a resztę odsłania „Rozwiń”', () => {
  const dlugie = [];
  for (const strona of ENCJE) {
    const boks = rozbierz(renderEncja(strona.slug));
    if (!boks || boks.pozycje.length <= LIMIT_POWIAZAN) continue;
    dlugie.push(strona.slug);
    const { pozycje } = boks;

    assert.equal(boks.zwiniety, true, `${strona.slug}: długi boks startuje zwinięty`);
    assert.equal(pozycje.filter((ukryta) => !ukryta).length, LIMIT_POWIAZAN, `${strona.slug}: widać dokładnie ${LIMIT_POWIAZAN} pozycji`);
    assert.deepEqual(pozycje.slice(0, LIMIT_POWIAZAN), Array(LIMIT_POWIAZAN).fill(false), `${strona.slug}: widoczne są pierwsze pozycje, w kolejności wyświetlania`);
    assert.ok(pozycje.slice(LIMIT_POWIAZAN).every(Boolean), `${strona.slug}: każda pozycja ponad limit czeka na „Rozwiń”`);

    assert.equal(boks.przyciskow, 1, `${strona.slug}: boks ma jeden przycisk`);
    assert.equal(boks.etykieta, 'Rozwiń', `${strona.slug}: przycisk nazywa się „Rozwiń”`);
    assert.equal(boks.jeszcze, pozycje.length - LIMIT_POWIAZAN, `${strona.slug}: przycisk podaje liczbę schowanych pozycji`);

    for (const grupa of boks.grupy) {
      assert.equal(grupa.licznik, grupa.pozycje.length, `${strona.slug}: licznik grupy podaje pełną liczbę stron, nie liczbę widocznych`);
      assert.equal(grupa.ukryta, grupa.pozycje.every(Boolean), `${strona.slug}: nagłówek grupy znika wtedy i tylko wtedy, gdy nie widać żadnej jej pozycji`);
    }
  }
  // Baza ma dziś strony z długim boksem (gra srw-oe); bez nich test byłby pusty.
  assert.ok(dlugie.includes('srw-oe'), `strona gry srw-oe ma długi boks; długie boksy: ${dlugie.join(', ')}`);
});

test('granica limitu: 50 pozycji stoi w całości, 51 chowa jedną', () => {
  const rowno = rozbierz(boksPowiazan(sztuczneGrupy({ postac: 30, mech: 20 })));
  assert.equal(rowno.pozycje.length, 50);
  assert.equal(rowno.zwiniety, false);
  assert.equal(rowno.przyciskow, 0);
  assert.equal(rowno.klasPonadLimit, 0);

  const ponad = rozbierz(boksPowiazan(sztuczneGrupy({ postac: 30, mech: 21 })));
  assert.equal(ponad.zwiniety, true);
  assert.equal(ponad.jeszcze, 1);
  assert.deepEqual(ponad.pozycje.map(Number).join(''), `${'0'.repeat(50)}1`);
  assert.deepEqual(ponad.grupy.map((g) => g.ukryta), [false, false], 'grupa z choć jedną widoczną pozycją zachowuje nagłówek');
});

test('grupa zaczynająca się dokładnie na granicy limitu chowa się razem z nagłówkiem', () => {
  const boks = rozbierz(boksPowiazan(sztuczneGrupy({ postac: 50, mech: 3, seria: 2 })));
  assert.deepEqual(boks.grupy.map((g) => g.ukryta), [false, true, true]);
  assert.deepEqual(boks.grupy.map((g) => g.licznik), [50, 3, 2]);
  assert.equal(boks.jeszcze, 5);
});

test('limit liczy pozycje w kolejności wyświetlania, przez grupy: sceny, epizody, potem reszta', () => {
  // Kolejność grup ustala silnik, nie kolejność wstawiania do mapy.
  const boks = rozbierz(boksPowiazan(sztuczneGrupy({ seria: 10, postac: 45, pojecie: 10 })));
  assert.deepEqual(boks.grupy.map((g) => g.licznik), [45, 10, 10], 'postacie, hasła, serie');
  assert.deepEqual(boks.grupy.map((g) => g.pozycje.filter((u) => !u).length), [45, 5, 0]);
  assert.deepEqual(boks.grupy.map((g) => g.ukryta), [false, false, true]);
});

test('lista fabuły dzielona na gry chowa grę razem z jej podpisem', () => {
  // Dwa układy scen z dwóch gier: 50 + 12 (druga gra zaczyna się dokładnie na granicy
  // limitu) i 40 + 20 (granica wypada w środku drugiej gry).
  const epizody = Object.values(DANE.strony).filter((s) => s.typ === 'epizod');
  const gry = [...new Set(epizody.map((e) => e.gra))];
  assert.ok(gry.length >= 2, 'baza ma epizody co najmniej dwóch gier');
  const epizodGry = (gra) => epizody.find((e) => e.gra === gra);
  const sceny = (gra, ile) => Array.from({ length: ile }, (_, i) => ({
    slug: `scena-${gra}-${i + 1}`, typ: 'scena', tytul: `Scena ${i + 1}`, numer_sceny: `1-${i + 1}`, epizod: epizodGry(gra).slug,
  }));

  const naGranicy = rozbierz(boksPowiazan(new Map([['scena', [...sceny(gry[0], 50), ...sceny(gry[1], 12)]]])));
  const [pierwsza, druga] = naGranicy.grupy[0].listy;
  assert.equal(naGranicy.grupy[0].listy.length, 2, 'dwie gry — dwie listy');
  assert.ok(pierwsza.maPodpis && druga.maPodpis, 'przy dwóch grach każda lista ma podpis gry');
  assert.deepEqual([pierwsza.ukryta, pierwsza.podpisUkryty], [false, false]);
  assert.deepEqual([druga.ukryta, druga.podpisUkryty], [true, true], 'gra bez widocznej pozycji znika z podpisem');
  assert.ok(druga.pozycje.every(Boolean));
  assert.equal(naGranicy.jeszcze, 12);

  const wSrodku = rozbierz(boksPowiazan(new Map([['scena', [...sceny(gry[0], 40), ...sceny(gry[1], 20)]]])));
  const [, drugaWSrodku] = wSrodku.grupy[0].listy;
  assert.deepEqual([drugaWSrodku.ukryta, drugaWSrodku.podpisUkryty], [false, false], 'gra z widoczną pozycją zachowuje podpis');
  assert.equal(drugaWSrodku.pozycje.filter((u) => !u).length, 10);
  assert.equal(wSrodku.jeszcze, 10);
});

test('schowane pozycje są w HTML-u od razu — „Rozwiń” niczego nie dociąga', () => {
  const html = renderEncja('srw-oe');
  const boks = html.match(/<section class="blok-powiazan"[^>]*>\s*<h2>Powiązania<\/h2>([\s\S]*?)<\/section>/)[1];
  const pozycji = (boks.match(/<li[ >]/g) ?? []).length;
  const odsylaczy = (boks.match(/<a class="link-strony" href="#\//g) ?? []).length;
  assert.ok(pozycji > LIMIT_POWIAZAN);
  assert.equal(odsylaczy, pozycji, 'każda pozycja, także schowana, jest gotowym odsyłaczem');
});

test('arkusz stylów chowa pozycje ponad limit tylko w zwiniętym boksie', () => {
  const css = fs.readFileSync(path.join(ROOT, 'src/srw/style.css'), 'utf8');
  assert.match(css, /\.blok-powiazan\[data-zwiniety\] \.ponad-limit \{ display: none; \}/);
  // Żadna inna reguła nie może chować klasy bez warunku — rozwinięty boks pokazuje wszystko.
  const regulyKlasy = css.split('}').filter((r) => /\.ponad-limit[^{]*\{[^}]*display:\s*none/.test(r));
  assert.equal(regulyKlasy.length, 1, 'jedna reguła chowa pozycje ponad limit');
  assert.match(css, /\.rozwin-powiazania:focus-visible/, 'przycisk ma widoczny fokus klawiatury');
});

/** Atrapa elementu z atrybutami — tyle DOM, ile czyta przełącznik. */
function atrapa({ zwiniety }) {
  const atrybuty = (poczatkowe) => {
    const mapa = new Map(Object.entries(poczatkowe));
    return {
      hasAttribute: (n) => mapa.has(n),
      getAttribute: (n) => mapa.get(n) ?? null,
      setAttribute: (n, v) => { mapa.set(n, String(v)); },
      removeAttribute: (n) => { mapa.delete(n); },
    };
  };
  const przewiniecia = [];
  const boks = { ...atrybuty(zwiniety ? { 'data-zwiniety': '' } : {}), scrollIntoView: (o) => przewiniecia.push(o) };
  const etykieta = { textContent: zwiniety ? 'Rozwiń' : 'Zwiń' };
  const przycisk = {
    ...atrybuty({ 'aria-expanded': String(!zwiniety) }),
    closest: (selektor) => (selektor === '.blok-powiazan' ? boks : selektor === '[data-rozwin-powiazania]' ? przycisk : null),
    querySelector: (selektor) => (selektor === '[data-etykieta]' ? etykieta : null),
  };
  return { boks, przycisk, etykieta, przewiniecia };
}

test('„Rozwiń” odsłania boks, a „Zwiń” chowa go z powrotem', () => {
  const { boks, przycisk, etykieta, przewiniecia } = atrapa({ zwiniety: true });

  assert.equal(przelaczPowiazania(przycisk), true);
  assert.equal(boks.hasAttribute('data-zwiniety'), false, 'po kliknięciu boks nie jest zwinięty');
  assert.equal(przycisk.getAttribute('aria-expanded'), 'true');
  assert.equal(etykieta.textContent, 'Zwiń');
  assert.equal(przewiniecia.length, 0, 'rozwinięcie nie przewija strony');

  assert.equal(przelaczPowiazania(przycisk), false);
  assert.equal(boks.hasAttribute('data-zwiniety'), true, 'drugie kliknięcie zwija boks');
  assert.equal(przycisk.getAttribute('aria-expanded'), 'false');
  assert.equal(etykieta.textContent, 'Rozwiń');
  assert.equal(przewiniecia.length, 1, 'po zwinięciu boks wraca w pole widzenia');
});

test('przełącznik ignoruje element spoza boksu', () => {
  assert.equal(przelaczPowiazania(null), null);
  assert.equal(przelaczPowiazania({ closest: () => null }), null);
});

test('kliknięcie przycisku trafia do przełącznika przez delegację na dokumencie', () => {
  const sluchacze = [];
  const dokument = { addEventListener: (typ, fn) => sluchacze.push([typ, fn]) };
  podepnijZwijanie(dokument);
  assert.deepEqual(sluchacze.map(([typ]) => typ), ['click']);

  const { boks, przycisk } = atrapa({ zwiniety: true });
  // Kliknięcie pada na napis w przycisku, nie na sam przycisk.
  sluchacze[0][1]({ target: { closest: (s) => przycisk.closest(s) } });
  assert.equal(boks.hasAttribute('data-zwiniety'), false);

  // Kliknięcie w odsyłacz boksu niczego nie przełącza.
  sluchacze[0][1]({ target: { closest: () => null } });
  assert.equal(boks.hasAttribute('data-zwiniety'), false);

  assert.doesNotThrow(() => podepnijZwijanie(undefined), 'brak dokumentu (Node) nie jest błędem');
});

test('witryna podpina przełącznik przy starcie', () => {
  const main = fs.readFileSync(path.join(ROOT, 'src/srw/main.js'), 'utf8');
  assert.match(main, /import \{ podepnijZwijanie \} from '\.\/zwijanie\.js';/);
  assert.match(main, /^podepnijZwijanie\(\);$/m);
});
