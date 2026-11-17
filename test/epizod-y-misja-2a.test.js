/**
 * Druga misja epizodu 1 SRW Y: „Przebudzenie niebiańskiego demona” (`dostawa_1_2a.txt`).
 *
 * Testy pilnują czterech rzeczy:
 * - materiał z dostawy jest zarchiwizowany w całości, a jego skrypt kończy epizod,
 * - scena 1-2A jest dosłownym fragmentem skryptu i ma pełną analizę,
 * - dane jednostek i pilotów trafiają do bazy bez zmiany wartości,
 * - odświeżony rekord pary (mech, gra) dotyczy tylko maszyn, które nowa misja
 *   naprawdę przyniosła, i nie gubi starszego uzbrojenia A. Adventu.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wczytajStrony, wczytajSkrypty } from '../tools/content-loader.mjs';
import { zbudujRejestr, sprawdzWiernoscSceny } from '../src/srw/registry.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIWUM = path.join(ROOT, 'dostawy/srw-y/dostawa_1_2a.txt');
const DOSTAWA = 'dostawy/srw-y/dostawa_1_2a.txt';
const DODATEK = 'dostawy/srw-y/Y_dostawa_1_2a_dodatek.txt';
const ARCHIWUM_DODATKU = path.join(ROOT, DODATEK);
const SCENA = 'srw-y-ep1-misja-2a-przebudzenie-niebianskiego-demona';

const strony = wczytajStrony({ root: ROOT }).filter((s) => !s.problem);
const bySlug = zbudujRejestr(strony).bySlug;
const epizod = bySlug.get('srw-y-ep1');
const skrypt = wczytajSkrypty({ root: ROOT }).get('episodes/srw-y/ep001.md');
const scena = bySlug.get(SCENA);
const dostawa = fs.readFileSync(ARCHIWUM, 'utf8').replace(/\r\n/g, '\n');

/** Porównanie parametrów: `'…'` z dostawy i `''…''` z JSON-a to ten sam cudzysłów. */
const normalizujApostrofy = (s) => s.replace(/''/g, "'");

/** Diagnostyka z dostawy, której nie wolno publikować (strażnik treści 406/409). */
const DIAGNOSTYKA = /^Brak zdolności w danych rekordu\.$/m;

/** Blok jednostki z części UCZESTNICY dostawy, razem z tabelą parametrów. */
function blokJednostki(nazwa) {
  const uczestnicy = dostawa.split('---\nUCZESTNICY\n---')[1];
  const mechy = uczestnicy.slice(uczestnicy.indexOf('\n## '), uczestnicy.indexOf('#### Piloci i postacie'));
  const czesci = mechy.split(/^## /m).slice(1);
  const blok = czesci.find((c) => c.split('\n')[0].trim() === nazwa);
  assert.ok(blok, `dostawa ma blok jednostki „${nazwa}”`);
  // Pusty dział zdolności dostawa opisuje zdaniem diagnostycznym; strona pomija
  // cały pusty dział, więc porównujemy dane bez niego.
  const dane = blok.slice(blok.indexOf('| Parametr')).trim()
    .replace(/\n\n### Macierzyste zdolności maszyny\n\nBrak zdolności w danych rekordu\./g, '');
  assert.doesNotMatch(dane, DIAGNOSTYKA, `${nazwa}: bez diagnostyki z dostawy`);
  return dane;
}

const NOWE_MECHY = { 'getter-arc': 'Getter Arc', insector: 'Insector', 'zordo-xx': 'Zordo XX' };
const ODŚWIEŻONE = { 'a-advent': 'A. Advent', lunedrache: 'Lunedrache' };
const NOWE_POSTACIE = ['show-kamui', 'yume-minami', 'koyomi-yamanaka', 'chise-asukagawa',
  'hayato-jin', 'shikishima', 'igari', 'mei', 'matka-yomogiego'];
const NOWE_HASLA = ['laboratorium-saotome', 'getter-d2', 'promienie-gettera', 'insectorzy',
  'n-u-n-g', 'ryoma-nagare', 'doktor-saotome', 'campbellianie', 'historia-ziemi'];

test('archiwum misji 2A jest kompletne, a jej skrypt kończy epizod', () => {
  assert.ok(fs.existsSync(ARCHIWUM), 'dostawa leży w dostawy/srw-y');
  assert.match(dostawa, /^### A\. Advent - hangar$/m);
  assert.match(dostawa, /^### Misja 3 — Przebudzenie niebiańskiego demona$/m);
  assert.match(dostawa, /^#### Piloci i postacie występujące w misji$/m);
  assert.match(dostawa, /^#### Hasła encyklopedii w dialogach tej misji$/m);
  assert.ok(dostawa.length > 70000, 'dostawa jest zachowana w całości');

  // Dostawa poprzedza skrypt nagłówkiem `# Super Robot Wars Y — …`; epizod ma własny
  // tytuł, więc w archiwum skryptu zostaje sama treść misji (od pierwszego `###`).
  const oczekiwany = dostawa.split('---\nSKRYPT\n---')[1].split('\n---\nUCZESTNICY\n---')[0]
    .trim().replace(/^# .*\n\n/, '').trim();
  assert.ok(skrypt.trimEnd().endsWith(oczekiwany), 'cała misja 2A na końcu skryptu epizodu');
  assert.equal(skrypt.split('### A. Advent - hangar').length - 1, 1, 'bez duplikatu sceny');
  assert.ok(!skrypt.includes('UCZESTNICY'), 'dane uczestników nie trafiają do archiwum skryptu');
});

test('scena 1-2A jest dosłowna, ma numer z nazwy misji i pełną analizę', () => {
  assert.ok(scena, 'strona sceny istnieje');
  assert.equal(scena.typ, 'scena');
  assert.equal(scena.epizod, 'srw-y-ep1');
  assert.equal(scena.numer_sceny, '1-2A', 'numer bierze się z nazwy misji');
  assert.equal(scena.tytul, 'Przebudzenie niebiańskiego demona');
  assert.deepEqual(sprawdzWiernoscSceny(scena, skrypt), []);
  for (const fragment of ['### A. Advent - hangar', '### Miasto Yagami - plac miejski', '### Yuri Mart',
    '### Laboratorium Saotome - hangar', '**Takuma Nagare:** Mój ojciec to Ryoma Nagaaare!!']) {
    assert.ok(scena.body.includes(fragment), fragment);
  }
  assert.equal((scena.sekcje_analizy ?? []).length,
    (scena.body.split('## Analiza')[1] ?? '').split('\n').filter((l) => /^### /.test(l)).length,
    'każda podsekcja analizy ma mapowanie do treści');
  assert.match(scena.body, /## Wątki w scenie/);
  assert.match(scena.body, /## Nawiązania do oryginalnych odcinków/);
});

test('nowe jednostki zachowują parametry i uzbrojenie z dostawy', () => {
  for (const [slug, profil] of Object.entries(NOWE_MECHY)) {
    const mech = bySlug.get(slug);
    assert.ok(mech, slug);
    assert.equal(mech.typ, 'mech', slug);
    assert.equal(mech.seria, 'getter-robo-arc', slug);
    assert.deepEqual(mech.gry, ['srw-y'], slug);
    const wpis = JSON.parse(mech.w_gre['srw-y']);
    assert.equal(wpis.dostawa, DOSTAWA, slug);
    assert.equal(wpis.profil, profil, slug);
    assert.equal(normalizujApostrofy(wpis.dane), blokJednostki(profil), `${slug}: dane dosłownie z dostawy`);
    const wTresci = normalizujApostrofy(mech.body.slice(mech.body.indexOf('## Parametry')));
    assert.ok(wTresci.includes(normalizujApostrofy(wpis.dane).replace(/\n\n---$/, '')),
      `${slug}: parametry widoczne w treści`);
  }
  assert.deepEqual(bySlug.get('getter-arc').piloci, ['takuma-nagare', 'baku-yamagishi', 'show-kamui']);
  // Insector i Zordo XX należą w dostawie do wrogiej „grupy czerwonej 1” i nie mają
  // osobowego pilota — w silniku SRW Y mają techniczny rekord pilota o nazwie maszyny,
  // więc pole `piloci` zostaje puste, a treść nie może ich nazywać jednostkami grywalnymi.
  for (const [slug, profil] of [['insector', 'Insector'], ['zordo-xx', 'Zordo XX']]) {
    assert.match(dostawa, new RegExp(`\\*\\*${profil}\\*\\* — pilot główny: ${profil} — grupa czerwona 1`),
      `${slug}: przeciwnik w grupie czerwonej 1`);
    assert.deepEqual(bySlug.get(slug).piloci, [], `${slug}: brak osobowego pilota`);
    assert.doesNotMatch(bySlug.get(slug).body, /jednost(?:ek|ka|ki) grywaln/i,
      `${slug}: wróg z grupy czerwonej nie jest opisany jako jednostka grywalna`);
  }
});

test('odświeżony rekord pary (mech, gra) obejmuje tylko maszyny z tej misji', () => {
  for (const [slug, profil] of Object.entries(ODŚWIEŻONE)) {
    const mech = bySlug.get(slug);
    const wpis = JSON.parse(mech.w_gre['srw-y']);
    assert.equal(wpis.dostawa, DOSTAWA, `${slug}: nowe źródło parametrów`);
    assert.equal(wpis.profil, profil, slug);
    assert.equal(normalizujApostrofy(wpis.dane), blokJednostki(profil), `${slug}: dane dosłownie z dostawy`);
  }
  // A. Advent zachowuje obie bronie z prologu i dostaje trzecią z nowej misji.
  const advent = bySlug.get('a-advent').body;
  for (const bron of ['Wielokierunkowa obrona przeciwlotnicza', 'Rakiety MWCT', 'Podwójne działo energetyczne']) {
    assert.ok(advent.includes(bron), `A. Advent: ${bron}`);
  }
  assert.match(advent, /\|\s*EN\s*\|\s*200\s*\|/, 'A. Advent: EN 200 z nowej dostawy');
  const lunedrache = bySlug.get('lunedrache');
  assert.match(lunedrache.body, /Łącze energii/, 'Lunedrache: nowa zdolność maszyny');
  assert.match(lunedrache.body, /\|\s*EN\s*\|\s*200\s*\|/, 'Lunedrache: EN 200 z nowej dostawy');
});

test('nowe postacie i hasła świata trafiają do grafu epizodu', () => {
  for (const slug of NOWE_POSTACIE) {
    const strona = bySlug.get(slug);
    assert.ok(strona, slug);
    assert.equal(strona.typ, 'postac', slug);
    assert.ok(strona.gry.includes('srw-y'), `${slug}: gra`);
    assert.ok(epizod.postacie.includes(slug), `${slug}: obsada epizodu`);
  }
  for (const slug of NOWE_HASLA) {
    const strona = bySlug.get(slug);
    assert.ok(strona, slug);
    assert.equal(strona.typ, 'pojecie', slug);
    assert.ok(epizod.pojecia.includes(slug), `${slug}: hasła epizodu`);
  }
  // Kamui dowodzi trojgiem pilotów Arca, a każdy z nich ma maszynę w swoim polu.
  for (const pilot of ['takuma-nagare', 'baku-yamagishi']) {
    assert.ok(bySlug.get(pilot).mechy.includes('getter-arc'), `${pilot}: Getter Arc`);
  }
  assert.ok(bySlug.get('show-kamui').mechy.includes('getter-arc'), 'show-kamui: Getter Arc');
});

test('proza o wydarzeniach gry trzyma się tego, co mówi skrypt', () => {
  // Błąd z tej dostawy: karta Zordo XX opisywała finał walki tak, jak w mandze
  // („wspólny atak obu maszyn”), choć gra mówi tylko, że D2 jest „na granicy
  // wytrzymałości”, a Takuma przesiada się do Arca. Proza o grze musi mieć
  // zaczepienie w skrypcie — inaczej opisuje pierwowzór pod etykietą gry.
  const proza = ['insector', 'zordo-xx', 'getter-arc', 'getter-d2', 'insectorzy']
    .map((slug) => bySlug.get(slug).body);
  for (const fragment of proza) {
    assert.doesNotMatch(fragment, /wspólny atak obu maszyn|oba Gettery|wspólnie niszczą/,
      'finał walki spoza skryptu');
    assert.doesNotMatch(fragment, /w mandze i serialu jest pierwszym potworem/,
      'pierwowzór nie może udawać wydarzeń gry');
  }
  // W dialogach potwór pada wyłącznie jako „ten wielki”, bez dopisywania faktów spoza skryptu
  // i bez ujawniania niewystępującej w misji nazwy frakcji z pierwowzoru.
  const skryptBezNazw = skrypt.replace(/\s+/g, ' ');
  assert.ok(!skryptBezNazw.includes('Zordo'), 'skrypt nie nazywa potwora — test ma sens');
  assert.match(bySlug.get('zordo-xx').body, /„ten wielki”/,
    'opis z misji trzyma się określenia z dialogu');
  assert.doesNotMatch(scena.body, /Andromed/i,
    'scena nie ujawnia nazwy frakcji nieobecnej w rozegranych misjach');
});

test('dodatek 1-2A (Y_dostawa_1_2a_dodatek.txt): Getter Kirik, Getter Khan i Dzieci Gettera', () => {
  const surowe = fs.readFileSync(ARCHIWUM_DODATKU);
  assert.equal(surowe.length, 10758, 'dokładny rozmiar pliku z Google Drive');
  assert.equal(
    crypto.createHash('sha256').update(surowe).digest('hex'),
    '2d484ae04f06259b646184803ac69375640c9b0839f5de6f52c19e35e0625df6',
    'skrót SHA-256 zgodny z Google Drive',
  );
  const dodatek = surowe.toString('utf8').replace(/\r\n/g, '\n');

  const formy = {
    'getter-kirik': {
      profil: 'Getter Kirik',
      encyklopedia: 'Getter Robo powstały z połączenia trzech Get Machine w kolejności Kirik, Khan i Arc.',
    },
    'getter-khan': {
      profil: 'Getter Khan',
      encyklopedia: 'Getter Robo powstały z połączenia trzech Get Machine w kolejności Khan, Arc i Kirik.',
    },
  };
  for (const [slug, { profil, encyklopedia }] of Object.entries(formy)) {
    const sekcja = dodatek.split(`## ${profil} — forma po transformacji\n`)[1];
    assert.ok(sekcja, `${slug}: sekcja w dodatku`);
    const poczatek = sekcja.indexOf('| Parametr');
    const oczekiwane = sekcja.slice(poczatek, sekcja.indexOf('\n---\n', poczatek) + 4);

    const mech = bySlug.get(slug);
    assert.ok(mech.body.includes(encyklopedia), `${slug}: dosłowny opis z Encyklopedii`);
    const wpis = JSON.parse(mech.w_gre['srw-y']);
    assert.equal(wpis.dostawa, DODATEK, `${slug}: źródło parametrów`);
    assert.equal(wpis.profil, profil, `${slug}: profil`);
    assert.equal(normalizujApostrofy(wpis.dane), oczekiwane, `${slug}: dane dosłownie z dodatku`);
    const wTresci = normalizujApostrofy(mech.body.slice(mech.body.indexOf('## Parametry')));
    assert.ok(wTresci.includes(oczekiwane.replace(/\n\n---$/, '')), `${slug}: parametry widoczne w treści`);
  }
  assert.match(bySlug.get('getter-khan').body, /Khan Rover/, 'Getter Khan: nazwa formy z Encyklopedii');

  // Cała trójka pilotów Gettera dostaje w slocie 1 umiejętność „Dzieci Gettera” (poz. nauki 99).
  for (const slug of ['baku-yamagishi', 'show-kamui', 'takuma-nagare']) {
    const body = bySlug.get(slug).body;
    assert.match(
      body,
      /\|\s*1\s*\|\s*Dzieci Gettera\s*\|\s*99\s*\|\s*Aktywna, gdy na pokładzie są 3 piloci i każdy ma Morale 140\+\. Początek fazy gracza: Morale \+5\. Gdy wszyscy 3 mają Morale 160\+: końcowe zadawane obrażenia x1\.2\.\s*\|/,
      `${slug}: umiejętność Dzieci Gettera w slocie 1`,
    );
  }
});
