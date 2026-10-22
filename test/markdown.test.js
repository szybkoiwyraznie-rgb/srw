import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown, escapeHtml } from '../src/srw/markdown.js';

const resolver = (slug) => (slug === 'demo' ? { href: '#/gra/demo', tytul: 'Gra DEMO' } : null);

test('renderuje nagłówki, akapity i listy', () => {
  const { html } = renderMarkdown('## Sekcja\n\nAkapit pierwszy.\n\n- raz\n- dwa\n', { resolveLink: resolver });
  assert.match(html, /<h2>Sekcja<\/h2>/);
  assert.match(html, /<p>Akapit pierwszy\.<\/p>/);
  assert.match(html, /<ul><li>raz<\/li><li>dwa<\/li><\/ul>/);
});

test('wikilink istniejący staje się odsyłaczem, martwy zgłasza problem', () => {
  const ok = renderMarkdown('Zobacz [[demo|DEMO]].', { resolveLink: resolver });
  assert.match(ok.html, /<a href="#\/gra\/demo" title="Gra DEMO">DEMO<\/a>/);
  assert.equal(ok.problemy.length, 0);

  const zle = renderMarkdown('Zobacz [[nie-ma-takiego]].', { resolveLink: resolver });
  assert.deepEqual(zle.problemy, ['martwy wikilink: [[nie-ma-takiego]]']);
  assert.match(zle.html, /class="martwy-link"/);
});

test('tabela obsługuje escapowany pionek w wikilinku', () => {
  const md = [
    '| Motyw | Źródło |',
    '|---|---|',
    '| Nieufność | [[demo\\|Gundam]] |',
    '',
  ].join('\n');
  const { html, problemy } = renderMarkdown(md, { resolveLink: resolver });
  assert.equal(problemy.length, 0);
  assert.match(html, /<th>Motyw<\/th><th>Źródło<\/th>/);
  assert.match(html, /<td><a href="#\/gra\/demo" title="Gra DEMO">Gundam<\/a><\/td>/);
});

test('tabela nie rozjeżdża się, gdy pionek w wikilinku nie jest escapowany', () => {
  const md = [
    '| Motyw | Źródło | Odcinek |',
    '|---|---|---|',
    '| Szkolenie w [[demo|Gundam]] | Prolog [[demo|DEMO]] | Epizod 0 |',
    '',
  ].join('\n');
  const { html, problemy } = renderMarkdown(md, { resolveLink: resolver });
  assert.equal(problemy.length, 0);
  assert.equal((html.match(/<th>/g) ?? []).length, 3, 'nagłówek ma trzy kolumny');
  const wiersz = html.slice(html.indexOf('<tbody>'));
  assert.equal((wiersz.match(/<td>/g) ?? []).length, 3, 'wiersz ma tyle samo kolumn co nagłówek');
  assert.match(wiersz, /<td>Szkolenie w <a href="#\/gra\/demo" title="Gra DEMO">Gundam<\/a><\/td>/);
});

test('blok :::skrypt pokazuje formatowanie wizualne, bez znaczników md', () => {
  const { html } = renderMarkdown(':::skrypt\n**Himari:** Catapult!\n\n> cytat\n:::\n', { resolveLink: resolver });
  assert.match(html, /<div class="skrypt-tekst">/);
  assert.match(html, /<strong>Himari:<\/strong> Catapult!/);
  assert.match(html, /<blockquote>/);
  assert.ok(!html.includes('**'));
  assert.ok(!html.includes('<pre'));
});

test('treść jest escapowana przed dodaniem znaczników', () => {
  const { html } = renderMarkdown('<script>alert(1)</script>', { resolveLink: resolver });
  assert.ok(!html.includes('<script>'));
  assert.match(html, /&lt;script&gt;/);
  assert.equal(escapeHtml('a & b < c > d "e"'), 'a &amp; b &lt; c &gt; d &quot;e&quot;');
});

test('niebezpieczne adresy w linkach markdown nie stają się odsyłaczami', () => {
  const { html } = renderMarkdown('[klik](javascript:alert(1))', { resolveLink: resolver });
  assert.ok(!html.includes('href="javascript'));
});

test('cytat blokowy i linia pozioma', () => {
  const { html } = renderMarkdown('> uwaga\n\n---\n', { resolveLink: resolver });
  assert.match(html, /<blockquote><p>uwaga<\/p><\/blockquote>/);
  assert.match(html, /<hr>/);
});

test('zawinięta pozycja listy nie rozpada się na osobny akapit', () => {
  const md = '1. **Rozpoznanie** — Amuro nie ufa,\nKōji wita je,\nRyōma nie\nwita ich wcale.\n\n2. **Zawieszenie** — koniec.\n';
  const { html } = renderMarkdown(md, { resolveLink: resolver });
  assert.match(html, /<ol><li><strong>Rozpoznanie<\/strong> — Amuro nie ufa, Kōji wita je, Ryōma nie wita ich wcale\.<\/li><li><strong>Zawieszenie<\/strong> — koniec\.<\/li><\/ol>/);
  assert.ok(!html.includes('<p>wita'));
});

test('ADR 0011: kilka poziomów na jednej stronie — każdy fragment ma własny blok', () => {
  const md = '{{skrypt\nAkapit ze skryptu.\n}}\n\n{{zrodlo\nAkapit ze źródła.\n}}\n\n{{wiedza\nAkapit z wiedzy.\n}}\n';
  const { html, problemy } = renderMarkdown(md, { resolveLink: resolver, wymagajPoziomu: true });
  assert.deepEqual(problemy, []);
  assert.match(html, /poziom-skrypt[\s\S]*Akapit ze skryptu/);
  assert.match(html, /poziom-zrodlo[\s\S]*Akapit ze źródła/);
  assert.match(html, /poziom-wiedza[\s\S]*Akapit z wiedzy/);
});

test('ADR 0011: fragment poza blokiem poziomu jest zgłaszany, nagłówek nie', () => {
  const { problemy } = renderMarkdown('## Tytuł\n\nAkapit bez poziomu.\n', { resolveLink: resolver, wymagajPoziomu: true });
  assert.equal(problemy.length, 1);
  assert.match(problemy[0], /bez poziomu/);
});

test('ADR 0011: nieznany poziom, zagnieżdżenie i niezamknięty blok są błędami', () => {
  const a = renderMarkdown('{{plotka\nx\n}}\n', { resolveLink: resolver });
  assert.match(a.problemy.join(' '), /nieznany poziom/);
  const b = renderMarkdown('{{zrodlo\n{{wiedza\nx\n}}\n}}\n', { resolveLink: resolver });
  assert.match(b.problemy.join(' '), /zagnieżdżony/);
  const c = renderMarkdown('{{zrodlo\nx\n', { resolveLink: resolver });
  assert.match(c.problemy.join(' '), /niezamknięty/);
});
