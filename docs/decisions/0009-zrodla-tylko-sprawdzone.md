# 0009 — Źródło wpisujemy tylko po sprawdzeniu; wiedza niesprawdzona nie ma linków

Data: 2026-10-17
Status: obowiązujący (zaostrza ADR 0004 pkt 2 i pkt 4)

## Kontekst

ADR 0004 wymagał, by wpis `pochodzenie: wiedza` miał pole `zrodla` i sekcję `## Źródła`. W praktyce
agent wpisywał adresy z pamięci, a ich treści nie sprawdzał (sandbox nie ma dostępu do Wikipedii przez
curl, a `fetch_page` nie był użyty). Efekt: strona pokazywała „wiedza modelu” obok linków, które
wyglądały jak źródła, a nikt ich nie czytał. Właściciel zgłosił to jako wprowadzające w błąd —
źródło ma sens tylko wtedy, gdy jest sprawdzone.

## Decyzja

1. **`zrodla` i sekcja `## Źródła` to wyłącznie adresy sprawdzone.** Przed wpisaniem adresu agent
   otwiera stronę (`fetch_page` lub `web_search`) i potwierdza treść, której dotyczy wpis. W sekcji
   `## Źródła` podaje, co dokładnie potwierdza i kiedy sprawdzono.
2. **Poziomy pochodzenia** (`POCHODZENIA`):
   - `skrypt` — wprost z rozegrania (bez zmian),
   - `menu` — z ekranów gry (bez zmian),
   - `zrodlo` — **nowe**: treść potwierdzona w podanych, sprawdzonych źródłach. Wymaga `zrodla`
     i `## Źródła`. Etykieta w witrynie: „ze źródła · sprawdzone”,
   - `wiedza` — **zmienione**: kontekst z pamięci modelu, **niesprawdzony**. Nie wolno mu mieć
     `zrodla` (build przerywa). Etykieta: „wiedza modelu · niesprawdzone”.
3. **Brak źródła nie jest błędem.** „Nie sprawdziłem” jest pełnoprawnym stanem (zgodnie z ADR 0004 pkt 2
   zdanie „Nie wiem” jest odpowiedzią). Wpis `wiedza` bez linków jest w porządku — pokazuje, czego
   jeszcze nie potwierdzono.
4. **Kolejka weryfikacji** żyje w opisie PR sesji (lista niesprawdzonych adresów), nie w treści bazy.
   Wpis przechodzi na `zrodlo` dopiero, gdy jego treść zostanie sprawdzona w źródle.

## Konsekwencje

- Nowe wpisy startują jako `wiedza` bez linków; podniesienie do `zrodlo` jest świadomą czynnością.
- Z bazy zniknęły niesprawdzone adresy (13 wpisów + gra demo + epizod demo). Ich lista jest w opisie PR.
- `getter-1` jest pierwszym wpisem na `zrodlo` — treść sprawdzona narzędziem `fetch_page`
  (Wikipedia, *Getter Robo* i *List of Getter Robo characters*).
