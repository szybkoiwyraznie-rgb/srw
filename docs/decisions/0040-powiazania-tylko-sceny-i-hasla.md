# 0040 — „Powiązania” na stronie encji pokazują tylko sceny i hasła; bez podnagłówków w „Z tej serii”

Data: 2026-11-10
Status: obowiązujący; zmienia pkt 1 i 3 ADR 0038 na stronach encji oraz uzupełnia ADR 0039.
Układ kolumn i kolejność boksów (ADR 0035, 0036) oraz mechanizm zwijania (ADR 0039) pozostają w mocy.

## Kontekst

Po ADR 0038 i ADR 0039 boks „Powiązania” na stronie encji zbierał relacje ze wszystkich typów
stron (`scena`, `epizod`, `gra`, `postac`, `mech`, `pojecie`, `seria`). W praktyce oznaczało to,
że kolumnę boczną gry, serii czy jednostki zapełniały długie wyliczenia postaci, mechów,
epizodów i serii (np. 248 pozycji na stronie *Super Robot Wars OE*, 88 na *Connect Force*,
70 na *White Base*), powielając to, co i tak stoi w metryce, listach działów, własnych listach
strony („Rozegrane epizody”, „Z tej serii:”) i samej treści.

Równocześnie na stronach postaci, mechów, serii i gier wiele wystąpień pojęć świata (`typ: pojecie`)
występowało w opisach zwykłym tekstem bez wikilinków, więc znikały one z „Powiązań”. Ponadto
na stronach serii lista „Z tej serii:” dublowała podział nagłówkami `<h3>` mimo wspólnego
nagłówka boksu, a marginesy `.blok-powiazan`, `h2` i `.fragment` dawały widoczną lukę w układzie.

Właściciel: w „Powiązaniach” na stronie encji zostają wyłącznie sceny i hasła (pojęcia); w opisach
należy olinkować obecne pojęcia, usunąć zbędne podnagłówki listy „Z tej serii:” i wyrównać
odstępy boksów.

## Decyzja

1. **`Powiązania` na stronie encji pokazują tylko `scena` i `pojecie` (`TYPY_POWIAZAN = ['scena', 'pojecie']`).**
   Boks nadal łączy oba kierunki odsyłaczy (wychodzące i przychodzące) i zachowuje kolejność grup
   (Sceny w kolejności rozgrywki, z podpisami gier przy wielu grach; Hasła alfabetycznie).
   Strony typów `epizod`, `gra`, `postac`, `mech` i `seria` nie trafiają do „Powiązań” strony encji —
   są dostępne przez metrykę, własne listy („Rozegrane epizody”, „Z tej serii:”), nawigację
   działów oraz odsyłacze w treści.
2. **Pełne linkowanie pojęć w opisach encji.** Gdy opis gry, serii, pojęcia, postaci lub mecha
   wspomina istniejące hasło (`typ: pojecie`), nazwa otrzymuje wikilink `[[slug|tekst]]` zgodnie
   z zakresem gry i poziomem wiarygodności (bez dopisywania wiedzy spoza danego zakresu).
3. **Lista „Z tej serii:” bez podnagłówków typów i spójne odstępy boksów.** `sekcjaListy` dla
   `Z tej serii:` wywołuje `sekcjaPowiazan` z opcją `{ naglowkiGrup: false }`; `sekcjaPowiazan`
   na stronie epizodu nadal pokazuje podnagłówki. W `src/srw/style.css` wyrównano marginesy
   `.kolumna-glowna > .blok-powiazan`, `.kolumna-glowna > .fragment`, `.blok-powiazan h2`,
   `.grupa-powiazan` oraz `.lista-horyzontalna li`, a `.gra-fabuly` otrzymała stonowany kolor
   `var(--tusz-2)`.
4. **Strony scen i epizodów oraz zwijanie ponad 50 pozycji bez zmian.** Strony scen i epizodów
   zachowują własne boksy obsady i odniesień (ADR 0036 pkt 5), a limit 50 pozycji i przycisk
   „Rozwiń” (ADR 0039) dalej obsługują każdy długi boks „Powiązań”.

Realizacja: `TYPY_POWIAZAN`, `powiazaniaStrony`, `boksPowiazan` i `sekcjaListy` w
`src/srw/render-entity.js`; `src/srw/style.css`; wikilinki w `content/{gry,serie,pojecia,postacie,mechy}/*.md`.

## Odrzucone

- **Wyjątek dla stron gier i serii** (zostawienie pełnych list postaci/mechów w ich „Powiązaniach”)
  — te strony mają już dedykowane listy „Rozegrane epizody” i „Z tej serii:” oraz własne filtry
  w działach; wyjątek podważyłby spójną regułę dla wszystkich 316 stron encji.
- **Usunięcie mechanizmu zwijania ponad 50 pozycji (ADR 0039)** — po zmianie najdłuższy boks ma
  dziś 50 pozycji (*Super Robot Wars OE*), lecz kolejne epizody i sceny przekroczą 50, więc próg
  i przycisk „Rozwiń” zostają gotowe.

## Konsekwencje

- Boks „Powiązania” na stronach encji pokazuje wyłącznie kontekst fabularny (`Sceny`) i pojęciowy
  (`Hasła`); po uzupełnieniu wikilinków encje gry, serii, pojęć, postaci i mechów mają bezpośrednie
  odniesienia do właściwych pojęć świata.
- W aktualnej bazie 303 z 316 encji ma boks „Powiązania”; pozostałe 13 to debiuty z zapowiedzi lub
  postacie/jednostki nieuczestniczące jeszcze w żadnej zapisanej scenie ani opisanym haśle.
- `test/powtorzenia-list.test.js` i `test/zwijanie-powiazan.test.js` sprawdzają filtrowanie typów
  `TYPY_POWIAZAN`, komplet scen i haseł z obu kierunków, brak podnagłówków `<h3>` w „Z tej serii:”
  oraz zwijanie ponad 50 pozycji zarówno na bazie, jak i na sztucznych grupach.
