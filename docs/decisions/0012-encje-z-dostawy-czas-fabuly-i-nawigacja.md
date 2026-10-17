# 0012. Encje tylko z dostawy, brak wiedzy o przyszłości fabuły, sceny w nawigacji, bronie w mechach

Status: przyjęta. Doprecyzowuje ADR 0003 (typy stron) i ADR 0008 (sceny).

## Kontekst

Właściciel zgłosił cztery zasady podczas pierwszej dostawy SRW OE (epizod 0):

1. nowe encje powstają wyłącznie z dostawy (skryptu), a nie z innych encji;
2. nie wpisujemy wiedzy o przyszłości względem aktualnego stanu fabuły;
3. sceny są główną jednostką fabularną i mają to odzwierciedlać nawigacja;
4. bronie nie są osobną kategorią, tylko elementem opisu mechów.

## Decyzja

1. **Encje wprost z dostawy.** Nowa postać, mech, seria albo gra pojawia się w bazie tylko wtedy,
   gdy wprost występuje w skrypcie lub w dostawie właściciela. Encji wynikającej z innej encji
   (np. szefa organizacji, o której mowa w opisie innej postaci) nie zakładamy. Przykład:
   Exart i Connect Force są w skrypcie, więc mogą mieć wpisy; szef Connect Force nie jest w dostawie,
   więc wpisu nie ma.
2. **Brak wiedzy o przyszłości.** Dane są ogólne i sprzed aktualnego stanu fabuły. Dla epizodu 0
   nie piszemy o późniejszych epizodach, zwycięzcach, poległych ani o losie postaci i jednostek
   z dalszej części historii.
3. **Sceny w nawigacji.** Gradacja: gra → epizod → scena. Scena jest jednostką fabularną, na której
   opiera się treść. W menu jest pozycja „Sceny” (`#/sceny`), listowana pogrupowana po epizodach.
4. **Bronie w mechach.** Typ `bron` usunięty z rejestru, nawigacji, kafelków i katalogów.
   Uzbrojenie jest częścią opisu mecha (sekcja w treści). Pole `bronie` na mechu i scenie usunięte.

Dodatkowo: `seria` jest opcjonalna dla postaci i mechów (oryginalne postacie i mechy gry,
np. Seishiro i Exart, nie pochodzą z anime).

## Konsekwencje

- `src/srw/registry.js`: usunięte `bron`, `KLASY_BRONI`, `POLA_RELACJI.bronie`; `TYPY_Z_SERIA` puste.
- Nawigacja i trasy: `sceny` dodane, `bronie` / `bron` usunięte; `tools/content-loader.mjs` bez `content/bronie`.
- Stare wpisy w ADR 0003 i ADR 0004 zostają bez zmian (L5); obowiązuje ta decyzja.
