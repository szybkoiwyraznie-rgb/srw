/**
 * „Co nowego" — dziennik zmian widoczny na stronie, prowadzony ręcznie
 * przez agenta przy każdym PR (ADR 0005). Ma odpowiadać na pytanie
 * „co doszło do bazy od ostatniego razu", czego nie pokazuje żaden licznik.
 */

import { escapeHtml } from './markdown.js';
import { wpisyCoNowego } from './data.js';
import { nazwaMiesiaca, stanPusty } from './render.js';

function listaDziennikaGrupy(wpisy) {
  return `<ul class="dziennik">${wpisy.map(wpisHtml).join('')}</ul>`;
}

function wpisHtml(w) {
  return `<li>
    <span class="data mono">${escapeHtml(w.data)}${w.czas ? `<br>${escapeHtml(w.czas)}` : ''}</span>
    <div>${w.html}</div>
  </li>`;
}

/**
 * Lista wpisów dziennika bez nagłówka strony — używana też na stronie głównej.
 * `limit` obcina do najnowszych wpisów; pełna strona podaje bez limitu.
 */
export function listaDziennika(limit = null) {
  const wpisy = wpisyCoNowego();
  const wybrane = limit ? wpisy.slice(0, limit) : wpisy;
  return listaDziennikaGrupy(wybrane);
}

export function renderCoNowego() {
  const wpisy = wpisyCoNowego();
  if (wpisy.length === 0) {
    return `<div class="naglowek-strony"><a class="okruszek" href="#/">Baza</a><h1>Co nowego</h1></div>` +
      stanPusty('Dziennik zmian jest pusty.', 'Agent dopisuje tu wpis przy każdym uzupełnieniu bazy.');
  }

  // wpisy pogrupowane po miesiącu (klucz RRRR-MM), najnowsze pierwsze
  const grupy = new Map();
  for (const w of wpisy) {
    const miesiac = String(w.data ?? '').slice(0, 7);
    if (!grupy.has(miesiac)) grupy.set(miesiac, []);
    grupy.get(miesiac).push(w);
  }
  const miesiace = [...grupy.keys()].sort().reverse();

  return `
<div class="naglowek-strony">
  <a class="okruszek" href="#/">Baza</a>
  <h1>Co nowego</h1>
  <p class="podtytul">${wpisy.length} ${wpisy.length === 1 ? 'wpis' : 'wpisów'} w dzienniku zmian</p>
</div>
${miesiace.map((m) => `
  <section class="blok">
    <h2>${nazwaMiesiaca(m)}</h2>
    ${listaDziennikaGrupy(grupy.get(m))}
  </section>`).join('')}`;
}
