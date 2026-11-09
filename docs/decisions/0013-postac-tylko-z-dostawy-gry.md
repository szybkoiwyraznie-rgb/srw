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

## Adnotacja (2026-11-09)

Właściciel doprecyzował granicę: **osoba prowadząca dialog (mówca) w dostawie to postać** —
nawet gdy pochodzi z innej serii. Same wzmianki i nazwiska padające w tekście pozostają
hasłami wiki.

- Mówcy prologu SRW Y — Tetsuya, Hyoma, Chizuru, Heero, Duo, Quatre, Trowa i Nunnally —
  prowadzą dialog w `episodes/srw-y/ep001.md`, więc mają strony w `content/postacie/`
  (precedens: Koji Kabuto, Amuro Ray, Bright Noa — mówcy z własnymi profilami).
- Kryterium udziału w grze: postać i mech muszą wystąpić w dostawie jako mówca dialogu,
  na ilustracji z dostawy albo w obsadzie misji — pilnuje `test/udzial-w-grze.test.js`.
- Osoby tylko wspominane (dr-hell, lelouch-vi-britannia, kamille-bidan, haman-karn,
  gilbert-dullindal, milliardo-peacecraft, treize-khushrenada, tetsuro-yagami,
  general-takeda, komendant-igor) to hasła w `content/pojecia/`; osoby obecne w materiale
  wyłącznie jako wspomniane dostają rodzaj treści tagiem `postac-wspominana` (ADR 0033).
