/**
 * Postacie i mechy to encje biorące udział w grze (ADR 0013, ADR 0029,
 * adnotacja właściciela 2026-11-09): każdy wpis musi występować w dostawie —
 * jako mówca w dialogu, w dostawie ilustracji albo w obsadzie misji
 * (frontmatter epizodów i scen). Osoba tylko wspominana w tekście jest hasłem
 * w `content/pojecia/`, nie postacią (wzór: dr-hell, tetsuro-yagami).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Mówcy z dialogów dostawy tekstowej (`**Imię Nazwisko:**`).
const mowcy = new Set();
for (const plik of fs.readdirSync('episodes', { recursive: true })) {
  if (!plik.endsWith('.md')) continue;
  const tresc = fs.readFileSync(path.join('episodes', plik), 'utf8');
  for (const m of tresc.matchAll(/^\s*>?\s*\*\*([^*]+?):\*\*/gm)) {
    mowcy.add(m[1].trim().toLowerCase());
  }
}

// Encje z dostawy ilustracyjnej (manifest bucketa R2).
const manifest = JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8'));
const ilustrowane = new Set(Object.keys(manifest.encje));

// Obsada misji: pola `postacie:` i `mechy:` w frontmatterze epizodów i scen.
const obsada = new Set();
for (const katalog of ['content/epizody', 'content/sceny']) {
  for (const plik of fs.readdirSync(katalog)) {
    if (!plik.endsWith('.md')) continue;
    const tresc = fs.readFileSync(path.join(katalog, plik), 'utf8');
    const fm = tresc.split('---')[1] ?? '';
    for (const pole of ['postacie', 'mechy']) {
      const m = fm.match(new RegExp(`^${pole}: \\[([^\\]]*)\\]`, 'm'));
      if (!m) continue;
      for (const slug of m[1].split(',')) {
        const s = slug.trim();
        if (s) obsada.add(s);
      }
    }
  }
}

function czyMowca(tytul) {
  const t = tytul.toLowerCase();
  if (mowcy.has(t)) return true;
  // Mówcy bywają przedstawiani samym imieniem („Koji:”, „Himari:”).
  const pierwsze = t.split(/\s+/)[0];
  return mowcy.has(pierwsze) && [...mowcy].some((m) => m.split(/\s+/)[0] === pierwsze);
}

test('każda postać i mech biorą udział w grze: mówca, ilustracja albo obsada', () => {
  const slabe = [];
  for (const katalog of ['content/postacie', 'content/mechy']) {
    for (const plik of fs.readdirSync(katalog)) {
      if (!plik.endsWith('.md')) continue;
      const slug = plik.slice(0, -3);
      const tresc = fs.readFileSync(path.join(katalog, plik), 'utf8');
      const fm = tresc.split('---')[1] ?? '';
      const tytul = fm.match(/^tytul:\s*"?([^"\n]+)"?/m)?.[1]?.trim() ?? slug;
      const rola = [czyMowca(tytul), ilustrowane.has(slug), obsada.has(slug)];
      if (!rola.some(Boolean)) slabe.push(`${katalog}/${slug} („${tytul}”)`);
    }
  }
  assert.deepEqual(slabe, [],
    'encje bez udziału w grze przenieś do content/pojecia (ADR 0013) albo uzupełnij obsadę');
});
