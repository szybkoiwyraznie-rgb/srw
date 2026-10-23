# 0031 — Wątki fabularne: nazwa, cztery kolumny i kolejność scen

Data: 2026-10-23
Status: obowiązujący; zastępuje w tym zakresie nazwę sekcji i kształt tabeli z ADR 0008
(punkt 5) i opis z `docs/guides/SCHEMAT_DANYCH.md`.

## Kontekst

Sekcja epizodu nazywała się `## Wątki anime`, choć zbierała zapożyczenia nie tylko z anime:
w epizodzie 0 i 1 są wiersze o prologu gry, o Connect Force, o drużynie SV2 z Patlabora
i o Raijin-Oh. Nazwa sugerowała więc węższy zakres niż treść, a dla gier i mang nie miała
zastosowania.

Tabela miała pięć kolumn: motyw, źródło, „Odcinek / wersja”, typ i różnice. Kolumna
„Odcinek / wersja” mieszała porządki — obok `odc. 5 „Runaway Labor X-10!”` stały wartości
`Epizod 1` (numer epizodu gry, na jego własnej stronie), `Szkolenie podstawowe`, `Division 2`
(nazwa plutonu) i `odc. 1–51`, więc czytelnik nie wiedział, czy patrzy na odcinek serialu,
część gry, czy nazwę grupy. Kolumna „Typ” (`adaptacja`, `nawiazanie`, `fuzja`, `autorskie`)
powtarzała informację, którą niesie źródło: skoro w kolumnie źródła stoi gra, a w kolumnie
odcinka `n/d`, wątek jest autorski.

Kolejność wierszy rosła wraz z redakcją, nie z fabułą: w epizodzie 1 misja 3 stała po misji 4.
Właściciel wskazał to jako losowe i oczekiwał porządku scen.

## Decyzja

1. **Sekcja nazywa się `## Wątki fabularne`.** Obejmuje zapożyczenia z anime, mang, gier
   i komiksów oraz wątki własne gry; nazwa „anime” znika z treści, dokumentacji i testów.
2. **Tabela ma cztery kolumny:** `Motyw w epizodzie | Źródło | Odcinek w źródle | Różnice`.
   Kolumna „Typ” jest usunięta, a rozróżnienie „zapożyczone / autorskie” niesie kolumna
   „Odcinek w źródle”. Jeśli informacja o rodzaju zapożyczenia jest istotna, trafia do
   kolumny „Różnice” jako zdanie, nie jako etykieta.
3. **Kolumna „Odcinek w źródle” ma dokładnie trzy dopuszczalne postaci:**
   `odc. N „Tytuł”` — konkretny odcinek serialu; `cała seria` — motyw z całego dzieła bez
   wskazania odcinka; `n/d` — brak odpowiednika w źródle, czyli wątek autorski gry.
   Numer epizodu gry, nazwa drużyny i numeracja scen nie są tu dopuszczalne.
4. **Wiersze idą w kolejności występowania w epizodzie**, czyli w kolejności scen. Motyw,
   który pojawia się w dwóch scenach, stoi przy pierwszej z nich. Kolejność scen jest
   nośnikiem porządku, więc tabela nie dostaje osobnej kolumny ze sceną.
5. **Zasady pilnuje test** `test/watki-fabularne.test.js`: nazwa sekcji, cztery kolumny,
   dopuszczalne wartości kolumny trzeciej, zgodność `n/d` ze źródłem gry oraz jawna
   kolejność motywów w obu epizodach.

## Wykonanie

- `content/epizody/srw-oe-ep0.md` i `content/epizody/srw-oe-ep1.md` mają sekcję
  `## Wątki fabularne` z czterema kolumnami; wartości `Epizod 0`, `Epizod 1`, `Szkolenie
  podstawowe`, `Division 2`, `wczesne odcinki` i `odc. 1–51 (1991–1992)` zastąpione przez
  `n/d` albo `cała seria`, a numer odcinka anime został tylko tam, gdzie jest znany.
- Wiersze epizodu 1 ułożone według scen 1-1 → 1-4 (misja 3 przed misją 4).
- Zaktualizowane: `AGENTS.md`, `README.md`, `content/README.md`,
  `docs/guides/PRZEPLYW_EPIZODU.md`, `docs/guides/SCHEMAT_DANYCH.md`, komentarz w
  `src/srw/render-episode.js` oraz testy `test/uklad-stron.test.js` (nazwa boksy, liczba
  kolumn) i nowy `test/watki-fabularne.test.js`.

## Konsekwencje

Tabela traci jedną kolumnę, ale nie traci informacji o pochodzeniu: mówi o nim źródło i odcinek.
Cena jest taka, że różnice między `nawiazanie`, `fuzja` i `adaptacja` nie są już widoczne
w nagłówku kolumny — jeśli będą potrzebne, wracają jako zdanie w „Różnicach”, a nie jako nowa
kolumna. Każda nowa scena epizodu wymaga dopisania motywów w miejscu odpowiadającym jej
kolejności; pilnuje tego test z jawną listą.
