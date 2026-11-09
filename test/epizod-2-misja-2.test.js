/** Dostawa 2-2: archiwum, pełna scena, obsada i parametry bez spoilerów. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny, normalizujTekst } from '../src/srw/registry.js';
import { zbudujDane } from '../tools/build.mjs';
const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const bytes = fs.readFileSync('dostawy/srw-oe/dostawa_2_2.txt');
const raw = bytes.toString('utf8').replace(/\r\n/g, '\n');
const script = raw.split('---\nSKRYPT\n---\n')[1].split('\n---\nUCZESTNICY\n---')[0].trim();
const archive = fs.readFileSync('episodes/srw-oe/ep002.md', 'utf8');
const scena = bySlug.get('srw-oe-ep2-czarny-labor');
const epizod = bySlug.get('srw-oe-ep2');

test('oryginał 2-2 jest zachowany bajt w bajt, a misja dopisana bez danych technicznych', () => {
  assert.equal(bytes.length, 36781);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), 'b04cacb44da5cf358098ec02aa227b567629270feb4593e4fc00645103027982');
  assert.ok(archive.includes(script + '\n'));
  assert.equal((archive.match(/^## Czarny Labor$/gm) ?? []).length, 1);
  assert.ok(archive.includes('**Go:** Tak...\n\n## Czarny Labor'));
  assert.doesNotMatch(archive, /UCZESTNICY|DL102_20|Entry ID|\(Ally\)/);
});

test('scena 2-2 zachowuje wszystkie dialogi, kolejność i mapę 13 sekcji', async () => {
  assert.equal(scena.numer_sceny, '2-2');
  assert.equal(scena.epizod, 'srw-oe-ep2');
  assert.deepEqual(sprawdzWiernoscSceny(scena, archive), []);
  const quoted = [...scena.body.matchAll(/:::skrypt\n([\s\S]*?)\n:::/g)].map((m) => m[1]);
  assert.equal(quoted.length, 10);
  assert.equal(normalizujTekst(quoted.join('\n')), normalizujTekst(script));
  assert.equal(scena.sekcje_analizy.length, 13);
  globalThis.SRW_DATA = await zbudujDane();
  const { renderScena } = await import('../src/srw/render-scene.js');
  const html = renderScena(scena.slug);
  assert.equal((html.match(/class="skok-do-tresci"/g) ?? []).length, 13);
  assert.match(html, /Nawiązania do oryginalnych odcinków/);
  for (const title of ['Griffin was Here!', 'Tragedy in Rain']) assert.ok(scena.body.includes(title));
  const sceneOrder = pages.filter((p) => p.epizod === 'srw-oe-ep2').map((p) => p.numer_sceny).sort();
  assert.deepEqual(sceneOrder, ['2-1', '2-2', '2-3', '2-4', '2-5', '2-6', '2-7']);
});

test('obsada nie myli Entry ID z liczbą maszyn ani neutralnych Laborów z posiłkami', () => {
  const actors = ['seishiro', 'himari-yaegaki', 'noa-izumi', 'isao-ota', 'asuma-shinohara',
    'mikiyasu-shinshi', 'hiromi-yamazaki', 'kanuka-clancy', 'kiichi-goto', 'zolnierz-jsdf',
    'control-ai', 'badrinath-harchand', 'utsumi', 'kurosaki'];
  const units = ['exart', 'ingram-nr-1', 'ingram-nr-2', 'hal-x10-green', 'helldiver',
    'brocken', 'brocken-dzialko-automatyczne', 'griffon'];
  assert.deepEqual(scena.postacie, actors);
  assert.deepEqual(scena.mechy, units);
  for (const key of ['postacie', 'mechy', 'pojecia']) {
    for (const slug of scena[key]) assert.ok(epizod[key].includes(slug), `${key}: ${slug}`);
  }
  assert.deepEqual(bySlug.get('griffon').piloci, ['badrinath-harchand']);
  assert.deepEqual(bySlug.get('badrinath-harchand').mechy, ['griffon']);
  assert.deepEqual(bySlug.get('hal-x10-green').piloci, ['zolnierz-jsdf', 'shinohara-hos']);
  assert.ok(bySlug.get('zolnierz-jsdf').mechy.includes('hal-x10-green'));
  assert.deepEqual(bySlug.get('brocken-dzialko-automatyczne').piloci, ['control-ai']);
  assert.ok(bySlug.get('control-ai').mechy.includes('brocken-dzialko-automatyczne'));
  assert.equal(bySlug.has('si-sterujaca'), false, 'SI sterująca to istniejące Control AI');
  assert.doesNotMatch(scena.body.split('## Analiza')[1], /dwa Griffony|cztery Helldivery/);
});

// Kontrola wszystkich powtórzonych parametrów: pierwsze osiem komórek każdej
// broni (bez opisów kontynuowanych w kolejnych wierszach) musi odpowiadać dostawie.
const unitNames = {
  'Brocken (Brocken/Działko automatyczne)': 'brocken-dzialko-automatyczne',
  'Brocken (Brocken/Melee)': 'brocken', Exart: 'exart', Griffon: 'griffon',
  'HAL-X10 (HAL-X10/Green)': 'hal-x10-green', Helldiver: 'helldiver',
  'Ingram nr 1': 'ingram-nr-1', 'Ingram nr 2': 'ingram-nr-2',
};
function attacks(text) {
  return text.split('\n').filter((l) => /^\|\s*\d+\s*\|/.test(l))
    .map((l) => l.split('|').slice(1, 9).map((c) => c.trim()));
}
test('osiem jednostek zachowuje pełne wartości broni z nowej dostawy', () => {
  const unitsText = raw.split('#### Domyślne mechy')[1].split('#### Piloci i postacie')[0];
  let checked = 0;
  for (const match of unitsText.matchAll(/^## ([^\n]+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)) {
    checked++;
    const slug = unitNames[match[1]];
    assert.ok(slug, match[1]);
    const data = JSON.parse(bySlug.get(slug).w_gre['srw-oe']);
    assert.deepEqual(attacks(data.dane), attacks(match[2]), slug);
  }
  assert.equal(checked, 8, 'każdy z ośmiu bloków parametrów sprawdzony');
  const griffon = JSON.parse(bySlug.get('griffon').w_gre['srw-oe']);
  assert.equal(griffon.dostawa, 'dostawy/srw-oe/dostawa_2_2.txt');
  assert.equal(attacks(griffon.dane).length, 4);
  assert.match(griffon.dane, /Nagły unik/);
  assert.match(griffon.dane, /ASURA/);
  assert.match(griffon.dane, /Cel\/Unik\+3/);
  assert.equal(attacks(JSON.parse(bySlug.get('brocken-dzialko-automatyczne').w_gre['srw-oe']).dane).length, 2);
});

test('nowe umiejętności i bezpieczne powiązania nie ujawniają profilu Ally', () => {
  assert.match(bySlug.get('badrinath-harchand').body, /\| 2 \| \*\*Gracz\*\* \| 3 \| Kryt\+8% Kryt Obraż\.\+6% \|/);
  assert.match(bySlug.get('kanuka-clancy').body, /\| 2 \| \*\*Policjant\*\* \| 3 \| Zadawane Obraż\. x1\.1 \/ Obr\+4% \|/);
  for (const slug of ['badrinath-harchand', 'griffon', 'utsumi', 'kurosaki',
    'brocken-dzialko-automatyczne', 'hss', 'shaft-enterprises', scena.slug, epizod.slug]) {
    assert.doesNotMatch(bySlug.get(slug).body, /\(Ally\)|\+100|Przekierowanie|Entry ID|DL102_20|eventP01|charalist00/);
  }
  for (const slug of ['utsumi', 'kurosaki', 'hss', 'shaft-enterprises']) {
    assert.doesNotMatch(bySlug.get(slug).body, /## Parametry/);
  }
  for (const slug of ['griffon', 'brocken-dzialko-automatyczne']) {
    assert.equal(bySlug.get(slug).seria, 'mobile-police-patlabor');
    assert.equal((bySlug.get(slug).body.match(/^### Ilustracja \d+$/gm) ?? []).length, 2, 'dwie ilustracje z kolejnej dostawy');
  }
  assert.match(epizod.body, /### \[\[srw-oe-ep2-czarny-labor\|Misja 2: Czarny Labor\]\]/);
});


test('wszystkie parametry pilotów z 2-2 są odzwierciedlone bez dublowania tabel', () => {
  const pilots = {
    'Noa Izumi': 'noa-izumi', 'Isao Ota': 'isao-ota', 'Kanuka Clancy': 'kanuka-clancy',
    'Seishiro Kusanagi': 'seishiro', 'Himari Yaegaki': 'himari-yaegaki',
    'Badrinath Harchand': 'badrinath-harchand', 'Żołnierz JSDF': 'zolnierz-jsdf',
    'SI sterująca': 'control-ai',
  };
  const pilotText = raw.split('#### Piloci i postacie')[1].split('##### Postacie niebojowe')[0];
  let checked = 0;
  for (const m of pilotText.matchAll(/^#### ([^\n]+)\n([\s\S]*?)(?=^#### |$(?![\s\S]))/gm)) {
    checked++;
    const page = bySlug.get(pilots[m[1]]);
    assert.ok(page, m[1]);
    assert.equal((page.body.match(/^## Parametry$/gm) ?? []).length, 1, page.slug);
    for (const row of m[2].split('\n').filter((line) => /^\|\s*\*\*(SP|Atak|Obrona|Celność|Unik)\*\*/.test(line))) {
      const [name, value] = row.split('|').slice(1, 3).map((c) => c.trim().replaceAll('**', ''));
      assert.ok(page.body.includes(`| ${name} | ${value} |`), `${page.slug}: ${name}=${value}`);
    }
    // Weryfikacja umiejętności i komend: postać ma każdy pełny wiersz dostawy.
    for (const row of m[2].split('\n').filter((line) => /^\|\s*\d+\s*\|/.test(line))) {
      const canonical = '| ' + row.split('|').slice(1, -1).map((c) => c.trim()).join(' | ') + ' |';
      assert.ok(page.body.includes(canonical), `${page.slug}: ${canonical}`);
    }
    if (m[1] === 'Himari Yaegaki') assert.match(page.body, /60/);
  }
  assert.equal(checked, 8);
});
