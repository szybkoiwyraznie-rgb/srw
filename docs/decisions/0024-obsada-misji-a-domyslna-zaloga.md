# 0024 — Obsada misji a domyślna załoga jednostki

Data: 2026-10-20
Status: obowiązujący; doprecyzowuje ADR 0023 i schemat danych.

## Kontekst

Dostawa z 2026-10-20 przyniosła dane z plików misji epizodu 0 (m.in. `eventP00.cpk/DL100_02_Entry.dat`).
W misji „Rescue White Base” pole „Entry character/pilot” przypisuje konkretnym maszynom
nazwanych pilotów: `Zaku II (Char)` — Char Aznable, `Zaku II/Bazooka` — Crown,
`Zaku II/Machine Gun` — Slender. Wcześniej te trzy jednostki miały w bazie tylko dane
jednostkowe z menu: dla wersji z karabinem i z bazooką domyślną załogą jest zbiorczy profil
**Żołnierz Zeonu**, a Char był jedynym nazwanym pilotem.

Powstaje pytanie, czy pole `piloci` opisuje domyślną załogę jednostki, czy obsadę misji,
w której maszyna występuje. Obie informacje są prawdziwe na swoim poziomie i obie są
potrzebne: bez domyślnej załogi znika relacja do profilu Żołnierza Zeonu (ADR 0023,
adnotacja), bez obsady misji nie da się odpowiedzieć na pytanie „kto siedzi w którym Zaku”.

## Decyzja

1. **`piloci` wymienia nazwanych pilotów z obsady misji, a po nich domyślną załogę jednostki.**
   Kolejność jest znacząca: pierwszy odsyłacz to pilot, który faktycznie siada za sterami
   w opisanej scenie; dalsze to domyślne obsadzenie jednostki. Dla trzech Zaku II wygląda to
   tak: `[slender, zolnierz-zeonu]`, `[crown, zolnierz-zeonu]`, `[char-aznable]`.
2. **Nazwany pilot wskazuje w `mechy` konkretną maszynę, nie rodzinę.** Slender ma
   w `mechy` wpis `zaku-ii-karabin-maszynowy`, Crown — `zaku-ii-bazooka`. Strona rodziny
   nie istnieje (ADR 0029), więc proza linkuje maszynę, w której pilot siedzi, a o samej
   rodzinie mówi zwykłym tekstem. Graf powiązań prowadzi do właściwej jednostki.
3. **Dane misji nie są prezentowane dosłownie.** Strona nie cytuje nazw plików ani pól
   „Entry character/pilot”; proza mówi o świecie: kto prowadzi którą maszynę podczas ataku.
   Surowe etykiety dostawy zostają w `w_gre` tylko tam, gdzie należą do danych jednostki
   (menu), a nie do obsady misji (ADR 0018).
4. **Pochodzenie ustalenia zostaje w ADR, nie w treści.** Nazwy plików misji i sposób
   przypisania pilotów są zapisane w tym dokumencie dla kolejnych sesji; witryna ich nie
   pokazuje.

## Odrzucone alternatywy

- **Tylko profil zbiorczy w `piloci`** — zostawia bez odpowiedzi, kto siedzi w której maszynie,
  mimo że dostawa to rozstrzyga.
- **Tylko nazwany pilot w `piloci`** — zrywa relację z profilem domyślnej załogi i przeczy
  adnotacji do ADR 0023, według której maszyny wskazują wpis Żołnierza Zeonu.
- **Osobne pole `piloci_misji`** — schemat nie potrzebuje trzeciego kanału relacji; kolejność
  w `piloci` wystarcza i nie wymaga zmian w rendererze ani w grafie.

## Konsekwencje

Testy pilnują kolejności w `piloci` i tego, że strony Slendera i Crowna wskazują właściwe
maszyny. Kolejne dostawy z danymi misji dopisują nazwanych pilotów na początek `piloci`,
a domyślna załoga zostaje na końcu. Strona rodziny Zaku II nadal wymienia wszystkich trzech
pilotów, bo opisuje całą rodzinę, a nie jedną maszynę.
