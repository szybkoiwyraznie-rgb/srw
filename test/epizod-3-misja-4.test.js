/** Dostawa 3-4: „Szturm na kryjówkę piratów” — kurs na Marsa, baza piratów
 *  wydrążona w asteroidzie i rozmowa na mostku o losach dezerterów Zeonu. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny, normalizujTekst } from '../src/srw/registry.js';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const bytes = fs.readFileSync('dostawy/srw-oe/dostawa_3_4.txt');
const raw = bytes.toString('utf8').replace(/\r\n/g, '\n');
const deliveredScript = raw.split('---\nSKRYPT\n---\n')[1].split('\n---\nUCZESTNICY\n---')[0].trim();
// Misja kończy się przed wariantem tekstu z dodatku — ten jest odmienną wersją
// tych samych wydarzeń, nie dalszym ciągiem, i nie wchodzi do archiwum rozegrania.
const coreScript = deliveredScript.split('\n\n## Wariant tekstu DLC')[0].trim();
const script = coreScript.replace('## Szturm na kryjówkę piratów', '## Ep. 3-4: Szturm na kryjówkę piratów');
const archive = fs.readFileSync('episodes/srw-oe/ep003.md', 'utf8');
const episode = bySlug.get('srw-oe-ep3');
const scene = bySlug.get('srw-oe-ep3-kryjowka-piratow');

test('dostawa 3-4 jest archiwizowana w całości jako czwarta misja epizodu 3', () => {
  assert.equal(bytes.length, 33608);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
    'f1ca4f3c7169b108f8df47d62d44813c10ecfac814352957bf9f98234515f5ff');
  assert.ok(archive.includes('## Ep. 3-4: Szturm na kryjówkę piratów\n'));
  assert.equal(archive.split(script).length - 1, 1, 'pełny skrypt misji znajduje się w archiwum dokładnie raz');
  assert.ok(archive.endsWith(script + '\n'), 'misja 3-4 kończy archiwum epizodu');
  assert.ok(script.endsWith('w Układzie Słonecznym...'));
  assert.doesNotMatch(archive, /UCZESTNICY|Entry ID|DL103_30|Wariant tekstu DLC/);
});

test('scena 3-4 cytuje cały skrypt dosłownie i wskazuje epizod oraz kolejny numer misji', () => {
  assert.equal(scene.numer_sceny, '3-4');
  assert.equal(scene.epizod, 'srw-oe-ep3');
  assert.deepEqual(sprawdzWiernoscSceny(scene, archive), []);
  const blocks = [...scene.body.matchAll(/:::skrypt\n([\s\S]*?)\n:::/g)].map((m) => m[1]);
  assert.equal(blocks.length, 6, 'każdy etap sceny ma osobny blok skryptu');
  assert.equal(normalizujTekst(blocks.join('\n')), normalizujTekst(script));
  assert.equal(scene.sekcje_analizy.length, 6);
  assert.equal(scene.sekcje_analizy[0], 'Kurs na Marsa → Ep. 3-4: Szturm na kryjówkę piratów');
  assert.equal(scene.sekcje_analizy.at(-1), 'Los dezerterów → White Base / Mostek');
  // Analiza nie wymienia nagłówków skryptu jako tematów — opisuje świat.
  assert.doesNotMatch(scene.body.split('## Analiza')[1].split('\n## ')[0], /^###\s+(?:Dialogi|Warunkowe dialogi)/m);
  assert.match(scene.body, /## Analiza[\s\S]*## Wątki w scenie/);
  assert.ok(episode.body.includes('[[srw-oe-ep3-kryjowka-piratow|Misja 4: Szturm na kryjówkę piratów]]'));
});

test('pusta stopka wariantu DLC nie wycieka do archiwum ani do prozy witryny (ADR 0018)', () => {
  const wariant = deliveredScript.split('\n\n## Wariant tekstu DLC').at(-1);
  assert.ok(wariant.includes('alternatywny tekst tej samej misji, nie dalszy ciąg wydarzeń'));
  // Stopka opisuje strukturę ekstraktu dostawy, nie świat gry — zostaje wyłącznie w dostawie i historii wewnętrznej.
  assert.doesNotMatch(episode.body, /wariant tekstu z dodatku|Wariant tekstu DLC|wspólnych ustępów/i);
  assert.doesNotMatch(scene.body, /wariant tekstu z dodatku|Wariant tekstu DLC|wspólnych ustępów/i);
});

test('obsada misji 3-4 wnosi piratów z byłych żołnierzy Zeonu, Hiromiego Tachibanę i bazę Connect na Marsie', () => {
  assert.equal(episode.gra, 'srw-oe');
  assert.equal(episode.numer, 3);
  for (const slug of ['kamina', 'simon', 'hiromi-tachibana', 'terry-sanders-jr', 'pilot-ms']) {
    assert.ok(episode.postacie.includes(slug), `obsada epizodu: ${slug}`);
    assert.ok(bySlug.has(slug), `strona istnieje: ${slug}`);
    assert.ok(scene.postacie.includes(slug), `obsada sceny: ${slug}`);
  }
  // Kwestię „Hiromi:” w 3-4 wypowiada Hiromi Tachibana (Go-Saurer), nie Hiromi Yamazaki z SV2.
  assert.ok(!scene.postacie.includes('hiromi-yamazaki'), 'Yamazaki nie występuje w misji 3-4');
  assert.ok(episode.serie.includes('nekketsu-saikyo-go-saurer'), 'seria Go-Saurer w epizodzie 3');
  for (const slug of ['gelgoog', 'rick-dom', 'zaku-ii-bazooka', 'zaku-ii-karabin-maszynowy']) {
    assert.ok(episode.mechy.includes(slug), `sprzęt epizodu: ${slug}`);
    assert.ok(scene.mechy.includes(slug), `sprzęt sceny: ${slug}`);
    assert.ok(bySlug.get(slug).piloci.includes('pilot-ms'), `${slug}: pilot z dostawy`);
  }
  assert.ok(bySlug.get('pilot-ms').mechy.includes('gelgoog'));
  assert.ok(bySlug.get('stacja-mars'), 'baza Connect w Układzie Słonecznym ma własne hasło');
  assert.ok(scene.pojecia.includes('stacja-mars'));
  assert.ok(scene.pojecia.includes('earth-federation'));
  assert.ok(episode.pojecia.includes('stacja-mars'));
});
