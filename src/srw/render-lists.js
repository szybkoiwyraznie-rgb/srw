/**
 * Listy działów: gry, epizody, sceny, postacie, mechy, serie.
 *
 * Każda lista jest jedną funkcją o wspólnym kształcie: filtry (opcjonalne)
 * → nagłówek z liczbą → pozycje. Filtry działają z adresu (np. #/mechy?seria=…),
 * więc każdy widok da się komuś podesłać linkiem. Dla postaci i mechów lista to
 * galeria kafelków z miniaturami; filtry krokowe (Gra → Epizod → Scena, Seria)
 * wzajemnie się zawężają (intersection).
 */

import { escapeHtml } from './markdown.js';
import { hrefDlaSlug, hrefListy } from './links.js';
import { dajStrone, listaStron, listaPosortowana, listaEpizodow, listaFiltrowana, tagiMap, statystyki } from './data.js';
import { nazwaTypu, numerEpizodu, stanPusty, odmiana } from './render.js';
import { sortujSceny } from './registry.js';
import { elementSceny } from './render-scene.js';

/** Wymiary kafelka w galerii (px). Suwak reguluje wartość w UI. */
const KAFEL_MIN = 140;
const KAFEL_MAX = 360;
const KAFEL_DOMYSLNY = 240;

/** Pola, po których można filtrować galerie postaci i mechów. */
const POLA_FILTRU = ['gra', 'epizod', 'scena', 'seria'];

/** Pola filtrów nad listami epizodów i scen (ADR 0034). Pytamy o to, co w nich
 * gra: tytuł, świat oraz konkretna maszyna albo postać. */
const POLA_FILTRU_FABULY = ['gra', 'seria', 'mech', 'postac'];

/** Lista serii pyta tylko o grę — reszta pól nie ma dla serii sensu. */
const POLA_FILTRU_SERII = ['gra'];

/** Czy lista tego typu jest listą fabularną (epizody, sceny). */
const czyFabula = (typ) => typ === 'epizod' || typ === 'scena';

/** Pola filtrów właściwe dla listy danego typu. */
const polaFiltru = (typ) => {
  if (czyFabula(typ)) return POLA_FILTRU_FABULY;
  if (typ === 'seria') return POLA_FILTRU_SERII;
  if (typ === 'postac' || typ === 'mech') return POLA_FILTRU;
  return [];
};

/** Wartość filtra `seria` dla encji bez przypisanej serii (opcja „Nieokreślona”). */
const BEZ_SERII = 'bez-serii';

/** Ile tagów pokazuje wiersz listy. Rodzaj treści jest teraz tagiem (ADR 0033),
 * więc cztery chipsy ucinały już sensowną informację. */
const LIMIT_CHIPSOW = 6;

/** Klucze adresu właściwe dla listy: własne filtry plus jej kontrolki specjalne.
 * Reszta jest odrzucana, żeby nie zawężała widoku ani nie przenosiła się w linkach. */
function kluczeAdresu(typ) {
  const klucze = new Set(polaFiltru(typ));
  if (typ === 'postac' || typ === 'mech') klucze.add('rozmiar');
  if (typ === 'pojecie') klucze.add('tagi');
  return klucze;
}

/** Tylko klucze tej listy i tylko tekstowe wartości — adres jest danymi wejściowymi. */
function oczyscQuery(typ, query) {
  const dozwolone = kluczeAdresu(typ);
  const q = {};
  for (const [klucz, wartosc] of Object.entries(query ?? {})) {
    if (!dozwolone.has(klucz) || wartosc === undefined || wartosc === null) continue;
    q[klucz] = String(wartosc);
  }
  return q;
}

/** Rozmiar kafelka z adresu: liczba całkowita w granicach suwaka. */
function normalizujRozmiar(wartosc) {
  const liczba = Math.round(Number(wartosc));
  if (!Number.isFinite(liczba)) return String(KAFEL_DOMYSLNY);
  return String(Math.min(KAFEL_MAX, Math.max(KAFEL_MIN, liczba)));
}

/** Wartość do atrybutu HTML. escapeHtml nie obejmuje apostrofu, a `data-query`
 * jest w apostrofach — bez tego cudzysłów w adresie zamykał atrybut. */
function escapeAtrybut(tekst) {
  return escapeHtml(tekst).replace(/'/g, '&#39;');
}

export function renderListe(typ, query = {}) {
  // Filtry zależne nie mogą być aktywne bez swoich wymagań (np. Odcinek bez Gry).
  const q = oczyscQuery(typ, query);
  if (q.epizod && !q.gra) delete q.epizod;
  if (q.scena && !q.epizod) delete q.scena;

  let lista = typ === 'epizod'
    ? listaEpizodow()
    : typ === 'scena' ? listaSceneWszystkie() : listaPosortowana(typ);

  // Zastosuj WSZYSTKIE ustawione filtry jednocześnie (intersection), nie tylko pierwszy.
  for (const pole of polaFiltru(typ)) {
    const wartosc = q[pole];
    if (!wartosc) continue;
    lista = filtrujPoPolu(lista, typ, pole, wartosc);
  }
  // Hasła zawężamy też wybranymi tagami — wystarczy jeden z nich (suma wyboru).
  const wybraneTagi = typ === 'pojecie' ? tagiZZapytania(q.tagi) : [];
  if (wybraneTagi.length) lista = filtrujPoTagach(lista, wybraneTagi);

  const filtr = wybierzFiltr(typ, q); // tylko do nagłówka (który źródło jest wybrane)
  const filtrHtml = (typ === 'postac' || typ === 'mech')
    ? renderFiltryKrokowe(typ, q)
    : czyFabula(typ) ? renderFiltryFabuly(typ, q)
      : typ === 'seria' ? renderFiltrGry(q) : '';
  const chmura = typ === 'pojecie' ? renderChmuraTagow(wybraneTagi) : '';
  const etykietaTagow = wybraneTagi.length ? `tagi: ${wybraneTagi.join(', ')}` : null;

  if (lista.length === 0) {
    // Filtry zostają nad pustą listą: inaczej po wybraniu zestawu bez wyników
    // nie da się już zmienić ustawienia inaczej niż przez „pokaż wszystkie”.
    return naglowekListy(typ, filtr, 0, etykietaTagow) + filtrHtml + chmura + stanPusty(
      `Nic tu jeszcze nie ma${(filtr || wybraneTagi.length) ? ' dla tego filtra' : ''}.`,
      'Baza rośnie w tempie rozgrywki — kolejny epizod doda wpisy.',
    );
  }

  const html = typ === 'epizod'
    ? listaEpizodowHtml(lista)
    : typ === 'scena' ? listaSceneHtml(lista) : listaEncjiHtml(lista, typ);

  return naglowekListy(typ, filtr, lista.length, etykietaTagow) + filtrHtml + chmura + html;
}

function naglowekListy(typ, filtr, liczba, etykietaFiltra = null) {
  // Filtr może wskazywać stronę (Gra, Odcinek, Seria), wartość specjalną
  // („bez serii”) albo zestaw tagów — nagłówek pokazuje wtedy własną etykietę.
  const cel = filtr ? (filtr.zrodlo ? filtr.zrodlo.tytul : filtr.etykieta) : null;
  const etykieta = cel ?? etykietaFiltra;
  return `<div class="naglowek-strony">
  <a class="okruszek" href="#/">Baza</a>
  <h1>${nazwaTypu(typ, 'wiele')}${etykieta ? `<span class="filtru-jest">— ${escapeHtml(etykieta)}</span>` : ''}
  </h1>
  <p class="podtytul">${liczba} ${odmiana(liczba, [
    nazwaTypu(typ).toLowerCase(),
    nazwaTypu(typ, 'wiele').toLowerCase(),
    trzeciaForma(typ),
  ])}
  ${etykieta ? `· <a href="${hrefListy(typ)}">pokaż wszystkie</a>` : ''}</p>
</div>`;
}

function trzeciaForma(typ) {
  return {
    gra: 'gier', epizod: 'epizodów', postac: 'postaci', mech: 'mechów', scena: 'scen', pojecie: 'haseł', seria: 'serii',
  }[typ] ?? 'pozycji';
}

/** Dozwolone filtry listy: pole → typ encji, do której prowadzi (tylko nagłówek). */
const FILTRY = {
  epizod: { gra: 'gra', seria: 'seria', mech: 'mech', postac: 'postac' },
  scena: { gra: 'gra', seria: 'seria', mech: 'mech', postac: 'postac' },
  postac: { seria: 'seria', gra: 'gra', epizod: 'epizod', scena: 'scena' },
  mech: { seria: 'seria', gra: 'gra', epizod: 'epizod', scena: 'scena' },
  seria: { gra: 'gra' },
  gra: {},
};

function wybierzFiltr(typ, query) {
  const dostepne = FILTRY[typ] ?? {};
  for (const [pole, typCelu] of Object.entries(dostepne)) {
    const wartosc = query?.[pole];
    if (!wartosc) continue;
    if (pole === 'seria' && wartosc === BEZ_SERII) {
      return { pole, wartosc, zrodlo: null, typCelu, etykieta: 'bez serii' };
    }
    const zrodlo = dajStrone(wartosc);
    if (!zrodlo) continue;
    return { pole, wartosc, zrodlo, typCelu };
  }
  return null;
}

/** Filtruje listę encji po jednym polu. Wszystkie filtry są stosowane razem (intersection). */
function filtrujPoPolu(lista, typ, pole, wartosc) {
  if (czyFabula(typ)) return filtrujFabule(lista, typ, pole, wartosc);
  if (pole === 'gra') {
    return lista.filter((p) => {
      const gry = Array.isArray(p.gry) ? p.gry : (p.gra ? [p.gra] : []);
      return gry.includes(wartosc);
    });
  }
  if (pole === 'seria') {
    if (wartosc === BEZ_SERII) return lista.filter((p) => !p.seria);
    return lista.filter((p) => p.seria === wartosc);
  }
  if (pole === 'epizod') {
    const epizod = dajStrone(wartosc);
    if (!epizod) return [];
    const poleEncji = typ === 'mech' ? 'mechy' : 'postacie';
    const slugi = new Set(epizod[poleEncji] ?? []);
    return lista.filter((p) => slugi.has(p.slug));
  }
  if (pole === 'scena') {
    const scena = dajStrone(wartosc);
    if (!scena) return [];
    const poleEncji = typ === 'mech' ? 'mechy' : 'postacie';
    const slugi = new Set(scena[poleEncji] ?? []);
    return lista.filter((p) => slugi.has(p.slug));
  }
  return lista;
}

/** Gra, do której należy epizod albo scena (scena dziedziczy ją po epizodzie). */
function graWpisu(wpis) {
  if (wpis.typ === 'epizod') return wpis.gra ?? null;
  return dajStrone(wpis.epizod)?.gra ?? null;
}

/** Postacie i mechy wymienione we wpisie epizodu albo sceny. */
function encjeWpisu(wpis) {
  return [...(wpis.postacie ?? []), ...(wpis.mechy ?? [])].map(dajStrone).filter(Boolean);
}

/**
 * Filtr listy epizodów i scen (ADR 0034).
 *
 * Epizod i scena nie mają pola `seria` — świat biorą z obsady, więc filtr serii
 * pyta, czy występuje w nich choć jedna postać albo maszyna z tej serii.
 */
function filtrujFabule(lista, typ, pole, wartosc) {
  if (pole === 'gra') return lista.filter((p) => graWpisu(p) === wartosc);
  if (pole === 'mech') return lista.filter((p) => (p.mechy ?? []).includes(wartosc));
  if (pole === 'postac') return lista.filter((p) => (p.postacie ?? []).includes(wartosc));
  if (pole === 'seria') {
    if (wartosc === BEZ_SERII) return lista.filter((p) => encjeWpisu(p).some((e) => !e.seria));
    return lista.filter((p) => encjeWpisu(p).some((e) => e.seria === wartosc));
  }
  return lista;
}

/** Encje typu `typ` spełniające wszystkie filtry z query poza `pomijajPole`.
 * Służy do wyznaczania dostępnych opcji w selektorach filtrów (zawężanie wzajemne). */
function encjePoFiltrach(typ, query, pomijajPole) {
  let lista = typ === 'epizod' ? listaEpizodow() : typ === 'scena' ? listaSceneWszystkie() : listaPosortowana(typ);
  for (const [pole, wartosc] of Object.entries(query ?? {})) {
    if (pole === pomijajPole || !wartosc) continue;
    lista = filtrujPoPolu(lista, typ, pole, wartosc);
  }
  return lista;
}

function listaEpizodowHtml(lista) {
  const grupy = new Map();
  for (const e of lista) {
    const klucz = e.gra ?? '—';
    if (!grupy.has(klucz)) grupy.set(klucz, []);
    grupy.get(klucz).push(e);
  }
  return [...grupy.entries()].map(([graSlug, epizody]) => {
    const gra = dajStrone(graSlug);
    return `<section class="blok">
      ${gra ? `<h2><a href="${hrefDlaSlug(gra.slug, 'gra')}">${escapeHtml(gra.tytul)}</a></h2>` : '<h2>Bez przypisanej gry</h2>'}
      <ol class="lista-epizodow">${epizody.map((e) => `
        <li>
          <a href="${hrefDlaSlug(e.slug, 'epizod')}">
            <span class="mono">${numerEpizodu(e.numer)}</span> ${escapeHtml(e.tytul)}
            ${e.trasa ? `<span class="trasa">${escapeHtml(e.trasa)}</span>` : ''}
          </a>
          <span class="meta">
            ${e.rozegrano ? escapeHtml(e.rozegrano) : ''}
            ${(e.postacie ?? []).length ? ` · ${(e.postacie ?? []).length} ${odmiana((e.postacie ?? []).length, ['postać', 'postacie', 'postaci'])}` : ''}
            ${(e.mechy ?? []).length ? ` · ${(e.mechy ?? []).length} ${odmiana((e.mechy ?? []).length, ['mech', 'mechy', 'mechów'])}` : ''}
          </span>
        </li>`).join('')}</ol>
    </section>`;
  }).join('');
}

/** Sceny wszystkich epizodów: grupy po epizodzie, w kolejności numerycznej (ADR 0008). */
function listaSceneWszystkie() {
  const kolejnosc = listaEpizodow().map((e) => e.slug);
  return listaStron('scena').sort((a, b) => kolejnosc.indexOf(a.epizod) - kolejnosc.indexOf(b.epizod));
}

function listaSceneHtml(lista) {
  const grupy = new Map();
  for (const s of lista) {
    const klucz = s.epizod ?? '—';
    if (!grupy.has(klucz)) grupy.set(klucz, []);
    grupy.get(klucz).push(s);
  }
  return [...grupy.entries()].map(([epSlug, sceny]) => {
    const ep = dajStrone(epSlug);
    return `<section class="blok">
      ${ep ? `<h2><a href="${hrefDlaSlug(ep.slug, 'epizod')}">${escapeHtml(ep.tytul)}</a></h2>` : '<h2>Bez przypisanego odcinka</h2>'}
      <ul class="lista-scen">${sortujSceny(sceny).map(elementSceny).join('')}</ul>
    </section>`;
  }).join('');
}

function listaEncjiHtml(lista, typ) {
  if (typ === 'seria') {
    return `<div class="siatka">${lista.map(kartaSerii).join('')}</div>`;
  }
  if (typ === 'postac' || typ === 'mech') {
    return galeriaEncji(lista, typ);
  }
  return `<ul class="lista-duza">${lista.map((p) => `
    <li>
      <a href="${hrefDlaSlug(p.slug, p.typ)}">${escapeHtml(p.tytul)}</a>
      <span class="meta">${metaEncji(p)}</span>
      ${(p.tagi ?? []).length ? `<span class="chipsy-inline">${p.tagi.slice(0, LIMIT_CHIPSOW).map((t) => `<a class="chip chip-maly" href="#/tag/${encodeURIComponent(t)}">${escapeHtml(t)}</a>`).join('')}</span>` : ''}
    </li>`).join('')}</ul>`;
}

/** Galeria kafelków: miniatura + nazwa, kliknięcie prowadzi do strony encji. */
function galeriaEncji(lista, typ) {
  const nazwaTypuMnoga = typ === 'postac' ? 'postaci' : 'mechów';
  return `<section class="naglowek-galeria">
    <h2>${nazwaTypu(typ, 'wiele')} <span class="licznik-galeria">${lista.length}</span></h2>
  </section>
  <div class="galeria-encji" role="grid" aria-label="${nazwaTypuMnoga}">${lista.map((p) => kartaKafelka(p, typ)).join('')}</div>`;
}

/** Jeden kafelek encji w galerii. */
function kartaKafelka(p, typ) {
  const obraz = ilustracjaEncji(p);
  const seria = p.seria ? dajStrone(p.seria) : null;
  const metaCzesci = [];
  if (seria) metaCzesci.push(escapeHtml(seria.tytul));
  if (typ === 'postac' && p.rola) metaCzesci.push(escapeHtml(p.rola));
  if (typ === 'mech' && Array.isArray(p.piloci) && p.piloci.length) {
    const piloci = p.piloci.map((s) => { const x = dajStrone(s); return x ? escapeHtml(x.tytul) : s; }).join(', ');
    metaCzesci.push(`piloci: ${piloci}`);
  }
  const metaHtml = metaCzesci.length ? `<p class="kafelek-meta">${metaCzesci.join(' · ')}</p>` : '';
  const obrazHtml = obraz
    ? `<img src="${escapeHtml(obraz)}" alt="${escapeHtml(p.tytul)}" loading="lazy" decoding="async">`
    : miniaturkaGeneryczna(typ, p.tytul);
  return `<article class="kafelek-encji" role="gridcell">
    <a href="${hrefDlaSlug(p.slug, p.typ)}" class="kafelek-link">
      <div class="kafelek-obraz">${obrazHtml}</div>
      <h3 class="kafelek-tytul">${escapeHtml(p.tytul)}</h3>
      ${metaHtml}
    </a>
  </article>`;
}

/** URL ilustracji encji: pole obraz, potem pierwszy obraz w treści, sonst null. */
function ilustracjaEncji(p) {
  if (p.obraz) return p.obraz;
  const m = String(p.html ?? '').match(/<img[^>]+src="([^"]+)"/);
  if (m) return m[1];
  return null;
}

/** Generyczna miniaturka SVG dla encji bez ilustracji. */
function miniaturkaGeneryczna(typ, tytul) {
  const czyMech = typ === 'mech';
  const ikona = czyMech
    ? '<rect x="18" y="28" width="44" height="20" rx="4"/><rect x="14" y="52" width="52" height="26" rx="4"/><circle cx="30" cy="38" r="7" fill="none" stroke="currentColor" stroke-width="2"/><rect x="24" y="74" width="12" height="6" rx="2"/><rect x="44" y="74" width="12" height="6" rx="2"/>'
    : '<rect x="14" y="30" width="52" height="16" rx="4"/><circle cx="30" cy="44" r="10" fill="none" stroke="currentColor" stroke-width="2"/><rect x="20" y="60" width="16" height="6" rx="2"/><rect x="44" y="60" width="16" height="6" rx="2"/><rect x="24" y="72" width="8" height="6" rx="2"/><rect x="48" y="72" width="8" height="6" rx="2"/>';
  return `<div class="kafelek-obraz-generyczny" aria-label="${escapeHtml(tytul)}" role="img">
    <svg viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <rect width="60" height="80" rx="10" fill="var(--panel-2)" stroke="var(--ramka)"/>
      ${ikona}
    </svg>
    <span class="generyczny-tytul">${escapeHtml(tytul)}</span>
  </div>`;
}

/** Tagi haseł z liczbą wystąpień (tylko dział haseł — inne działy mają własne widoki). */
function tagiHasel() {
  const mapa = new Map();
  for (const p of listaStron('pojecie')) {
    for (const tag of p.tagi ?? []) mapa.set(tag, (mapa.get(tag) ?? 0) + 1);
  }
  return mapa;
}

/** Tagi z adresu: bez pustych wartości, duplikatów i nazw spoza bazy. */
function tagiZZapytania(wartosc) {
  const znane = tagiHasel();
  const tagi = String(wartosc ?? '').split(',').map((t) => t.trim()).filter(Boolean);
  return [...new Set(tagi)].filter((t) => znane.has(t));
}

/** Lista ogranicza się do wybranych tagów: hasło wystarczy, że ma którykolwiek z nich.
 * Tagi w bazie rzadko występują razem, więc iloczyn kasowałby listę po drugim kliknięciu. */
function filtrujPoTagach(lista, tagi) {
  return lista.filter((p) => tagi.some((tag) => (p.tagi ?? []).includes(tag)));
}

/** Chmura tagów nad listą haseł. Odsyłacze w chipach zachowują wybór
 * i przełączają jeden tag, więc działają też bez JavaScriptu i da się je wysłać linkiem. */
function renderChmuraTagow(wybrane) {
  const liczniki = tagiHasel();
  if (liczniki.size === 0) return '';
  const kolejnosc = [...liczniki.keys()].sort((a, b) => liczniki.get(b) - liczniki.get(a) || a.localeCompare(b, 'pl'));
  const chip = (tag) => {
    const aktywny = wybrane.includes(tag);
    const nowe = aktywny ? wybrane.filter((t) => t !== tag) : [...wybrane, tag];
    const zapytanie = nowe.length ? `?${new URLSearchParams({ tagi: nowe.join(',') }).toString()}` : '';
    return `<a class="chip${aktywny ? ' chip-aktywny' : ''}" aria-pressed="${aktywny}" href="${hrefListy('pojecie')}${zapytanie}">${escapeHtml(tag)} <span class="licznik">${liczniki.get(tag)}</span></a>`;
  };
  return `<section class="chmura-tagow" aria-label="Tagi haseł">
  <div class="chmura">${kolejnosc.map(chip).join('')}</div>
  <p class="chmura-opis">${wybrane.length
    ? `Wybrane: ${wybrane.map((t) => `<strong>${escapeHtml(t)}</strong>`).join(', ')} · <a href="${hrefListy('pojecie')}">wyczyść wybór</a>`
    : 'Kliknij tag, żeby zawęzić hasła. Kilka tagów naraz pokazuje hasła oznaczone którymkolwiek z nich.'}</p>
</section>`;
}

/** Filtry krokowe nad galerią: Gra → Epizod → Scena, plus Seria i suwak rozmiaru.
 * Opcje w każdym selektorze uwzględniają pozostałe ustawione filtry (intersection).
 * Epizod pokazuje opcje tylko z wybranej gry; scena tylko z wybranego odcinka. */
function renderFiltryKrokowe(typ, query) {
  const gry = listaStron('gra').sort((a, b) => String(a.tytul).localeCompare(String(b.tytul), 'pl'));
  const wybraneGra = query.gra || '';
  const wybraneEpizod = query.epizod || '';
  const wybraneScena = query.scena || '';
  const wybraneSeria = query.seria || '';
  const rozmiar = normalizujRozmiar(query.rozmiar);

  // Odcinki: tylko z wybranej gry (jeśli gra wybrana), w przeciwnym razie żadne.
  let epizody = wybraneGra ? listaFiltrowana('epizod', 'gra', wybraneGra) : [];
  // Zawęż odcinki do tych, które mają encje spełniające pozostałe filtry (scena, seria).
  epizody = epizody.filter((e) => {
    let kandydaci = typ === 'epizod' ? listaEpizodow() : typ === 'scena' ? listaSceneWszystkie() : listaPosortowana(typ);
    if (query.seria) kandydaci = filtrujPoPolu(kandydaci, typ, 'seria', query.seria);
    if (query.scena) kandydaci = filtrujPoPolu(kandydaci, typ, 'scena', query.scena);
    if (kandydaci.length === 0) return false;
    const poleEncji = typ === 'mech' ? 'mechy' : 'postacie';
    const slugi = new Set(e[poleEncji] ?? []);
    return kandydaci.some((p) => slugi.has(p.slug));
  });

  // Sceny: tylko z wybranego odcinka, zawężone pozostałymi filtrami.
  let sceny = wybraneEpizod ? listaStron('scena').filter((s) => s.epizod === wybraneEpizod).sort(porownajSceny) : [];
  if (wybraneEpizod) {
    const pozostale = encjePoFiltrach(typ, { ...query, scena: undefined }, 'scena');
    const slugiPozostale = new Set(pozostale.map((p) => p.slug));
    sceny = sceny.filter((s) => {
      const poleEncji = typ === 'mech' ? 'mechy' : 'postacie';
      return (s[poleEncji] ?? []).some((slug) => slugiPozostale.has(slug));
    });
  }

  const kandydaciSerii = encjePoFiltrach(typ, { ...query, seria: undefined }, 'seria');
  const liczbaBezSerii = kandydaciSerii.filter((p) => !p.seria).length;
  const serie = kandydaciSerii
    .filter((p) => p.seria)
    .map((p) => dajStrone(p.seria))
    .filter(Boolean);
  // unikalne serie, posortowane
  const serieUnikalne = Array.from(new Map(serie.map((s) => [s.slug, s])).values())
    .sort((a, b) => String(a.tytul).localeCompare(String(b.tytul), 'pl'));

  const q = { ...query, rozmiar };
  const jsonQuery = escapeAtrybut(JSON.stringify(q));

  const scenaDisabled = !wybraneEpizod;
  const epizodDisabled = !wybraneGra;

  return `<div class="filtry-krokowe" data-typ="${typ}" data-query='${jsonQuery}'>
    <div class="filtr-grupa">
      <label class="filtr-etykieta">Gra</label>
      <select class="filtr-select" name="gra" onchange="srwZmienFiltr(this, 'gra')">
        <option value="">wszystkie gry</option>
        ${gry.map((g) => `<option value="${escapeHtml(g.slug)}"${g.slug === wybraneGra ? ' selected' : ''}>${escapeHtml(g.tytul)}</option>`).join('')}
      </select>
    </div>
    <div class="filtr-grupa">
      <label class="filtr-etykieta">Odcinek</label>
      <select class="filtr-select" name="epizod"${epizodDisabled ? ' disabled' : ''} onchange="srwZmienFiltr(this, 'epizod')">
        <option value="">wszystkie</option>
        ${epizody.map((e) => `<option value="${escapeHtml(e.slug)}"${e.slug === wybraneEpizod ? ' selected' : ''}>${escapeHtml(e.tytul)} (${numerEpizodu(e.numer)})</option>`).join('')}
      </select>
    </div>
    <div class="filtr-grupa">
      <label class="filtr-etykieta">Scena</label>
      <select class="filtr-select" name="scena"${scenaDisabled ? ' disabled' : ''} onchange="srwZmienFiltr(this, 'scena')">
        <option value="">wszystkie</option>
        ${sceny.map((s) => `<option value="${escapeHtml(s.slug)}"${s.slug === wybraneScena ? ' selected' : ''}>${escapeHtml(s.numer_sceny)} — ${escapeHtml(s.tytul)}</option>`).join('')}
      </select>
    </div>
    <div class="filtr-grupa filtr-grupa-seria">
      <label class="filtr-etykieta">Seria</label>
      <select class="filtr-select" name="seria" onchange="srwZmienFiltr(this, 'seria')">
        <option value="">wszystkie serie</option>
        ${liczbaBezSerii ? `<option value="${BEZ_SERII}"${wybraneSeria === BEZ_SERII ? ' selected' : ''}>Nieokreślona</option>` : ''}
        ${serieUnikalne.map((s) => `<option value="${escapeHtml(s.slug)}"${s.slug === wybraneSeria ? ' selected' : ''}>${escapeHtml(s.tytul)}</option>`).join('')}
      </select>
    </div>
    <div class="filtr-grupa filtr-grupa-suwak">
      <label class="filtr-etykieta">Kafełek</label>
      <input type="range" class="filtr-suwak" name="rozmiar" min="${KAFEL_MIN}" max="${KAFEL_MAX}" value="${rozmiar}" oninput="srwZmienRozmiar(this.value)">
      <span class="wartosc-suwaka">${rozmiar} px</span>
    </div>
  </div>
  <style>
    .galeria-encji { --kafel-szer: ${rozmiar}px; }
  </style>`;
}

/** Jeden selektor filtra: pusta opcja, opcje dodatkowe i strony do wyboru. */
function selektFiltru(pole, etykieta, pusta, opcje, wybrany = '', dodatkowe = '') {
  return `<div class="filtr-grupa">
      <label class="filtr-etykieta">${etykieta}</label>
      <select class="filtr-select" name="${pole}"${opcje.length === 0 && !dodatkowe ? ' disabled' : ''} onchange="srwZmienFiltr(this, '${pole}')">
        <option value="">${pusta}</option>
        ${dodatkowe}
        ${opcje.map((o) => `<option value="${escapeHtml(o.slug)}"${o.slug === wybrany ? ' selected' : ''}>${escapeHtml(o.tytul)}</option>`).join('')}
      </select>
    </div>`;
}

/**
 * Filtr nad listą serii: Gra (zgłoszenie właściciela, 2026-10-24).
 *
 * Seria należy do gry przez pole `gry`, więc opcje biorą się z samych serii —
 * gra bez ani jednej serii nie ma po co stać w selektorze. Bieżący wybór
 * zostaje w nim nawet wtedy, gdy nic mu nie odpowiada.
 */
function renderFiltrGry(query) {
  const slugi = new Set(listaPosortowana('seria').flatMap((s) => (Array.isArray(s.gry) ? s.gry : (s.gra ? [s.gra] : []))));
  if (query.gra) slugi.add(query.gra);
  const gry = [...slugi].map(dajStrone).filter(Boolean)
    .sort((a, b) => String(a.tytul).localeCompare(String(b.tytul), 'pl'));
  return `<div class="filtry-krokowe" data-typ="seria" data-query='${escapeAtrybut(JSON.stringify(query))}'>
    ${selektFiltru('gra', 'Gra', 'wszystkie gry', gry, query.gra ?? '')}
  </div>`;
}

/**
 * Filtry nad listą epizodów albo scen: Gra, Seria, Mech, Postać (ADR 0034).
 *
 * Opcje każdego selektora liczą się z listy zawężonej **pozostałymi** filtrami,
 * więc wybory nawzajem się ograniczają i nie da się złożyć zestawu bez wyników.
 * Wybrana wartość zostaje w swoim selektorze nawet wtedy, gdy inne filtry już
 * jej nie przepuszczają — inaczej nie byłoby czego odznaczyć.
 */
function renderFiltryFabuly(typ, query) {
  const bazowa = () => (typ === 'epizod' ? listaEpizodow() : listaSceneWszystkie());
  const poPozostalych = (pomijane) => {
    let lista = bazowa();
    for (const pole of POLA_FILTRU_FABULY) {
      if (pole === pomijane) continue;
      const wartosc = query[pole];
      if (wartosc) lista = filtrujFabule(lista, typ, pole, wartosc);
    }
    return lista;
  };
  const posortowane = (strony) => Array.from(new Map(strony.map((s) => [s.slug, s])).values())
    .sort((a, b) => String(a.tytul).localeCompare(String(b.tytul), 'pl'));
  /** Opcje selektora: dostępne po zawężeniu + zawsze bieżący wybór. */
  const zWyborem = (strony, wybrany) => {
    const lista = posortowane(strony);
    if (wybrany && !lista.some((s) => s.slug === wybrany)) {
      const wybrana = dajStrone(wybrany);
      if (wybrana) return posortowane([...lista, wybrana]);
    }
    return lista;
  };

  const gry = zWyborem(poPozostalych('gra').map(graWpisu).map(dajStrone).filter(Boolean), query.gra);
  const encjeSerii = poPozostalych('seria').flatMap(encjeWpisu);
  const serie = zWyborem(encjeSerii.map((e) => e.seria).filter(Boolean).map(dajStrone).filter(Boolean), query.seria);
  const mechy = zWyborem(poPozostalych('mech').flatMap((p) => (p.mechy ?? []).map(dajStrone)).filter(Boolean), query.mech);
  const postacie = zWyborem(poPozostalych('postac').flatMap((p) => (p.postacie ?? []).map(dajStrone)).filter(Boolean), query.postac);
  const bezSerii = encjeSerii.some((e) => !e.seria);

  const selekt = (pole, etykieta, pusta, opcje, dodatkowe = '') => selektFiltru(pole, etykieta, pusta, opcje, query[pole] ?? '', dodatkowe);

  const opcjaBezSerii = (bezSerii || query.seria === BEZ_SERII)
    ? `<option value="${BEZ_SERII}"${query.seria === BEZ_SERII ? ' selected' : ''}>Nieokreślona</option>`
    : '';

  return `<div class="filtry-krokowe" data-typ="${typ}" data-query='${escapeAtrybut(JSON.stringify(query))}'>
    ${selekt('gra', 'Gra', 'wszystkie gry', gry)}
    ${selekt('seria', 'Seria', 'wszystkie serie', serie, opcjaBezSerii)}
    ${selekt('mech', 'Mech', 'wszystkie maszyny', mechy)}
    ${selekt('postac', 'Postać', 'wszystkie postacie', postacie)}
  </div>`;
}

/** Kliknięcie selecta filtra: zmienia hash z zachowaniem pozostałych filtrów i resetem zależnych. */
globalThis.srwZmienFiltr = function (select, pole) {
  const kontener = select.closest?.('.filtry-krokowe');
  let q = {};
  try {
    q = JSON.parse(kontener?.dataset?.query ?? '{}') ?? {};
  } catch {
    q = {}; // uszkodzony atrybut nie może zablokować filtrów
  }
  if (select.value) q[pole] = select.value; else delete q[pole];
  if (pole === 'gra') { delete q.epizod; delete q.scena; }
  if (pole === 'epizod') { delete q.scena; if (!q.gra) delete q.epizod; }
  if (pole === 'scena' && !q.epizod) delete q.scena;
  const typ = kontener?.dataset?.typ ?? 'mech';
  location.hash = `${hrefListy(typ)}?${new URLSearchParams(q).toString()}`;
};

/** Suwak rozmiaru kafelka: zmienia custom property na kontenerze galerii. */
globalThis.srwZmienRozmiar = function (wartosc) {
  const pokaz = document.querySelector('.wartosc-suwaka');
  if (pokaz) pokaz.textContent = wartosc + ' px';
  const galerias = document.querySelectorAll('.galeria-encji');
  for (const g of galerias) g.style.setProperty('--kafel-szer', wartosc + 'px');
};

function porownajSceny(a, b) {
  return new Intl.Collator('pl', { numeric: true, sensitivity: 'base' }).compare(String(a.numer_sceny ?? ''), String(b.numer_sceny ?? ''));
}

/** Opis wiersza listy: seria, rola i liczba maszyn. Rodzaj hasła niesie tag (ADR 0033). */
function metaEncji(p) {
  const czesci = [];
  if (p.seria) {
    const s = dajStrone(p.seria);
    if (s) czesci.push(escapeHtml(s.tytul));
  }
  if (p.typ === 'postac' && p.rola) czesci.push(escapeHtml(p.rola));
  if (p.typ === 'postac' && Array.isArray(p.mechy) && p.mechy.length) {
    czesci.push(`${p.mechy.length} ${odmiana(p.mechy.length, ['mech', 'mechy', 'mechów'])}`);
  }
  return czesci.join(' · ');
}

function kartaSerii(s) {
  const postacie = listaStron('postac').filter((p) => p.seria === s.slug).length;
  const mechy = listaStron('mech').filter((p) => p.seria === s.slug).length;
  return `<article class="karta-serie">
    <h3><a href="${hrefDlaSlug(s.slug, 'seria')}">${escapeHtml(s.tytul)}</a></h3>
    <p class="meta">${[s.rodzaj ? String(s.rodzaj).toUpperCase() : '', s.rok, s.odcinki ? `${s.odcinki} odc.` : ''].filter(Boolean).map(escapeHtml).join(' · ')}</p>
    <p class="meta">${postacie} ${odmiana(postacie, ['postać', 'postacie', 'postaci'])} · ${mechy} ${odmiana(mechy, ['mech', 'mechy', 'mechów'])}</p>
  </article>`;
}

/** Chmura tagów. */
export function renderTagi() {
  const tagi = Object.entries(tagiMap()).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'pl'));
  if (tagi.length === 0) return stanPusty('Brak tagów — żadna strona ich jeszcze nie używa.');
  const max = Math.max(...tagi.map(([, l]) => l.length));
  return `<div class="naglowek-strony">
  <a class="okruszek" href="#/">Baza</a>
  <h1>🏷️ Tagi</h1>
  <p class="podtytul">${tagi.length} ${odmiana(tagi.length, ['tag', 'tagi', 'tagów'])} — swobodne, bez słownika: różnorodność nazewnictwa jest tu zaletą.</p>
</div>
<div class="chmura">
  ${tagi.map(([tag, lista]) => {
    const waga = 0.85 + (lista.length / max) * 0.9;
    return `<a class="chip" style="font-size:${waga.toFixed(2)}rem" href="#/tag/${encodeURIComponent(tag)}">${escapeHtml(tag)} <span class="licznik">${lista.length}</span></a>`;
  }).join('')}
</div>`;
}

export function renderTag(tag) {
  const slugi = tagiMap()[tag] ?? [];
  const strony = slugi.map(dajStrone).filter(Boolean)
    .sort((a, b) => String(a.tytul).localeCompare(String(b.tytul), 'pl'));
  if (strony.length === 0) return stanPusty(`Nie ma stron z tagiem <strong>${escapeHtml(tag)}</strong>.`, '<a href="#/tagi">Wszystkie tagi</a>');
  return `<div class="naglowek-strony">
  <a class="okruszek" href="#/tagi">Tagi</a>
  <h1>🏷️ ${escapeHtml(tag)}</h1>
  <p class="podtytul">${strony.length} ${odmiana(strony.length, ['strona', 'strony', 'stron'])}</p>
</div>
<ul class="lista-duza">${strony.map((p) => `
  <li>
    <a href="${hrefDlaSlug(p.slug, p.typ)}">${escapeHtml(p.tytul)}</a>
    <span class="meta">${nazwaTypu(p.typ)}${metaEncji(p) ? ` · ${metaEncji(p)}` : ''}</span>
  </li>`).join('')}</ul>`;
}
