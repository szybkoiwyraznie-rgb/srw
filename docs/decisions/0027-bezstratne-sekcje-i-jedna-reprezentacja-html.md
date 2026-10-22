# 0027 — Bezstratne sekcje scen i jedna reprezentacja HTML

Data: 2026-10-22
Status: obowiązujący; uzupełnia ADR 0001, 0006 i 0008.

## Kontekst

Audyt kodu w PR #10 wykazał cztery powiązane problemy. Renderer scen znał na stałe cztery
tytuły sekcji i budował z nich `Map`, więc dodatkowa sekcja `##` znikała, a powtórzony tytuł
nadpisywał wcześniejsze wystąpienie. Mapa `sekcje_analizy` mogła pomijać podsekcje analizy,
a powtórzone tytuły `###` współdzieliły identyfikator i cel odsyłacza. Build przechowywał też
pełny HTML sceny lub epizodu obok HTML-u tych samych sekcji albo boksów.

Właściciel zatwierdził wdrożenie pełnego zakresu zmian silnika 2026-10-22.

## Decyzja

1. **Sekcje sceny pozostają uporządkowaną listą.** Renderer nie zamienia ich na mapę po tytule
   i nie odrzuca nazw spoza zamkniętej listy. Wszystkie wystąpienia są renderowane.
2. **Układ zachowuje cztery szczególne miejsca, ale nie ogranicza formy.** „Analiza” i „Treść
   sceny” stoją w kolumnie głównej, „Nawiązania do oryginalnych odcinków” i „Wątki w scenie”
   w bocznej. Każda pozostała sekcja trafia do kolumny głównej. Powtórki dostają kolejne,
   unikalne identyfikatory.
3. **Mapa analizy jest kompletna.** Każda podsekcja `###` z `## Analiza` wymaga dokładnie
   jednej pary w `sekcje_analizy`. Brak, nadmiar, nieistniejący tytuł albo zbyt wiele użyć
   celu zatrzymują build. Scena bez podsekcji `###` nie potrzebuje mapy.
4. **Powtórzone tytuły są rozstrzygane przez kolejność wystąpień.** Kolejny taki sam tytuł
   po lewej i prawej stronie mapy zużywa kolejne wystąpienie. Każde dostaje osobną kotwicę
   i osobny cel; tekst tytułu nie jest samodzielnym kluczem danych.
5. **Artefakt przechowuje jedną wyrenderowaną reprezentację treści strony.** Zwykłe encje
   zachowują pole `html`; scena z poprawnym podziałem przechowuje `sekcje`, a epizod — `boksy`.
   Pełne `html` nie jest do nich dopisywane drugi raz. Tekst wyszukiwarki, relacje i surowy
   skrypt epizodu pozostają osobnymi danymi, bo pełnią inne funkcje.
6. **Renderery zachowują zgodność wsteczną.** Jeśli starsze dane nie mają niepustych `sekcje`
   albo `boksy`, renderer nadal pokazuje pełne `html`. Build korzysta ze struktury zawsze,
   gdy udało się ją utworzyć.

## Odrzucone alternatywy

- **Rozszerzanie stałej listy tytułów przy każdej nowej sekcji** — przeczy ADR 0006 i nadal
  pozwala przypadkiem ukryć treść.
- **Mapa `tytuł → HTML`** — z definicji traci powtórzone tytuły.
- **Opcjonalne mapowanie analizy** — tworzy podsekcje wyglądające jak odsyłacze, które nie
  prowadzą do treści, i rozmija się z przewodnikiem przepływu epizodu.
- **Pozostawienie pełnego HTML jako zapasu w każdym rekordzie** — zgodność wsteczną zapewnia
  renderer, nie duplikowanie bieżących danych w każdym artefakcie.

## Konsekwencje

Testy pilnują dodatkowych i powtórzonych sekcji, kompletności mapy, unikalności kotwic,
pojedynczej reprezentacji HTML oraz fallbacku dla starszych danych. Kontrole poziomów
wiarygodności zbierają HTML z pola właściwego dla typu strony, zamiast zakładać obecność
`strona.html` w każdym rekordzie.
