# 0043 — Druga dostawa tej samej gry odświeża parę (mech, gra) w miejscu

Data: 2026-11-16
Status: obowiązujący

## Kontekst

Pętla epizodu (ADR 0020, 0023, 0026) zakłada, że dostawa przynosi nową misję,
a wraz z nią nowe jednostki i postacie. Druga dostawa SRW Y —
`dostawy/srw-y/dostawa_1_2a.txt`, misja „Przebudzenie niebiańskiego demona” —
przyniosła jednak także pełne bloki maszyn, które w bazie już były: A. Advent
i Lunedrache z pierwszej misji. Bloki różnią się od starych — inna EN, nowa
broń, nowa zdolność maszyny — bo gra pokazuje parametry na innym etapie fabuły.

Pytanie brzmiało: nowa strona wariantu, druga gra (`gry: [srw-y, srw-y]`),
czy podmiana istniejącego rekordu. Wariantów nie ma jak odróżnić w adresie
(ten sam slug), a druga gra to ta sama gra — obie drogi prowadziłyby do
duplikatów treści i łamały strażników unikalności slugów.

## Decyzja

1. **Para (mech, gra) jest jedna i odświeża się w miejscu.** Nowa dostawa
   nadpisuje `w_gre['srw-y']` na stronie istniejącej maszyny: `dostawa`
   wskazuje nowy plik, `profil` i `dane` biorą się z jej bloku. Stara wersja
   zostaje w historii gita — baza pokazuje stan najnowszy, nie archiwum.
2. **Odświeżamy tylko maszyny, które dostawa naprawdę przyniosła.** Blok
   jednostki w części UCZESTNICY jest źródłem prawdy; brak bloku znaczy, że
   misja tej maszyny nie dotyczy, i rekord zostaje przy starym źródle.
3. **Uzbrojenie z wcześniejszych misji nie znika.** Jeśli nowy blok nie
   powtarza broni z prologu (A. Advent traci „Rakiety MWCT” z jednym trybem),
   wiersz zostaje w tabeli z odsyłaczem do misji, z której pochodzi. Tabela
   parametrów opisuje maszynę, nie pojedynczy zrzut ekranu.
4. **Dane w `w_gre` są dosłowne, poza diagnostyką.** `dane` przepisujemy znak
   w znak z dostawy, z dwiema normalizacjami: `'…'` z dostawy i `''…''`
   z JSON-a to ten sam cudzysłów polecenia, a zdanie „Brak zdolności w danych
   rekordu.” opisuje pustkę w rekordzie gry, nie maszynę — takiego działu na
   stronie nie ma i nie wolno go publikować (ADR 0025, strażnik treści).
5. **Test strażniczy jest osobny dla misji.** `test/epizod-y-misja-2a.test.js`
   pilnuje sufiksowego archiwum skryptu, numeru sceny z nazwy pliku dostawy,
   dosłowności `dane` oraz tego, że odświeżenie nie zgubiło starszych broni.
   Wspólne strażniki (`test/srw-y.test.js`) wystarczyłyby do wykrycia braku
   postaci, ale nie do wykrycia cichej podmiany parametrów.

## Konsekwencje

- Kolejna dostawa tej samej gry znowu nadpisze parę — i znowu zostanie po
  niej tylko historia gita. Kto potrzebuje parametrów z konkretnego etapu,
  znajduje je w `dostawy/<gra>/<plik>.txt`, bo każda dostawa jest archiwizowana.
- Uczestnicy dostawy liczą się z aktualnego pliku (`w_gre.dostawa`), więc
  `node tools/uczestnicy-dostaw.mjs` pokrywa 218 par bez zmian w narzędziu.
- Gdyby kiedyś trzeba było pokazać oba warianty równocześnie, trzeba będzie
  wprowadzić wersjonowanie etapu w `w_gre` i osobną decyzję — dziś tego nie ma.
