/**
 * Każdy mech w bazie pochodzi z dostawy (ADR 0029).
 *
 * Strona „Zaku II” powstała w 2026-10-20 jako generyczna rodzina maszyn, choć
 * dostawa znała wyłącznie trzy konkretne wersje (Char, bazooka, karabin
 * maszynowy). Takiej strony nie było w żadnym materiale i nie miała ilustracji,
 * więc została usunięta. Test pilnuje, żeby podobna „rodzina” nie wróciła:
 * parametrami każdej jednostki musi być rekord z archiwum dostaw albo profil
 * menu.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { wczytajStrony } from '../tools/content-loader.mjs';

const pages = wczytajStrony();
const mechy = pages.filter((p) => p.typ === 'mech');

test('każdy mech ma parametry z dostawy albo z menu gry', () => {
  const problemy = [];
  for (const mech of mechy) {
    const wpis = mech.w_gre?.['srw-oe'];
    if (!wpis) {
      problemy.push(`${mech.slug}: brak wpisu w_gre.srw-oe`);
      continue;
    }
    let dane;
    try {
      dane = typeof wpis === 'string' ? JSON.parse(wpis) : wpis;
    } catch {
      problemy.push(`${mech.slug}: w_gre.srw-oe nie jest poprawnym JSON-em`);
      continue;
    }
    const dostawa = dane?.dostawa;
    if (dostawa === 'menu') continue;
    if (typeof dostawa !== 'string' || !dostawa.startsWith('dostawy/')) {
      problemy.push(`${mech.slug}: dostawa=${JSON.stringify(dostawa)} nie wskazuje archiwum w dostawy/`);
      continue;
    }
    if (!fs.existsSync(dostawa)) problemy.push(`${mech.slug}: plik ${dostawa} nie istnieje`);
  }
  assert.deepEqual(problemy, []);
});

test('nie ma strony generycznej dla rodziny maszyn', () => {
  // Maszyna z kilkoma wersjami nie dostaje strony nadrzędnej „na zapas”:
  // każda wersja z dostawy ma własną stronę, a odsyłacze prowadzą do nich.
  assert.equal(mechy.some((m) => m.slug === 'zaku-ii'), false,
    'strona „Zaku II” bez odpowiednika w dostawie nie może wrócić');
  const wersje = ['zaku-ii-karabin-maszynowy', 'zaku-ii-bazooka', 'zaku-ii-char'];
  for (const slug of wersje) {
    assert.ok(mechy.some((m) => m.slug === slug), `${slug}: strona wersji z dostawy`);
  }
});
