/**
 * „O bazie" — krótka instrukcja obsługi dla właściciela i dla przyszłych
 * sesji agenta: co to jest, jak rośnie, jak czytać znaczniki i gdzie
 * wrzuca się nowy materiał.
 */

export function renderOBazie() {
  return `
<div class="naglowek-strony">
  <a class="okruszek" href="#/">Baza</a>
  <h1>O bazie</h1>
  <p class="podtytul">Czym jest ten serwis i jak się nim posługiwać</p>
</div>

<div class="tresc-dluga">
<section class="blok">
  <h2>Co to jest</h2>
  <p>Prywatny dziennik rozgrywki w gry z serii <em>Super Robot Wars</em>, prowadzony równolegle
  z graniem. Nie jest to serwis fanowski ani encyklopedia uniwersalna: baza opisuje
  <strong>tylko to, co zostało rozegrane</strong>, a wartością jest to, że rośnie razem z postępem w grze.</p>
  <p>Interfejs jest po to, żeby oglądać zależności: która postać prowadzi który mech, z jakiej serii
  anime pochodzi, w których epizodach się pojawiła i jak ten wątek wypada w porównaniu z oryginalnym odcinkiem.</p>
</section>

<section class="blok">
  <h2>Jak baza rośnie</h2>
  <ol class="kroki">
    <li><strong>Rozgrywasz epizod</strong> i przepisujesz jego skrypt (dialogi, narrator, nazwy) do pliku w <code>episodes/</code>.</li>
    <li><strong>Przekazujesz materiał agentowi</strong> — skrypt, a jeśli chcesz, także szczegóły o postaciach i mechach (z uzbrojeniem).</li>
    <li><strong>Agent uzupełnia bazę</strong>: tworzy wpisy encji, dopina relacje, pisze analizy i komentarze, linkuje wątki do serii anime.</li>
    <li><strong>Build renderuje witrynę</strong> — publikacja to zwykły push; nowa wersja pojawia się automatycznie.</li>
  </ol>
</section>

<section class="blok">
  <h2>Znaczniki pochodzenia</h2>
  <p>Najważniejsza konwencja w tym projekcie: przy każdym wpisie widać, skąd pochodzi informacja.</p>
  <ul>
    <li><span class="legenda poziom-skrypt">białe tło</span> — dostawa właściciela (skrypt epizodu, szczegóły o mechach, pilotach i broniach). Najwyższy priorytet.</li>
    <li><span class="legenda poziom-zrodlo">niebieskie tło</span> — uzupełnienie z zewnętrznych źródeł, sprawdzone przy zapisie (ADR 0009).</li>
    <li><span class="legenda poziom-wiedza">zielone tło</span> — wiedza i analiza modelu bez potwierdzenia. Najniższy poziom wiarygodności.</li>
  </ul>
  <p>Dzięki temu widać, gdzie kończy się gra, a zaczyna interpretacja — i można wracać do wpisów
  o niższej pewności, żeby je zweryfikować.</p>
</section>

<section class="blok">
  <h2>Niedokończone jest w porządku</h2>
  <p>Wpis może istnieć, zanim wiadomo o nim wszystko. Strony pokazują, czego jeszcze brakuje
  („Do uzupełnienia"), a puste pola nie są błędem — są kolejką zadań na kolejne epizody.</p>
</section>

<section class="blok">
  <h2>Dla agenta</h2>
  <p>Zasady pracy, schemat danych i lista rzeczy do zrobienia po wrzuceniu nowego skryptu
  żyją w pliku <code>AGENTS.md</code> w repozytorium — to jedyny plik startowy sesji.
  Schematy encji opisuje <code>docs/guides/SCHEMAT_DANYCH.md</code>, a decyzje projektowe
  rejestr <code>docs/decisions/</code>.</p>
</section>
</div>`;
}
