# 0017 — Ilustracja właściciela jest dostawą encji

Data: 2026-10-19
Status: obowiązujący; zastępuje ADR 0016 pkt 8 w zakresie encji z ilustracji i doprecyzowuje ADR 0012–0014.

## Kontekst

Właściciel doprecyzował, że ilustracja bohatera lub mecha oznacza jego obecność w dostawie.
Brak opisu tekstowego nie jest powodem do pominięcia encji. Dotychczasowa interpretacja,
według której Kuro.png i Shiro.png miały czekać na tekst, była zbyt wąska.

## Decyzja

1. **Ilustracja dostarczona przez właściciela jest pełnoprawną dostawą encji.** Może zostać
   przekazana w czacie albo udostępniona w buckecie R2 właściciela. Dotyczy to także listy
   plików zidentyfikowanych przez właściciela lub pobranej przez agenta z jego bucketa.
   Postać z takiej dostawy jest `postac`, a mech — `mech`; brak tekstu nie zmienia ich w hasła wiki.
2. Agent rozpoznaje encję na podstawie ilustracji, nazwy pliku i kontekstu dostawy.
   Najpierw szuka istniejącego wpisu: kolejna ilustracja nie tworzy duplikatu ani sama
   w sobie nowego wariantu. Przy niejednoznacznej tożsamości agent nie zgaduje; wyjaśnia
   konkretną niejasność, zamiast żądać opisu do każdej rozpoznawalnej ilustracji.
3. Dla rozpoznanej, nieistniejącej encji agent **tworzy wpis i przypisuje ilustrację**.
   Jeśli tekst dostawy nie zawiera opisu, uzupełnia go kwerendą lub pamięcią modelu.
   Nie kończy pracy na pustym wpisie albo statusie „czeka na dane tekstowe”.
4. Ilustracja i jej przypisanie od właściciela mają poziom `menu`. Opis potwierdzony
   przez odczytane źródło ma blok `zrodlo`, adres przy potwierdzanej informacji i datę
   sprawdzenia; niesprawdzony kontekst z pamięci modelu — blok `wiedza` bez linków.
   Obecność ilustracji nie sprawia, że dopisane fakty stają się dostawą właściciela.
5. Ilustracja potwierdza zakres dostawy, **nie konkretne zdarzenie ani debiut fabularny**.
   Nie dopisujemy postaci do obsady epizodu czy sceny bez materiału potwierdzającego udział.
   Nadal nie ujawniamy przyszłych wydarzeń, losów postaci ani rozwiązań fabularnych.
6. Kwerenda służy uzupełnianiu dostarczonej encji i relacji. Osoby, mechy i serie znalezione
   wyłącznie w źródłach nadal nie stają się automatycznie nowymi encjami (ADR 0012).
7. Bieżące zastosowanie: Kuro i Shiro otrzymują wpisy postaci, obrazy z R2 i opisy ogólne
   z kwerendy, z odsyłaczami do istniejącego Masakiego i Cybustera. Nie dopisujemy ich
   do szkolenia podstawowego z epizodu 0 ani do domyślnej załogi z dostawy parametrów.

## Konsekwencje

Właściciel może dostarczać encje samymi ilustracjami; uzupełnienie tekstu jest zadaniem
agenta. Pliki nie czekają na dodatkowe zlecenie tekstowe, jeśli encję można rozpoznać.
Status niezależnego obejrzenia obrazu i dostępności R2 pozostaje jawny i odrębny od
sprawdzenia opisu w zewnętrznych źródłach. Zakaz spoilerów i poziomy pochodzenia pozostają.
