# 0044 — Ostatnia dostawa ma rację, a domysł z materiału jest dopuszczalny

Data: 2026-11-19
Status: obowiązujący; doprecyzowuje ADR 0012 (granice fabuły), ADR 0043 (odświeżanie pary)
i L24 (proza gry kontra pierwowzór).

## Kontekst

Dwie sytuacje z misji 1-3A SRW Y pokazały, że dotychczasowe zasady były czytane zbyt
dosłownie — jak deterministyczny program, a nie jak redakcja rozumiejąca materiał.

**Pierwsza: umiejętność „Dzieci Gettera”.** Dodatek `Y_dostawa_1_2a_dodatek.txt` podawał
dla niej `Poz. nauki 99`, a misja `dostawa_1_3a.txt` podaje `1`. Strony pilotów mają 1,
ale różnica została zepchnięta na bok jako „nierozstrzygnięta rozbieżność źródeł”.
Właściciel wyjaśnił: **99 to poziom zablokowanej umiejętności, a fabuła misji 1-3A ją
odblokowała — dlatego ma teraz 1.** Rację ma więc zawsze ostatnia dostawa.

**Druga: Shalbandes.** W dialogach misji 1-3A kaiju nie jest ani raz nazwany po imieniu —
mieszkańcy mówią „Kaiju! To kaiju?!”, a Gauma „Jest, i to wielki!”. Wcześniejsza zasada
(L24) kazała traktować brak nazwy w skrypcie jako brak podstawy do opisu wydarzeń gry,
więc strona kaiju zawierała wyłącznie opis mechaniczny i tło z anime — bez walki rozegranej
w misji. Tymczasem z przebiegu sceny wynika bez wątpliwości, że to ten sam potwór:
unoszenie samochodów i budynków, wyłonienie się kaiju, nieudana próba przejęcia go przez
Gaumę, przyzwanie Dynazenona i obrona kopuły. Właściciel: **baza jest pisana przez agentów,
którzy mają czytać ze zrozumieniem, antycypować i tłumaczyć — a nie przez program
porównujący znak w znak.**

## Decyzja

1. **Ostatnia dostawa jest wiążąca.** Gdy dwie dostawy podają różne wartości tego samego
   pola tej samej pary (mech, gra) albo tej samej umiejętności pilota, obowiązuje wartość
   z dostawy późniejszej. Wcześniejsza zostaje w archiwum jako stan historyczny i nie wraca
   do treści, dopóki nowsza dostawa go nie powtórzy. Dotyczy to także progu odblokowania
   umiejętności: jeśli nowsza dostawa zmienia poziom, opisujemy stan po zmianie.
2. **Tożsamość wynika z materiału, nie z powtórzenia nazwy.** Jeśli z przebiegu sceny
   jednoznacznie wynika, że opisywany potwór, maszyna albo osoba to konkretna encja,
   wydarzenia trafiają do jej strony — nawet gdy skrypt nie używa jej nazwy. Niepewność
   („chyba”, „zdaje się”) zostaje wtedy w prozie; pewności nie udajemy, ale też nie
   pomijamy tego, co materiał mówi wprost.
3. **Granica domysłu jest ostra: materiał albo logika sceny.** Dopuszczalne jest to, co
   wynika z dostawy, z wcześniejszych dostaw tej samej gry albo z nieodpartego związku
   zdarzeń w scenie. Niedopuszczalne zostaje dopisywanie faktów z pierwowzoru anime,
   z późniejszych epizodów i z wiedzy ogólnej pod poziomem `skrypt` (ADR 0012).
4. **Rozbieżność się rozstrzyga, nie odkłada.** Znaleziona sprzeczność dwóch dostaw jest
   zadaniem do rozstrzygnięcia według pkt 1, nie pozycją w „pozostałych lukach”.

## Konsekwencje

- Strona `shalbandes` dostała blok `{{skrypt}}` z przebiegiem misji 1-3A (unoszenie
  samochodów i budynków, wyłonienie się kaiju, utrata władzy przez Gaumę, przyzwanie
  Dynazenona, wypchnięcie potworów poza kopułę, reakcja Juugi), a dane pilota z dostawy
  (parametry, „Umiejętności pilota”, Duch „Hart”) wróciły na stronę jednostki.
- „Dzieci Gettera” ma na stronach `Poz. nauki 1` ze źródłem w `dostawa_1_3a.txt`;
  `test/epizod-y-misja-2a.test.js` pilnuje tylko, że dodatek zachowuje swoją wartość 99,
  i nie wymaga jej w treści stron.
- Nowy test `test/ostatnia-dostawa.test.js` pilnuje pkt 1: gdy późniejsza dostawa podaje
  **inny** blok jednostki niż ta wpisana w `w_gre`, test zgłasza naruszenie. Porównuje
  wartości, nie zapis — szerokość kolumn tabeli, przecinki i inne różnice redakcyjne nie
  są rozbieżnością. Powtórzenie tego samego bloku w kolejnej dostawie też nią nie jest,
  więc źródłem zostaje dostawa, która rekord wprowadziła.
- Wniosek z pisania testu: 18 z 89 par nie było w ogóle porównywanych, bo `profil`
  w `w_gre` („Kampfer/Bazooka”, „Dom (Black Tri-Stars)”, „Zaku II (Char)”) nie równa się
  nagłówkowi w dostawie (`## Kampfer (Kampfer/Bazooka)`, `## Dom`, `### Zaku II (Zaku II/Char)`).
  Test dopasowuje teraz nagłówki po treści i schodzi do poziomu `###` w pliku zbiorczym;
  próg minimalnej liczby porównań pilnuje, żeby ta ślepota nie wróciła.
