/** Dostawa 2-3: pełne dialogi, parametry i granica między treningiem a fabułą. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny } from '../src/srw/registry.js';
import { zbudujDane } from '../tools/build.mjs';
const pages = wczytajStrony();
const bySlug = new Map(pages.map(p => [p.slug, p]));
const bytes = fs.readFileSync('dostawy/srw-oe/dostawa_2_3.txt');
const raw = bytes.toString('utf8').replace(/\r\n/g, '\n');
const script = raw.split('---\nSKRYPT\n---\n')[1].split('\n---\nUCZESTNICY\n---')[0].trim();
const archive = fs.readFileSync('episodes/srw-oe/ep002.md', 'utf8');
const scene = bySlug.get('srw-oe-ep2-ryk-dziczy');
const episode = bySlug.get('srw-oe-ep2');
const crew = ['shinobu-fujiwara', 'sara-yuki', 'ryo-shiba', 'masato-shikibu', 'alan-igor'];

test('dostawa 2-3 zachowuje wszystkie bajty, a skrypt jest dopisany dokładnie raz', () => {
  assert.equal(bytes.length, 37401);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), '42485174a36ddb8f960772d582bb7894cc85069cf514f713d81bf4aad838cd3e');
  // Od misji 2-4 archiwum rośnie dalej, więc sprawdzamy obecność i jednokrotność,
  // a nie koniec pliku.
  assert.ok(archive.includes(script + '\n'));
  assert.equal(archive.split(script).length - 1, 1, 'skrypt misji 2-3 występuje raz');
  assert.equal((archive.match(/^## Ryk dziczy$/gm) ?? []).length, 1);
  assert.ok(archive.includes('## Czarny Labor'));
  assert.doesNotMatch(archive, /UCZESTNICY|Entry ID|DL102_30|eventP01/);
  assert.ok(fs.existsSync('dostawy/srw-oe/epizod-2-misja-3-pl.md'));
});

test('scena 2-3 ma pełne dialogi i jedenaście działających powiązań analizy', async () => {
  assert.equal(scene.numer_sceny, '2-3');
  assert.deepEqual(sprawdzWiernoscSceny(scene, archive), []);
  const blocks = [...scene.body.matchAll(/:::skrypt\n([\s\S]*?)\n:::/g)].map(m => m[1]);
  assert.equal(blocks.length, 11);
  assert.equal(blocks.join('\n\n'), script);
  assert.equal(scene.sekcje_analizy.length, 11);
  globalThis.SRW_DATA = await zbudujDane();
  const { renderScena } = await import('../src/srw/render-scene.js');
  assert.equal((renderScena(scene.slug).match(/class="skok-do-tresci"/g) ?? []).length, 11);
  assert.match(scene.body, /wariant rozmowy dotyczy krytycznych uszkodzeń/);
  assert.match(scene.body, /hologramami wyświetlanymi przez drony/);
  assert.match(scene.body, /oficjalne dołączenie pozostaje przyszłością/);
  // Ogólnego tła anime nie przedstawiamy jako potwierdzonego odcinka.
  assert.doesNotMatch(scene.body, /Nawiązania do oryginalnych odcinków/);
});

test('obsada oddziela obecnych pilotów od osób wspomnianych i zachowuje relacje', () => {
  assert.equal(scene.postacie.length, 15);
  for (const slug of crew) {
    const pilot = bySlug.get(slug);
    assert.ok(scene.postacie.includes(slug));
    assert.equal(pilot.seria, 'super-beast-machine-god-dancouga');
    assert.deepEqual(pilot.mechy, ['final-dancouga']);
  }
  assert.deepEqual(bySlug.get('final-dancouga').piloci, crew);
  assert.deepEqual(scene.mechy, ['exart', 'final-dancouga', 'ingram-nr-1', 'ingram-nr-2', 'nekton-assault', 'nekton-creek']);
  for (const key of ['postacie', 'mechy', 'pojecia']) {
    for (const slug of scene[key]) assert.ok(episode[key].includes(slug), `${key}: ${slug}`);
  }
  for (const slug of ['komendant-igor', 'general-takeda', 'shigeo-shiba']) {
    assert.ok(bySlug.has(slug));
    assert.ok(!scene.postacie.includes(slug), `${slug}: tylko wzmianka`);
  }
  assert.deepEqual(bySlug.get('nekton-creek').piloci, ['mucus']);
  assert.ok(bySlug.get('mucus').mechy.includes('nekton-creek'));
  assert.equal(bySlug.get('super-beast-machine-god-dancouga').rodzaj, 'tv');
  assert.equal(bySlug.get('super-beast-machine-god-dancouga').rok, 1985);
  assert.equal(bySlug.get('super-beast-machine-god-dancouga').odcinki, 38);
});

function attacks(text) {
  return text.split('\n').filter(l => /^\|\s*\d+\s*\|/.test(l))
    .map(l => l.split('|').slice(1, 9).map(c => c.trim()));
}
test('każdy z sześciu profili maszyn zachowuje wartości uzbrojenia', () => {
  const names = {Exart: 'exart', 'Final Dancouga': 'final-dancouga',
    'Ingram nr 1': 'ingram-nr-1', 'Ingram nr 2': 'ingram-nr-2',
    'Nekton Assault': 'nekton-assault', 'Nekton Creek': 'nekton-creek'};
  const text = raw.split('#### Domyślne mechy')[1].split('#### Piloci i postacie')[0];
  let count = 0;
  for (const m of text.matchAll(/^## ([^\n]+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)) {
    count++;
    const unit = bySlug.get(names[m[1]]);
    const data = JSON.parse(unit.w_gre['srw-oe']);
    assert.deepEqual(attacks(data.dane), attacks(m[2]), unit.slug);
    assert.deepEqual(attacks(unit.body), attacks(m[2]), `${unit.slug}: tabela widoczna`);
  }
  assert.equal(count, 6);
  assert.equal(attacks(bySlug.get('final-dancouga').body).length, 7);
  assert.match(bySlug.get('final-dancouga').body, /Hart.*Odepch\.\/Rzut[\s\S]*Obraż\.-4%/);
  assert.match(bySlug.get('nekton-creek').body, /holograficzny przeciwnik/);
});

const clean = s => s.replaceAll('**', '').replace(/\s+/g, ' ').trim();
test('jedenaście profili pilotów odzwierciedla statystyki, umiejętności i komendy', () => {
  const names = {'Noa Izumi':'noa-izumi', 'Isao Ota':'isao-ota', 'Kanuka Clancy':'kanuka-clancy',
    'Seishiro Kusanagi':'seishiro', 'Himari Yaegaki':'himari-yaegaki', 'Mucus':'mucus',
    'Shinobu Fujiwara':'shinobu-fujiwara', 'Sara Yuki':'sara-yuki', 'Ryo Shiba':'ryo-shiba',
    'Masato Shikibu':'masato-shikibu', 'Alan Igor':'alan-igor'};
  const text = raw.split('#### Piloci i postacie')[1].split('##### Postacie niebojowe')[0];
  let count = 0;
  for (const m of text.matchAll(/^#### ([^\n]+)\n([\s\S]*?)(?=^#### |$(?![\s\S]))/gm)) {
    count++;
    const pilot = bySlug.get(names[m[1]]);
    assert.ok(pilot, m[1]);
    assert.equal((pilot.body.match(/^## Parametry$/gm) ?? []).length, 1);
    const rows = pilot.body.split('\n').filter(l => l.startsWith('|')).map(l => l.split('|').slice(1,-1).map(clean).join('|'));
    for (const row of m[2].split('\n').filter(l => /^\|\s*(\d+|\*\*(SP|Atak|Obrona|Celność|Unik)\*\*)\s*\|/.test(l))) {
      assert.ok(rows.includes(row.split('|').slice(1,-1).map(clean).join('|')), `${pilot.slug}: ${row}`);
    }
    if (m[2].includes('podpilot korzysta')) {
      assert.match(pilot.body, /60/);
      assert.match(pilot.body, /podpilot.*statystyk.*głównego pilota/);
      assert.doesNotMatch(pilot.body, /\|\s*(?:\*\*)?(Atak|Obrona|Celność|Unik)(?:\*\*)?\s*\|/);
    }
  }
  assert.equal(count, 11);
});

test('trening nie ujawnia przyszłych losów ani fikcyjnych danych osób z dodatku', () => {
  for (const slug of [...crew, 'final-dancouga', 'nekton-creek', scene.slug]) {
    assert.doesNotMatch(bySlug.get(slug).body, /Entry ID|eventP01|DL102_30|charalist00|Black Wing|śmierć Alana/);
  }
  for (const slug of ['asuma-shinohara', 'mikiyasu-shinshi', 'hiromi-yamazaki', 'kiichi-goto', 'suol', 'komendant-igor', 'general-takeda']) {
    assert.doesNotMatch(bySlug.get(slug).body, /## Parametry/);
  }
  const trzynasty = bySlug.get('13-samodzielny-oddzial').body;
  assert.match(trzynasty, /czekając na przybycie/);
  // Od misji 2-5 wiadomo, że oddziałem jest White Base — dalsze losy zostają zapowiedzią.
  assert.match(trzynasty, /\[\[white-base\|White Base\]\]/);
  assert.doesNotMatch(trzynasty, /A Baoa Qu|Solar Ray|Kolonia Axis|śmierć/);
  assert.match(episode.body, /Misja 3: Ryk dziczy/);
});
