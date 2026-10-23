# 0029 — Mech tylko z dostawy: brak strony generycznej dla rodziny maszyn

Data: 2026-10-22
Status: obowiązujący; zastępuje w tym zakresie punkt 1 ADR 0023 (strona bazowa wariantów)
i adnotację z 2026-10-20 w ADR 0023 („Pozostałe jednostki Zaku II” jako sekcja strony bazowej).
Doprecyzowuje ADR 0012 i 0017.

## Kontekst

W bazie pojawiła się strona `zaku-ii` („Zaku II”) bez ilustracji i bez rekordu w żadnej
dostawie. Powstała 2026-10-20 jako „wersja bazowa” dla trzech wersji Zaku II opisanych
w dostawie parametrów (Char, bazooka, karabin maszynowy) — czyli jako strona nadrzędna
wymyślona przy redakcji grafu, a nie odczytana z materiału. Właściciel wskazał to jako błąd:
w dostawach nie ma generycznego Zaku II, są wyłącznie trzy konkretne wersje.

Ten sam mechanizm mógłby w przyszłości tworzyć kolejne „rodziny” (np. „Dom”, „Gundam”,
„Ingram”) i mnożyć puste strony bez materiału, mylące czytelnika i rozrzedzające graf.

## Decyzja

1. **Strona mecha powstaje wyłącznie z rekordu w dostawie tekstowej.** Podstawą jest wpis
   w pliku `dostawy/**` (menu gry, katalog jednostek, dane misji) albo maszyna nazwana
   wprost w skrypcie epizodu. Kwerenda i pamięć modelu mogą uzupełniać istniejącą stronę,
   ale nigdy nie tworzą nowej jednostki (ADR 0012, 0017).
2. **Nie tworzymy strony generycznej „na siłę”.** Jeśli jedna maszyna występuje w kilku
   wersjach, każda wersja z dostawy ma własną stronę, a strony odsyłają do siebie nawzajem
   w sekcji `## Pozostałe jednostki <nazwa>`. Strona nadrzędna dla rodziny nie powstaje,
   dopóki dostawa nie zawiera jej jako odrębnego rekordu.
3. **Sprawdzenie jest automatyczne.** Każda strona `typ: mech` musi mieć w `w_gre.srw-oe`
   pole `dostawa`: `menu`, gdy rekord pochodzi z dostawy menu bez pliku archiwalnego, albo
   ścieżkę do istniejącego pliku w `dostawy/`. Brak tego wpisu albo nieistniejący plik
   zatrzymują testy. Test dodatkowo pilnuje, że nie wraca strona `zaku-ii`.
4. **Ilustracja nie jest dowodem wersji.** Nowy obraz tej samej maszyny trafia do istniejącej
   strony (ADR 0017, 0023 pkt 2); wersję tworzy rekord w dostawie, nie plik graficzny.
5. **Usunięcie strony nie zmienia archiwów.** Pliki `dostawy/**` i `episodes/**` zostają
   nietknięte, a odsyłacze w bazie prowadzą odtąd do istniejących wersji albo są zwykłym
   tekstem, jeśli mowa o rodzinie maszyn, a nie o konkretnej jednostce.

## Wykonanie

- `content/mechy/zaku-ii.md` usunięty; odsyłacze `[[zaku-ii|…]]` w epizodach, scenach,
  postaciach, hasłach, serii i dzienniku zmian zastąpione odsyłaczami do trzech wersji
  (`zaku-ii-char`, `zaku-ii-bazooka`, `zaku-ii-karabin-maszynowy`) albo zwykłym tekstem
  „Zaku” / „Zaku II”, gdy zdanie mówi o rodzinie maszyn.
- Pola `mechy` epizodu 0 i sceny 0-2 wymieniają trzy wersje; wpis `zaku-ii` zniknął.
- Sekcja „Pozostałe jednostki Zaku II” przeniesiona na strony trzech wersji.
- Nowy test `test/mechy-z-dostawy.test.js` pilnuje pochodzenia parametrów i braku strony
  generycznej.

## Konsekwencje

Liczba stron spada o jeden (mechy: 25 → 24), a graf nie traci żadnej maszyny: wszystkie trzy
wersje Zaku II pozostają z ilustracjami, parametrami i obsadą misji. Kolejna maszyna
z kilkoma wersjami nie dostanie strony nadrzędnej bez rekordu w dostawie.
