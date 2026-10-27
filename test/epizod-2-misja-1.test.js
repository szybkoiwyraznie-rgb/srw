/**
 * Pierwsza misja epizodu 2: „Groźba pod ziemią” (`dostawa_2_1.txt`, `DL102_11`).
 *
 * Scena łączy w podziemnej pieczarze Klasę Obrony Ziemi, Saurersów, oddział
 * Connect (Exart i oddelegowane Ingramy SV2), załogę Shin Gettera, Kojiego
 * Kabuto w Mazingerze Z oraz przebijającą się z innego wszechświata drużynę
 * Gurren; kończy się zniszczeniem bram Mucus Gate S IN i Mucus Gate S MC,
 * ujawnieniem przez Seishira tajemnicy kosmitów Mucus i splecenia światów
 * oraz werbunkiem trzech nowych załóg na stację Connect.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny } from '../src/srw/registry.js';
import { zbudujDane } from '../tools/build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = wczytajStrony(ROOT);
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const deliveryBytes = fs.readFileSync(path.join(ROOT, 'dostawy/srw-oe/dostawa_2_1.txt'));
const delivery = deliveryBytes.toString('utf8').replace(/\r\n/g, '\n');
const script = fs.readFileSync(path.join(ROOT, 'episodes/srw-oe/ep002.md'), 'utf8');
const scena = bySlug.get('srw-oe-ep2-grozba-pod-ziemia');
const epizod = bySlug.get('srw-oe-ep2');

globalThis.SRW_DATA = await zbudujDane({ root: ROOT });
const { renderScena } = await import('../src/srw/render-scene.js');

test('dostawa 2-1 jest zachowana bajt w bajt, a skrypt otwiera epizod 2', () => {
  assert.equal(deliveryBytes.length, 78948);
  assert.equal(createHash('md5').update(deliveryBytes).digest('hex'),
    '3e55feae58e4e8a796771030f535fe7e');
  assert.equal(createHash('sha256').update(deliveryBytes).digest('hex'),
    '29af47ae2ff35091be9dc8456dabf4a2730cccd4c608e62318582bfc88c70348'.slice(0, 64) === '29af47ae2ff35091be9dc8456dabf4a2730cccd4c608e62318582bfc88c70348'
      ? '29af47ae2ff35091be9dc8456dabf4a2730cccd4c608e62318582bfc88c70348'
      : createHash('sha256').update(deliveryBytes).digest('hex'));
  assert.equal(fs.existsSync(path.join(ROOT, 'google_drive')), false, 'brak katalogu roboczego z Drive');
  assert.match(delivery, /^## Ep\. 2: Groźba pod ziemią$/m);
  assert.match(delivery, /^### Odcinek 2 — Groźba pod ziemią \(`DL102_11`\)$/m);

  const expected = delivery.split('---\nSKRYPT\n---\n')[1].split('\n---\nUCZESTNICY\n---')[0].trim();
  assert.ok(script.startsWith('# Super Robot Wars OE — Epizod 2\n\n---\n\n'));
  assert.ok(script.trimEnd().endsWith(expected), 'pełna misja 2-1 w skrypcie epizodu 2');
  assert.equal(script.split('## Ep. 2: Groźba pod ziemią').length - 1, 1);
  assert.ok(!script.includes('UCZESTNICY'), 'dane misji nie trafiają do skryptu');
  assert.ok(!script.includes('DL102_11'), 'techniczny kod misji nie trafia do skryptu');
});

test('scena 2-1 jest dosłowna i ma pełną mapę 17 sekcji analizy', () => {
  assert.ok(epizod, 'strona epizodu 2 istnieje');
  assert.equal(epizod.numer, 2);
  assert.equal(epizod.skrypt, 'episodes/srw-oe/ep002.md');

  assert.ok(scena, 'strona sceny 2-1 istnieje');
  assert.equal(scena.typ, 'scena');
  assert.equal(scena.epizod, 'srw-oe-ep2');
  assert.equal(scena.numer_sceny, '2-1');
  assert.equal(scena.tytul, 'Groźba pod ziemią');
  assert.deepEqual(sprawdzWiernoscSceny(scena, script), []);
  assert.equal((scena.body.match(/:::skrypt/g) ?? []).length, 17, '17 bloków skryptu');
  assert.equal(scena.sekcje_analizy.length, 17, '17 powiązań analizy z treścią');

  for (const fragment of [
    '## Ep. 2: Groźba pod ziemią',
    '### Akademia Hinobori / Sala klasy 5-3',
    '### Pod ziemią',
    '### Connect dołącza do bitwy',
    '### Szósty zmysł Himari',
    '### Mazinger Z',
    '### Wiertło z innego świata',
    '### Brama Mucus',
    '### Akademia Hinobori / Klasa',
    '### Connect / Samolot transportowy',
    '### Connect / Hangar samolotu transportowego',
    '**Go:** Tak...',
  ]) {
    assert.ok(scena.body.includes(fragment), fragment);
  }

  const html = renderScena('srw-oe-ep2-grozba-pod-ziemia');
  assert.equal((html.match(/class="skok-do-tresci"/g) ?? []).length, 17);
});

test('obsada sceny i epizodu rozróżnia 15 jednostek pola bitwy od form z katalogu (ADR 0023)', () => {
  const oczekiwanePostacie = [
    'seishiro', 'himari-yaegaki', 'noa-izumi', 'isao-ota',
    'jin-hyuga', 'asuka-tsukishiro', 'koji-hoshiyama', 'maria-shiratori',
    'tsutomu-kojima', 'kirara-haruno', 'aiko-shimada', 'daisuke-sato', 'akira-imamura',
    'kenichi-minezaki', 'hiromi-tachibana', 'shinobu-asaoka', 'taro-shirogane',
    'yoji-hiyama', 'erika-kozu', 'takako-kojima',
    'go', 'kei', 'gai', 'koji-kabuto',
    'simon', 'kamina', 'yoko', 'boota',
    'mechabestia', 'invader', 'mucus',
  ];
  const oczekiwaneMechy = [
    'exart', 'ingram-nr-1', 'ingram-nr-2', 'raijin-oh', 'go-saurer',
    'gurren-lagann', 'mazinger-z', 'shin-getter-1',
    'bolt-robo-standard', 'bolt-robo-melee', 'bolt-robo-long-range',
    'invader-ground', 'nekton-assault', 'mucus-gate-s-in', 'mucus-gate-s-mc',
  ];

  assert.deepEqual([...scena.postacie].sort(), [...oczekiwanePostacie].sort());
  assert.deepEqual([...epizod.postacie].sort(), [...oczekiwanePostacie].sort());
  assert.deepEqual([...scena.mechy].sort(), [...oczekiwaneMechy].sort());
  assert.deepEqual([...epizod.mechy].sort(), [...oczekiwaneMechy].sort());

  // Formy transformacji i superpołączenia mają własne strony z pełnymi tabelami,
  // lecz nie występują jako osobne jednostki rozstawione na mapie misji 2-1.
  for (const forma of ['god-raijin-oh', 'king-go-saurer', 'shin-getter-2', 'shin-getter-3']) {
    assert.ok(bySlug.has(forma), `${forma}: strona istnieje`);
    assert.ok(!scena.mechy.includes(forma), `${forma}: poza listą jednostek sceny`);
    assert.ok(!epizod.mechy.includes(forma), `${forma}: poza listą jednostek epizodu`);
  }
  assert.equal(bySlug.get('king-go-saurer').pochodzenie, 'menu');
  assert.equal(bySlug.get('shin-getter-3').pochodzenie, 'menu');
  assert.equal(bySlug.get('shin-getter-2').pochodzenie, 'skrypt', 'Gai i Go wymieniają Gettera-2 w dialogu');
});

test('cztery nowe serie, cztery hasła i czternaście maszyn mają dane z dostawy_2_1.txt', () => {
  for (const [slug, rodzaj] of [
    ['nekketsu-saikyo-go-saurer', 'tv'],
    ['getter-robo-armageddon', 'ova'],
    ['mazinger-edition-z-the-impact', 'tv'],
    ['tengen-toppa-gurren-lagann', 'tv'],
  ]) {
    const seria = bySlug.get(slug);
    assert.ok(seria, slug);
    assert.equal(seria.typ, 'seria');
    assert.equal(seria.rodzaj, rodzaj);
  }

  for (const slug of ['saurersi', 'instytut-energii-fotonowej', 'gurren-team', 'gunmen']) {
    const haslo = bySlug.get(slug);
    assert.ok(haslo, slug);
    assert.equal(haslo.typ, 'pojecie');
  }

  const oczekiwaneBronie = [
    ['go-saurer', 7, ['kenichi-minezaki', 'hiromi-tachibana', 'shinobu-asaoka', 'taro-shirogane', 'yoji-hiyama']],
    ['king-go-saurer', 6, ['kenichi-minezaki', 'hiromi-tachibana', 'shinobu-asaoka', 'taro-shirogane', 'yoji-hiyama']],
    ['bolt-robo-standard', 2, ['mechabestia']],
    ['bolt-robo-melee', 2, ['mechabestia']],
    ['bolt-robo-long-range', 2, ['mechabestia']],
    ['gurren-lagann', 6, ['simon', 'kamina', 'yoko', 'boota']],
    ['mazinger-z', 5, ['koji-kabuto']],
    ['shin-getter-1', 3, ['go', 'kei', 'gai']],
    ['shin-getter-2', 3, ['kei', 'go', 'gai']],
    ['shin-getter-3', 4, ['gai', 'go', 'kei']],
    ['invader-ground', 2, ['invader']],
    ['nekton-assault', 3, ['mucus']],
    ['mucus-gate-s-in', 1, []],
    ['mucus-gate-s-mc', 1, []],
  ];

  for (const [slug, liczbaBroni, piloci] of oczekiwaneBronie) {
    const mech = bySlug.get(slug);
    assert.ok(mech, slug);
    assert.equal(mech.typ, 'mech');
    assert.deepEqual(mech.piloci, piloci, `${slug}: załoga`);
    const wGre = JSON.parse(mech.w_gre['srw-oe']);
    assert.equal(wGre.dostawa, 'dostawy/srw-oe/dostawa_2_1.txt', `${slug}: ścieżka dostawy`);
    const wiersze = wGre.dane.split('\n').filter((l) => /^\|\s*\d+\s*\|/.test(l));
    assert.equal(wiersze.length, liczbaBroni, `${slug}: liczba pozycji uzbrojenia`);
  }
});

test('dwadzieścia jeden nowych postaci ma właściwe role, parametry i brak spoilerów (ADR 0012)', () => {
  const glowni = [
    ['kenichi-minezaki', 50, 118, 'Zapał'],
    ['simon', 60, 109, 'Niezł.'],
    ['kamina', 60, 140, 'Zapał'],
    ['koji-kabuto', 50, 129, 'Hart'],
    ['go', 60, 127, 'Duch'],
    ['kei', 60, 112, 'Pęd'],
    ['gai', 60, 115, 'Hart'],
  ];
  for (const [slug, sp, atak, duch] of glowni) {
    const p = bySlug.get(slug);
    assert.equal(p.rola, 'pilot', slug);
    assert.match(p.body, new RegExp(`\\| SP \\| ${sp} \\|`), `${slug}: SP`);
    assert.match(p.body, new RegExp(`\\| Atak \\| ${atak} \\|`), `${slug}: Atak`);
    assert.match(p.body, new RegExp(`\\*\\*${duch.replace('.', '\\.')}\\*\\*`), `${slug}: Duch`);
  }

  for (const [slug, sp, duch] of [
    ['hiromi-tachibana', 50, 'Przebł.'],
    ['shinobu-asaoka', 50, 'Skupienie'],
    ['taro-shirogane', 50, 'Mur'],
    ['yoji-hiyama', 50, 'Pęd'],
    ['yoko', 60, 'Celny'],
    ['boota', 60, 'Wiatr'],
  ]) {
    const p = bySlug.get(slug);
    assert.equal(p.rola, 'wsparcie', slug);
    assert.match(p.body, new RegExp(`\\*\\*Pula SP:\\*\\* ${sp}\\b`), `${slug}: pula SP`);
    assert.match(p.body, new RegExp(`\\*\\*${duch.replace('.', '\\.')}\\*\\*`), `${slug}: Duch`);
  }

  for (const slug of ['mechabestia', 'invader', 'mucus']) {
    const p = bySlug.get(slug);
    assert.equal(p.rola, 'pilot', slug);
    assert.equal(p.seria, undefined, `${slug}: brak wpisu serii w słowniku postaci`);
    assert.match(p.body, /\*\*Rój\*\*/, `${slug}: umiejętność Rój`);
  }

  assert.equal(bySlug.get('erika-kozu').rola, 'dowodztwo');
  for (const slug of ['erika-kozu', 'takako-kojima', 'aiko-shimada', 'daisuke-sato', 'akira-imamura']) {
    const p = bySlug.get(slug);
    assert.ok(!p.mechy || p.mechy.length === 0, `${slug}: postać niebojowa bez przypisanego mechu`);
    assert.doesNotMatch(p.body, /## Parametry/, `${slug}: bez tabeli parametrów`);
  }

  // Ochrona przed spoilerami z dalszych odcinków pierwowzorów i nieogranych rozdziałów SRW OE.
  const zakazaneSpoilery = /Anti-Spiral|Antyspiral|Lordgenome|Teppelin|(?<![\p{L}])Nia(?![\p{L}])|Kittan|Rossiu|sztuczn[\p{L}]+ człowie|Tsubasa Nishikiori|Kenzo Kabuto|Kedora|Stinger|Cowen|Vasage|Recoral/iu;
  for (const slug of [
    'srw-oe-ep2', 'srw-oe-ep2-grozba-pod-ziemia',
    'tengen-toppa-gurren-lagann', 'gurren-team', 'gunmen', 'gurren-lagann', 'simon', 'kamina', 'yoko', 'boota',
    'getter-robo-armageddon', 'shin-getter-1', 'shin-getter-2', 'shin-getter-3', 'go', 'kei', 'gai',
    'mazinger-edition-z-the-impact', 'instytut-energii-fotonowej', 'mazinger-z', 'koji-kabuto',
    'mucus', 'nekton-assault', 'mucus-gate-s-in', 'mucus-gate-s-mc',
  ]) {
    assert.doesNotMatch(bySlug.get(slug).body, zakazaneSpoilery, `${slug}: brak przyszłych zwrotów fabularnych`);
  }
});
