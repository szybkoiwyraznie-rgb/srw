# 0018 — Treść o świecie, nie o procesie tworzenia bazy

Data: 2026-10-19
Status: obowiązujący; doprecyzowuje ADR 0005, 0009–0011 i 0014–0017 w zakresie treści widocznej w witrynie.

## Kontekst

Właściciel odrzucił opisy mówiące o „dostawie”, „skrypcie”, „danych od właściciela”
i samym właścicielu zamiast o postaciach, maszynach i świecie. Są to wewnętrzne informacje
o pracy nad projektem, nie treść tematyczna.

## Decyzja

1. **Treść witryny opisuje fabułę, świat, lore, postacie, maszyny i mechaniki gry.**
   Nie opisuje pozyskiwania materiałów, procedur agentów ani działania bazy danych.
   Nie używamy w niej słowa „dostawa” ani wtrąceń typu „właściciel podał”, „ze skryptu”,
   „dane od właściciela”, „nie przypisano do sceny” czy „brak materiału do utworzenia biografii”.
   Nie zastępujemy ich eufemizmami o tym samym procesie.
2. Piszemy bezpośrednio o przedmiocie wpisu: co to jest, jaką pełni rolę, z kim lub czym
   jest związany, jak działa. Zamiast komentować brak danych, pomijamy nieznany szczegół.
   Uzupełnienie kontekstu wymaga właściwego poziomu wiarygodności; zakaz wymyślania faktów
   i wyprzedzania rozegranej fabuły nadal obowiązuje.
3. **Reguła obejmuje całą widoczną treść**, nie tylko sekcję „Opis”: komentarze,
   porównania, legendy, stronę główną, „O bazie”, dziennik zmian i komunikaty szablonów.
   Wewnętrzne instrukcje, ścieżki archiwów, zadania redakcyjne i historia procedur pozostają
   w `docs/`, `AGENTS.md`, testach i opisie PR, a nie na stronach tematycznych.
4. Zachowujemy odsyłacze do źródeł przy twierdzeniach, oznaczenia wiarygodności i rozróżnienie
   świata gry od oryginalnego anime. Widoczna legenda mówi o informacjach z gry,
   sprawdzonych źródłach oraz niezweryfikowanym kontekście, nie o sposobie pracy agenta.
   Porównanie chronologii jest treścią merytoryczną; opis procedury zachowywania archiwum — nie.
5. **Reguła nie zmienia archiwów ani wewnętrznego schematu.** Pliki `episodes/**`
   i `dostawy/**` pozostają nietykalne. Techniczne klucze, znaczniki bloków i klasy CSS
   mogą nadal nazywać się `skrypt` lub `menu`; nie są tekstem dla czytelnika.
   Pełna treść epizodu nadal jest dostępna, ale bez nazwy pliku i nagłówka o skrypcie.
6. Publiczny dziennik informuje o nowych i poprawionych opisach, ilustracjach i powiązaniach.
   Dawne notatki o procedurach zachowano w `docs/HISTORIA_WEWNETRZNA.md`; nie są publikowane.

## Kontrola jakości

Testy sprawdzają widoczny tekst wszystkich stron, strony głównej, „O bazie”, dziennika
oraz legend. Kontrolują również, że epizod nadal zawiera dialogi, ale nie wyświetla ścieżki
archiwum ani kolejki zadań redakcyjnych. Testy nie blokują technicznych nazw w kodzie
lub metadanych i nie zastępują merytorycznego przeglądu stylu.

## Adnotacja (2026-10-20)

Właściciel odrzucił opis **Żołnierza Zeonu**, który mówił o „zbiorczym profilu”, „obsadzie,
którą gra przypisuje masowym Zaku II” i „standardowym obsadzeniu tych maszyn w grze”.
To naruszenie punktu 1 w wersji, której wcześniej nie wychwycił żaden test: opis postaci
opowiadał o rekordzie w grze i o tym, jak gra rozdziela maszyny, zamiast o ludziach.

Zasada doprecyzowana:

- **Sekcja „Opis” mówi o świecie.** Zbiorczy wpis opisuje anonimowych żołnierzy, ich rolę
  i sposób walki — nie miejsce w danych gry. Zamiast „w grze obsadza ją profil żołnierza”
  piszemy „podstawowa maszyna zwykłych żołnierzy Zeonu”.
- **Mechaniki opisujemy jako zjawisko w świecie.** Szyk, grupa i blok tarczą są cechami
  walki, nie polami rekordu; nie używamy słów „profil”, „obsada”, „roster”, „w grze”.
- **Odsyłacze do scen są fabularne.** Piszemy „podczas ataku na White Base”, a nie
  „w scenie 0-2”; numer sceny należy do nawigacji i metadanych, nie do prozy.
- Reguła nie zmienia sekcji „Parametry”: to surowe dane jednostki z gry i wolno im używać
  nagłówków typu „Przypisany profil”.

Test sprawdza, że sekcja „Opis” żadnej encji nie zawiera tych określeń.

## Adnotacja 2026-10-22 — dziennik zmian nie opisuje interfejsu

Publiczny dziennik (`content/co-nowego.md`) opisuje wyłącznie treść bazy: nowe i poprawione
opisy, ilustracje i powiązania. **Nie odnotowuje zmian interfejsu ani innych technikaliów** —
galerii kafelków, filtrów, układu stron, wydajności czy parametrów budowania. Decyzja
właściciela z 2026-10-22: baza jest informacją o fabule, nie o technice. Dotyczy to też
pozycji już opublikowanych: z dziennika usunięto wpisy, które opisywały wyłącznie interfejs
albo dokumentację wewnętrzną (2026-10-21 00:20, 00:30, 00:38; 2026-10-20 20:08, 20:15, 20:20,
11:49, 18:11; 2026-10-20 10:46) oraz wpisy o galerii kafelków i filtrach z 2026-10-21 22:15
i 22:30. Wpisy o nowych opisach, ilustracjach i powiązaniach zostały bez zmian.

## Adnotacja 2026-11-09 — dziennik mówi wyłącznie o fabule

Właściciel: „zawartość bazy jest w 100% o fabule, a nie o procesie”. Wpisy
dziennika opisujące proces, bazę, formatowanie i strukturę stron naruszają zasadę,
nawet bez słów technicznych (np. „dostaje własne strony”, „ma pełne statystyki”,
„kwestie idą jedna pod drugą”). Doprecyzowanie:

- **Wpis dziennika to stwierdzenie o świecie** — o postaciach, maszynach, wydarzeniach,
  historii i mechanikach gry. Nie mówi, że coś „pojawiło się w bazie”, „dostało stronę”,
  „zostało uzupełnione”, „rozdzielone” ani jak jest formatowane.
- Nazwy działów, bloków, poziomów danych i samych stron nie należą do prozy wpisu;
  odnośniki do stron pozostają, ale ich mowa o sobie znika.
- Notatki o przebiegu pracy trafiają do `docs/HISTORIA_WEWNETRZNA.md`; 2026-11-09
  przeniesiono tam cały zapas wpisów o procesie z dziennika publicznego.
- Test dziennika rozszerzono o słowa struktury i formatowania, ale lista nie zastępuje
  przeglądu stylu.

## Adnotacja 2026-11-18 — zasada obowiązuje także wtedy, gdy opisuje samą siebie

Wpis dziennika z 2026-11-17 21:39 chwalił wykonanie tej reguły: mówił, że analiza sceny
„opisuje teraz wydarzenia sceny własnymi słowami” i że „język warsztatu zniknął z analiz scen”.
Właściciel uznał to za szczególnie rażące naruszenie punktu 3: zdanie o redagowaniu analiz jest
opisem procesu nawet wtedy, gdy dotyczy usuwania opisów procesu. Doprecyzowanie:

- **Dziennik nie relacjonuje pracy nad prozą.** Nie mówi, co „opisuje teraz”, co „zniknęło
  z analiz”, czego „nie ma już w komentarzach”. Mówi o postaciach, maszynach, miejscach
  i wydarzeniach — także wtedy, gdy wpis podsumowuje większą zmianę treści.
- **Reguła dotyczy każdej prozy widocznej w witrynie**, nie tylko boksów opisowych: analiz scen,
  komentarzy epizodów, kolumny „Różnice” w wątkach i opisów encji. Podmiotem zdania jest świat,
  a nie gra („Gra przenosi”, „W grze pluton czeka”, „scenariusz gry pomija”).
- **Porównanie z pierwowzorem zostaje dozwolone.** Zdanie o różnicy wobec anime jest treścią
  merytoryczną; warsztatowe jest wskazanie autora tej różnicy („gra”, „scenariusz gry”).
- Strażnicy: rozszerzona lista `test/dziennik-zmian.test.js` oraz test
  `proza scen i epizodów mówi o świecie, nie o grze jako autorze` w `test/sceny.test.js`.
  Wyjątki: „gra polityczna”, „gra w piłkę”, „świat gry” jako nazwa uniwersum.
