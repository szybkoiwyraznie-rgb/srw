# 0032 — Ilustracje żyją tylko w polu widzenia

Data: 2026-10-24
Status: obowiązujący; uzupełnia ADR 0019 (podgląd pełnoekranowy) i ADR 0015 (oryginały w R2).

## Kontekst

Galeria postaci to dziś 55 kafelków, galeria mechów — 33, a strona encji potrafi mieć
kilkanaście ilustracji w kilku blokach gier. Obrazy są pobierane z R2 w pełnej
rozdzielczości miniatury, więc jedno przewinięcie galerii zostawia w pamięci karty
kilkadziesiąt zdekodowanych bitmap. Natywne `loading="lazy"` opóźnia tylko **pierwsze**
pobranie: obraz raz wyrysowany zostaje w pamięci do zmiany trasy, a przy powrocie na tę
samą listę wszystko dekoduje się od nowa.

Witryna to jeden plik artefaktu bez zależności npm (ADR 0001, AGENTS.md §6), więc
rozwiązanie musi zmieścić się w kilkudziesięciu liniach czystego ESM i działać także
w przeglądarce bez `IntersectionObserver`.

## Decyzja

1. **Obraz poza polem widzenia oddaje pamięć.** Moduł `src/srw/leniwe-obrazy.js`
   przechowuje adres ilustracji w `data-zrodlo` i zdejmuje atrybut `src`, gdy obraz
   oddali się od ekranu. Przeglądarka zwalnia wtedy bitmapę; wraca ona dopiero wtedy,
   gdy obraz znów się zbliży.
2. **Dwa marginesy zamiast jednego.** Wczytanie następuje w pasie
   `MARGINES_WCZYTANIA` (400 px) wokół ekranu, zwolnienie dopiero poza
   `MARGINES_ZWOLNIENIA` (1600 px). Różnica daje histerezę — drobny ruch w tę i z powrotem
   nie przełącza obrazów.
3. **Pierwsze przejście jest natychmiastowe.** Po renderze trasy moduł sam mierzy
   położenie każdego obrazu: te w polu widzenia dostają `src` od razu, pozostałe
   startują jako puste ramki. Obserwator zgłasza stan dopiero w kolejnej klatce,
   a widoczna miniatura nie może przez tę klatkę być pusta.
4. **Układ strony się nie rusza.** Przy zwalnianiu zapamiętujemy zmierzone wymiary
   i przypinamy je stylem; przy wczytaniu znikają. Obraz, który nigdy nie zdążył się
   wyrysować, nie dostaje przypiętego zera — miejsce trzyma mu klasa `.obraz-zwolniony`
   z minimalną wysokością.
5. **Adres czyta się przez `adresObrazu`.** Podgląd pełnoekranowy (ADR 0019) i każdy
   inny kod, który potrzebuje źródła miniatury, pyta o nie modułu, nie o atrybut `src` —
   kliknięta miniatura może być w tym momencie zwolniona.
6. **Brak `IntersectionObserver` oznacza zwykłe ładowanie.** Moduł wczytuje wtedy
   wszystkie obrazy naraz; strona zachowuje się jak przed zmianą, nic nie znika.
7. **Znaczniki zostają bez zmian.** Renderery nadal wypuszczają `<img src="…"
   loading="lazy" decoding="async">`, więc artefakt czytany bez JavaScriptu (i testy
   renderujące HTML w Node) widzą komplet ilustracji.

## Odrzucone alternatywy

- **Samo `loading="lazy"`** — nie zwalnia pamięci i nie rozwiązuje problemu długich galerii.
- **Wirtualizacja listy kafelków** (usuwanie węzłów DOM poza ekranem) — zmienia wysokość
  dokumentu, psuje przewijanie, skoki do kotwic i wyszukiwanie w przeglądarce.
- **Jeden margines dla wczytania i zwolnienia** — obraz na granicy migotałby przy
  każdym drgnięciu kółka myszy.
- **Podmiana `src` na przezroczysty piksel** — zostawia w pamięci dekoder i sprawia,
  że `src` przestaje być wiarygodnym adresem dla podglądu.

## Konsekwencje

Pamięć karty zależy od wielkości ekranu, nie od długości listy. Przewijanie galerii
w tę i z powrotem kosztuje ponowne dekodowanie obrazu z pamięci podręcznej przeglądarki —
świadomie wybrany kompromis. Każda nowa ścieżka wstawiająca `<img>` do strony dostaje
leniwe ładowanie za darmo, bo moduł podpina się po każdym renderze trasy w `main.js`;
kod czytający adres ilustracji musi używać `adresObrazu`.
