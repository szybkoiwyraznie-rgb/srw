/**
 * Hasła świata po misjach 2-4 i 2-5: baza Jaburo, strategia Zeonu, rozkaz
 * Revila wobec White Base i nowa klasa maszyn — mobile armor.
 *
 * Każda informacja pochodzi ze scen rozegranych w epizodzie 2 albo z otwartego
 * źródła wskazanego w frontmatterze (ADR 0009–0013).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { wczytajStrony } from '../tools/content-loader.mjs';

const pages = wczytajStrony();
const bySlug = new Map(pages.map((p) => [p.slug, p]));
const haslo = (slug) => {
  const p = bySlug.get(slug);
  assert.ok(p, `brak hasła ${slug}`);
  assert.equal(p.typ, 'pojecie', slug);
  return p;
};

test('Jaburo opisuje desant 2-4 i szturm Apsalusa', () => {
  const p = haslo('jaburo');
  assert.match(p.body, /portu kosmicznego/);
  assert.match(p.body, /\[\[char-aznable\|Char\]\] prowadzi maszyny przez ogień przeciwlotniczy/);
  assert.match(p.body, /\[\[shiro-amada\|Shiro\]\] wraz z 08\. Plutonem/);
  assert.match(p.body, /\[\[apsalus-iii\|Apsalusa III\]\] — \[\[mobile-armor\|mobile armora\]\]/);
  assert.match(p.body, /wiązka przebija skałę/);
  assert.match(p.body, /\[\[13-samodzielny-oddzial\|13\. Samodzielny Oddział\]\]/);
  assert.match(p.body, /doki i port ocalają/);
  assert.match(p.body, /zostaje w bazie na naprawy/);
  assert.equal((p.body.match(/^## Opis$/gm) ?? []).length, 1);
  assert.match(p.body, /\{\{zrodlo gra=wspolne\n\nJaburo to rozległy kompleks/);
  assert.ok(p.zrodla.includes('https://gundam.fandom.com/wiki/Jaburo'));
});

test('Zeon po Jaburo przechodzi do wojny partyzanckiej i stawia na nowe maszyny', () => {
  const p = haslo('zeon');
  assert.match(p.body, /porzuca obronę linii na Ziemi/);
  assert.match(p.body, /wojny partyzanckiej i działań opóźniających/);
  assert.match(p.body, /\[\[mobile-armor\|mobile armory\]\]/);
  assert.match(p.body, /projektu rodu Sahalinów/);
  assert.match(p.body, /\[\[ramba-ral\|Ramby Rala\]\] i \[\[crowley-hamon\|Crowley Hamon\]\]/);
  // Tajny plan Najwyższego Wodza pozostaje zapowiedzią — bez treści z przyszłości.
  assert.match(p.body, /tajny plan/);
  assert.doesNotMatch(p.body, /Solar Ray|Kolonia Axis|A Baoa Qu|Gihren/);
});

test('Federacja i Connect Force przyjmują rozkaz Revila o przynęcie', () => {
  const federacja = haslo('earth-federation');
  assert.match(federacja.body, /rolę przynęty/);
  assert.match(federacja.body, /wystartować przed główną flotą/);
  assert.match(federacja.body, /połączyć się z \[\[connect-force\|Connect Force\]\]/);
  assert.match(federacja.body, /Zeon nie jest jedynym wrogiem ludzkości/);

  const connect = haslo('connect-force');
  assert.match(connect.body, /zamierza przekazać Connect Force więcej sił/);
  assert.match(connect.body, /\[\[white-base\|White Base\]\] zadanie przynęty/);
  assert.doesNotMatch(connect.body, /Vasage|Warp Gate|rozumie jej myśli/);
});

test('08. Pluton MS wchodzi na pokład White Base przed wylotem w kosmos', () => {
  const p = haslo('08-pluton-ms');
  assert.match(p.body, /broni bramy portu kosmicznego przed desantem \[\[char-aznable\|Chara\]\]/);
  assert.match(p.body, /wchodzi na pokład \[\[white-base\|White Base\]\]/);
  assert.match(p.body, /melduje się \[\[bright-noa\|Brightowi\]\] jako oficer okrętu/);
  assert.match(p.body, /obrony bazy przed \[\[apsalus-iii\|Apsalusem III\]\]/);
  assert.match(p.body, /opuszcza Ziemię/);
});

test('13. Samodzielny Oddział okazuje się White Base, ale bez zdradzania dalszych walk', () => {
  const p = haslo('13-samodzielny-oddzial');
  assert.match(p.body, /Okazuje się nim \[\[white-base\|White Base\]\]/);
  assert.match(p.body, /leci przodem przed główną flotą/);
  assert.match(p.body, /fortecę Solomon/);
  assert.match(p.body, /\[\[08-pluton-ms\|08\. Pluton MS\]\] z \[\[shiro-amada\|Shiro Amadą\]\]/);
  assert.doesNotMatch(p.body, /A Baoa Qu|Solar Ray|Kolonia Axis|śmierć/);
});

test('mobile armor jest osobnym hasłem z otwartym źródłem i prowadzi do Apsalusa', () => {
  const p = haslo('mobile-armor');
  assert.equal(p.tytul, 'Mobile armor');
  assert.ok(p.tagi.includes('technologia'), 'rodzaj treści jest tagiem (ADR 0033)');
  assert.ok(p.tagi.includes('one-year-war'));
  assert.deepEqual(p.zrodla, ['https://gundam.fandom.com/wiki/Mobile_Weapon']);
  assert.match(p.body, /\{\{zrodlo gra=wspolne\n\nMobile armor \(MA\) różni się od mobile suita/);
  assert.match(p.body, /znacznie większy i zwykle niehumanoidalny/);
  assert.match(p.body, /działa kierowanej energii/);
  assert.match(p.body, /pojedyncza jednostka, a taktyką bliżej mu do okrętu/);
  assert.match(p.body, /\[Gundam Wiki, „Mobile Weapon”, sekcja Mobile Armor\]\(https:\/\/gundam\.fandom\.com\/wiki\/Mobile_Weapon\); sprawdzono 2026-11-07\)/);
  assert.match(p.body, /\[\[apsalus-iii\|Apsalus III\]\]/);
  assert.match(p.body, /\[\[marker\|Marker\]\] i \[\[michel-ninorich\|Michel\]\] rozpoznają go po rozmiarze/);
  assert.doesNotMatch(p.body, /Entry ID|eventP01|DL102_50/);
  // Odsyłacz w drugą stronę: mobile suit wskazuje klasę większą.
  assert.match(haslo('mobile-suit').body, /\[\[mobile-armor\|mobile armory\]\]/);
});

test('epizod 2 i scena 2-5 prowadzą do nowych i odświeżonych haseł', () => {
  const scena = bySlug.get('srw-oe-ep2-szturm-apsalusa');
  const epizod = bySlug.get('srw-oe-ep2');
  for (const slug of ['mobile-armor', 'jaburo', 'zeon', 'earth-federation', 'connect-force', '13-samodzielny-oddzial']) {
    assert.ok(scena.pojecia.includes(slug), `scena: ${slug}`);
    assert.ok(epizod.pojecia.includes(slug), `epizod: ${slug}`);
  }
  for (const slug of ['jaburo', 'zeon', 'earth-federation', '08-pluton-ms', 'mobile-armor', '13-samodzielny-oddzial']) {
    assert.ok(bySlug.has(slug), slug);
  }
});
