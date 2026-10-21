# 0025 — Nowa dostawa epizodu 0: mechy, piloci i obsada misji

Data: 2026-10-21
Status: obowiązujący; zastępuje ADR 0016 pkt 2 w zakresie wersji dostawy.

## Kontekst

Właściciel przekazał nową wersję dostawy epizodu 0 (plik `dostawa_epizod_0.txt`) i polecił
podmienić wszystkie dane dotyczące mechów, pilotów i obsady misji. Ilustracje i sceny
pozostają bez zmian. Poprzednia dostawa `dostawy/srw-oe/jednostki-piloci-i-uzbrojenie-pl.md`
obejmowała wyłącznie parametry pięciu jednostek z menu; nowa dzieli materiał na trzy części:
misje, mechy i pilotów.

## Decyzja

1. Plik `dostawy/srw-oe/jednostki-piloci-i-uzbrojenie-pl.md` zostaje zastąpiony polskim
   opracowaniem nowej dostawy. Surowy plik źródłowy leży obok jako
   `dostawy/srw-oe/dostawa_epizod_0.txt`. Poprzednia wersja pozostaje w historii gita.
2. Nowa dostawa jest źródłem danych o mechach, pilotach i obsadzie misji. Wartości, nazwy
   broni i umiejętności przepisujemy dosłownie; w tabelach broni złamania wiersza zapisujemy
   jako `&lt;br&gt;`, zgodnie z ADR 0016 pkt 3.
3. Parametry jednostek w `w_gre.srw-oe` wskazują na nowy plik dostawy (`dostawa`). W pierwszej
   wersji materiału nie było profilu Real PG Gundam; jednostka zachowywała wtedy wpis
   i ilustracje, a parametry pochodziły z menu (`dostawa: menu`). Uchyla to adnotacja
   z 2026-10-21 poniżej.
4. Obsada misji trafia do relacji epizodu i scen: `DL100_01` dodaje Brocken/Melee pod kontrolą
   Control AI, a `DL100_02` — Exarta, Gundama, White Base oraz trzy Zaku II z Char, Crownem
   i Slenderem. Surowych nazw plików misji nie pokazujemy na stronach (ADR 0024 pkt 3).
5. Statystyki pilotów, komendy Ducha i umiejętności są prezentowane wyłącznie na stronach
   postaci. Parametry jednostki nie powtarzają sekcji domyślnej załogi; obsadę pokazuje
   pole `piloci` w danych ogólnych, a strony postaci prowadzą do maszyn.
6. Brak wpisu w słowniku postaci nie jest tym samym co brak przynależności świata.
   **Control AI** — profil sterujący maszyną — nie dostaje serii Patlabor; związek z tą
   serią dotyczy Brockena. Bezimienny żołnierz Zeonu nie jest osobnym wpisem (adnotacja
   z 2026-10-21 poniżej).
7. Ilustracje i sceny pozostają nietknięte.

## Konsekwencje

Strony mechów i pilotów pokazują pełne dane nowej dostawy. Testy pilnują liczby ataków,
statystyk pilotów i obsady obu misji. Kolejna wersja dostawy wymaga nowego ADR-a i podmiany
obu plików w `dostawy/srw-oe/`.

## Adnotacja 2026-10-21 — uzupełnienie Real PG Gundam

Właściciel uzupełnił materiał o profil **Real PG Gundam (Gundam (Keroro))** z serii
Sgt. Frog: cztery bronie, Blok tarczą i Odtwórz. Sekcja trafiła na koniec części *Mechy*
w opracowaniu, a strona jednostki wskazuje teraz na plik dostawy (`dostawa` = ścieżka).
Punkt 3 decyzji w zakresie Real PG Gundam przestaje obowiązywać; pozostałe ustalenia
bez zmian.

## Adnotacja 2026-10-21 — bez domyślnej załogi w parametrach mechów

Właściciel uznał sekcję „Domyślny pilot / załoga i umiejętności specjalne” w parametrach
mechów za zbędną. Usunięto ją z treści i z `w_gre.dane` dziewięciu jednostek; pozostało
pole `piloci` w danych ogólnych oraz pełne profile na stronach postaci. Punkt 5 decyzji
obowiązuje w nowym brzmieniu.

## Adnotacja 2026-10-21 — Żołnierz Zeonu poza bazą

Wpis **Żołnierz Zeonu** powstał z pozycji obsady w materiale epizodu 0. Właściciel
wyjaśnił, że ta postać nigdy nie występowała w fabule i trafiła do materiału przez
pomyłkę, dlatego wpis znika z bazy: nie ma strony postaci, nie figuruje w polu `piloci`
maszyn i nie ma do niego odsyłaczy. Surowy plik materiału pozostaje niezmieniony jako
zapis źródłowy; opracowanie w `dostawy/srw-oe/` również zachowuje ten profil, bo opisuje
materiał, a nie stan bazy. Punkt 6 decyzji w zakresie Żołnierza Zeonu przestaje obowiązywać.
