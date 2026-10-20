# 0020 — Zakres gry na fragmencie treści i ilustracji

Data: 2026-10-20
Status: obowiązujący; uzupełnia ADR 0003, 0009–0011 i 0017. **Punkty 1, 3 i 5 zaostrzone przez
ADR 0021: zakres jest obowiązkowy na każdym bloku, a boks bez etykiety nie powstaje.**

## Kontekst

Baza obejmuje nie jedną grę, lecz kolejne tytuły z serii. Ta sama postać, mech albo
wydarzenie może występować w kilku grach, a w każdej z nich wyglądać i przebiegać inaczej:
inny projekt maszyny, inny skład załogi, inna wersja wydarzeń z anime. Samo oznaczenie
wiarygodności (`skrypt` / `menu` / `zrodlo` / `wiedza`) mówi, **skąd** wiadomo, że coś jest
prawdą — ale nie mówi, **o której wersji** świata ta prawda obowiązuje.

Pole `gry` opisuje przynależność encji do tytułów, a `w_gre` trzyma parametry pary
(mech, gra). Brakowało trzeciego elementu: widocznego oznaczenia na samym fragmencie tekstu
i przy galerii ilustracji, żeby czytelnik wiedział, do którego tytułu odnosi się dany opis.

## Decyzja

1. **Blok treści może nieść zakres gry.** Otwarcie bloku przyjmuje atrybuty:
   `{{menu gra=srw-oe`, `{{zrodlo gra=srw-alpha`. Atrybut jest opcjonalny; dozwolona jest
   na razie tylko nazwa `gra` — nieznany atrybut zatrzymuje build.
2. **Dwie wartości znaczeniowe.** `gra=<slug>` wskazuje konkretny tytuł (musi istnieć jako
   strona typu `gra`). `gra=wspolne` oznacza informacje niezależne od wersji: rodowód
   postaci, pierwowzór z anime, fakty wspólne dla całej serii.
3. **Zakres jest widoczny.** Fragment z zakresem pokazuje u góry małą etykietę z nazwą gry
   i odsyłaczem do jej strony; `wspolne` pokazuje etykietę „Wspólne”. Blok bez zakresu nie
   dostaje żadnej etykiety — znaczy to „nie twierdzę, że to informacja o konkretnej wersji”.
4. **Ilustracje dziedziczą zakres bloku.** Galeria umieszczona w bloku `{{menu gra=...}}`
   jest galerią tej gry; podgląd pełnoekranowy pokazuje przy obrazie nazwę tytułu.
   Encja występująca w kilku grach ma osobny blok ilustracji na każdy tytuł, w kolejności
   gier z pola `gry`. Nie tworzymy wspólnej galerii mieszającej projekty z różnych gier.
5. **Strona wielotytułowa nie może być niejednoznaczna.** Jeśli pole `gry` zawiera więcej niż
   jeden wpis, **każdy** blok treści musi mieć zakres: konkretną grę albo `wspolne`.
   Naruszenie zatrzymuje build. Na stronie jednej gry zakres jest zalecany tam, gdzie opis
   dotyczy wersji z gry (parametry, galeria, dane produkcyjne), a zbędny przy faktach
   ogólnych.
6. **Zakres musi należeć do strony.** `gra=<slug>` spoza pola `gry` danej strony jest błędem —
   chroni to przed przypadkowym przypisaniem opisu do tytułu, w którym encja nie występuje.
7. **Zakres nie zastępuje poziomu wiarygodności.** Obie osie są niezależne: blok nadal musi
   być oznaczony jako `skrypt` / `menu` / `zrodlo` / `wiedza`, a `gra=` dopowiada, o której
   wersji świata mówi. Kolory poziomów pozostają bez zmian (ADR 0010–0011).
8. **Infoboks pokazuje przynależność.** Strona encji wymienia gry z pola `gry` w pierwszym
   wierszu infoboksu („Gra” przy jednej, „Gry” przy kilku), z odsyłaczami do tytułów.
9. **Statystyki pozostają w `w_gre`.** Klucz obiektu to slug gry; nie przenosimy parametrów
   do treści ani nie mieszamy ich między tytułami.

## Składnia

```
{{menu gra=srw-oe

## Ilustracje

![Exart — ilustracja 1 z 3](https://…/Exart.jpg)
}}

{{zrodlo gra=wspolne

Cybuster był pierwszym oryginalnym mechem Banpresto…
}}
```

Strona obejmująca dwie gry — galerie osobno, każda z własnym tytułem:

```
## Ilustracje

{{menu gra=srw-oe

![Mazinger Z — wersja z OE](…)
}}

{{menu gra=srw-alpha

![Mazinger Z — wersja z Alpha](…)
}}
```

## Odrzucone alternatywy

- **Zakres w polu strony zamiast na fragmencie** — nie da się opisać encji, która w każdej
  grze wygląda inaczej; strona musiałaby udawać jedną wersję.
- **Osobna strona na każdą grę** (`mazinger-z-srw-oe`, `mazinger-z-srw-alpha`) — rozbija graf,
  dubluje encje i łamie niezmienność slugów (ADR 0003).
- **Kolor tła zamiast etykiety** — kolory już znaczą poziom wiarygodności (ADR 0010);
  przeładowanie ich drugim znaczeniem myli.
- **Zakres domyślny „ostatnio grana gra”** — zgadywanie; po zmianie tytułu stare wpisy
  po cichu zmieniałyby znaczenie.

## Konsekwencje i kontrola

Testy sprawdzają składnię atrybutu, widoczną etykietę i odsyłacz, obsługę `wspolne`, wymóg
zakresu na stronie wielotytułowej, odrzucanie gier spoza pola `gry` oraz obecność tytułu
w podglądzie ilustracji. Dziś baza opisuje jeden tytuł, więc wymóg z punktu 5 jeszcze nie
występuje w treści — obowiązuje od pierwszego wpisu obejmującego drugą grę.
