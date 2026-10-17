/**
 * Strona epizodu — serce dziennika rozgrywki.
 *
 * Układ: metryka rozegrania → skrypt (surowy tekst, zwijany) → treść
 * analityczna (streszczenie, sceny, wątki anime, komentarz) → obsada
 * i sprzęt wyciągnięte ze skryptu.
 *
 * Skrypt jest tu widoczny w całości, bo baza jest prywatnym archiwum
 * rozgrywki: bez źródła tekstowego analiza wisiałaby w powietrzu.
 */

import { escapeHtml } from './markdown.js';
import { hrefDlaSlug, hrefFiltru } from './links.js';
import { dajStrone, dajDane, backlinkiStrony } from './data.js';
import {
  nazwaTypu, chipsyTagow, linkStrony,
  nieZnalesc, numerEpizodu, odmiana,
} from './render.js';
import { sekcjaPowiazan } from './render-entity.js';
import { sekcjaScen } from './render-scene.js';

export function renderEpizod(slug) {
  const e = dajStrone(slug);
  if (!e || e.typ !== 'epizod') return nieZnalesc(slug);

  const gra = e.gra ? dajStrone(e.gra) : null;
  const poprzedni = sasiedni(e, -1);
  const nastepny = sasiedni(e, +1);

  const grupy = new Map();
  for (const [pole, typ] of [['postacie', 'postac'], ['mechy', 'mech'], ['pojecia', 'pojecie'], ['serie', 'seria']]) {
    const lista = (e[pole] ?? []).map(dajStrone).filter(Boolean);
    if (lista.length) grupy.set(typ, lista.sort((a, b) => String(a.tytul).localeCompare(String(b.tytul), 'pl')));
  }

  return `
<div class="naglowek-epizodu">
  <div class="okruszki">
    <a href="#/epizody">Epizody</a>
    ${gra ? ` · <a href="${hrefDlaSlug(gra.slug, 'gra')}">${escapeHtml(gra.tytul)}</a>` : ''}
  </div>
  <h1><span class="numer-epizodu">Epizod ${numerEpizodu(e.numer)}</span> ${escapeHtml(e.tytul)}</h1>
  <p class="podtytul">
    ${e.rozegrano ? `rozegrano ${escapeHtml(e.rozegrano)}` : 'data rozegrania nieuzupełniona'}
    ${e.trasa ? ` · trasa: <strong>${escapeHtml(e.trasa)}</strong>` : ''}
  </p>
</div>

${e.skryptTekst ? `
<details class="panel-skryptu"${e.skryptOtwarty ? ' open' : ''}>
  <summary>Skrypt epizodu <span class="meta">${escapeHtml(e.skrypt ?? '')}</span></summary>
  <pre class="skrypt">${escapeHtml(e.skryptTekst)}</pre>
</details>` : ''}

<div class="uklad-encja">
  <div class="tresc-encja">
    ${e.html}
    ${sekcjaScen(e.slug)}
    ${sekcjaPowiazan('W tym epizodzie', grupy, {})}
    ${sekcjaPrzypisow(e)}
  </div>
  <aside class="infoboks">
    <dl class="infoboks-lista">
      ${gra ? `<dt>Gra</dt><dd><a href="${hrefDlaSlug(gra.slug, 'gra')}">${escapeHtml(gra.tytul)}</a></dd>` : ''}
      <dt>Numer</dt><dd>${numerEpizodu(e.numer)}</dd>
      ${e.trasa ? `<dt>Trasa</dt><dd>${escapeHtml(e.trasa)}</dd>` : ''}
      ${e.rozegrano ? `<dt>Rozegrano</dt><dd>${escapeHtml(e.rozegrano)}</dd>` : ''}
      ${e.skrypt ? `<dt>Skrypt</dt><dd><code>${escapeHtml(e.skrypt)}</code></dd>` : ''}
    </dl>
    ${chipsyTagow(e.tagi)}
    <nav class="nawigacja-epizodow">
      ${poprzedni ? `<a href="${hrefDlaSlug(poprzedni.slug, 'epizod')}">← ${numerEpizodu(poprzedni.numer)} ${escapeHtml(poprzedni.tytul)}</a>` : ''}
      ${nastepny ? `<a href="${hrefDlaSlug(nastepny.slug, 'epizod')}">${numerEpizodu(nastepny.numer)} ${escapeHtml(nastepny.tytul)} →</a>` : ''}
    </nav>
  </aside>
</div>`;
}

/** Sąsiedni epizod tej samej gry (kolejność wg numeru). */
function sasiedni(epizod, kierunek) {
  const rodzenstwo = Object.values(dajDane().strony)
    .filter((p) => p.typ === 'epizod' && p.gra === epizod.gra)
    .sort((a, b) => (a.numer ?? 0) - (b.numer ?? 0));
  const i = rodzenstwo.findIndex((p) => p.slug === epizod.slug);
  return i >= 0 ? rodzenstwo[i + kierunek] ?? null : null;
}

/** Krótka lista rzeczy, które agent ma jeszcze uzupełnić (puste pola = funkcja, nie wstyd). */
function sekcjaPrzypisow(e) {
  const braki = [];
  if (!e.rozegrano) braki.push('data rozegrania');
  if (!e.skrypt) braki.push('odnośnik do skryptu');
  if (!(e.postacie ?? []).length) braki.push('obsada (postacie)');
  if (!(e.mechy ?? []).length) braki.push('mechy');
  if (braki.length === 0) return '';
  return `<section class="blok-powiazan blok-braki">
    <h2>Do uzupełnienia</h2>
    <p class="meta">Ten epizod nie ma jeszcze: ${braki.join(', ')}.</p>
  </section>`;
}
