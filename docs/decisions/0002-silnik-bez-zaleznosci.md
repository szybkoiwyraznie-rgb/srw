# 0002 — Silnik witryny bez zależności, routing po hashu

Data: 2026-10-13
Status: obowiązujący

## Kontekst

Witryna ma działać za dziesięć lat, także wtedy, gdy nikt nie będzie już pamiętał, jak działał
jej stos technologiczny. Ma też działać lokalnie — z pliku na dysku, bez serwera, na tablecie
używanym przy graniu.

## Decyzja

1. **`src/srw/` to czysty ESM bez żadnych zależności runtime.** Build skleja moduły w jeden
   zasięg (`tools/module-graph.mjs`), a wynik jest wstrzykiwany do jednego pliku HTML.
2. **Routing jest po hashu** (`#/epizod/demo-ep001`). To jedyny mechanizm adresowania, który
   zachowuje się tak samo pod `file://` i pod HTTPS.
3. **Wyszukiwanie działa po stronie przeglądarki** na tekście wstrzykniętym przez build —
   bez indeksu, bez zapytań sieciowych.
4. **Markdown to świadomy podzbiór**: nagłówki, akapity, listy, tabele, cytaty, obrazy, linki,
   wikilinki, blok `:::skrypt`. Nierozpoznana składnia frontmattera jest błędem, nie cichym
   pominięciem.
5. Zależności build-time (np. rasteryzacja obrazów) są dopuszczalne, ale wymagają ADR-a
   i nie mogą trafić do silnika.

## Konsekwencje

- Brak łańcucha narzędzi do zestarzenia się; brak podatności wprowadzanych przez zależności.
- Kosztem jest własny, mały parser markdownu — świadomie ograniczony i pokryty testami.
- Zasada „jeden zasięg" oznacza konieczność pilnowania kolizji nazw i braku cyklicznych
  importów; pilnuje tego build, nie człowiek.
