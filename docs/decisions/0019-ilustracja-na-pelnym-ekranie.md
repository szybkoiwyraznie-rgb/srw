# 0019 — Ilustracja otwiera się na pełnym ekranie

Data: 2026-10-20
Status: obowiązujący; uzupełnia ADR 0002, 0015 i 0017 w zakresie oglądania ilustracji.

## Kontekst

Ilustracje z R2 są wstawiane do treści jako podglądy o ograniczonej wysokości, żeby nie
rozpychały strony ani małego ekranu. Właściciel chce móc obejrzeć każdą z nich w całości,
klikając obraz — bez opuszczania wpisu i bez szukania odnośnika pod galerią.

Artefakt ma pozostać jednym samowystarczalnym plikiem HTML bez zależności runtime
(ADR 0001–0002), a oryginały — w R2 (ADR 0015, 0017). Obraz nadal jest dostawą encji;
sposób jego wyświetlania nie zmienia zasad przypisywania ani poziomów wiarygodności.

## Decyzja

1. **Każdy obraz w treści jest przyciskiem.** Renderer markdown zamienia `![alt](src)` na
   `<button class="ilustracja-otworz" data-pelny-ekran>` z osadzonym `<img>`. To samo dotyczy
   obrazu encji z frontmattera. Natywny przycisk daje obsługę klawiatury i czytnika ekranu
   bez atrap ARIA; nie zmienia się liczba ani adresy obrazów.
2. **Kliknięcie otwiera modalne okno podglądu.** Okno to natywny `<dialog>` w trybie
   `showModal()`, który wypełnia całe okno przeglądarki (`100vw × 100dvh`), a obraz mieści się
   w nim przez `object-fit: contain`. Podpis pochodzi z tekstu alternatywnego obrazu.
   Zamknięcie: przycisk, klawisz Esc, kliknięcie tła lub marginesu wokół ilustracji;
   fokus wraca do miniatury.
3. **Wiele ilustracji to jedna galeria.** Na stronie z kilkoma obrazami okno pokazuje licznik
   „n z m” i strzałki; klawisze ← i → przełączają ilustracje z zawijaniem. Kolejność wynika
   z kolejności obrazów na stronie.
4. **Tryb pełnoekranowy jest ulepszeniem, nie warunkiem.** Okno samo wypełnia ekran, więc
   działa też w ramce bez uprawnień. Przycisk „Pełny ekran” pojawia się tylko wtedy, gdy
   przeglądarka udostępnia Fullscreen API i nie zgłasza `fullscreenEnabled === false`;
   odmowa uprawnień jest ignorowana bez komunikatu o błędzie.
5. **Bez nowych zależności i bez kopiowania plików.** Okno podstawia adres obrazu z R2;
   artefakt nadal ma jeden blok `<script>` i zero zewnętrznych zasobów poza samymi obrazami.
   Przy braku `<dialog>` kliknięcie otwiera oryginał w nowej karcie.
6. **Tło strony jest zablokowane** na czas otwartego okna (`html.podglad-otwarty`), żeby
   przewijanie nie uciekało spod modala; po zamknięciu blokada znika.

## Odrzucone alternatywy

- **Link `target="_blank"`** — wychodzi z witryny i oddaje sterowanie przeglądarce;
  nie daje galerii ani spójnego wyglądu.
- **Powiększanie w miejscu** — zmienia układ strony i wypycha treść przy każdym kliknięciu.
- **Zewnętrzna biblioteka lightboxa** — łamie ADR 0002 (zero zależności) i powiększa artefakt.

## Konsekwencje i kontrola

Obrazy w treści przestają być samodzielnymi `<img>`; są zawsze w przycisku otwierającym.
Testy pilnują, że każdy obraz ma otwieracz i tekst alternatywny, że szkielet zawiera okno
z kompletem elementów sterujących oraz że okno nie wczytuje obrazu przed otwarciem.
Nowe galerie dodaje się jako zwykłe obrazy markdown — podgląd podłącza się sam.

## Adnotacja (2026-10-20)

W galeriach pozostawały jeszcze odnośniki „Otwórz plik …” pod każdym obrazem — pozostałość po
czasach, gdy powiększenia nie było. Właściciel uznał je za zbędne: wystarczy podgląd i okno
pełnoekranowe. Odnośniki usunięto ze wszystkich 22 galerii, a test pilnuje, że pod obrazem nie
ma już linku do R2. Oryginał nadal jest dostępny — przez samo kliknięcie obrazu i przycisk
„Pełny ekran”.
