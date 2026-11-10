# 0038 — „Powiązania” to wszystkie relacje strony w jednym boksie

Data: 2026-11-10
Status: obowiązujący; zastępuje pkt 2 ADR 0036 i uchyla zapisaną tam odrzuconą alternatywę
„scalenie »Powiązań« i »Wymienione w«”. Pozostałe punkty ADR 0036 obowiązują.

## Kontekst

Kolumna boczna strony encji (gra, postać, mech, hasło, seria) miała dwa boksy z odsyłaczami:

| Boks | Skąd się brał |
|---|---|
| „Powiązania” | strony, do których ta odsyła (pola i wikilinki) |
| „Wymienione w” | strony, które odsyłają tutaj |

Podział szedł po **kierunku odsyłacza**, a kierunek jest śladem redakcji, nie faktem o świecie
gry: to, czy Seishiro stoi w obsadzie sceny, czy scena jest wspomniana w opisie Seishiro, zależy
od tego, na której stronie ktoś napisał zdanie. Gdy dwie strony odsyłały do siebie nawzajem —
a tak jest zwykle — ta sama pozycja stała w obu boksach. Po ADR 0036 było to 1357 pozycji
na 263 stronach z 316 (strona *Connect Force*: 34 wspólne na 40 i 83; Seishiro: 28 na 37 i 62).
Do tego 296 pozycji „Wymienione w” na 189 stronach powtarzało metrykę (seria postaci, gra, pilot
mecha), bo ADR 0036 pkt 2 tej jednej powtórki nie usuwał.

Właściciel: połączyć oba boksy w jeden — „Powiązania”, czyli wszystkie relacje między encjami.

## Decyzja

1. **Jeden boks: „Powiązania”.** Relacją jest odsyłacz w którąkolwiek stronę — pole albo wikilink
   stąd albo skądś tutaj. Boks wymienia każdą powiązaną stronę **raz**; dwie strony odsyłające
   do siebie nawzajem to jedna relacja.
2. **„Jedna pozycja — jedno miejsce” obejmuje cały boks.** Strona pokazana w metryce albo
   na własnej liście („Rozegrane epizody”, „Z tej serii…”) nie wraca w „Powiązaniach”, bez względu
   na kierunek odsyłacza. Powiązana strona stoi więc dokładnie w jednym z trzech miejsc:
   metryka, własna lista, „Powiązania”.
3. **Układ boksu.** Grupy w stałej kolejności typów: Sceny, Epizody, Gry, Postacie, Mechy,
   Hasła, Serie; przy nazwie grupy liczba stron. Sceny i epizody stoją po jednej w wierszu,
   z numerem, w kolejności rozgrywki (gra, epizod, numer sceny); gdy lista obejmuje więcej niż
   jedną grę, każda gra ma podpis — „01 Epizod 1” istnieje w każdej z nich. Pozostałe grupy
   są alfabetyczne.
4. Strony epizodu i sceny mają własny układ i nie podlegają tej decyzji (ADR 0036 pkt 5).

Realizacja: `powiazaniaStrony` i `boksPowiazan` w `src/srw/render-entity.js`. `sekcjaPowiazan`
zostaje dla list „Z tej serii…” i „W tym epizodzie”.

## Odrzucone

- **Dwa boksy bez powtórzeń** (pozycja w „Wymienione w” tylko wtedy, gdy nie ma jej
  w „Powiązaniach”) — czytelnik nie ma jak zgadnąć, dlaczego scena stoi w jednym boksie,
  a sąsiednia w drugim; o podziale dalej decydowałby kierunek odsyłacza.
- **Jeden boks ze znacznikiem kierunku przy pozycji** — strzałka mówi, na której stronie stoi
  zdanie z odsyłaczem; to informacja dla redaktora, nie dla czytelnika.
- **Powtarzanie metryki w boksie, gdy strona z metryki odsyła tutaj** (dawny ADR 0036 pkt 2) —
  seria postaci stała w metryce i jeszcze raz niżej.

## Konsekwencje

- Dwa boksy miały razem 6194 pozycje (2378 i 3816), jeden ma 4541: znika 1357 pozycji
  powtórzonych między boksami i 296 powtórzeń metryki. Na każdej z 316 stron encji zbiór stron
  osiągalnych z kolumny bocznej jest taki sam jak przed zmianą, a kolumna główna jest bajt w bajt
  ta sama — nic nie zginęło, zmieniła się tylko liczba list.
- Boks ma 311 stron z 316. Najdłuższy jest na stronie gry (*Super Robot Wars OE*: 248 pozycji —
  wszystko, co w tej grze występuje; tyle samo stało wcześniej w „Wymienione w”).
- Wikilink albo pole na jednej stronie wystarcza, by obie strony pokazały się nawzajem
  w „Powiązaniach”. Strona, do której nic nie odsyła i która nigdzie nie odsyła, nie ma boksu.
- `test/powtorzenia-list.test.js` wyprowadza oczekiwania z danych: jeden boks, brak powtórzeń,
  komplet relacji, licznik zgodny z listą, porządek grup i podpisy gier.
