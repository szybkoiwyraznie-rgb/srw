/**
 * Punkt startowy witryny: montuje router i renderery.
 * Po każdym renderze domyka interakcje wymagające DOM.
 */

import { uruchomRouter } from './router.js';
import { podepnijPodglad } from './podglad.js';
import { rama, tytulStrony, nieZnalesc, nazwaTypu } from './render.js';
import { czasStrony, coNowegoCzas, czasBazy } from './data.js';
import { renderGlowna } from './render-home.js';
import { renderEncja } from './render-entity.js';
import { renderEpizod } from './render-episode.js';
import { renderScena } from './render-scene.js';
import { renderListe, renderTagi, renderTag } from './render-lists.js';
import { renderSzukanie } from './render-search.js';
import { renderCoNowego } from './render-whatsnew.js';
import { renderOBazie } from './render-about.js';

/** Mapa tras list ↔ tras encji (dla podświetlenia nawigacji). */
const LISTA_TRAS = {
  gra: 'gry', epizod: 'epizody', scena: 'sceny', postac: 'postacie',
  mech: 'mechy', pojecie: 'pojecia', seria: 'serie',
};

function renderuj(trasa) {
  const app = globalThis.document?.getElementById('app');
  if (!app) return;

  let aktywna = trasa.nazwa;
  let tytul = 'SRW Database';
  let html;

  switch (trasa.nazwa) {
    case 'glowna':
      html = renderGlowna(); tytul = 'Baza'; aktywna = 'glowna'; break;

    case 'gra':
      html = renderEncja(trasa.param); tytul = trasa.param ?? 'Gra'; aktywna = 'gry'; break;
    case 'epizod':
      html = renderEpizod(trasa.param); tytul = trasa.param ?? 'Epizod'; aktywna = 'epizody'; break;
    case 'scena':
      html = renderScena(trasa.param); tytul = trasa.param ?? 'Scena'; aktywna = 'sceny'; break;
    case 'postac':
    case 'mech':
    case 'pojecie':
    case 'seria':
      html = renderEncja(trasa.param);
      tytul = trasa.param ?? nazwaTypu(trasa.nazwa);
      aktywna = LISTA_TRAS[trasa.nazwa];
      break;

    case 'gry':
    case 'epizody':
    case 'sceny':
    case 'postacie':
    case 'mechy':
    case 'pojecia':
    case 'serie': {
      const typ = Object.keys(LISTA_TRAS).find((t) => LISTA_TRAS[t] === trasa.nazwa);
      html = renderListe(typ, trasa.query);
      tytul = nazwaTypu(typ, 'wiele');
      break;
    }

    case 'tagi': html = renderTagi(); tytul = 'Tagi'; break;
    case 'tag': html = renderTag(trasa.param); tytul = `Tag: ${trasa.param ?? ''}`; aktywna = 'tagi'; break;
    case 'szukaj': html = renderSzukanie(trasa.query.q); tytul = 'Szukaj'; break;
    case 'co-nowego': html = renderCoNowego(); tytul = 'Co nowego'; break;
    case 'o-bazie': html = renderOBazie(); tytul = 'O bazie'; break;

    default: html = nieZnalesc(trasa.param ?? 'strona'); tytul = 'Nie znaleziono'; break;
  }

  const czas = ['gra', 'epizod', 'scena', 'postac', 'mech', 'pojecie', 'seria'].includes(trasa.nazwa)
    ? czasStrony(trasa.param)
    : trasa.nazwa === 'co-nowego' ? coNowegoCzas() : czasBazy();
  app.innerHTML = rama(aktywna, tytul, html, czas);
  tytulStrony(tytul);
  domknijInterakcje(app);
}

/** Detale panelu skryptu mają pamiętać stan w obrębie sesji przeglądarki. */
function domknijInterakcje(app) {
  globalThis.scrollTo?.(0, 0);
  const tresc = app.querySelector('.tresc');
  if (tresc) tresc.scrollTop = 0;
}

/**
 * Odsyłacze wewnątrz strony (podsekcja analizy → miejsce w treści sceny) nie
 * mogą zmieniać trasy hashowej, więc przechwytujemy kliknięcie i przewijamy
 * ręcznie. Delegacja na dokumencie działa dla każdej wyrenderowanej strony.
 */
function podepnijSkokiWStronie() {
  const d = globalThis.document;
  if (!d?.addEventListener) return;
  d.addEventListener('click', (e) => {
    const link = e.target?.closest?.('[data-cel]');
    if (!link) return;
    const cel = d.getElementById(link.dataset.cel);
    if (!cel) return;
    e.preventDefault();
    cel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    cel.classList.remove('podswietlenie');
    void cel.offsetWidth;
    cel.classList.add('podswietlenie');
  });
}

// Podgląd ilustracji działa przez delegację zdarzeń, więc wystarczy podpiąć go raz.
podepnijPodglad();
podepnijSkokiWStronie();

const stop = uruchomRouter(renderuj);
if (globalThis.__SRW_TEST__) globalThis.__SRW_STOP__ = stop;
