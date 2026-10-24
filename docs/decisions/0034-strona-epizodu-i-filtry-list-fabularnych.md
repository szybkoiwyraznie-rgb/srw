# 0034 — Strona epizodu prowadzi scenami, listy fabularne mają własne filtry

Data: 2026-10-24
Status: obowiązujący; uzupełnia ADR 0008 (sceny), 0020 (zakres gry) i 0030 (filtry w adresie).

## Kontekst

Trzy uwagi właściciela z 2026-10-24 dotyczyły tego samego: ekran marnował miejsce
i nie prowadził do treści.

- **Strona epizodu** zaczynała się zwijanym boksem „Treść epizodu” z całym surowym
  skryptem, a lista scen — główna droga do materiału — czekała na dole wąskiej kolumny
  bocznej, pod metryką i obsadą. Nagłówki misji w streszczeniu nie prowadziły nigdzie,
  a w epizodzie 1 brakowało nagłówka pierwszej misji.
- **Każdy boks treści** otwierał się osobnym wierszem z plakietką zakresu gry
  („SUPER ROBOT WARS OE”, „WSPÓLNE”), a dopiero pod nią stał tytuł sekcji. Na stronie
  z kilkunastoma boksami to kilkanaście wierszy zjedzonych przez jedną etykietę.
- **Listy Sceny i Epizody** nie miały żadnych filtrów, choć galerie postaci i mechów
  od dawna mają pasek selektorów zawężających się nawzajem (ADR 0030).

## Decyzja

1. **Sceny otwierają stronę epizodu.** Sekcja „Sceny" stoi nad układem dwukolumnowym,
   na pełną szerokość, w siatce kart (numer, tytuł, streszczenie). Wąski wariant sekcji
   zostaje w kodzie dla miejsc, gdzie lista jest dodatkiem obok treści.
2. **Zwijany boks z surowym skryptem znika**, a razem z nim kopia skryptu w artefakcie.
   Dosłowny tekst czyta się po scenach (ADR 0008 wymusza jego wierność), a archiwum
   rozgrywki zostaje w `episodes/`.
3. **Nagłówek misji w streszczeniu jest odsyłaczem do sceny.** Zapisujemy go wikilinkiem
   (`### [[slug-sceny|Misja N: Tytuł]]`), więc liczy się też jako powiązanie w grafie.
   Każda misja ma swój nagłówek — brak jednego z nich jest błędem wpisu, nie stylem.
4. **Plakietka zakresu gry wchodzi w wiersz tytułu sekcji**: tytuł po lewej, plakietka
   po prawej, wspólna linia pod spodem. Fragment bez nagłówka (akapit, tabela, ilustracja)
   zachowuje etykietę nad treścią — nie ma z czym jej zestawić.
5. **Listy epizodów i scen dostają własny pasek filtrów: Gra, Seria, Mech, Postać.**
   Filtry żyją w adresie (ADR 0030) i stosują się razem (iloczyn). Opcje każdego
   selektora liczą się z listy zawężonej pozostałymi filtrami, więc wybory nawzajem się
   ograniczają; bieżący wybór zostaje w swoim selektorze nawet wtedy, gdy wynik jest pusty —
   inaczej nie byłoby czego odznaczyć.
6. **Epizod i scena biorą serię z obsady.** Nie mają pola `seria`, więc filtr serii pyta,
   czy występuje w nich choć jedna postać albo maszyna z danej serii (plus „Nieokreślona"
   dla jednostek bez serii). Scena dziedziczy grę po swoim epizodzie.
7. **Każda lista przyjmuje tylko swoje filtry.** Galerie postaci i mechów zachowują
   Grę → Odcinek → Scenę, Serię i suwak kafelka; listy fabularne nie mają suwaka ani
   filtrów odcinka i sceny; lista serii pyta wyłącznie o **Grę**, bo wiąże je pole `gry`,
   a pozostałe pola nie mają dla serii sensu. Klucze spoza zestawu danej listy są
   odrzucane z adresu.

## Odrzucone alternatywy

- **Zostawić boks „Treść epizodu” i tylko przenieść sceny** — dwa wejścia do tej samej
  treści, z czego jedno (ściana surowego tekstu) nie mówi nic o zawartości.
- **Automatyczne wiązanie nagłówków misji ze scenami po tytule** — ukryta magia, która
  milczy, gdy tytuł przestanie pasować; wikilink zrywa się głośno, bo build nie przepuszcza
  martwego odsyłacza.
- **Plakietka jako element pływający (`float`)** — łamie się przy długich tytułach
  i nie daje wspólnej linii pod wierszem.
- **Jeden wspólny zestaw filtrów dla wszystkich list** — „Scena” nad listą scen i suwak
  kafelków nad epizodami to pola bez znaczenia; zestaw zależy od tego, co lista pokazuje.

## Konsekwencje

Strona epizodu zaczyna się od tego, po co się na nią wchodzi, a artefakt schudł o kopię
skryptu. Streszczenie prowadzi wprost do scen, więc epizod można czytać misja po misji.
Każda sekcja na każdej stronie oszczędza jeden wiersz. Listy Sceny i Epizody stały się
narzędziem przeglądu: „które sceny ma Raijin-Oh”, „w których epizodach gra Char”.
Nowy typ listy wymaga świadomego wyboru zestawu filtrów (punkt 7).
