/**
 * Przyrost SRW Y 1.1C: archiwum, graf encji i jedna scena pierwszego epizodu.
 *
 * Test nie zastępuje testów ogólnych bazy: pilnuje konkretnie, żeby kolejny
 * etap dostawy nie zgubił surowego skryptu, zakresu gry ani relacji z menu.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wczytajSkrypty, wczytajStrony } from '../tools/content-loader.mjs';
import { zbudujRejestr, sprawdzWiernoscSceny } from '../src/srw/registry.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIWUM = path.join(ROOT, 'dostawy/srw-y/Y_dostawa_1_1C.txt');
const strony = wczytajStrony({ root: ROOT }).filter((s) => !s.problem);
const bySlug = zbudujRejestr(strony).bySlug;
const epizod = bySlug.get('srw-y-ep1');
const skrypt = wczytajSkrypty({ root: ROOT }).get('episodes/srw-y/ep001.md');

const POSTACIE = [
  'agent', 'annina-servania', 'baku-yamagishi', 'echika-y-franburnett',
  'forte-tsukinowa', 'gauma', 'zaawansowana-si', 'cross-tsukinowa',
  'mobile-doll', 'takuma-nagare', 'chang-wufei', 'yomogi-asanaka', 'zero',
  'aytie', 'cookie', 'wren',
];
const MECHY = [
  'altron-gundam', 'amx-003-gaza-c', 'a-advent', 'lunedrache',
  'lancelot-albion-zero', 'lumenus', 'taurus', 'zamza-zah',
  'getter-arc', 'insector', 'zordo-xx',
];
// Druga misja epizodu (1-2A) dopisuje do obsady postacie Getter Robo Arc
// i SSSS.DYNAZENON — mówców, którzy nie występowali w prologu.
const POSTACIE_Z_MISJI_2A = [
  'chise-asukagawa', 'yume-minami', 'show-kamui', 'koyomi-yamanaka', 'hayato-jin',
  'shikishima', 'igari', 'mei', 'matka-yomogiego',
];
const POJECIA_Z_MISJI_2A = [
  'laboratorium-saotome', 'getter-d2', 'promienie-gettera', 'insectorzy', 'n-u-n-g',
  'ryoma-nagare', 'doktor-saotome',
];
const SERIE = [
  'super-robot-wars-original', 'mobile-suit-gundam-wing-endless-waltz',
  'mobile-suit-z-gundam', 'mobile-suit-gundam-seed-destiny', 'getter-robo-arc',
  'ssss-dynazenon', 'code-geass-lelouch-of-the-re-surrection',
  'code-geass-lelouch-of-the-rebellion-iii-glorification',
];
// Mówca w skrypcie to postać epizodu i sceny (ADR 0013, adnotacja 2026-11-09) —
// także wtedy, gdy ma już stronę z innej gry (Koji, Amuro, Bright z SRW OE).
const POSTACIE_Z_PROLOGU = [
  'heero-yuy', 'duo-maxwell', 'quatre-raberba-winner', 'trowa-barton',
  'nunnally-vi-britannia', 'tetsuya-tsurugi', 'chizuru-nambara', 'hyoma-aoi',
  'koji-kabuto', 'amuro-ray', 'bright-noa',
];
const POJECIA = [
  'wojna-rewolucyjna', 'nowa-federacja-ziemska', 'val-x', 'logos',
  'czarni-rycerze', 'ninja', 'statek-emigracyjny', 'nira-kana-i',
  'pamiec-stg', 'teoria-y', 'miasto-yagami', 'mechaniczne-marionetki',
];
const POSTACIE_Z_DIALOGU = {
  Agent: 'agent',
  Amuro: 'amuro-ray',
  'Annina Servania': 'annina-servania',
  Aytie: 'aytie',
  'Baku Yamagishi': 'baku-yamagishi',
  'Bright Noa': 'bright-noa',
  'Chang Wufei': 'chang-wufei',
  'Chizuru Nambara': 'chizuru-nambara',
  Cookie: 'cookie',
  'Cross Tsukinowa': 'cross-tsukinowa',
  'Duo Maxwell': 'duo-maxwell',
  'Echika Y. Franburnett': 'echika-y-franburnett',
  'Forte Tsukinowa': 'forte-tsukinowa',
  Gauma: 'gauma',
  'Heero Yuy': 'heero-yuy',
  'Hyoma Aoi': 'hyoma-aoi',
  Koji: 'koji-kabuto',
  'Nunnally vi Britannia': 'nunnally-vi-britannia',
  'Quatre Raberba Winner': 'quatre-raberba-winner',
  'Takuma Nagare': 'takuma-nagare',
  Tetsuya: 'tetsuya-tsurugi',
  'Trowa Barton': 'trowa-barton',
  Wren: 'wren',
  'Yomogi Asanaka': 'yomogi-asanaka',
  Zero: 'zero',
  // Misja 2A dopisuje mówców Getter Robo Arc i SSSS.DYNAZENON.
  'Show Kamui': 'show-kamui',
  Hayato: 'hayato-jin',
  Shikishima: 'shikishima',
  Igari: 'igari',
  Mei: 'mei',
  'Matka Yomogiego': 'matka-yomogiego',
  'Chise Asukagawa': 'chise-asukagawa',
  'Yume Minami': 'yume-minami',
  'Koyomi Yamanaka': 'koyomi-yamanaka',
};
// Głosy zbiorowe: „Obywatel” i „Żołnierz oddziału D2” to nie osoby, więc nie mają
// stron (ADR 0013 — bezimienny ogół nie dostaje wpisu); „Prezenter” to głos z transmisji.
const GLOSY_ZBIOROWE = new Set(['Prezenter', 'Obywatel', 'Żołnierz oddziału D2']);
const SCENA = 'srw-y-ep1-misja-1-kwiaty-ninja-i-urodziny';
const STARE_SCENY = [
  'srw-y-ep1-parada-cesarza-leloucha',
  'srw-y-ep1-atak-na-miasto-yagami',
  'srw-y-ep1-start-a-adventu',
  'srw-y-ep1-ninja-w-cieniu',
  'srw-y-ep1-rdzen-nira-kana-i',
];

for (const slug of ['srw-y', 'srw-y-ep1', ...POSTACIE, ...POSTACIE_Z_PROLOGU, ...MECHY, ...SERIE, ...POJECIA, SCENA]) {
  test(`SRW Y: istnieje strona ${slug}`, () => {
    assert.ok(bySlug.has(slug), slug);
  });
}

test('SRW Y: archiwum dostawy jest niepuste i obejmuje surowy dialog oraz menu', () => {
  const raw = fs.readFileSync(ARCHIWUM, 'utf8');
  assert.ok(Buffer.byteLength(raw) > 90000);
  assert.match(raw, /### Parada cesarza Leloucha/);
  assert.match(raw, /### A\. Advent - rdzeń Systemu Nira-Kana-I/);
  assert.match(raw, /#### Domyślne mechy i jednostki w misji/);
  assert.match(raw, /#### Serie reprezentowane w misji/);
});

test('SRW Y: epizod wskazuje grę, skrypt i komplet dostarczonych relacji', () => {
  assert.equal(epizod.gra, 'srw-y');
  assert.equal(epizod.numer, 1);
  assert.equal(epizod.skrypt, 'episodes/srw-y/ep001.md');
  assert.deepEqual(epizod.postacie, [...POSTACIE, ...POSTACIE_Z_PROLOGU, ...POSTACIE_Z_MISJI_2A]);
  assert.deepEqual(epizod.mechy, MECHY);
  for (const slug of [...SERIE, ...POJECIA, ...POJECIA_Z_MISJI_2A]) {
    assert.ok(epizod.serie?.includes(slug) || epizod.pojecia?.includes(slug), slug);
  }
  assert.doesNotMatch(skrypt, /UCZESTNICY/);
  assert.match(skrypt, /\*\*Cross Tsukinowa:\*\* \*\(Starszy brat cię obroni/);
});

test('SRW Y: dostawa ma jedną scenę 1-1C z dosłownym, pełnym fragmentem skryptu', () => {
  const scena = bySlug.get(SCENA);
  assert.equal(scena.numer_sceny, '1-1C');
  assert.equal(scena.tytul, 'Kwiaty, ninja i urodziny');
  assert.equal(scena.epizod, 'srw-y-ep1');
  assert.deepEqual(sprawdzWiernoscSceny(scena, skrypt), []);
  assert.match(scena.body, /## Treść sceny\n/);
  assert.match(scena.body, /:::skrypt\n/);
  assert.match(scena.body, /## Analiza/);
  assert.match(scena.body, /### Parada cesarza Leloucha/);
  assert.match(scena.body, /### Rezydencja Franburnettów/);
  assert.match(scena.body, /### A\. Advent - rdzeń Systemu Nira-Kana-I/);
  assert.match(scena.body, /\*\*Cross Tsukinowa:\*\* \*\(Starszy brat cię obroni/);
  assert.doesNotMatch(scena.body, /UCZESTNICY/);
  assert.equal(strony.filter((s) => s.typ === 'scena' && s.epizod === 'srw-y-ep1').length, 2);
  for (const slug of STARE_SCENY) assert.ok(!bySlug.has(slug), `${slug}: usunięty podział nie jest sceną`);
});

test('SRW Y: wszystkie profile mechów zachowują dane menu pod zakresem srw-y', () => {
  // Kolejna misja uzupełnia albo odświeża rekord tej samej pary (mech, gra),
  // więc źródłem bywa późniejsze archiwum — A. Advent i Lunedrache mają dane
  // z misji 2A, a nie z prologu.
  const POZNIEJSZE = Object.fromEntries(['a-advent', 'lunedrache', 'getter-arc', 'insector', 'zordo-xx']
    .map((s) => [s, 'dostawy/srw-y/dostawa_1_2a.txt']));
  for (const slug of MECHY) {
    const mech = bySlug.get(slug);
    assert.deepEqual(mech.gry, ['srw-y'], slug);
    const wpis = mech.w_gre?.['srw-y'];
    assert.equal(typeof wpis, 'string', `${slug}: w_gre.srw-y`);
    const dane = JSON.parse(wpis);
    assert.equal(dane.dostawa, POZNIEJSZE[slug] ?? 'dostawy/srw-y/Y_dostawa_1_1C.txt', slug);
    assert.equal(dane.profil, mech.tytul, slug);
    assert.match(mech.body, /\{\{menu gra=srw-y/, slug);
  }
});

test('SRW Y: relacje encji prowadzą do epizodu, scen i serii', () => {
  for (const slug of [...POSTACIE, ...POSTACIE_Z_PROLOGU, ...MECHY]) {
    const strona = bySlug.get(slug);
    assert.ok(strona.gry.includes('srw-y'), `${slug}: gra`);
    assert.ok(strona.body.includes('gra=srw-y'), `${slug}: zakres bloków`);
  }
  for (const slug of SERIE) {
    const seria = bySlug.get(slug);
    assert.ok(seria.gry.includes('srw-y'), `${slug}: gra`);
    const encjeSerii = strony.filter((strona) => strona.seria === slug);
    assert.ok(encjeSerii.length > 0, `${slug}: relacje encji z frontmattera`);
  }
  const scena = bySlug.get(SCENA);
  assert.ok(scena.postacie.length > 0, `${SCENA}: postacie`);
  assert.ok(Array.isArray(scena.pojecia), `${SCENA}: pojęcia`);
});

test('SRW Y: każdy nazwany mówca scen 1-1C i 1-2A jest postacią w obsadzie swojej sceny i epizodu', () => {
  const scena = bySlug.get(SCENA);
  const scena2a = bySlug.get('srw-y-ep1-misja-2a-przebudzenie-niebianskiego-demona');
  const mowiacy = [...skrypt.matchAll(/^\s*>?\s*\*\*([^*]+):\*\*/gm)].map((match) => match[1]);
  assert.ok(mowiacy.length > 0, 'skrypt zawiera nazwanych mówców');
  for (const nazwa of new Set(mowiacy)) {
    if (GLOSY_ZBIOROWE.has(nazwa)) continue;
    const slug = POSTACIE_Z_DIALOGU[nazwa];
    assert.ok(slug, `brak rozpoznania mówcy: ${nazwa}`);
    const strona = bySlug.get(slug);
    assert.equal(strona?.typ, 'postac', `${nazwa}: mówca jest postacią (ADR 0013)`);
    assert.ok(strona.gry.includes('srw-y'), `${nazwa}: powiązanie z grą`);
    const wScenie = scena.postacie.includes(slug) || scena2a.postacie.includes(slug);
    assert.ok(wScenie, `${nazwa}: relacja postaci sceny`);
    assert.ok(epizod.postacie.includes(slug), `${nazwa}: relacja postaci epizodu`);
  }
});

test('SRW Y: opisy encyklopedyczne są widoczne w Markdown, a brakujące pozostają puste', () => {
  for (const slug of MECHY) {
    assert.match(bySlug.get(slug).body, /\{\{menu gra=srw-y\n\n(?!## )\S/, `${slug}: opis mecha`);
  }
  for (const slug of POSTACIE.filter((x) => !['agent', 'zaawansowana-si', 'mobile-doll'].includes(x))) {
    assert.match(bySlug.get(slug).body, /\{\{menu gra=srw-y\n\n(?!## )\S/, `${slug}: opis postaci`);
  }
  for (const slug of ['agent', 'zaawansowana-si', 'mobile-doll']) {
    assert.doesNotMatch(bySlug.get(slug).body, /\{\{menu gra=srw-y\n\n(?!## )\S/, `${slug}: nie dopisano niekanonicznego opisu`);
  }
});

test('publiczna treść nie zawiera diagnostycznych wstawek ani technicznego indeksu encji', () => {
  const zakazane = [
    'Brak zdolności w danych rekordu.',
    'Brak potwierdzonego rekordu pilota w tym materiale.',
    'Brak umiejętności w danych rekordu.',
    'Brak rozkazów ducha w danych rekordu.',
    'Brak niezerowego przypisania w trzech polach macierzystych umiejętności maszyny.',
    'Maszyna nie ma własnych zdolności macierzystych.',
    'Encje reprezentowane w bazie',
  ];
  for (const strona of strony) {
    const publiczne = `${strona.body}\\n${JSON.stringify(strona.w_gre ?? '')}`;
    for (const komunikat of zakazane) {
      assert.doesNotMatch(publiczne, new RegExp(komunikat.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')), `${strona.slug}: ${komunikat}`);
    }
  }
});
