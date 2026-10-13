# Schemat danych

Jedna strona = jeden plik `content/<dział>/<slug>.md` = frontmatter + treść w markdownie.
Ten dokument jest źródłem prawdy o polach; walidator (`src/srw/registry.js`) egzekwuje to,
co opisane jako **wymagane** i **pilnowane**.

## Pola wspólne (każdy typ)

| Pole | Wymagane | Wartość | Uwagi |
|---|---|---|---|
| `typ` | tak | `gra` / `epizod` / `postac` / `mech` / `bron` / `seria` | musi zgadzać się z katalogiem |
| `slug` | tak | małe litery, cyfry, myślniki | **niezmienny** — patrz ADR 0003 |
| `tytul` | tak | string | tytuł widoczny w witrynie; może być polski lub oryginalny |
| `tytul_ja`, `tytul_en` | nie | string | zapisy oryginalne — ułatwiają późniejsze wyszukiwanie |
| `tagi` | nie | tablica slugów | swobodne, bez słownika (ADR 0006) |
| `pochodzenie` | nie | `skrypt` / `menu` / `wiedza` | patrz ADR 0004 |
| `zrodla` | nie | tablica URL-i `http(s)` | jeśli wypełnione, treść musi mieć sekcję `## Źródła` |
| `utworzono` | nie | `RRRR-MM-DD` | data pierwszego wpisu do bazy |
| `obraz` | nie | URL lub ścieżka | miniatura; oryginały trzymamy poza gitem |

## Pola relacji (frontmatter)

Każde z tych pól to tablica slugów **istniejących** wpisów właściwego typu — build przerywa
pracę, jeśli odsyłacz jest martwy albo prowadzi do złego typu.

| Pole | Typ celu | Gdzie używane |
|---|---|---|
| `gra` | `gra` | epizod |
| `seria` | `seria` | postać, mech |
| `postacie` | `postac` | epizod |
| `mechy` | `mech` | epizod, postać, bron |
| `bronie` | `bron` | epizod, mech |
| `serie` | `seria` | epizod |
| `gry` | `gra` | postać, mech |
| `piloci` | `postac` | mech |

Relacje można też wyrażać wikilinkami w treści (`[[slug]]`, `[[slug|etykieta]]`). Oba kanały
liczą się do grafu i do sekcji „Powiązania" / „Wymienione w".

## Pola specyficzne

**gra**: `platforma`, `rok`, `status` (`planowana` / `w-toku` / `ukończona` / `porzucona`).

**epizod**: `gra` (wymagane), `numer` (wymagane, liczba ≥ 1), `rozegrano` (data), `trasa`
(dla gier z rozgałęzieniami), `skrypt` (ścieżka do pliku w `episodes/`, np. `episodes/demo/ep001.md`).
Pole `skrypt` jest wiążące w obie strony: plik musi istnieć, a każdy plik w `episodes/` musi
mieć swój wpis epizodu.

**postac**: `seria` (wymagane), `rola` (`pilot` / `wsparcie` / `dowodztwo` / `antagonista` /
`postac` / `inne`), `seiyuu`, `mechy`, `gry`.

**mech**: `seria` (wymagane), `typ_mecha`, `piloci`, `bronie`, `gry`, opcjonalnie `w_gre`
(obiekt jednopoziomowy: `slug-gry: wartość`) na parametry specyficzne dla konkretnego tytułu.

**bron**: `klasa` (`bron-biala` / `strzelecka` / `beam` / `rakietowa` / `specjalna` / `obrona` /
`wsparcie`), `mechy`. Klasa opisuje **mechanizm działania**, nie świat pochodzenia — broń
promieniowa z Mazingera i z Gundama mają tę samą klasę.

**seria**: `rodzaj` (`tv` / `ova` / `film` / `manga` / `gra` / `powiesc` / `inne`), `rok`, `odcinki`.

Nowa klasa broni albo rola postaci wymaga dopisania wartości do `src/srw/registry.js` —
to jedno miejsce, celowo wąskie.

## Sekcje treści

| Typ | Sekcje wymagane | Typowy zestaw |
|---|---|---|
| encje | `## Opis` | `## Rola w drużynie`, `## Warianty`, `## Ciekawostki`, `## Źródła` |
| epizod | `## Streszczenie` | `## Sceny`, `## Wątki anime`, `## Komentarz`, `## Źródła` |

Poza tym lista sekcji jest **wolna** (ADR 0006). Sekcja `## Wątki anime` w epizodzie prowadzi
się jako tabelę:

```markdown
| Motyw w epizodzie | Źródło | Odcinek / wersja | Typ | Różnice |
|---|---|---|---|---|
| Nieufność wobec sojuszników | [[mobile-suit-gundam-1979\|Gundam]] | wczesne odcinki | adaptacja | ... |
```

Typy wątków: `adaptacja`, `nawiazanie`, `hold`, `dywergencja`, `fuzja`, `autorskie`.
W komórkach tabeli pionek w wikilinku zapisujemy jako `\|`.

## Przykład minimalnego wpisu

```markdown
---
typ: postac
slug: sayla-mass
tytul: Sayla Mass
seria: mobile-suit-gundam-1979
rola: wsparcie
gry: [demo]
pochodzenie: skrypt
tagi: [universal-century]
---

## Opis

Krótki, konkretny opis — kim jest i co robi w rozegranym materiale.
```

## Zasady pisania

- Piszemy po polsku, prozą. Nazwy własne zostawiamy w pisowni oryginalnej (z zapisem japońskim,
  jeśli jest znany).
- Nie piszemy o tym, czego nie było w materiale ani czego nie potwierdza źródło.
- Wpis może być niekompletny — **puste pole jest informacją**, nie błędem.
