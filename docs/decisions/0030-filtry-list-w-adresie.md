# 0030 — Filtry działów w adresie: seria „Nieokreślona” i chmura tagów haseł

Data: 2026-10-22
Status: obowiązujący; doprecyzowuje ADR 0002 (routing po hashu) i ADR 0006 (swoboda formy).

## Kontekst

Właściciel poprosił o dwie zmiany w działach list: w galerii mechów brakowało opcji
wyboru maszyn bez przypisanej serii, a lista haseł nie miała sposobu zawężenia po tagach
(pojedynczy tag dało się otworzyć tylko jako osobną stronę `#/tag/<tag>`, bez łączenia).
Trzy mechy (`h-bomb-missile`, `medea`, `turret`) nie mają serii, więc filtr „Seria” nie
pozwalał ich w ogóle wybrać, a w dziale haseł widok był jedną płaską listą.

## Decyzja

1. **Stan filtra żyje w adresie.** Wybór serii i tagów jest parametrem zapytania
   (`#/mechy?seria=bez-serii`, `#/pojecia?tagi=najazd,era`). Każdy widok da się wysłać
   linkiem, a odświeżenie strony zachowuje wybór (ADR 0002).
2. **Brak serii ma własną wartość, nie pusty ciąg.** Pusty ciąg oznacza „wszystkie serie”,
   więc maszyny bez serii dostają sentinel `bez-serii`, widoczny w selektorze jako
   **„Nieokreślona”**. Nagłówek listy mówi wtedy „bez serii”, a opcja pojawia się tylko
   wtedy, gdy w bazie (po pozostałych filtrach) są takie maszyny.
3. **Chmura tagów nad hasłami.** Dział haseł pokazuje na górze tagi wraz z liczbą haseł,
   które je mają. Chip jest odsyłaczem, więc działa bez JavaScriptu; kliknięcie dokłada
   tag do wyboru, a kliknięcie aktywnego tagu go zdejmuje. Wybór opisuje nagłówek
   („tagi: …”) i link „wyczyść wybór”.
4. **Kilka tagów to suma, nie iloczyn.** Lista pokazuje hasła oznaczone którymkolwiek
   z wybranych tagów. Tagi w bazie rzadko występują razem (np. `najazd` i `era` nie mają
   wspólnego hasła), więc iloczyn opróżniałby listę po drugim kliknięciu i wyglądał
   na awarię. Liczby na chipach pokazują rozmiar zbioru tagu, nie wynik filtra.
5. **Adres jest danymi wejściowymi.** Klucz `tagi` jest przyjmowany tylko na liście haseł;
   wartości spoza bazy, duplikaty i puste elementy są odrzucane przed filtrowaniem,
   a nagłówek i chipy są escapowane jak każda inna wartość z adresu.
6. **Chmura dotyczy haseł, nie całej bazy.** Pełny przegląd tagów wszystkich typów stron
   zostaje na `#/tagi`; chmura w dziale czyta wyłącznie tagi stron typu `pojecie`,
   żeby liczby i wynik filtra opisywały ten sam zbiór.

## Odrzucone alternatywy

- **Osobna strona „mechy bez serii”** — duplikuje galerię i wprowadza drugi adres tego
  samego widoku; wystarcza wartość filtra.
- **Filtrowanie tagów w JavaScript (klient)** — traci link do widoku i wymaga stanu
  w pamięci; odsyłacze w chipach dają ten sam efekt i są testowalne w Node.
- **Iloczyn tagów (AND)** — patrz punkt 4; przy obecnych danych pusty wynik po drugim
  kliknięciu.
- **Chmura nad każdą listą** — postacie i mechy mają już filtry krokowe; dodatkowa chmura
  mieszałaby dwa modele zawężania w jednym widoku.

## Konsekwencje

Filtry są częścią adresu, więc testy rendererów mogą sprawdzać HTML bez przeglądarki
(`test/filtry-list.test.js`). Nowe encje bez serii automatycznie trafiają pod „Nieokreślona”,
a nowy tag na stronie hasła pojawia się w chmurze bez zmian w kodzie.
