import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { wczytajStrony, wczytajSkrypty } from '../tools/content-loader.mjs';
import { wytnijBlokSkryptu } from '../src/srw/registry.js';
import { renderMarkdown } from '../src/srw/markdown.js';
const pages = wczytajStrony();
const bySlug = new Map(pages.map(p => [p.slug, p]));
const delivery = fs.readFileSync('dostawy/srw-oe/jednostki-piloci-i-uzbrojenie-pl.md', 'utf8');

test('polska dostawa zastępuje stary skrypt i menu, bez zmiany historycznych slugów', () => {
  assert.equal(fs.existsSync('dostawy/srw-oe/exart-piloci-i-uzbrojenie.md'), false);
  const script = wczytajSkrypty().get('episodes/srw-oe/ep000.md');
  assert.match(script, /Minęły dekady, odkąd Federacja Ziemska/);
  assert.match(script, /Prześlij dane do działu analiz/);
  assert.doesNotMatch(script, /Connect Station|Welcome back|I'm/);
  assert.equal(wytnijBlokSkryptu(bySlug.get('prolog-i-trening-w-connect').body), script.trim());
  for (const slug of ['srw-oe-ep0', 'prolog-i-trening-w-connect', 'exart', 'seishiro', 'himari-yaegaki', 'earth-federation']) assert.ok(bySlug.has(slug));
  assert.equal(bySlug.get('earth-federation').tytul, 'Federacja Ziemska');
});

test('pięć jednostek zachowuje wszystkie ataki i ich dane w parze mech–gra', () => {
  const machines = [['exart',5], ['cybuster',7], ['cybird',3], ['brocken',1], ['real-pg-gundam',4]];
  for (const [slug, count] of machines) {
    const mech = bySlug.get(slug);
    const stats = JSON.parse(mech.w_gre['srw-oe']);
    assert.equal(stats.dostawa, 'dostawy/srw-oe/jednostki-piloci-i-uzbrojenie-pl.md');
    const rows = mech.body.split('\n').filter(line => /^\| \d+ \|/.test(line));
    assert.equal(rows.length, count, slug);
    for (const row of rows) {
      const cells = row.split('|').slice(1,-1).map(c => c.trim());
      assert.equal(cells.length, 9, `${slug}: kolumny tabeli`);
      for (const cell of cells) assert.ok(stats.dane.includes(cell), `${slug}: dane w w_gre: ${cell}`);
      assert.ok(delivery.includes(cells[1]), `${slug}: broń z dostawy`);
    }
    const html = renderMarkdown(mech.body).html;
    assert.equal((html.match(/<table>/g) ?? []).length, 1, slug);
    assert.equal((html.match(/<tr>/g) ?? []).length, count+1, slug);
    assert.doesNotMatch(mech.body, /&lt;br&gt;|base Lv|Learn-level|Prevail/);
  }
});

test('profile załogi i transformacje są powiązane, ale nie udają sceny fabularnej', () => {
  assert.deepEqual(bySlug.get('exart').piloci, ['seishiro', 'himari-yaegaki']);
  assert.deepEqual(bySlug.get('masaki-andoh').mechy, ['cybuster', 'cybird']);
  assert.deepEqual(bySlug.get('control-ai').mechy, ['brocken']);
  assert.deepEqual(bySlug.get('real-pg-gundam').piloci, []);
  assert.match(bySlug.get('cybuster').body, /\[\[cybird\|Cybird\]\]/);
  assert.match(bySlug.get('cybird').body, /\[\[cybuster\|Cybuster\]\]/);
  for (const slug of ['srw-oe-ep0', 'prolog-i-trening-w-connect']) {
    assert.deepEqual(bySlug.get(slug).postacie, ['seishiro', 'himari-yaegaki']);
    assert.deepEqual(bySlug.get(slug).mechy, ['exart']);
  }
  assert.match(bySlug.get('himari-yaegaki').body, /brak macierzystego przypisania/);
  assert.ok(bySlug.has('invaderzy'));
  for (const slug of ['kuro', 'shiro', 'keroro']) assert.ok(!bySlug.has(slug), slug);
});

test('aktualny materiał nie ujawnia poprzednich spoilerów i nie twierdzi, że Himari wysłała dane', () => {
  const connect = bySlug.get('connect-force').body;
  assert.doesNotMatch(connect, /Vasage|Mucus|Warp Gate|rozumie jej myśli/);
  assert.doesNotMatch(bySlug.get('himari-yaegaki').body, /wsiada do Exert razem|wysyła dane do zespołu/);
});
