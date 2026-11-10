# 0037 — Seria z listy uczestników jest wiążąca; przezwisko to pole strony, nie osobna strona

Data: 2026-11-10
Status: obowiązujący; doprecyzowuje ADR 0012 (encje z dostawy), ADR 0013 (mówca to postać),
ADR 0025 pkt 6 (brak wpisu w słowniku) i ADR 0033 pkt 5 (strona nie taguje samej siebie).

## Kontekst

Dostawa misji podaje postacie w dwóch miejscach: jako **mówców skryptu** oraz na **liście
uczestników**, gdzie każda jednostka, każdy pilot i każda postać niebojowa ma na twardo
wpisaną serię. Skrypt posługuje się tym, jak postacie zwracają się do siebie — także
przezwiskami; lista uczestników podaje imię i nazwisko.

Sesja wprowadzająca misję 2-8 SRW OE potraktowała oba zestawy osobno. Mówcy „Potato”, „Bon”,
„Chobi”, „Kuko”, „Two” i „Mabo” dostali strony pod przezwiskami, bez serii, opisane jako
bezimienni uczniowie — choć dodatek tej samej dostawy wymienia Orie Ishizukę
(*Matchless Raijin-Oh*) oraz Saneyasu Mushanokojiego, Kazutakę Sekiego, Kumiko Tanabe, Harumi
Sato i Masao Fujiyoshiego (*Nekketsu Saikyo Go-Saurer*). Eldran został bez serii, mimo że
dostawa przypisuje go do *Matchless Raijin-Oh*. Żołnierz JSDF miał z kolei serię
*Mobile Police Patlabor*, której dostawa mu nie daje („Brak wpisu w słowniku postaci”).

Właściciel: seria wpisana na liście uczestników ma być bezwzględnie przestrzegana; Potato to
pseudonim, Orie Ishizuka to imię i nazwisko.

## Decyzja

1. **Seria z dostawy jest serią strony.** Dla każdej nazwy z listy uczestników pole `seria`
   strony jest dokładnie tym, co wpisała dostawa. Nie zmienia tego ani brak ilustracji,
   ani to, że w skrypcie postać mówi pod inną etykietą.
2. **Dostawa, która serii nie podaje, też wiąże.** „Brak wpisu w słowniku postaci”
   i równoważne zapisy oznaczają stronę **bez** pola `seria` (tak jak Control AI w ADR 0025
   pkt 6). Związek ze światem niesie wtedy tag, nie pole.
3. **Każdy uczestnik ma stronę pod nazwą z dostawy.** Tytułem strony postaci jest imię
   i nazwisko z listy uczestników. Mówca skryptu, który nie pasuje do żadnego tytułu, jest
   najpierw dopasowywany do listy uczestników tej samej dostawy, a dopiero potem zakładany.
4. **Przezwisko to pole `pseudonim`.** Gdy postać mówi w skrypcie pod przezwiskiem, strona
   pod imieniem i nazwiskiem dostaje `pseudonim: <etykieta ze skryptu>`. Pole widać
   w podtytule i w metryce, na listach postaci, a wyszukiwarka traktuje je jak tytuł.
   Strony pod samym przezwiskiem nie zakładamy; jedna osoba ma jedną stronę.
5. **Skąd wiadomo, kto jest kim.** Dodatek „postacie niebojowe, portretowe i systemowe”
   wymienia dokładnie te wpisy dialogowe, które mówią w scenie. Po dopasowaniu mówców
   znanych z imienia zostają pary do rozstrzygnięcia: gdy w danej serii zostaje jedna
   etykieta i jedno nazwisko (Potato — Orie Ishizuka), rozstrzyga sama dostawa; gdy zostaje
   ich kilka, pary potwierdza źródło, zapisane na stronie w bloku `{{zrodlo}}`.
6. **Tag świata idzie za serią.** Strona z polem `seria` nie nosi tagu świata innej serii
   (uczeń z *Raijin-Oh* nie ma tagu `super-robot-wars`). Zasada „strona nie taguje samej
   siebie” (ADR 0033 pkt 5) nie może przy tym odbierać stronie serii: Eldran należy do
   *Matchless Raijin-Oh*, choć tag świata tej serii brzmi `eldran` — tej jednej stronie
   tagu świata nie wymagamy.

## Odrzucone alternatywy

- **Strona pod przezwiskiem z dopiskiem w treści** — czytelnik szukający „Orie Ishizuka”
  nic nie znajduje, a lista „Z tej serii” pomija osobę, którą dostawa do serii przypisała.
- **Dwie strony, przezwisko i nazwisko, połączone odsyłaczem** — jedna osoba w dwóch
  miejscach; opisy rozjeżdżają się przy pierwszej kolejnej dostawie.
- **Przezwisko jako tytuł, nazwisko jako pole** — odwrotnie niż w dostawie, która
  przypisuje serię do nazwiska, i odwrotnie niż na stronach już istniejących (Yoko Kuriki,
  Taro Shirogane, Christina Mackenzie).
- **Seria dopisywana z wiedzy ogólnej tam, gdzie dostawa jej nie podaje** — żołnierz JSDF
  „pasuje” do *Patlabora*, ale to wniosek redaktora, nie wpis dostawy.

## Konsekwencje

- Sześć stron zmieniło slug i tytuł: `potato` → `orie-ishizuka`, `bon` →
  `saneyasu-mushanokoji`, `chobi` → `kazutaka-seki`, `kuko` → `kumiko-tanabe`, `two` →
  `harumi-sato`, `mabo` → `masao-fujiyoshi`. Mają serię, pseudonim i blok ze źródłem.
- `eldran` ma serię `matchless-raijin-oh`; `zolnierz-jsdf` nie ma serii.
- Pole `pseudonim` dostało też dziesięć stron, które od początku nosiły imię i nazwisko,
  a przezwisko miały tylko w zdaniu: Cookie, Love, Kinta, Elly, Profesor, Momotaro, Chris,
  Misza, Bud, Shige.
- `tools/uczestnicy-dostaw.mjs` czyta przypisania „nazwa → seria” ze wszystkich dostaw
  i porównuje je z bazą (`node tools/uczestnicy-dostaw.mjs`); `test/seria-z-dostawy.test.js`
  wymaga, by rozbieżności nie było, by każdy mówca skryptu prowadził do strony postaci i by
  przezwisko nie miało własnej strony. `test/tagi.test.js` pilnuje pkt 6.
- Mówcy, których lista uczestników nie obejmuje (prolog SRW Y), nie mają serii z dostawy;
  ta decyzja ich nie dotyczy.

## Adnotacja 2026-11-10 — załoga z listy jednostek misji też wiąże

Ta sama lista podaje przy każdej jednostce załogę: `pilot główny: X — piloci wspierający
w misji: A, B`. Po misji 2-8 SRW OE strony Daiteioha i Ganbarugera miały w polu `piloci`
tylko pilota głównego, choć dostawa wymienia przy nich po dwóch pilotów wspierających,
a czterej piloci zbiorowi (Żołnierz Zeonu, Oficer Zeonu, Mechabestia, Control AI) nie mieli
w polu `mechy` sześciu maszyn, które dostawy im przypisują. Testy tego nie widziały —
sprawdzały pole `piloci` tylko pod kątem pilota głównego albo zapisywały stan bazy.

7. **Załoga z dostawy jest załogą strony.** Każda osoba z wiersza jednostki — pilot główny
   i piloci wspierający — stoi w polu `piloci` strony mecha, a ten mech w polu `mechy`
   strony każdej z nich; dotyczy to także pilotów zbiorowych. Wiersz oznaczony „cel/obiekt
   skryptowy; nie jest pilotowanym mechem” załogi nie daje (ADR 0025), tak samo wiersz bez
   osoby („brak”, „???”). Forma połączona ma załogę maszyny, z której powstaje.
8. **Kierunek bez wyjątków:** pilot wpisany w `piloci` ma tę maszynę w `mechy`. Odwrotnie
   nie zawsze — Kuro i Shiro wiążą się z Cybusterem, a Bakuryu-Oh z God Raijin-Oh, nie
   będąc ich załogą.

`tools/uczestnicy-dostaw.mjs` czyta teraz także załogi (`zalogiDostaw`, `porownajZalogi`)
i kończy pracę kodem 1, gdy cokolwiek się nie zgadza; `test/seria-z-dostawy.test.js` wymaga
zera rozbieżności i pilnuje pkt 8.

Rozstrzygnięcia właściciela z tego samego dnia, których dostawy nie podają wprost:

- **Harumi Sato („Two”) to dziewczynka**, **Yu Izumi to dziewczyna** — strony opisują je
  w rodzaju żeńskim. Polszczyzna wymusza rodzaj; gdy ani dostawa, ani źródło go nie podają,
  pytanie trafia do właściciela, a opis nie udaje neutralnego.
- **Hiryu Tsukishiro należy do załogi Daiteioha.** Dostawa daje mu kartę podpilota z serią
  *Kanzen Shouri Daiteioh*, ale nie wymienia go przy żadnej jednostce, więc pkt 7 sam by go
  nie objął; `daiteioh` i `perfect-daiteioh` mają go w polu `piloci` na mocy tej decyzji.
