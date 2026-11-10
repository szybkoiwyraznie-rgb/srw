# 0036 — Jedna pozycja, jedno miejsce: kolumna boczna nie powtarza metryki ani własnych list strony

Data: 2026-11-10
Status: obowiązujący; uzupełnia ADR 0034 (układ dwukolumnowy) i ADR 0035 (układ boksów strony encji).

## Kontekst

Strona encji (gra, postać, mech, hasło, seria) pokazuje odsyłacze w czterech miejscach, a każde
powstaje z czego innego:

| Miejsce | Skąd się bierze |
|---|---|
| Metryka (Gra, Seria, Piloci) | pola frontmattera tej strony |
| Lista w treści („Rozegrane epizody”, „Z tej serii: postacie / mechy”) | pola **innych** stron: `gra` epizodu, `seria` postaci i mecha |
| „Powiązania” | odsyłacze wychodzące tej strony: wikilinki z treści i pola-relacje |
| „Wymienione w” | strony, które odsyłają tutaj |

Właściciel 2026-11-10 zauważył na stronie serii *Matchless Raijin-Oh*, że „Z tej serii: postacie”
(15 pozycji) różni się od „Powiązania: Postacie” (11 pozycji), i zapytał, po co ta sama lista stoi
dwa razy. Listy różniły się, bo pierwszą układa silnik z pola `seria`, a druga zbierała wikilinki
ze zdania pisanego ręcznie, do którego nie dopisano uczniów dodanych w późniejszej sesji. Ci sami
uczniowie stali też trzeci raz w „Wymienione w”, bo pole `seria` jest odsyłaczem do strony serii.

Pomiar całej bazy przed zmianą (316 stron encji):

- 168 pozycji własnych list wracało w „Powiązaniach” (18 serii i jedna gra),
- wszystkie 195 pozycji własnych list wracało w „Wymienione w” (każda seria z obsadą, obie gry),
- 624 pozycje „Powiązań” na 314 stronach powtarzały metrykę stojącą kilka wierszy wyżej
  (gra, seria, piloci).

## Decyzja

1. **Jedna pozycja — jedno miejsce.** Strona, do której odsyła metryka albo własna lista strony,
   nie pojawia się w „Powiązaniach”.
2. **„Wymienione w” pomija pozycje własnej listy.** Postać z polem `seria` odsyła do serii tym samym
   polem, z którego powstaje „Z tej serii” — to jeden fakt, nie dwa. Tak samo epizod i pole `gra`.
   „Wymienione w” nie pomija natomiast metryki: to, że strona serii opisuje postać, jest inną
   informacją niż to, że postać do tej serii należy.
3. **Lista z pól jest jedynym kompletnym wykazem.** „Z tej serii” i „Rozegrane epizody” powstają
   z pól i same się uzupełniają. Zdanie w treści serii może wymieniać, kto ją reprezentuje
   (`PRZEPLYW_EPIZODU.md` §4), ale nie zastępuje listy i nie buduje drugiej.
4. Odsyłacz do postaci albo mecha **spoza** serii (np. Eldran, pilot z innej serii) zostaje
   w „Powiązaniach” — nie ma go na żadnej innej liście strony.
5. Strony epizodu i sceny mają własny układ („W tym epizodzie” budowane wyłącznie z pól) i nie
   podlegają tej decyzji.

Realizacja: `renderEncja` w `src/srw/render-entity.js` — `wlasneListy` (jedno źródło dla sekcji
w treści i dla pomijania) oraz `slugiMetryki` (pola pokazywane w metryce jako odsyłacze).

## Odrzucone

- **Uzupełnianie samych zdań w treści** — „Powiązania” zgadzałyby się z listą do następnej
  dostawy; powtórzenie zostaje, a rozjazd wraca przy pierwszej nowej postaci.
- **Ukrycie całej grupy typu w „Powiązaniach” serii** (istniejący parametr `pomijaj`) — gubi
  odsyłacze do postaci spoza serii.
- **Scalenie „Powiązań” i „Wymienione w” w jedną listę** — zmienia znaczenie obu sekcji
  (kierunek odsyłacza), na które powołują się `AGENTS.md` i `PRZEPLYW_EPIZODU.md`; wymaga
  osobnej decyzji właściciela.

## Konsekwencje

- „Powiązania” mają 2365 pozycji zamiast 3157, „Wymienione w” 3794 zamiast 3989; żaden odsyłacz
  nie znika ze strony — każdy stoi dokładnie w jednym z miejsc.
- Grupa typu znika z „Powiązań”, gdy wszystkie jej pozycje stoją już w metryce albo na liście
  (np. „Gry” i „Serie” na stronie postaci).
- Nowe pole-odsyłacz w metryce trzeba dopisać do `slugiMetryki`; `test/powtorzenia-list.test.js`
  czyta metrykę z wyrenderowanej strony i nie przepuści powtórzenia.
- Strona pozostaje wzajemnie powiązana: pozycja może stać w „Powiązaniach” i w „Wymienione w”
  jednocześnie, gdy dwie strony odsyłają do siebie nawzajem (1355 pozycji na 263 stronach).
  To dwa różne fakty, a nie powtórzenie tej samej listy.
