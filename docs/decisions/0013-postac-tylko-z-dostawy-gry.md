# 0013. Postać to tylko postać z dostawy gry; postać z innej serii to hasło wiki

Status: przyjęta. Doprecyzowuje ADR 0003 (typy stron) i ADR 0012 (encje z dostawy).

## Kontekst

Dr. Hell z *Mazinger Z* pojawia się w prologu SRW OE jako nawiązanie. Został wpisany do sekcji
„Postacie”, choć w tej bazie nie jest postacią z gry, tylko wpisem wiki o postaci spoza tytułu.

## Decyzja

1. **Postac** (sekcja „Postacie” w menu) to wyłącznie postać należąca do gry, czyli z dostawy
   właściciela (np. Seishiro, Himari).
2. **Postać z innej serii** pojawiająca się jako nawiązanie w skrypcie to **hasło wiki**
   (`typ: pojecie`, katalog `content/pojecia/`). Pole `kategoria` opisuje ją jako „postać z innej serii”.
3. Hasło powstaje tylko z dostawy (ADR 0012, pkt 1), a jego dane podlegają tym samym regułom
   poziomów i źródeł co pozostałe hasła.

## Konsekwencje

- `content/postacie/dr-hell.md` przeniesiony do `content/pojecia/dr-hell.md`; typ `pojecie`, pole `rola` usunięte.
- Epizod 0 i scena 0-1: Dr. Hell jest w `pojecia`, nie w `postacie`.
- `docs/guides/SCHEMAT_DANYCH.md` opisuje to przy typie `postac`.
