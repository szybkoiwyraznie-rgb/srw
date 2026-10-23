/**
 * Tabela „Wątki fabularne” na stronie epizodu (ADR 0031).
 *
 * Właściciel zgłosił cztery rzeczy: nazwa „Wątki anime” nie obejmowała gier i komiksów,
 * kolejność wierszy była przypadkowa, kolumna „Odcinek / wersja” mieszała odcinek anime
 * z numerem epizodu gry, a kolumna „Typ” powtarzała informację, którą niesie źródło.
 * Testy pilnują więc nazwy sekcji, czterech kolumn, dopuszczalnych wartości kolumny
 * „Odcinek w źródle” i kolejności wierszy zgodnej z kolejnością scen.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { wczytajStrony } from '../tools/content-loader.mjs';

const pages = wczytajStrony();
const epizody = pages.filter((p) => p.typ === 'epizod');
const NAGLOWEK = '## Wątki fabularne';

/** Komórki wiersza tabeli z pominięciem pierwszego i ostatniego pionka. */
function komorki(linia) {
  const plain = linia
    .replace(/\[\[([^\]|]*)\\?\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\\\|/g, '|');
  return plain.split('|').slice(1, -1).map((c) => c.trim());
}

/** Komórki wiersza bez zamiany wikilinków na etykiety — do sprawdzania źródła. */
function komorkiSurowe(linia) {
  return linia.replace(/\\\|/g, '\u0000').split('|').slice(1, -1)
    .map((c) => c.trim().replace(/\u0000/g, '\\|'));
}

/** Wiersze tabeli z sekcji „Wątki fabularne” danej strony. */
function tabela(page) {
  const start = page.body.indexOf(NAGLOWEK);
  assert.ok(start >= 0, `${page.slug}: brak sekcji „Wątki fabularne”`);
  const koniec = page.body.slice(start + NAGLOWEK.length).search(/\n## /);
  const sekcja = koniec < 0 ? page.body.slice(start) : page.body.slice(start, start + NAGLOWEK.length + koniec);
  return sekcja.split('\n').filter((l) => l.trim().startsWith('|')).map((l) => l.trim());
}

test('każdy epizod ma sekcję „Wątki fabularne”, a stara nazwa nie występuje', () => {
  assert.ok(epizody.length >= 2);
  for (const page of epizody) {
    assert.ok(page.body.includes(NAGLOWEK), `${page.slug}: brak „${NAGLOWEK}”`);
    assert.doesNotMatch(page.body, /^## Wątki anime$/m, `${page.slug}: została stara nazwa sekcji`);
  }
});

test('tabela wątków ma cztery kolumny: motyw, źródło, odcinek w źródle, różnice', () => {
  for (const page of epizody) {
    const wiersze = tabela(page);
    assert.ok(wiersze.length >= 3, `${page.slug}: tabela ma nagłówek i wiersze`);
    assert.deepEqual(komorki(wiersze[0]), ['Motyw w epizodzie', 'Źródło', 'Odcinek w źródle', 'Różnice'],
      `${page.slug}: nagłówek tabeli`);
    assert.match(wiersze[1], /^\|(?:\s*:?-{3,}:?\s*\|)+$/, `${page.slug}: wiersz oddzielający`);
    for (const wiersz of wiersze.slice(2)) {
      assert.equal(komorki(wiersz).length, 4, `${page.slug}: wiersz poza czterema kolumnami — ${wiersz}`);
    }
    // Kolumna „Typ” zniknęła wraz z informacją, którą powtarzała.
    assert.doesNotMatch(page.body, /\|\s*Typ\s*\|/, `${page.slug}: wróciła kolumna „Typ”`);
    assert.doesNotMatch(page.body, /Odcinek \/ wersja/, `${page.slug}: wrócił nagłówek „Odcinek / wersja”`);
  }
});

test('kolumna „Odcinek w źródle” podaje odcinek, całą serię albo n/d', () => {
  const dozwolone = /^(n\/d|cała seria|odc\. \d+ „[^”]+”)$/;
  for (const page of epizody) {
    for (const wiersz of tabela(page).slice(2)) {
      const [, zrodloSurowe, odcinek] = komorkiSurowe(wiersz);
      assert.match(odcinek, dozwolone, `${page.slug}: „${odcinek}” nie jest odcinkiem, serią ani n/d`);
      // „n/d” znaczy „wątek autorski gry”, więc źródłem musi być sama gra.
      if (odcinek === 'n/d') {
        assert.match(zrodloSurowe, /\[\[srw-oe\\?\|/, `${page.slug}: n/d bez źródła gry — ${zrodloSurowe}`);
      } else {
        assert.doesNotMatch(zrodloSurowe, /\[\[srw-oe\\?\|/,
          `${page.slug}: odcinek podany, a źródłem jest gra — ${zrodloSurowe}`);
      }
    }
  }
});

test('wiersze idą w kolejności scen epizodu', () => {
  // Kolejność wierszy = kolejność wystąpienia motywu w epizodzie. Listy są jawne,
  // bo tabela nie ma kolumny ze sceną: zmiana kolejności ma być widoczna w teście.
  const oczekiwane = {
    'srw-oe-ep0': [
      // scena 0-1: prolog i trening w Connect
      'Wspomnienie dawnych zagrożeń',
      'Kryzys jedności politycznej i nieznane energie',
      'Szkolenie w Connect Force',
      // scena 0-2: na ratunek White Base
      'Wybuch wojny, śmierć połowy ludzkości i pierwszy pilotaż Gundama',
      'Ranny kapitan, prowizoryczna załoga i starcie z Charem',
    ],
    'srw-oe-ep1': [
      // scena 1-1: szalejący prototyp Labora
      'Wspólne ćwiczenia wojska i policyjnych Laborów',
      'Bezzałogowy HAL-X10 poza kontrolą',
      'Ekipa Drugiego Plutonu SV2',
      'Przejęcie sterów przez podpilota',
      'Plotki o handlu z dalekim kosmosem',
      // scena 1-2: Black Tri-Stars
      'Black Tri-Stars na froncie Odessy',
      "Odprawa u M'Quve'a",
      'Powrót Connect z Japonii',
      // scena 1-3: powstrzymaj pocisk termojądrowy
      'Bitwa o Odessę i pocisk termojądrowy',
      // scena 1-4: trening Klasy Obrony
      'Klasa Obrony Ziemi i szkoła w Hinobori',
      'Raijin-Oh i troje pilotów',
      'Wspólne ćwiczenia z Connect',
    ],
  };

  for (const [slug, kolejnosc] of Object.entries(oczekiwane)) {
    const page = pages.find((p) => p.slug === slug);
    const motywy = tabela(page).slice(2).map((w) => komorki(w)[0]);
    assert.deepEqual(motywy, kolejnosc, `${slug}: wiersze nie idą w kolejności scen`);
    // Każda scena epizodu jest reprezentowana — tabela nie gubi etapów fabuły.
    const sceny = pages.filter((p) => p.typ === 'scena' && p.epizod === slug);
    assert.ok(motywy.length >= sceny.length, `${slug}: mniej motywów niż scen`);
  }
});
