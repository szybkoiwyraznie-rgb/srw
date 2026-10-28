/**
 * Odsyłacze do zewnętrznych źródeł (ADR 0009, ADR 0010, ADR 0011):
 * - każdy tekstowy odsyłacz zewnętrzny (poza hostem ilustracji R2) musi leżeć
 *   wewnątrz bloku `{{zrodlo ...}}`, nigdy w `skrypt`, `menu` ani `wiedza`;
 * - każdy akapit lub punkt listy ze źródłowym odsyłaczem musi nieść prawdziwą,
 *   nieprzyszłą datę sprawdzenia `sprawdzono RRRR-MM-DD`;
 * - składnia obrazów `![alt](url)` nie jest traktowana jako odsyłacz tekstowy.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { BLOK_OTWARCIA_RE } from '../src/srw/markdown.js';
import { wczytajStrony } from '../tools/content-loader.mjs';

const hostIlustracji = new URL(
  JSON.parse(fs.readFileSync('media/ilustracje.json', 'utf8')).baseUrl,
).host;
const dzisUtc = new Date().toISOString().slice(0, 10);

function poprawnaDataKalendarzowa(tekst, dzis) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tekst)) return false;
  const dt = new Date(`${tekst}T00:00:00Z`);
  if (Number.isNaN(dt.getTime())) return false;
  if (dt.toISOString().slice(0, 10) !== tekst) return false;
  return tekst <= dzis;
}

/**
 * Dzieli zawartość bloku na logiczne jednostki (akapity i punkty listy),
 * łącząc zawinięte wiersze kontynuacji tak samo jak renderer Markdown.
 */
function podzielJednostki(linie, startLinii) {
  const jednostki = [];
  let biezaca = null;
  const domknij = () => {
    if (biezaca) { jednostki.push(biezaca); biezaca = null; }
  };

  for (let idx = 0; idx < linie.length; idx += 1) {
    const linia = linie[idx];
    const nrLinii = startLinii + idx;
    const t = linia.trim();
    if (t === '' || /^(#{1,4}\s|-{3,}$|\*{3,}$|_{3,}$)/.test(t)) {
      domknij();
      continue;
    }
    if (/^\s*(?:[-*]|\d+\.)\s+/.test(linia) || t.startsWith('|') || /^>\s?/.test(linia)) {
      domknij();
      biezaca = { linia: nrLinii, tekst: t };
      continue;
    }
    if (biezaca) biezaca.tekst += ` ${t}`;
    else biezaca = { linia: nrLinii, tekst: t };
  }
  domknij();
  return jednostki;
}

function wyciagnijLinkiZrodlowe(tekst, hostObrazow) {
  const linki = [...tekst.matchAll(/(?<!!)\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]);
  return linki.filter((url) => {
    try { return new URL(url).host !== hostObrazow; } catch { return true; }
  });
}

function sprawdzOdsylaczeZrodlowe(page, { hostObrazow = hostIlustracji, dzis = dzisUtc } = {}) {
  const problemy = [];
  const linie = String(page.body ?? '').replace(/\r\n/g, '\n').split('\n');
  let poziom = null;
  let buforBloku = [];
  let startBloku = 1;
  let wSkrypcie = false;

  const rozliczBlok = () => {
    if (poziom === null) return;
    const jednostki = podzielJednostki(buforBloku, startBloku);
    for (const jedn of jednostki) {
      const zrodlowe = wyciagnijLinkiZrodlowe(jedn.tekst, hostObrazow);
      if (zrodlowe.length === 0) continue;
      if (poziom !== 'zrodlo') {
        problemy.push(`${page.slug}:${jedn.linia} -> link zewnętrzny w bloku {{${poziom}}}: ${zrodlowe.join(', ')}`);
        continue;
      }
      const daty = [...jedn.tekst.matchAll(/sprawdzono (\S+?)(?=[).,;:\s]|$)/g)].map((m) => m[1]);
      if (daty.length === 0) {
        problemy.push(`${page.slug}:${jedn.linia} -> brak daty sprawdzenia: ${zrodlowe.join(', ')}`);
        continue;
      }
      for (const data of daty) {
        if (!poprawnaDataKalendarzowa(data, dzis)) {
          problemy.push(`${page.slug}:${jedn.linia} -> niepoprawna lub przyszła data sprawdzenia "${data}"`);
        }
      }
    }
    poziom = null;
    buforBloku = [];
  };

  for (let i = 0; i < linie.length; i += 1) {
    const linia = linie[i];
    const t = linia.trim();
    if (/^:::/.test(t)) {
      wSkrypcie = !wSkrypcie;
      continue;
    }
    if (wSkrypcie) continue;

    const otwarcie = t.match(BLOK_OTWARCIA_RE);
    if (otwarcie && poziom === null) {
      poziom = otwarcie[1];
      buforBloku = [];
      startBloku = i + 2;
      continue;
    }
    if (t === '}}' && poziom !== null) {
      rozliczBlok();
      continue;
    }
    if (poziom !== null) {
      buforBloku.push(linia);
    } else {
      const poza = wyciagnijLinkiZrodlowe(linia, hostObrazow);
      if (poza.length > 0) {
        problemy.push(`${page.slug}:${i + 1} -> link zewnętrzny poza blokiem {{zrodlo}}: ${poza.join(', ')}`);
      }
    }
  }
  rozliczBlok();
  return problemy;
}

test('każdy tekstowy odsyłacz zewnętrzny w bazie leży w {{zrodlo}} i ma poprawną datę sprawdzenia (ADR 0009, 0011)', () => {
  const problemy = wczytajStrony().flatMap((page) => sprawdzOdsylaczeZrodlowe(page));
  assert.deepEqual(problemy, []);
});

test('walidator odrzuca linki poza {{zrodlo}}, brakujące lub błędne daty i akceptuje zawinięte punkty listy', () => {
  const dzis = '2026-10-25';
  assert.deepEqual(sprawdzOdsylaczeZrodlowe({
    slug: 'poprawna',
    body: [
      '{{zrodlo gra=wspolne',
      '- Pierwsze źródło ([Wiki 1](https://example.org/a);',
      '  [Wiki 2](https://example.org/b); sprawdzono 2026-10-25).',
      '}}',
      '{{menu gra=srw-oe',
      '![Obraz spoza R2 nie jest cytatem tekstowym](https://example.org/kadr.png)',
      '}}',
    ].join('\n'),
  }, { dzis }), []);

  const wMenu = sprawdzOdsylaczeZrodlowe({
    slug: 'zly-poziom',
    body: '{{menu gra=srw-oe\nOpis ([Wiki](https://example.org/x); sprawdzono 2026-10-25).\n}}',
  }, { dzis });
  assert.equal(wMenu.length, 1);
  assert.match(wMenu[0], /w bloku \{\{menu\}\}/);

  const zlaData = sprawdzOdsylaczeZrodlowe({
    slug: 'zla-data',
    body: '{{zrodlo gra=wspolne\nOpis ([Wiki](https://example.org/x); sprawdzono 2026-02-30).\n}}',
  }, { dzis });
  assert.equal(zlaData.length, 1);
  assert.match(zlaData[0], /niepoprawna lub przyszła data/);

  const przyszlaData = sprawdzOdsylaczeZrodlowe({
    slug: 'przyszla',
    body: '{{zrodlo gra=wspolne\nOpis ([Wiki](https://example.org/x); sprawdzono 2026-10-26).\n}}',
  }, { dzis });
  assert.equal(przyszlaData.length, 1);
  assert.match(przyszlaData[0], /niepoprawna lub przyszła data/);
});
