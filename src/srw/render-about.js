/** Informacje o zakresie tematycznym i legenda wiarygodności. */
export function renderOBazie() {
  return `
<div class="naglowek-strony">
  <a class="okruszek" href="#/">Baza</a>
  <h1>O bazie</h1>
  <p class="podtytul">Światy, bohaterowie i historie Super Robot Wars</p>
</div>
<div class="tresc-dluga">
<section class="blok">
  <h2>Postacie, mechy i wydarzenia</h2>
  <p><em>Super Robot Wars</em> łączy bohaterów i roboty różnych serii anime we wspólnych historiach.
  Opisy postaci i mechów prowadzą do ich powiązań, a epizody i sceny przedstawiają wydarzenia
  oraz nawiązania do oryginalnych serii. Zakres fabuły kończy się na rozegranych epizodach.</p>
</section>
<section class="blok">
  <h2>Znaczniki pochodzenia</h2>
  <ul>
    <li><span class="legenda poziom-skrypt">białe tło</span> — wydarzenia, dialogi i informacje z gry.</li>
    <li><span class="legenda poziom-zrodlo">niebieskie tło</span> — informacje potwierdzone w źródłach podanych przy opisie.</li>
    <li><span class="legenda poziom-wiedza">zielone tło</span> — niezweryfikowany kontekst i interpretacje, wymagające ostrożności.</li>
  </ul>
  <p>Porównania z anime rozróżniają wydarzenia wspólnego świata gry i historie oryginalnych serii.</p>
  <p>Gdy postać albo mech występuje w kilku tytułach, fragmenty opisów i galerie mają u góry nazwę
  gry, której dotyczą. Etykieta <span class="etykieta-gry">Wspólne</span> oznacza informacje
  niezależne od wersji — rodowód, pierwowzór z anime, fakty wspólne dla serii.</p>
</section>
</div>`;
}
