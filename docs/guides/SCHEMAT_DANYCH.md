# Schemat danych

Jedna strona = jeden plik `content/<dział>/<slug>.md` = frontmatter + treść w markdownie.
Ten dokument jest źródłem prawdy o polach; walidator (`src/srw/registry.js`) egzekwuje to,
co opisane jako **wymagane** i **pilnowane**.

## Pola wspólne (każdy typ)

| Pole | Wymagane | Wartość | Uwagi |
|---|---|---|---|
| `typ` | tak | `gra` / `epizod` / `scena` / `postac` / `mech` / `pojecie` / `seria` (bronie nie są typem, ADR 0012) | musi zgadzać się z katalogiem |
| `slug` | tak | małe litery, cyfry, myślniki | **niezmienny** — patrz ADR 0003 |
| `tytul` | tak | string | tytuł widoczny w witrynie; może być polski lub oryginalny |
| `tytul_ja`, `tytul_en` | nie | string | zapisy oryginalne — ułatwiają późniejsze wyszukiwanie |
| `tagi` | nie | tablica slugów | swobodne, bez słownika (ADR 0006) |
| `pochodzenie` | nie | `skrypt` / `menu` (dostawa właściciela) / `zrodlo` (sprawdzone) / `wiedza` (model) | kolor nadaje blok `{{poziom}}` na fragmencie (ADR 0011), nie pole strony; poziomy: ADR 0010; reguły źródeł: ADR 0009 |
| `zrodla` | nie | tablica URL-i `http(s)` | **tylko adresy sprawdzone** (ADR 0009); wymagane przy `pochodzenie: zrodlo`, zakazane przy `wiedza`; sekcja `## Źródła` jest opcjonalna |
| `utworzono` | nie | `RRRR-MM-DD` | pole opisowe; stopka strony pokazuje czas z historii gita (utworzenie i ostatnia modyfikacja, z godziną) |
| `obraz` | nie | URL lub ścieżka | miniatura; oryginały trzymamy poza gitem |

## Pola relacji (frontmatter)

Każde z tych pól wskazuje na **istniejące** wpisy właściwego typu — pojedynczy slug albo
tablicę slugów (zgodnie z tabelą). Build przerywa pracę, jeśli odsyłacz jest martwy albo
prowadzi do złego typu.

| Pole | Typ celu | Gdzie używane |
|---|---|---|
| `gra` | `gra` | epizod |
| `seria` | `seria` | postać, mech |
| `postacie` | `postac` | epizod |
| `mechy` | `mech` | epizod, postać, scena |
| `serie` | `seria` | epizod |
| `epizod` | `epizod` | scena |
| `gry` | `gra` | postać, mech, hasło, seria |
| `piloci` | `postac` | mech |
| `pojecia` | `pojecie` | epizod, scena |

Relacje można też wyrażać wikilinkami w treści (`[[slug]]`, `[[slug|etykieta]]`). Oba kanały
liczą się do grafu i do sekcji „Powiązania" / „Wymienione w".

## Pola specyficzne

**gra**: `platforma`, `rok`, `status` (`planowana` / `w-toku` / `ukończona` / `porzucona`).

**epizod**: `gra` (wymagane), `numer` (wymagane, liczba ≥ 0; epizod 0 istnieje), `rozegrano` (data), `trasa`
(dla gier z rozgałęzieniami), `skrypt` (ścieżka do pliku w `episodes/`, np. `episodes/srw-oe/ep000.md`).
Pole `skrypt` jest wiążące w obie strony: plik musi istnieć, a każdy plik w `episodes/` musi
mieć swój wpis epizodu.

**postac** (tylko postać z dostawy gry, także ilustracyjnej bez opisu tekstowego — ADR 0017; postać z innej serii pojawiająca się jako nawiązanie to `pojecie`, ADR 0013): `seria` (opcjonalne — oryginalne postacie gry nie mają serii), `rola` (`pilot` / `wsparcie` / `dowodztwo` / `antagonista` /
`postac` / `inne`), `seiyuu`, `mechy`, `gry`.

**pojecie** (hasło wiki: organizacja, państwo, era, miejsce, wydarzenie, technologia,
postać z innej serii — ADR 0013): `kategoria` (swobodny tekst), `gry`. Hasło powstaje
wyłącznie z dostawy (ADR 0012, 0013).

**mech**: `seria` (opcjonalne), `typ_mecha`, `piloci`, `gry`, opcjonalnie `w_gre`.
Jednostka bojowa to także okręt z załogą i uzbrojeniem (ADR 0022), nie hasło.
Odrębny rekord jednostki w dostawie dostaje własny slug `<jednostka>-<wyróżnik>`, własne
`w_gre` i galerię; strona bazowa linkuje je w sekcji „Pozostałe jednostki” (ADR 0023).
Słowo „wariant” zarezerwowane jest dla tej samej maszyny w różnych grach (ADR 0020).
Profil sterujący zbiorczą obsadą (np. **Control AI** przy Brockenie) może być wpisem
`postac`. Bezimienny ogół żołnierzy nie dostaje osobnego wpisu — opisują go strony maszyn.
`piloci` wymienia nazwanych pilotów w kolejności znaczącej dla obsady misji
(np. `[char-aznable, slender, crown]`; ADR 0024).

**`w_gre`** to mapa „slug gry → parametry pary (mech, gra)” (ADR 0020, 0023, 0024).
Wartość zapisujemy jako JSON w jednej linii:

```yaml
w_gre:
  srw-oe: '{"dostawa": "menu", "profil": "Gundam", "dane": "**Seria:** Mobile Suit Gundam…"}'
```

- `dostawa` — skąd pochodzą parametry: `menu`, gdy właściciel przekazał je z menu gry
  (nie ma pliku archiwalnego w `dostawy/`), albo ścieżka `dostawy/…md` do zapisanej dostawy
  w repozytorium,
- `profil` — nazwa profilu jednostki w menu gry,
- `dane` — dosłowny blok parametrów (markdown) z poziomu 1.

Bronie nie są osobnym typem (ADR 0012). Uzbrojenie mecha opisujesz w jego treści.

**scena** (ADR 0008): `epizod` (wymagane, slug epizodu), `numer_sceny` (wymagane, dowolny niepusty tekst — `1-2`, `2-2-1`, `Prolog`; numeracja zależy od gry), `streszczenie` (opcjonalne, pokazywane na liście scen
w epizodzie), opcjonalnie `postacie`, `mechy`. `sekcje_analizy` to lista par
`podsekcja analizy → podsekcja treści`; jest zbędna tylko wtedy, gdy analiza nie ma podsekcji `###`.
Każda podsekcja analizy wymaga dokładnie jednej pary, która robi z jej tytułu odsyłacz do wskazanego
miejsca treści sceny (`docs/guides/PRZEPLYW_EPIZODU.md` §1a). Slug sceny: `<slug-epizodu>-<tytul-sceny>`, np.
`demo-ep001-rozpoznanie` (bez numeru — ADR 0008). Plik: `content/sceny/<slug>.md`.

**seria**: `rodzaj` (`tv` / `ova` / `film` / `manga` / `gra` / `powiesc` / `inne`), `rok`, `odcinki`.

Nowa rola postaci wymaga dopisania wartości do `src/srw/registry.js` —
to jedno miejsce, celowo wąskie.

## Zakres gry w treści (ADR 0020)

Baza obejmuje kolejne tytuły, a ta sama postać czy mech mogą w każdej grze wyglądać i zachowywać
się inaczej. Dlatego **każdy** fragment treści niesie zakres gry w otwarciu bloku:

```markdown
{{menu gra=srw-oe

## Parametry

| Miejsce | Nazwa | Moc bazowa |
|---:|---|---:|
| 0 | Caloric Missile | 2300 |
}}

{{zrodlo gra=wspolne

Cybuster był pierwszym oryginalnym mechem Banpresto…
}}
```

| Zapis | Znaczenie |
|---|---|
| brak `gra` | **niedozwolony** — build przerywa pracę (ADR 0021) |
| `gra=<slug>` | opis dotyczy tej gry; musi istnieć strona typu `gra` i musi być wymieniona w `gry` strony |
| `gra=wspolne` | informacje niezależne od wersji: rodowód, pierwowzór z anime, fakty wspólne dla serii |

Zasady:

- etykieta gry jest widoczna u góry fragmentu i prowadzi do strony tytułu; `wspolne` pokazuje
  etykietę bez odsyłacza,
- galeria ilustracji dziedziczy zakres bloku, a podgląd pełnoekranowy pokazuje nazwę gry —
  encja z kilku gier ma osobny blok ilustracji na każdy tytuł, w kolejności pola `gry`,
- **każdy** blok ma zakres, także na stronie jednego tytułu (ADR 0021); brak atrybutu zatrzymuje build,
- nie ma zakresu domyślnego: jeśli fakt nie zależy od wersji, piszemy `gra=wspolne`,
- zakres nie zastępuje poziomu wiarygodności: `{{skrypt|menu|zrodlo|wiedza}}` mówi, skąd wiadomo,
  a `gra=` — o której wersji świata,
- parametry pary (mech, gra) nadal trzyma `w_gre`, a nie treść.

## Sekcje treści

| Typ | Sekcje wymagane | Typowy zestaw |
|---|---|---|
| encje | `## Opis` | `## Rola w drużynie`, `## Warianty`, `## Ciekawostki`, `## Źródła` |
| scena | `## Treść sceny`, `## Analiza` | `## Źródła` |
| epizod | `## Streszczenie` | `## Wątki fabularne`, `## Komentarz`, `## Źródła` (sekcja „Sceny" powstaje sama z wpisów scen) |

Strony postaci i mechów mają ustaloną kolejność sekcji: `## Opis`, `## Ilustracje`,
`## Parametry`. Każda z nich stoi we własnym bloku poziomu, więc na stronie widać trzy osobne
boksy — galeria zawsze między opisem a parametrami. Strona bez ilustracji nie dostaje pustego
boksy `## Ilustracje`.

**Treść sceny** to dosłowny blok `:::skrypt … :::` z tekstem sceny. Build sprawdza, czy jest
fragmentem skryptu epizodu (różnice w odstępach nie liczą się). Przeredagowana scena nie przechodzi.

Poza tym lista sekcji jest **wolna** (ADR 0006). Sekcja `## Wątki fabularne` w epizodzie prowadzi
się jako tabelę czterech kolumn (ADR 0031):

```markdown
| Motyw w epizodzie | Źródło | Odcinek w źródle | Różnice |
|---|---|---|---|
| Bezzałogowy HAL-X10 poza kontrolą | [[mobile-police-patlabor\|Patlabor]] | odc. 5 „Runaway Labor X-10!” | ... |
| Wspólne ćwiczenia z Connect | [[srw-oe\|Super Robot Wars OE]] | n/d | ... |
```

Kolumny:

- **Motyw w epizodzie** — co z fabuły jest zapożyczone albo własne; **Źródło** — dzieło, z którego
  motyw pochodzi (anime, manga, gra), z wikilinkiem do serii albo do gry,
- **Odcinek w źródle** — konkretne miejsce w źródle w jednej z trzech postaci:
  `odc. N „Tytuł”` (odcinek serialu), `cała seria` (motyw z całego dzieła, bez wskazania odcinka)
  i `n/d` (brak odpowiednika w źródle — motyw autorski gry),
- **Różnice** — co gra zachowuje, a co zmienia; tu też trafiają uwagi o tytule odcinka.

Wiersze idą w **kolejności występowania w epizodzie**, czyli w kolejności scen. Osobnej kolumny
z typem wątku nie ma: rozstrzyga wartość kolumny „Odcinek w źródle” (`n/d` = motyw gry).
W komórkach tabeli pionek w wikilinku zapisujemy jako `\|`; pionek wewnątrz `[[slug|etykieta]]`
nie dzieli wiersza nawet bez escapowania, więc tabela nie rozjeżdża się względem nagłówka.

## Przykład minimalnego wpisu

```markdown
---
typ: postac
slug: sayla-mass
tytul: Sayla Mass
seria: mobile-suit-gundam-1979
rola: wsparcie
gry: [srw-oe]
pochodzenie: skrypt
tagi: [universal-century]
---

## Opis

Krótki, konkretny opis — kim jest i co robi w rozegranym materiale.
```

## Zasady pisania

- Treść widoczna w witrynie jest o świecie, fabule i mechanikach, nie o procedurach tworzenia
  bazy: bez „dostawy”, „skryptu”, „właściciela” i komentarzy o brakach redakcyjnych (ADR 0018).
  Dotyczy to także publicznego dziennika. Techniczne pola i bloki zachowują swoje nazwy.

- Piszemy po polsku, prozą. Nazwy własne zostawiamy w pisowni oryginalnej (z zapisem japońskim,
  jeśli jest znany).
- Nie piszemy o tym, czego nie było w materiale ani czego nie potwierdza źródło.
- Wpis może być niekompletny — **puste pole jest informacją**, nie błędem.
