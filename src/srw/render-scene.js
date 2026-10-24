/**
 * Strona sceny (ADR 0008): analiza i treść sceny w lewej kolumnie,
 * nawigacja i materiały poboczne w prawej.
 *
 * Układ jest dwukolumnowy (3/4 + 1/4), bo scena ma dwa poziomy czytania:
 * najpierw analiza i dosłowny skrypt, obok — obsada, nawiązania do oryginału
 * i wątki. Podsekcje analizy prowadzą do odpowiadających im miejsc treści,
 * więc czytelnik nie szuka ich przewijaniem.
 *
 * Scena należy do epizodu — okruszki i nawigacja prowadzą wewnątrz epizodu
 * (poprzednia / następna scena), a lista scen na stronie epizodu powstaje
 * z tych samych wpisów.
 */

import { escapeHtml } from './markdown.js';
import { hrefDlaSlug, slugify } from './links.js';
import { dajStrone, dajDane } from './data.js';
import { linkStrony, nieZnalesc, numerEpizodu } from './render.js';
import { sortujSceny } from './registry.js';

/** Sceny jednego epizodu w kolejności numerycznej. */
export function scenyEpizodu(slugEpizodu) {
  const sceny = Object.values(dajDane().strony).filter((p) => p.typ === 'scena' && p.epizod === slugEpizodu);
  return sortujSceny(sceny);
}

export function renderScena(slug) {
  const s = dajStrone(slug);
  if (!s || s.typ !== 'scena') return nieZnalesc(slug);

  const epizod = dajStrone(s.epizod);
  const gra = epizod?.gra ? dajStrone(epizod.gra) : null;
  const sceny = scenyEpizodu(s.epizod);
  const i = sceny.findIndex((x) => x.slug === s.slug);
  const poprzednia = i > 0 ? sceny[i - 1] : null;
  const nastepna = i >= 0 && i < sceny.length - 1 ? sceny[i + 1] : null;

  const infoPozycje = [];
  const linkiListy = (slugi) => (slugi ?? []).map(dajStrone).filter(Boolean).map((p) => linkStrony(p)).join('<br>');
  if ((s.postacie ?? []).length) infoPozycje.push(`<dt>Postacie</dt><dd>${linkiListy(s.postacie)}</dd>`);
  if ((s.mechy ?? []).length) infoPozycje.push(`<dt>Mechy</dt><dd>${linkiListy(s.mechy)}</dd>`);
  if ((s.pojecia ?? []).length) infoPozycje.push(`<dt>Hasła</dt><dd>${linkiListy(s.pojecia)}</dd>`);

  // Sekcje pozostają tablicą: mapa po tytule nadpisywałaby powtórki, a lista
  // zamkniętych nazw ukrywałaby każdą nową sekcję dopisaną do sceny.
  const bazoweId = {
    Analiza: 'sekcja-analiza',
    'Treść sceny': 'sekcja-tresc',
    'Nawiązania do oryginalnych odcinków': 'sekcja-nawiazania',
    'Wątki w scenie': 'sekcja-watki',
  };
  const uzyteId = new Map();
  const sekcjeZrodlowe = Array.isArray(s.sekcje) ? s.sekcje : [];
  const sekcje = sekcjeZrodlowe.map((x) => {
    const baza = bazoweId[x.tytul] ?? `sekcja-${slugify(x.tytul) || 'bez-tytulu'}`;
    const numer = (uzyteId.get(baza) ?? 0) + 1;
    uzyteId.set(baza, numer);
    return { ...x, id: numer === 1 ? baza : `${baza}-${numer}` };
  });
  const oTytule = (tytul) => sekcje.filter((x) => x.tytul === tytul);
  const renderujSekcje = (lista) => lista
    .map((x) => `<section class="sekcja-strony" id="${x.id}">${x.html ?? ''}</section>`)
    .join('');

  const glowneTytuly = new Set(['Analiza', 'Treść sceny']);
  const boczneTytuly = new Set(['Nawiązania do oryginalnych odcinków', 'Wątki w scenie']);
  const glowneSekcje = [
    ...oTytule('Analiza'),
    ...oTytule('Treść sceny'),
    ...sekcje.filter((x) => !glowneTytuly.has(x.tytul) && !boczneTytuly.has(x.tytul)),
  ];
  const boczneSekcje = [
    ...oTytule('Nawiązania do oryginalnych odcinków'),
    ...oTytule('Wątki w scenie'),
  ];

  // Strona bez podziału na sekcje (starsze dane) nie może zniknąć — pokazujemy
  // całą treść w kolumnie głównej.
  const glowna = sekcje.length > 0
    ? renderujSekcje(glowneSekcje)
    : `<div class="tresc-encja">${s.html ?? ''}</div>`;
  const boczna = renderujSekcje(boczneSekcje);

  return `
<div class="naglowek-epizodu">
  <div class="okruszki">
    <a href="#/epizody">Epizody</a>
    ${gra ? ` · <a href="${hrefDlaSlug(gra.slug, 'gra')}">${escapeHtml(gra.tytul)}</a>` : ''}
    ${epizod ? ` · <a href="${hrefDlaSlug(epizod.slug, 'epizod')}">Epizod ${numerEpizodu(epizod.numer)}</a>` : ''}
  </div>
  <h1><span class="numer-epizodu">Scena ${escapeHtml(s.numer_sceny)}</span> ${escapeHtml(s.tytul)}</h1>
  <p class="podtytul">
    ${epizod ? `w epizodzie ${linkStrony(epizod)}` : ''}
  </p>
</div>

<div class="uklad-strona">
  <div class="kolumna-glowna tresc-encja">
    ${glowna}
  </div>
  <aside class="kolumna-boczna" aria-label="Informacje o scenie">
    <div class="panel-boczny">
      ${infoPozycje.length ? `<dl class="infoboks-lista">${infoPozycje.join('')}</dl>` : ''}
      <nav class="nawigacja-epizodow">
        ${poprzednia ? `<a href="${hrefDlaSlug(poprzednia.slug, 'scena')}">← ${escapeHtml(poprzednia.numer_sceny)} ${escapeHtml(poprzednia.tytul)}</a>` : ''}
        ${nastepna ? `<a href="${hrefDlaSlug(nastepna.slug, 'scena')}">${escapeHtml(nastepna.numer_sceny)} ${escapeHtml(nastepna.tytul)} →</a>` : ''}
      </nav>
    </div>
    ${boczna}
  </aside>
</div>`;
}

/**
 * Jeden wiersz listy scen — wspólny dla strony epizodu i działu „Sceny”.
 *
 * Streszczenie stoi zawsze w osobnym wierszu pod tytułem. Wcześniej było
 * dopisywane po myślniku w tej samej linii, więc krótszy opis zostawał przy
 * tytule, a dłuższy spadał do nowej linii zależnie od szerokości okna —
 * ta sama lista wyglądała niespójnie.
 */
export function elementSceny(s) {
  return `<li><a href="${hrefDlaSlug(s.slug, 'scena')}"><span class="numer-sceny">${escapeHtml(s.numer_sceny)}</span> <strong>${escapeHtml(s.tytul)}</strong></a>${
    s.streszczenie ? `<span class="streszczenie-sceny">${escapeHtml(s.streszczenie)}</span>` : ''}</li>`;
}

/**
 * Sekcja „Sceny" na stronie epizodu — agregacja wpisów scen (ADR 0008 pkt 4).
 *
 * Wariant `pelna` stoi na szczycie strony epizodu przez całą jej szerokość:
 * sceny są główną drogą do treści epizodu, więc nie mogą czekać w wąskiej
 * kolumnie bocznej pod metryką. Wąski wariant zostaje dla miejsc, gdzie lista
 * jest dodatkiem obok treści.
 */
export function sekcjaScen(slugEpizodu, { pelna = false } = {}) {
  const sceny = scenyEpizodu(slugEpizodu);
  if (sceny.length === 0) return '';
  const naglowek = pelna
    ? `<div class="naglowek-sekcji">
      <h2>Sceny</h2>
      <span class="licznik">${sceny.length}</span>
    </div>`
    : '<h2>Sceny</h2>';
  return `<section class="blok-sceny${pelna ? ' blok-sceny-pelna' : ''}">
    ${naglowek}
    <ul class="lista-scen${pelna ? ' lista-scen-siatka' : ''}">
      ${sceny.map(elementSceny).join('')}
    </ul>
  </section>`;
}
