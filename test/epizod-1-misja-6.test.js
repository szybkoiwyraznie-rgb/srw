/**
 * Misja 6 epizodu 1 „Ratuj transportowiec Medea”: dostawa z 2026-10-24
 * (dostawa_1_6.txt).
 *
 * Regresje pilnują archiwum, dosłownej sceny 1-6, rzeczywistych wariantów
 * zakończenia, powiązań obsady oraz nowych danych Medei i pilotów.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { wczytajStrony } from '../tools/content-loader.mjs';
import { sprawdzWiernoscSceny } from '../src/srw/registry.js';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const deliveryBytes = fs.readFileSync('dostawy/srw-oe/dostawa_1_6.txt');
const delivery = deliveryBytes.toString('utf8').replace(/\r\n/g, '\n');
const script = fs.readFileSync('episodes/srw-oe/ep001.md', 'utf8');
const scena = bySlug.get('srw-oe-ep1-ratuj-transportowiec-medea');
const epizod = bySlug.get('srw-oe-ep1');

const postacie = ['shiro-amada', 'terry-sanders-jr', 'karen-joshua', 'michel-ninorich',
  'eledore-massis', 'oficer-federacji', 'zolnierz-federacji', 'zolnierz-zeonu'];
const mechy = ['gundam-ez8', 'gundam-ground-type', 'gundam-ground-type-glowa-gm',
  'hover-truck', 'medea', 'dopp', 'zaku-ii-karabin-maszynowy', 'zaku-ii-bazooka'];
const pojecia = ['08-pluton-ms', 'jaburo', 'earth-federation', 'zeon'];

function komorki(wiersz) {
  return wiersz.split('|').slice(1, -1).map((cell) => cell.trim());
}

test('dostawa 1-6 jest zachowana bajt w bajt, a cała misja pozostaje w skrypcie epizodu', () => {
  assert.equal(deliveryBytes.length, 25000);
  assert.equal(createHash('sha256').update(deliveryBytes).digest('hex'),
    '786e51536ca0a2d5c20af619b58c577800ed6a5f76d8800f7bc6d3a1f4d0a056');
  assert.match(delivery, /^## Ratuj transportowiec Medea$/m);
  assert.match(delivery, /^### Odcinek 1 — Ratuj transportowiec Medea \(`DL101_60`\)$/m);
  assert.match(delivery, /^## Medea$/m);
  assert.match(delivery, /^#### Terry Sanders Jr\.$/m);
  const expected = delivery.split('---\nSKRYPT\n---\n')[1].split('\n---\nUCZESTNICY\n---')[0].trim();
  assert.ok(script.includes(expected), 'misja z obiema wariantami i narracją pozostaje w epizodzie');
  assert.ok(!script.includes('UCZESTNICY'));
  assert.ok(!script.includes('DL101_60'));
});

test('scena 1-6 jest dosłowna i poprzedza misję 1-7 w epizodzie 1', () => {
  assert.equal(scena.typ, 'scena');
  assert.equal(scena.epizod, 'srw-oe-ep1');
  assert.equal(scena.numer_sceny, '1-6');
  assert.equal(scena.tytul, 'Ratuj transportowiec Medea');
  assert.deepEqual(sprawdzWiernoscSceny(scena, script), []);
  assert.equal((scena.body.match(/:::skrypt/g) ?? []).length, 5);
  for (const fragment of ['### Baza Federacji / Hangar', '### Medea pod ostrzałem',
    '#### Warunkowe rozstrzygnięcie — jeden przebieg wydarzeń',
    '#### Warunkowe rozstrzygnięcie — alternatywny przebieg wydarzeń',
    'Po krótkim odpoczynku 08. Pluton MS wsiadł na pokład Medei i odleciał do Jaburo.']) {
    assert.ok(scena.body.includes(fragment), fragment);
  }
  const sceny = pages.filter((p) => p.typ === 'scena' && p.epizod === 'srw-oe-ep1')
    .sort((a, b) => String(a.numer_sceny).localeCompare(String(b.numer_sceny)));
  assert.deepEqual(sceny.map((s) => s.numer_sceny), ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8']);
});

test('pięć etapów analizy ma kotwice i opisuje prawdziwe warianty zakończenia', () => {
  const blokAnalizy = scena.body.split('## Analiza')[1].split('\n## ')[0];
  const analiza = [...blokAnalizy.matchAll(/^### (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(analiza, ['Serwis i wezwanie', 'Priorytet osłony', 'Części od GM-a w walce',
    'Dwa warianty zakończenia', 'Po akcji']);
  const mapa = scena.sekcje_analizy ?? [];
  assert.equal(mapa.length, 5);
  for (const wpis of mapa) {
    const [lewa, prawa] = String(wpis).split('→').map((s) => s.trim());
    assert.ok(analiza.includes(lewa), `analiza: ${lewa}`);
    assert.ok(scena.body.includes(prawa), `treść: ${prawa}`);
  }
  assert.match(blokAnalizy, /zmieniają kolejność komunikatów/);
  assert.match(blokAnalizy, /nie rozstrzygnięciem wydarzeń/);
  assert.match(scena.body, /\*\*Oficer Federacji:\*\* Tu Medea\. Kurs zabezpieczony\.\.\. Dzięki za ratunek!/);
});

test('obsada, jednostki i hasła misji 6 są spięte ze sceną oraz epizodem', () => {
  for (const slug of postacie) {
    assert.ok(bySlug.has(slug), `brak postaci ${slug}`);
    assert.ok(scena.postacie.includes(slug), `scena: ${slug}`);
    assert.ok(epizod.postacie.includes(slug), `epizod: ${slug}`);
  }
  for (const slug of mechy) {
    assert.ok(bySlug.has(slug), `brak mecha ${slug}`);
    assert.ok(scena.mechy.includes(slug), `scena: ${slug}`);
    assert.ok(epizod.mechy.includes(slug), `epizod: ${slug}`);
  }
  for (const slug of pojecia) {
    assert.ok(bySlug.has(slug), `brak pojęcia ${slug}`);
    assert.ok(scena.pojecia.includes(slug), `scena: ${slug}`);
    assert.ok(epizod.pojecia.includes(slug), `epizod: ${slug}`);
  }
  for (const slug of ['mobile-suit-gundam-08th-ms-team', 'mobile-suit-gundam-1979']) {
    assert.equal(bySlug.get(slug).typ, 'seria');
  }
  assert.ok(scena.zrodla.includes('https://gundam.fandom.com/wiki/Medea'));
  assert.ok(epizod.zrodla.includes('https://gundam.fandom.com/wiki/Medea'));
});

test('Medea zachowuje wpis bez broni i dostaje osobny karabin oraz drugiego pilota', () => {
  const medea = bySlug.get('medea');
  assert.equal(medea.typ, 'mech');
  // ADR 0024: pilot z obsady misji stoi przed domyślną załogą jednostki.
  assert.deepEqual(medea.piloci, ['oficer-federacji', 'zolnierz-jsdf']);
  assert.deepEqual(bySlug.get('oficer-federacji').mechy, ['medea']);
  assert.ok(bySlug.get('zolnierz-jsdf').mechy.includes('medea'));
  assert.ok(medea.tagi.includes('jsdf'));
  assert.ok(medea.tagi.includes('federacja'));
  const stats = JSON.parse(medea.w_gre['srw-oe']);
  assert.equal(stats.dostawa, 'dostawy/srw-oe/dostawa_1_6.txt');
  assert.equal(stats.profil, 'Medea');
  assert.ok(stats.dane.includes('#### Dodatkowe wpisy — selektor zerowy'));
  const rows = medea.body.split('\n').filter((line) => /^\|\s*\d+\s*\|/.test(line));
  assert.equal(rows.length, 2);
  for (const row of rows) {
    const cells = komorki(row);
    assert.equal(cells.length, 9);
    for (const cell of cells) {
      assert.ok(stats.dane.includes(cell), `w_gre: ${cell}`);
      assert.ok(delivery.includes(cell), `dostawa: ${cell}`);
    }
  }
  assert.deepEqual(komorki(rows[0]).slice(0, 7), ['0', 'Bez uzbrojenia', '0', '0–0', '+0', '0', '—']);
  assert.deepEqual(komorki(rows[1]).slice(0, 7),
    ['1', 'Karabin przeciwlotniczy', '1000', '1–2', '+5', '20', '—']);
});

test('Medea ma źródłowe tło konstrukcji transportowca', () => {
  const medea = bySlug.get('medea');
  for (const adres of ['https://gundam.fandom.com/wiki/Medea', 'https://www.mahq.net/medea/']) {
    assert.ok(medea.zrodla.includes(adres), adres);
    assert.ok(medea.body.includes(adres), adres);
  }
  const tlo = medea.body.match(/^\{\{zrodlo gra=wspolne\n([\s\S]*?)^\}\}$/m);
  assert.ok(tlo, 'osobny blok pierwowzoru');
  for (const fragment of ['odłączany kontener', 'bez pasa startowego',
    'niskociśnieniowe opony', 'dwa przeciwlotnicze karabiny maszynowe']) {
    assert.ok(tlo[1].includes(fragment), fragment);
  }
  assert.doesNotMatch(tlo[1], /Matilda|C-88|Thunderbolt|Garuda/);
});

test('Sanders, Karen i Michel zachowują pierwszą umiejętność i dostają drugą z poziomu 3', () => {
  const profile = {
    'terry-sanders-jr': ['Potenc. Obr', 'Blok', 'Obraż.-16% Sz. 12% *(1.08)*'],
    'karen-joshua': ['Potenc. Kryt', 'Wsparcie', 'Wsparcie: Atk/Obr+20%'],
    'michel-ninorich': ['Potenc. Unik', 'Blok', 'Obraż.-16% Sz. 12% *(1.08)*'],
  };
  for (const [slug, [pierwsza, druga, efekt]] of Object.entries(profile)) {
    const body = bySlug.get(slug).body;
    const rows = body.split('\n').filter((line) => /^\|\s*\d+\s*\|/.test(line));
    const first = rows.find((row) => row.includes(`**${pierwsza}**`));
    const second = rows.find((row) => row.includes(`**${druga}**`));
    assert.ok(first, `${slug}: pierwsza umiejętność`);
    assert.ok(second, `${slug}: druga umiejętność`);
    assert.deepEqual(komorki(first).slice(0, 3), ['1', `**${pierwsza}**`, '1'], slug);
    assert.deepEqual(komorki(second), ['2', `**${druga}**`, '3', efekt], slug);
    assert.ok(delivery.includes(`**${druga}**`), `${slug}: nazwa w dostawie`);
    assert.ok(delivery.includes(efekt), `${slug}: efekt w dostawie`);
  }
});

test('epizod i najnowszy wpis Co nowego opisują misję oraz jej skutki', () => {
  assert.ok(epizod.body.includes('[[srw-oe-ep1-ratuj-transportowiec-medea|Misja 6: Ratuj transportowiec Medea]]'));
  assert.match(epizod.body, /Medea melduje zabezpieczony kurs/);
  assert.match(epizod.body, /nie wiozła części zamiennych/);
  assert.match(epizod.body, /Ratunek klucza Medei i lot do Jaburo/);
  assert.match(scena.body, /nie przenoszą konkretnego odcinka/);
  const changelog = fs.readFileSync('content/co-nowego.md', 'utf8');
  const wpis = changelog.split(/^## /m).find((entry) => entry.startsWith('2026-10-24 20:55'));
  assert.ok(wpis, 'wpis misji 1-6 pozostaje w dzienniku');
  assert.ok(wpis.includes('srw-oe-ep1-ratuj-transportowiec-medea'));
  assert.ok(wpis.includes('**Blok**'));
  assert.ok(wpis.includes('**Wsparcie**'));
});
