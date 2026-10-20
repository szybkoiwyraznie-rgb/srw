# content/ — wpisy bazy

Treść bazy. Dział = katalog = typ strony (ADR 0003). Każdy plik to jedna strona:
frontmatter z metryką + treść w markdownie.

| Katalog | Typ | Co opisuje |
|---|---|---|
| `content/gry/` | `gra` | tytuły gier z serii, w które właściciel gra |
| `content/epizody/` | `epizod` | rozegrane epizody: streszczenie, sceny, wątki anime, komentarz |
| `content/sceny/` | `scena` | pojedyncze sceny epizodu: dosłowna treść i analiza |
| `content/postacie/` | `postac` | postacie występujące w rozegranych epizodach |
| `content/mechy/` | `mech` | jednostki biorące udział w rozegranych epizodach |
| `content/pojecia/` | `pojecie` | hasła wiki: organizacje, państwa, ery, miejsca, wydarzenia |
| `content/serie/` | `seria` | serie anime/manga, z których pochodzi cała reszta |

Pliki `README.md` w tych katalogach są dokumentacją — loader je pomija.

## Zasady

1. **Treść piszemy w markdownie, nigdy w HTML-u i nigdy w `dist/`.** Artefakt jest produktem buildu.
2. **Odsyłacze to wikilinki**: `[[slug]]` albo `[[slug|etykieta]]`. Slug, nie tytuł.
3. **Pole `Opis` jest obowiązkowe** w każdej encji, a `Streszczenie` w epizodzie. Reszta sekcji
   jest wolna — każda postać może mieć inny zestaw, jeśli tak wypada z materiału.
4. **Pochodzenie** (`pochodzenie: skrypt | menu | zrodlo | wiedza`) mówi, skąd wzięła się informacja.
   `zrodlo` wymaga pola `zrodla` z linkami, a `wiedza` nie może ich mieć. Sekcja `## Źródła`
   jest opcjonalna — build pilnuje pola, nie sekcji.
5. **Slug jest niezmienny.** Raz nadany identyfikator zostaje na zawsze, nawet jeśli zmieni się
   pisownia tytułu. Zmiana sluga zrywa wszystkie odsyłacze w bazie.
6. **Ścieżka pliku = `<dział>/<slug>.md`.** Rozjazd nazwy pliku i sluga nie zepsuje buildu,
   ale utrudni szukanie.

Pełny schemat pól: `docs/guides/SCHEMAT_DANYCH.md`.
