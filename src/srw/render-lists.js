/**
 * Listy działów: epizody, postacie, mechy, bronie, serie, gry.
 *
 * Każda lista jest jedną funkcją o wspólnym kształcie: filtr (opcjonalny)
 * → nagłówek z liczbą → pozycje. Filtry działają z adresu
 * (np. #/mechy?seria=…), więc każdy widok da się komuś podesłać linkiem.
 */

import { escapeHtml } from './markdown.js';
import { hrefDlaSlug, hrefFiltru, hrefListy } from './links.js';
import { dajStrone, listaStron, listaPosortowana, listaEpizodow, listaFiltrowana, tagiMap, statystyki } from './data.js';
import { nazwaTypu, klasaPoziomu, numerEpizodu, stanPusty, odmiana } from './render.js';

export function renderListe(typ, query = {}) {
  const filtr = wybierzFiltr(typ, query);
  const lista = filtr
    ? listaFiltrowana(typ, filtr.pole, filtr.wartosc)
    : (typ === 'epizod' ? listaEpizodow() : listaPosortowana(typ));

  if (lista.length === 0) {
    return naglowekListy(typ, null, 0) + stanPusty(
      `Nic tu jeszcze nie ma${filtr ? ' dla tego filtra' : ''}.`,
      'Baza rośnie w tempie rozgrywki — kolejny epizod doda wpisy.',
    );
  }

  const html = typ === 'epizod'
    ? listaEpizodowHtml(lista)
    : listaEncjiHtml(lista, typ);

  return naglowekListy(typ, filtr, lista.length) + html;
}

function naglowekListy(typ, filtr, liczba) {
  const cel = filtr ? filtr.zrodlo : null;
  return `
<div class="naglowek-strony">
  <a class="okruszek" href="#/">Baza</a>
  <h1>${nazwaTypu(typ, 'wiele')}
    ${filtr && cel ? `<span class="filtru-jest">— ${escapeHtml(cel.tytul)}</span>` : ''}
  </h1>
  <p class="podtytul">${liczba} ${odmiana(liczba, [
    nazwaTypu(typ).toLowerCase(),
    nazwaTypu(typ, 'wiele').toLowerCase(),
    trzeciaForma(typ),
  ])}
  ${filtr ? `· <a href="${hrefListy(typ)}">pokaż wszystkie</a>` : ''}</p>
</div>`;
}

function trzeciaForma(typ) {
  return {
    gra: 'gier', epizod: 'epizodów', postac: 'postaci',
    mech: 'mechów', bron: 'broni', seria: 'serii',
  }[typ] ?? 'pozycji';
}

/** Dozwolone filtry listy: pole → typ encji, do której prowadzi. */
const FILTRY = {
  epizod: { gra: 'gra', seria: 'seria' },
  postac: { seria: 'seria', gra: 'gra' },
  mech: { seria: 'seria', gra: 'gra' },
  bron: { seria: 'seria' },
  seria: {},
  gra: {},
};

function wybierzFiltr(typ, query) {
  const dostepne = FILTRY[typ] ?? {};
  for (const [pole, typCelu] of Object.entries(dostepne)) {
    const wartosc = query?.[pole];
    if (!wartosc) continue;
    const zrodlo = dajStrone(wartosc);
    if (!zrodlo) continue;
    return { pole, wartosc, zrodlo, typCelu };
  }
  return null;
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

function listaEncjiHtml(lista, typ) {
  if (typ === 'seria') {
    return `<div class="siatka">${lista.map(kartaSerii).join('')}</div>`;
  }
  return `<ul class="lista-duza">${lista.map((p) => `
    <li class="${klasaPoziomu(p.pochodzenie)}">
      <a href="${hrefDlaSlug(p.slug, p.typ)}">${escapeHtml(p.tytul)}</a>
      <span class="meta">${metaEncji(p)}</span>
      ${(p.tagi ?? []).length ? `<span class="chipsy-inline">${p.tagi.slice(0, 4).map((t) => `<a class="chip chip-maly" href="#/tag/${encodeURIComponent(t)}">${escapeHtml(t)}</a>`).join('')}</span>` : ''}
    </li>`).join('')}</ul>`;
}

function metaEncji(p) {
  const czesci = [];
  if (p.seria) {
    const s = dajStrone(p.seria);
    if (s) czesci.push(escapeHtml(s.tytul));
  }
  if (p.typ === 'postac' && p.rola) czesci.push(escapeHtml(p.rola));
  if (p.typ === 'bron' && p.klasa) czesci.push(escapeHtml(p.klasa));
  if (p.typ === 'mech' && Array.isArray(p.bronie) && p.bronie.length) {
    czesci.push(`${p.bronie.length} ${odmiana(p.bronie.length, ['broń', 'bronie', 'broni'])}`);
  }
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
  return `
<div class="naglowek-strony">
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
  return `
<div class="naglowek-strony">
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
