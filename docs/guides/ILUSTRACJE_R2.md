# Ilustracje w R2 — lista plików przez GitHub Actions

Oryginały ilustracji są w Cloudflare R2, nie w git ani w wynikowym HTML-u.
Workflow `.github/workflows/r2-inventory.yml` tworzy listę obiektów, nie zmienia bucketa,
nie pobiera obrazów i nie przypisuje ich automatycznie do wpisów bazy.
Artefakt jest narzędziem agenta: właściciel tylko wgrywa obrazy, nie musi uruchamiać
workflow ani pobierać jego wyników.

## Konfiguracja

- Bucket: `srw-images`.
- Publiczny adres testowy: `https://pub-f065608b5a964f3fb44480d8c9df01de.r2.dev`.
- Sekrety repozytorium Actions: `R2_ACCESS_KEY_ID` i `R2_SECRET_ACCESS_KEY`.
- Zmienna repozytorium Actions: `R2_ENDPOINT`, adres HTTPS endpointu S3 R2, bez ścieżki bucketa.
- Token R2: **Object Read only**, ograniczony do `srw-images`. Workflow nie może sam
  potwierdzić zakresu tokena; zakres ustawia właściciel w Cloudflare.

Nie kopiuj sekretów do czatu, kodu, manifestu ani logów. Agent nie potrzebuje ich wartości.
Brak prawa sesji do wyświetlenia listy sekretów na GitHubie nie oznacza ich braku.

## Użycie przez agenta

Workflow musi najpierw znaleźć się na domyślnej gałęzi po scaleniu przez właściciela.
Nie dodawaj zdarzeń `pull_request_target` ani obejść uruchamiających kod PR z sekretami.

**Integracja GitHuba używana przez agenta ma tylko odczyt Actions** — wywołanie
`gh workflow run` kończy się błędem 403 (`Resource not accessible by integration`),
także dla workflow `Testy`. Dlatego workflow ma drugi, wąski trigger: zmianę pliku
`.github/r2-inventory-request`. Push z tą zmianą uruchamia odczyt na gałęzi, na którą
wypchnięto commit; zdarzenie `push` nie dotyczy pull requestów, więc sekrety nadal nie
trafiają do kodu PR. Harmonogramu ani triggerów PR nie ma.

```bash
# wpisz datę i powód do pliku-żądania
git add .github/r2-inventory-request
git commit -F /tmp/msg.txt   # np. „R2: prośba o listę ilustracji”
git push origin <gałąź-sesji>
gh run list --workflow r2-inventory.yml --event push --limit 5
# Odczytaj ID właściwego uruchomienia (gałąź, czas, autor), następnie:
gh run watch <ID> --exit-status
gh run download <ID> --name r2-inventory --dir /tmp/srw-r2-inventory
```

Właściciel nadal może uruchomić workflow przyciskiem **Run workflow**
(`workflow_dispatch`). Jeśli odczyt padnie na konfiguracji, komunikat w logu wskazuje
brakującą zmienną lub sekret, nie ujawniając ich wartości.

Przy równoległych uruchomieniach sprawdź gałąź, czas i autora, zamiast zakładać, że najnowszy
run należy do tej sesji. Plik wynikowy to `r2-inventory.json`: czas wykonania, bucket,
publiczny adres bazowy, liczba i łączny rozmiar plików oraz `objects` z polami:
`key`, `size` (bajty), `lastModified`, `etag`, `url`. Lista jest sortowana po kluczu.
Foldery bez plików (klucze kończące się `/`) są pomijane. Paginacja obejmuje cały bucket,
nie tylko pierwsze 1000 obiektów; niekompletny odczyt kończy zadanie błędem.

Po kolejnej dostawie ilustracji uruchom workflow ponownie. Porównanie `key`, `etag` i czasu
modyfikacji z poprzednią listą umożliwia rozpoznanie nowych lub zastąpionych plików.
Artefakt jest przechowywany przez **7 dni**; to migawka, nie trwały rejestr ani stały monitoring.
Nazwy i metadane plików w artefakcie publicznego repozytorium traktuj jako publiczne.

## Ograniczenia i kontrola

- AWS CLI v2 jest dostępne na używanym runnerze GitHub `ubuntu-latest`; workflow sprawdza
  jego obecność. Skrypt korzysta tylko z `s3api list-objects-v2`. Nie ma nowych zależności npm
  ani zmian silnika strony. Testy lokalne używają atrap odpowiedzi, bez kluczy i połączeń z R2.
- Sekrety są przekazywane wyłącznie do kroku odczytu listy. Endpoint jest sprawdzany jako
  host Cloudflare R2 przed uruchomieniem AWS CLI. Surowe błędy klienta nie trafiają do logów.
- Lista **nie potwierdza dostępności publicznych URL**, zawartości obrazu, praw do ilustracji
  ani jej związku z postacią/mechem. Obejrzyj ją, gdy to możliwe; przy identyfikacji
  przekazanej przez właściciela można przypisać obraz bez niezależnej inspekcji,
  zachowując jawny status braku weryfikacji zdalnej (ADR 0016–0017).
- Dostęp do API GitHuba i Actions nie oznacza dostępu sieciowego sandboxa do domen R2.
  Jeśli sandbox nie może pobrać ilustracji, nie deklaruj jej obejrzenia. Sam manifest nadal
  pozwala poznać nazwy i adresy; inspekcja obrazów może wymagać osobnego rozwiązania.
- `r2.dev` jest adresem testowym; docelowo można przejść na własną subdomenę, zmieniając
  `R2_PUBLIC_BASE_URL` w workflow. Nie należy wtedy zmieniać kluczy istniejących plików.
- Nie uruchamiaj workflow z niezaufanej gałęzi. Nie udostępniaj go jako publicznego endpointu.

## Przypisane ilustracje (ADR 0016)

Manifest `media/ilustracje.json` przechowuje nazwy plików przypisanych do istniejących encji
oraz ewentualne pliki o nierozpoznanej tożsamości. Rozpoznane postacie i mechy
nie czekają na opis tekstowy: ich ilustracja jest już dostawą (ADR 0017). Zawiera jawny status weryfikacji. Obecne przypisania
pochodzą z listy właściciela; nie deklarują niezależnego obejrzenia plików przez agenta.
Nie należy zmieniać statusu na zweryfikowany wyłącznie dlatego, że workflow zwrócił nazwę.

Na stronie encji ilustracje są zwykłymi obrazami Markdown w bloku `menu`, w sekcji
„Ilustracje”. Każdy ma polski tekst alternatywny, odnośnik do pełnego pliku i lazy loading.
Spacje w nazwach kodujemy jako `%20`; wielkość liter pozostaje bez zmian. Test porównuje
manifest z odnośnikami stron. Nowa ilustracja tej samej maszyny nie tworzy wariantu mecha.

Tekst, kod i style pozostają w jednym HTML-u. Zewnętrzne ilustracje wymagają sieci,
a ich niedostępność nie blokuje czytania tekstu, nawigacji ani wyszukiwania.

## Nowe encje z ilustracji (ADR 0017)

Po odczytaniu listy R2 porównaj ją z istniejącymi wpisami i manifestem. Jeśli ilustracja
właściciela przedstawia rozpoznaną postać lub mecha bez wpisu, utwórz go i przypisz obraz.
Brak dostawy tekstowej nie jest blokadą: przygotuj opis z kwerendy (`zrodlo`, linki przy
faktach i data sprawdzenia) lub pamięci modelu (`wiedza`, bez linków). Ilustracja i identyfikacja
z dostawy pozostają na poziomie `menu`; nie kolorują dopisanego opisu jako danych właściciela.

Kuro i Shiro mają już takie wpisy i przypisane obrazy. Wszystkie 15 plików z listy właściciela
z 2026-10-19 jest przypisanych do 10 encji. Nie dodawaj postaci do konkretnej sceny lub
załogi z menu wyłącznie na podstawie ilustracji. Nie zakładaj kolejnych encji tylko dlatego,
że wymienia je źródło wykorzystane do napisania opisu.
