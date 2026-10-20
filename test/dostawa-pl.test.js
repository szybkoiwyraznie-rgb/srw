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
  assert.deepEqual(bySlug.get('exart').piloci, ['seishiro']);
  assert.deepEqual(bySlug.get('masaki-andoh').mechy, ['cybuster', 'cybird']);
  assert.deepEqual(bySlug.get('control-ai').mechy, ['brocken']);
  assert.deepEqual(bySlug.get('real-pg-gundam').piloci, []);
  assert.match(bySlug.get('cybuster').body, /\[\[cybird\|Cybird\]\]/);
  assert.match(bySlug.get('cybird').body, /\[\[cybuster\|Cybuster\]\]/);
  for (const slug of ['srw-oe-ep0', 'prolog-i-trening-w-connect']) {
    assert.deepEqual(bySlug.get(slug).postacie, ['seishiro', 'himari-yaegaki']);
    assert.deepEqual(bySlug.get(slug).mechy, ['exart']);
  }
  assert.doesNotMatch(bySlug.get('himari-yaegaki').body, /Profil załogi|Miejsce 2|brak macierzystego przypisania/);
  assert.ok(bySlug.has('invaderzy'));
  assert.ok(!bySlug.has('keroro'), 'nazwa wariantu nie przypisuje domyślnego pilota');
});

test('aktualny materiał nie ujawnia poprzednich spoilerów i nie twierdzi, że Himari wysłała dane', () => {
  const connect = bySlug.get('connect-force').body;
  assert.doesNotMatch(connect, /Vasage|Mucus|Warp Gate|rozumie jej myśli/);
  assert.doesNotMatch(bySlug.get('himari-yaegaki').body, /wsiada do Exert razem|wysyła dane do zespołu/);
});

test('ilustracje właściciela: 15 plików przy 10 encjach, w tym postacie bez dostawy tekstowej', () => {
  const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
  assert.equal(manifest.weryfikacjaZdalna, false, 'nie deklarujemy obejrzenia ilustracji');
  assert.equal(Object.keys(manifest.encje).length, 10);
  assert.equal(Object.values(manifest.encje).flat().length, 15);
  assert.deepEqual(manifest.nieprzypisane, []);
  for (const [slug, files] of Object.entries(manifest.encje)) {
    const body = bySlug.get(slug).body;
    const { html, problemy } = renderMarkdown(body, { wymagajPoziomu: true });
    assert.deepEqual(problemy, []);
    assert.equal((html.match(/<img /g) ?? []).length, files.length, slug);
    assert.match(body, /\{\{menu gra=srw-oe\n\n## Ilustracje/, `${slug}: galeria z zakresem gry (ADR 0020)`);
    for (const file of files) {
      const url = `${manifest.baseUrl}/${encodeURIComponent(file)}`;
      assert.ok(html.includes(`src="${url}"`), `${slug}: podgląd ${file}`);
      assert.ok(html.includes(`href="${url}"`), `${slug}: pełny rozmiar ${file}`);
    }
    assert.doesNotMatch(body, /data:image/);
    assert.doesNotMatch(html, /src="[^"]* /);
    assert.match(html, /loading="lazy"/);
  }
});


test('ilustracja jest dostawą: Kuro i Shiro mają opisy, źródła i powiązania bez dopisywania fabuły', () => {
  for (const slug of ['kuro', 'shiro']) {
    const page = bySlug.get(slug);
    assert.equal(page.typ, 'postac');
    assert.deepEqual(page.gry, ['srw-oe']);
    assert.deepEqual(page.mechy, ['cybuster']);
    assert.equal(page.seria, 'super-robot-wars-original');
    assert.equal(page.pochodzenie, 'zrodlo');
    assert.match(page.body, /## Opis/);
    assert.match(page.body, /\{\{zrodlo/);
    assert.match(page.body, /sprawdzono 2026-10-19/);
    assert.match(page.body, /\[\[masaki-andoh\|/);
    assert.match(page.body, /\[\[cybuster\|/);
    assert.match(page.body, /\{\{wiedza/);
    for (const url of page.zrodla) assert.ok(page.body.includes(url));
    const memory = page.body.match(/\{\{wiedza\n([\s\S]*?)\n\}\}/)[1];
    assert.doesNotMatch(memory, /https?:|\]\(/);
    for (const scene of ['srw-oe-ep0','prolog-i-trening-w-connect']) {
      assert.ok(!bySlug.get(scene).postacie.includes(slug));
    }
    assert.ok(!bySlug.get('cybuster').piloci.includes(slug), 'źródło nie zmienia załogi z menu');
    assert.match(bySlug.get('masaki-andoh').body, new RegExp('\\[\\['+slug+'\\|'));
  }
});


test('menu nie uchyla zakazu spoilerów: brak przyszłej roli Himari w stronach i danych', () => {
  assert.deepEqual(bySlug.get('exart').piloci, ['seishiro']);
  for (const page of pages) {
    assert.doesNotMatch(page.body, /(?:Miejsce|miejsce) 2[^\n]*Himari|Himari[^\n]*drugie miejsce|dwa miejsca załogi|kiedy Himari zajmie/);
  }
  const stats = JSON.parse(bySlug.get('exart').w_gre['srw-oe']);
  assert.doesNotMatch(stats.dane, /Miejsce 2|Przypisany profil: Himari|brak macierzystego przypisania/);
  assert.doesNotMatch(fs.readFileSync('content/co-nowego.md','utf8'), /dwa miejsca załogi|drugie miejsce Exarta/);
  // Raw owner archive remains faithful; it is not embedded in the site.
  assert.match(delivery, /Miejsce 2: Himari Yaegaki/);
  assert.match(bySlug.get('himari-yaegaki').body, /zdalnie steruje/);
});
