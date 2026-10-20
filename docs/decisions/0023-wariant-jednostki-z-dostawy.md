# 0023 — Wariant jednostki z dostawy jest osobną stroną

Data: 2026-10-20
Status: obowiązujący; doprecyzowuje ADR 0012 i 0017.

## Kontekst

Dostawa z 2026-10-20 przyniosła trzy rekordy Zaku II różniące się uzbrojeniem i pilotem:
`Zaku II/Karabin maszynowy`, `Zaku II/Bazooka` i `Zaku II (Char)`. W bazie jest już strona
bazowego Zaku II opisana skryptem sceny 0-2, a `docs/guides/ILUSTRACJE_R2.md` mówi, że
**nowa ilustracja tej samej maszyny nie tworzy wariantu mecha**. Trzeba rozstrzygnąć, czy
te trzy rekordy to warianty bez własnych stron, czy osobne wpisy.

## Decyzja

1. **Odrębny rekord w dostawie = odrębna strona.** Jeśli dostawa wymienia maszynę pod
   własną nazwą i z własnym zestawem parametrów (uzbrojenie, pilot, zdolności), powstaje
   dla niej strona z własnym slugiem — nawet gdy jest to wariant maszyny już opisanej.
   Slug nazywa wariant: `zaku-ii-karabin-maszynowy`, `zaku-ii-bazooka`, `zaku-ii-char`.
2. **Ilustracja sama nie tworzy wariantu.** Zasada z ADR 0017 i przewodnika R2 pozostaje:
   nowe zdjęcie tej samej maszyny trafia do istniejącej strony. Wariant powstaje z danych,
   nie z obrazka.
3. **Strona bazowa nie musi wyliczać wariantów w parametrach, ale powinna je linkować.**
   Sekcja `## Warianty` w bloku `menu` zbiera odsyłacze; zestaw parametrów zostaje przy
   wariancie, bo właśnie on się różni.
4. **Warianty nie wchodzą automatycznie do epizodu ani sceny.** Pola `mechy` epizodu i sceny
   wymieniają jednostki występujące w fabule; rekordy z menu są rosterem gry i żyją w grafie
   powiązań, dopóki scena ich nie użyje.
5. **Zbiorczy profil nie jest postacią.** `Żołnierz Zeonu` to klasa obsady, nie osoba:
   nie powstaje dla niego strona `postac` ani relacja `piloci`. Profil zostaje w tekście
   parametrów, a pole `piloci` wariantu jest puste — tak jak przy innych maszynach bez
   nazwanego pilota.

## Odrzucone alternatywy

- **Jeden wpis z tabelą wariantów** — gubi różnice w uzbrojeniu i przypisaniu pilota oraz
  zmusza do trzymania kilku galerii na jednej stronie bez jasnego zakresu.
- **Strona `zolnierz-zeonu`** — tworzy fikcyjną osobę z klasy jednostek i zachęca do
  przypisywania jej fabuły, której w dostawie nie ma.
- **Dopisywanie wariantów do `w_gre` bazowego Zaku II** — `w_gre` opisuje jedną parę
  (jednostka, gra), a nie kilka różnych maszyn.

## Konsekwencje

Liczba stron rośnie o trzy, a graf powiązań zyskuje odsyłacze z Zaku II i Chara. Kolejne
warianty z dostaw dostają własne slugi `<jednostka>-<wyróżnik>` i własne galerie; test
sprawdza komplet parametrów, liczbę ilustracji i brak encji `&lt;br&gt;` w treści.
