# 0008 — Sceny jako osobny typ strony; epizod agreguje sceny

Data: 2026-10-17
Status: obowiązujący (rozszerza ADR 0003 o siódmy typ strony)

## Kontekst

Właściciel wskazał, że głównym nośnikiem treści są **sceny** (np. `0-1`, `2-1`, `2-2-1`),
a skrypt dostarcza agentowi w podziale na sceny. Dotychczasowy model miał tylko epizod:
streszczenie i lista scen w jednym wpisie, bez treści scen. Czytelnik nie widział tego, co
faktycznie padło w scenie, a analiza nie miała do czego się odnosić.

## Decyzja

1. **Siódmy typ strony: `scena`**, w katalogu `content/sceny/<slug>.md` (ADR 0003 pkt 1 rozszerzony).
2. **Frontmatter sceny:**
   - `typ: scena`, `slug`, `tytul` (wymagane, jak w ADR 0003),
   - `epizod` (wymagane) — slug wpisu epizodu, typ `epizod` (pole relacji, `POLA_RELACJI`),
   - `numer_sceny` (wymagane) — tekst w postaci `\d+(-\d+)*`, np. `1-1`, `2`, `2-2-1`.
     Kolejność w epizodzie wynika z numeru (porównanie segment po segmencie, liczbowo),
   - `streszczenie` (opcjonalne) — jedno–dwa zdania, pokazywane na liście scen w epizodzie,
   - `postacie`, `mechy`, `bronie` — opcjonalne, jak w innych typach,
   - `pochodzenie: skrypt` (domyślnie dla scen — treść jest wprost z rozegrania).
3. **Sekcje wymagane:** `## Treść sceny` i `## Analiza`.
   - `## Treść sceny` zawiera **dokładną** treść sceny w bloku `:::skrypt … :::`
     (narracja i dialogi, bez poprawek).
   - **Build sprawdza wierność:** znormalizowany tekst bloku musi być fragmentem znormalizowanego
     skryptu epizodu (`episodes/…`, wskazanego przez `skrypt` epizodu). Różnica = czerwony build.
     Nie wolno przeredagować ani skrócić sceny „po cichu\".
   - `## Analiza` — wątki anime, nawiązania, komentarz. Zasady ADR 0004 (`wiedza` wymaga źródeł) obowiązują.
4. **Strona epizodu agreguje sceny.** Sekcja „Sceny\" na stronie epizodu powstaje z wpisów `scena`
   (`epizod` == slug, posortowane po `numer_sceny`). Ręcznej listy scen w treści epizodu
   **nie prowadzimy** — inaczej rozjedzie się z wpisami scen.
5. **Epizod** nadal ma `## Streszczenie`, `## Wątki anime`, `## Komentarz`; wątki i odwołania
   na poziomie całego epizodu zostają w epizodzie. Analiza konkretnej sceny żyje w scenie.
6. **Parzystość skryptu** (ADR 0005 pkt 2) bez zmian: każdy plik w `episodes/` ma wpis epizodu.
   Sceny nie wymagają własnych plików skryptu — wierność sprawdza się względem skryptu epizodu.

## Konsekwencje

- Czytelnik widzi treść sceny obok analizy; analiza nie może odwoływać się do niewidocznego tekstu.
- Numeracja (`numer_sceny`) jest częścią tożsamości sceny w widoku, ale **nie** częścią sluga.
  Slug sceny buduje się z epizodu i numeru (`demo-ep001-s1-1`) i jest niezmienny (ADR 0003 pkt 2).
- Dodanie sceny nie zmienia epizodu w pliku — agregacja dzieje się w rendererze.
