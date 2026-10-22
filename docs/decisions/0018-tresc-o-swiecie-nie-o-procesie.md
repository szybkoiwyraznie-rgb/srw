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
pozycji już opublikowanych — wpisy o galerii i filtrach z 2026-10-21 usunięto.
