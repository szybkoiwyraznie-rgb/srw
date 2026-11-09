# 0035. Układ boksów strony encji: opisy gier bez tytułów, potem źródła, ilustracje i parametry

Status: przyjęta. Domyka ADR 0011 (poziom na fragmencie), ADR 0020 i ADR 0021 (zakres gry na
fragmencie) oraz ADR 0027 (bezstratne sekcje).

## Kontekst

Strony encji (postacie, mechy, hasła, serie, gry) nosiły ślady sekcji z dostawy: tytuły „Opis”,
„Opis — SRW Y”, „Charakterystyka”, „W Super Robot Wars OE” oraz mieszaną kolejność bloków
z kolejnych gier i ze źródeł zewnętrznych. Właściciel 2026-11-09 wskazał, że tytuły boksów
opisowych są zbędne (plakietka gry wystarczy) i narzuca jedną kolejność dla wszystkich stron
encji, z grami traktowanymi równorzędnie (OE nie jest lepsze od Y).

## Decyzja

Każda strona encji układa boksy w stałej kolejności:

1. **Opisy z kolejnych gier** — boksy `{{skrypt}}`/`{{menu}}` bez tytułu, pod plakietką gry
   (`zakres-gry`), po jednym na grę, w kolejności pola `gry:`.
2. **Opis neutralny ze źródeł zewnętrznych** — bloki `{{zrodlo}}`/`{{wiedza}}` (np. „Postać
   w oryginale”, „Jednostka w oryginale”, „Pierwowzór”), również bez tytułów; w obrębie tego
   poziomu pierwszeństwo mają bloki o pierwowzorze, potem Głos, Nazwa, Dane postaci,
   Dane z misji, Dane o grze, Pozostałe.
3. **Ilustracje z kolejnych gier** — sekcja „Ilustracje”.
4. **Statystyki i parametry z kolejnych gier** — sekcja „Parametry”.

Dodatkowo:

- Tytuły opisowe („Opis”, „Opis — *”, „Charakterystyka”, „W Super Robot Wars OE”) są usuwane —
  treść mówi sama za siebie, zakres niesie plakietka.
- **Jedna gra = jeden boks opisowy** (doprecyzowanie 2026-11-09 po uwadze właściciela): boks
  opisowy gry zawiera tekst z dostawy zapisany 1:1 (ADR 0010). Agentowe parafrazy tego samego
  opisu (np. wersje z wikilinkami) są usuwane jako dubel, a nie pokazywane w osobnym boksie;
  dwa kanoniczne akapity tej samej gry trzyma się w jednym boksie.
- Walidacja: `maTrescOpisowa` w `src/srw/registry.js` wymaga treści opisowej poza boksami
  „Ilustracje”/„Parametry” zamiast listy obowiązkowych nagłówków (komunikat: „brak treści
  opisowej poza boksami Ilustracje/Parametry (ADR 0035)”).
- Odstępy między boksami są wąskie (`.fragment { margin: 6px 0 }`) — to treść ma przyciągać
  wzrok, nie szpary między boksami.
- Epizody i sceny korzystają z własnego układu (`sekcja-strony`) i nie podlegają tej kolejności.

## Konsekwencje

- Pliki `content/` przełożone w jednej kolejności; `test/uklad-stron.test.js` pilnuje ranków 1–4
  i braku tytułów opisowych.
- Opisy w testach wyciąga się z bloków beztytułowych (`{{skrypt}}`/`{{menu}}`), nie z nagłówków.
- ADR 0018 (treść o świecie, nie o procesie) bada tylko boksy opisowe gier, a nie bloki
  `{{zrodlo}}`/`{{wiedza}}`, które są opisem neutralnym.
