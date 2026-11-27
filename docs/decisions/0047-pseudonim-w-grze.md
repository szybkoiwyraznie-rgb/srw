# 0047 — Pseudonim zależny od gry (`pseudonim_w_grze`) i Zero bez własnej strony

Data: 2026-11-27
Status: obowiązujący; uzupełnia ADR 0013 (mówca to postać, wspominany to hasło), ADR 0037
(pseudonim jest polem strony o pełnym imieniu) i ADR 0046 (`seria_w_grze`).

## Kontekst

W *Super Robot Wars Y* (dostawa 1-1C) pod maską Zero mówi Suzaku Kururugi — baza miała
dla niego stronę `zero`. Dostawa 4-4 *Super Robot Wars OE* („Lelouch buntownik”) wprowadza
mówcę „Zero”, który jest Lelouchem vi Britannia: C.C. zwraca się do niego imieniem Leloucha,
a on prosi, by w masce tak go nie nazywała. Ta sama nazwa należy więc w dwóch grach do dwóch
różnych osób. Ogólne pole `pseudonim` tego nie wyrazi, a strona `zero` musiałaby opisywać
dwie osoby naraz.

Właściciel rozstrzygnął (2026-11-27): „strony mamy dwie Lelouch i Suzaku. Nie ma osobnej
strony Zero. Lelouch ma informacje, że występuje w określonych sytuacjach w określonych grach
jako Zero, i to samo Suzaku w miarę odkrywania fabuły. Popraw testy tak, żeby to akceptowały.”

## Decyzja

1. **Brak strony `zero`.** Strona `zero` zmienia slug na `suzaku-kururugi` (decyzja właściciela,
   wyjątek od niezmienności slugów); stary slug znika bez przekierowania, a odsyłacze zostają
   poprawione (ADR 0045 pkt 7). Hasło `lelouch-vi-britannia` przechodzi z `pojecia/` do
   `postacie/`, bo Lelouch mówi w skrypcie SRW OE (ADR 0013).
2. **Płaska mapa `pseudonim_w_grze` na stronach `postac`** (`gra: pseudonim`), jak `seria_w_grze`.
   Każdy klucz musi być grą z pola `gry` strony, wartość nie może być pusta ani równa tytułowi.
   Ogólny `pseudonim` zostaje i obowiązuje we wszystkich grach strony, o ile mapa nie mówi inaczej.
3. **Rozstrzyganie mówcy.** `pseudonimWGrze(strona, gra)` zwraca `pseudonim_w_grze[gra]`, a gdy
   go brak — `pseudonim`. Narzędzie `tools/uczestnicy-dostaw.mjs` i testy dopasowują mówcę
   najpierw po tytule, potem po pseudonimie w danej grze, więc „Zero” w SRW OE trafia do
   Leloucha, a w SRW Y do Suzaku. Ten sam pseudonim w jednej grze może należeć tylko do jednej
   strony.
4. **Widok.** Infoboks pokazuje pseudonim z dopiskiem gry („Zero (Super Robot Wars OE)”),
   podtytuł, karta listy i wyszukiwarka korzystają z `pseudonimyStrony(strona)`. Wyszukanie
   „Zero” znajduje obie osoby.
5. **Treść.** Blok gry na stronie mówi, kiedy postać występuje jako Zero — w miarę, jak fabuła
   to odkrywa. Bez zapowiadania tego, czego materiał jeszcze nie pokazał.

## Odrzucone alternatywy

- **Jedna strona `zero` dla obu osób** — łączy dwie postacie pod przezwiskiem, wbrew ADR 0037.
- **Strona `zero` jako hasło-przekierowanie** — właściciel wprost odrzucił osobną stronę Zero.

## Konsekwencje

- `lelouch-vi-britannia`: `gry: [srw-oe, srw-y]`, `pseudonim_w_grze: {srw-oe: Zero}`, mech `gawain`.
- `suzaku-kururugi`: `pseudonim_w_grze: {srw-y: Zero}`.
- Lelouch w SRW Y jest tylko wspominany, ale jako strona `postac` stoi w obsadzie epizodu i sceny
  1-1C (pole `pojecia` przyjmuje wyłącznie hasła).
- Test komend ducha szuka bloku z dostaw SRW OE po tytule albo po `pseudonim_w_grze['srw-oe']`.
