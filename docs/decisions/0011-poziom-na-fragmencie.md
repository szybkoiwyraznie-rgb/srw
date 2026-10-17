# 0011 — Poziom wiarygodności zaznaczany na fragmencie, nie na stronie

Data: 2026-10-17
Status: obowiązujący (uszczegóławia ADR 0010, pkt 2: kolor tła treści)

## Kontekst

Strona encji to mieszanka: fragmenty dostawy właściciela, uzupełnienia ze źródeł, wiedza
i analiza modelu, a do tego ilustracje. Kolor całej strony według jednego `pochodzenie`
kłamie o pozostałej treści. Właściciel zgłosił to wprost (przykład: Getter-1).

## Decyzja

1. **Kolor należy do fragmentu.** Fragment treści (akapit, lista, tabela, cytat, obraz,
   blok skryptu) zaznacza się blokiem:
   ```
   {{zrodlo
   Treść fragmentu.
   }}
   ```
   Dozwolone nazwy: `skrypt`, `menu`, `zrodlo`, `wiedza` (ten sam słownik co `pochodzenie`).
   Blok renderuje się jako `div.fragment.poziom.poziom-<nazwa>`, z kolorem z ADR 0010.
2. **Brak niejawnego dziedziczenia.** Fragment bez bloku poziomu jest błędem builda
   (stronom encji i scen). Nagłówki są neutralne, bo są tytułami sekcji.
3. **Bloki nie zagnieżdżają się.** Nieznana nazwa, zagnieżdżenie i niezamknięty blok są błędami.
4. **Strona nie ma koloru.** Kontener strony (`tresc-encja`), listy i wyniki wyszukiwania
   są neutralne. Pole `pochodzenie` w nagłówku zostaje: waliduje je rejestr (ADR 0009) i opisuje
   główne źródło strony w infoboksie i katalogach danych, ale nie koloruje treści.
5. **Istniejące strony** zostały owinięte jednym blokiem o poziomie z ich `pochodzenie`.
   Tekst nie został zmieniony. Przy dostawie kolejne fragmenty dostaną własne bloki, bez
   przepisywania starych.

## Konsekwencje

- Jedna strona może łączyć wszystkie trzy poziomy, a czytelnik widzi, skąd jest każdy fragment.
- Autor (agent) musi świadomie oznaczyć każdy fragment; build wymusza to przez błąd.
- Rozbieżności nadal idą do osobnej sekcji „Inne źródła i rozbieżności” (ADR 0010, pkt 3).
