# 0010 — Poziomy wiarygodności, kolor zamiast plakietek, procedura asymilacji dostaw

Data: 2026-10-17
Status: obowiązujący (uszczegóławia ADR 0004; plakietki z ADR 0004 zastąpione kolorem)

## Kontekst

Właściciel dostarcza dane na trzech poziomach wiarygodności. Dotychczas poziom pokazywała
plakietka tekstowa, a procedura przyjęcia dostawy nie była opisana. Przy pierwszej prawdziwej
dostawie (skrypt plus szczegóły mechów, pilotów i broni) trzeba wiedzieć, co jest wzorem, co
uzupełnia się źródłami, a co jest tylko wiedzą modelu.

## Decyzja

### 1. Trzy poziomy wiarygodności

| Poziom | Co to jest | Wartości `pochodzenie` | Tło treści |
|---|---|---|---|
| 1 — dostawa właściciela | skrypt epizodu, odczyt z ekranów gry (menu: statystyki, uzbrojenie, piloci), wszystko, co właściciel przekazał | `skrypt`, `menu` | białe |
| 2 — źródła sprawdzone | treść potwierdzona w zewnętrznym źródle, sprawdzona przy zapisie (ADR 0009) | `zrodlo` | pastelowy niebieski |
| 3 — wiedza i analiza modelu | dane własne modelu i jego analiza, bez potwierdzenia | `wiedza` | pastelowy zielony |

- **„Menu” to ekrany gry**, a nie menu restauracji: odczyt statystyk i uzbrojenia z ekranów
  jednostek. Należy do poziomu 1, bo pochodzi od właściciela.
- **Analiza pochodna jest na poziomie danych, z których powstała.** Streszczenie sceny napisane
  wyłącznie na podstawie skryptu jest poziomu 1. Analiza wnosząca fakty spoza skryptu jest poziomu 3.

### 2. Kolor zamiast plakietki

- Tło treści (akapity, pola, sekcje) odpowiada poziomowi. Tekst jest zawsze czarny.
- Kolory są pastelowe, bo długi tekst na mocnym tle męczy oczy.
- Legenda znajduje się na stronie głównej i w „O bazie”.
- Plakietki tekstowe i ikony zostały usunięte (ADR 0010, zgłoszenie właściciela).
- Witryna jest prywatna i przeznaczona dla właściciela, więc kolor jest jedynym sygnałem poziomu.

### 3. Reguły łączenia danych

1. **Dostawa właściciela jest wzorem i ma najwyższy priorytet.** Dostawa trafia do repozytorium 1:1
   i zostaje zapisana jako wzór. Strony są tworzone według tego wzoru.
2. **Dostawa nie jest nadpisywana przez niższe poziomy.** Źródła i wiedza modelu mogą tylko uzupełniać
   pola puste albo dodawać osobną część opisaną jako inne źródło.
3. **Rozbieżności są jawne, nie ukryte.** Gdy inne źródło, w tym wiedza modelu, różni się od dostawy,
   trafia do osobnej sekcji „Inne źródła i rozbieżności”. Tam jest wyraźnie napisane, co mówi dostawa,
   a co źródło. Właściciel nie ma z tym problemu, ale wymaga czytelnego oznaczenia.
4. **Statystyki i uzbrojenie należą do pary (mech, gra)** i zapisuje się je w `w_gre` (ADR 0003 i 0004).
5. **Wiedza modelu nie zmienia dostawy.** Może wypełniać luki, ale oznaczona jako poziom 3.

### 4. Procedura asymilacji dostawy

1. **Zapis wzoru.** Dostawa jest zapisana 1:1 w `episodes/` (skrypt) albo w katalogu danych dostawy
   `dostawy/<gra>/` (szczegóły mechów, pilotów, broni). Pliki są nietykalne jak skrypty.
2. **Wpisy z wzoru.** Każdy mech, pilot i broń z dostawy dostaje wpis lub uzupełnienie wpisu,
   z `pochodzenie: menu` albo `skrypt`, zależnie od tego, skąd dane.
3. **Uzupełnienia.** Źródła sprawdzone (ADR 0009) dopisują tylko luki, poziom `zrodlo`.
4. **Rozbieżności.** Osobna sekcja, bez zmiany dostawy.
5. **Dziennik.** Wpis w `content/co-nowego.md`.

Procedura nie wymaga ręcznego przenoszenia danych przez człowieka. Wzór jest czytany przez build,
a strony powstają z niego.

## Konsekwencje

- Kolor tła daje natychmiastową informację o wiarygodności bez czytania etykiet.
- Dostawy są archiwalne i odtwarzalne, bo są zapisane bez zmian.
- Rozbieżność między dostawą a źródłem nie znika po scaleniu danych; jest widoczna.
- Format danych z dostawy (np. struktura szczegółów mechów) zostanie zdefiniowany przy pierwszej
  prawdziwej dostawie. ADR 0010 zakłada tylko zasady, nie kształt pliku.
