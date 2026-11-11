# 0039 — „Powiązania” pokazują 50 pozycji; resztę odsłania „Rozwiń”

Data: 2026-11-10
Status: obowiązujący; uzupełnia ADR 0038 i współpracuje z [ADR 0040](0040-powiazania-tylko-sceny-i-hasla.md)
(po ograniczeniu typów w „Powiązaniach” encji mechanizm zwijania ponad 50 pozycji zostaje gotowy
na dalszy rozrost scen i haseł).

## Kontekst

Po ADR 0038 boks „Powiązania” wymienia wszystkie relacje strony w jednym miejscu. Na ośmiu
stronach z 316 lista przekracza 50 pozycji: gra *Super Robot Wars OE* ma ich 248, *Connect
Force* 88, *Zeon* 75, *Super Robot Wars Y* 71, *White Base* 70, Seishiro 69, a *Earth
Federation* i *Klasa Obrony Ziemi* po 52. Boks stoi w wąskiej kolumnie bocznej, więc 248
odsyłaczy to kilka ekranów przewijania obok krótkiego opisu gry.

Właściciel: „Powiązania” mają wyświetlać 50 pozycji, a resztę dopiero po kliknięciu „Rozwiń”.

## Decyzja

1. **Limit: 50 pozycji** (`LIMIT_POWIAZAN`). Liczone są odsyłacze w kolejności wyświetlania,
   przez wszystkie grupy naraz (Sceny, Epizody, Gry, Postacie, Mechy, Hasła, Serie — ADR 0038
   pkt 3), a nie po 50 na grupę. Boks do 50 pozycji stoi w całości i nie ma przycisku.
2. **Przycisk „Rozwiń”** pod listą podaje, ile pozycji czeka („jeszcze 198”). Po kliknięciu
   boks pokazuje wszystko, a przycisk zmienia się w „Zwiń”. Każde wejście na stronę zaczyna
   od boksu zwiniętego.
3. **Nic nie znika z HTML-a.** Pozycje ponad limit są na stronie od razu, z klasą
   `ponad-limit`; chowa je arkusz stylów, gdy boks ma atrybut `data-zwiniety`. Skrypt tylko
   zdejmuje albo zakłada ten atrybut — niczego nie dociąga i niczego nie przelicza.
4. **Licznik grupy podaje pełną liczbę stron**, także gdy widać tylko część („Postacie 117”
   przy 50 widocznych). Grupa, z której nie widać żadnej pozycji, chowa się razem z nagłówkiem;
   tak samo podpis gry na liście scen i epizodów.

Realizacja: `boksPowiazan` i `listaFabuly` w `src/srw/render-entity.js`, przełącznik
w `src/srw/zwijanie.js` (delegacja kliknięcia na dokumencie, podpinana raz w `main.js`),
reguły w `src/srw/style.css`.

## Odrzucone

- **Limit na grupę** (np. po 10 w każdej) — właściciel podał jedną liczbę dla boksu; przy
  siedmiu grupach boks i tak miałby do 70 pozycji, a krótkie grupy niczego by nie zyskały.
- **Natywne `<details>`** — zwija całą treść pod nagłówkiem, a tu część listy ma być widoczna
  bez kliknięcia; granica wypada w środku grupy, której `<details>` nie przetnie.
- **Dociąganie reszty po kliknięciu** — witryna jest jednym plikiem HTML bez serwera; dane
  i tak są w przeglądarce, więc osobne renderowanie „drugiej strony” listy niczego nie oszczędza.
- **Próg tolerancji** (nie zwijać, gdy ponad limit są tylko 2–3 pozycje) — dwie strony mają
  dziś 52 pozycje i przycisk „jeszcze 2”. Zostaje dosłownie 50, tak jak ustalił właściciel.
  Zapytany o te dwie strony, właściciel potwierdził: bez progu, zostaje jak jest.

## Konsekwencje

- Osiem stron startuje ze zwiniętym boksem; na pozostałych 308 nic się nie zmienia.
- Wyszukiwanie w przeglądarce (Ctrl+F) nie znajduje schowanej pozycji, dopóki boks jest
  zwinięty. Wyszukiwarka bazy i strony list działają bez zmian.
- Zbiór odsyłaczy boksu jest ten sam co przed zmianą — `test/powtorzenia-list.test.js` czyta
  wszystkie pozycje bez względu na zwinięcie i dalej pilnuje, że żadna relacja nie ginie.
- `test/zwijanie-powiazan.test.js` sprawdza limit na danych bazy, przypadki graniczne (50, 51,
  grupa zaczynająca się na granicy, lista scen dwóch gier) na sztucznych grupach, regułę CSS
  i przełącznik na atrapie elementu. Kliknięcia w prawdziwej przeglądarce testy nie obejmują —
  sandbox nie ma przeglądarki.
