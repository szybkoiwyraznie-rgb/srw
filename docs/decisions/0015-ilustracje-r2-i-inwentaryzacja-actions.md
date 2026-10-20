# 0015 — Oryginały ilustracji w R2, lista plików przez Actions

Data: 2026-10-18
Status: obowiązujący.

## Kontekst

Właściciel utworzył bucket `srw-images` w Cloudflare R2 oraz skonfigurował w GitHubie
klucze odczytu i endpoint S3. Chce wgrywać obrazy samodzielnie, bez każdorazowego
przekazywania agentowi nazw plików. Sandbox agenta ma ograniczoną sieć; sekrety Actions
nie są i nie powinny być dostępne w czacie ani w lokalnym repozytorium.

## Decyzja

1. Oryginały obrazów pozostają w R2, poza git i samowystarczalnym HTML-em strony.
   Ten krok nie zmienia renderowania ani nie dodaje jeszcze ilustracji do wpisów.
2. Ręczny workflow `r2-inventory.yml` odczytuje cały bucket poleceniem AWS CLI
   `s3api list-objects-v2`, z obsługą paginacji. Używa klucza **Object Read only**
   ograniczonego do tego bucketa; nigdy nie zapisuje ani nie usuwa obiektów.
3. AWS CLI obecne na runnerze GitHub jest narzędziem pomocniczym tego workflow,
   nie zależnością buildu strony ani silnika. Skrypt Node używa wyłącznie biblioteki
   standardowej; lokalne testy nie wymagają AWS CLI, sieci ani prawdziwych kluczy.
4. Klucze trafiają tylko do środowiska kroku odczytu z sekretów `R2_ACCESS_KEY_ID`
   i `R2_SECRET_ACCESS_KEY`. Endpoint pochodzi ze zmiennej `R2_ENDPOINT` i jest
   weryfikowany przed połączeniem. Workflow ma tylko uprawnienie GitHub `contents: read`.
5. Wynik to artefakt `r2-inventory`, plik JSON z listą nazw, rozmiarów, dat modyfikacji,
   ETag i publicznych adresów. Nie zawiera kluczy dostępu ani endpointu S3.
   Artefakt jest migawką przechowywaną 7 dni, nie commitem ani stałym monitoringiem.
6. Workflow uruchamiany jest wyłącznie ręcznie z zaufanego kodu. Nie dodajemy triggerów
   PR udostępniających sekrety. Agent może go uruchamiać po dodaniu workflow do `main`;
   scalenie nadal należy wyłącznie do właściciela.
7. Nazwy i metadane w publicznym repozytorium nie są traktowane jako poufne.
   Manifest nie jest dowodem poprawności ani publicznej dostępności obrazów;
   przypisanie obrazu do encji wymaga obejrzenia zawartości i zachowania ADR-ów.

## Konsekwencje

Właściciel wgrywa obrazy przez panel R2, a agent może uzyskać aktualną listę przez Actions
bez poznawania kluczy. Pełne sprawdzenie integracji wymaga uruchomienia na GitHubie;
testy lokalne nie potwierdzają poprawności poświadczeń. Procedura i ograniczenia sieciowe:
`docs/guides/ILUSTRACJE_R2.md`.

## Adnotacja (2026-10-20)

Punkt 6 mówi o uruchamianiu wyłącznie ręcznym. W praktyce integracja GitHuba, przez którą
pracuje agent, ma tylko odczyt Actions: `gh workflow run` zwraca 403 dla każdego workflow
w repozytorium, więc ręczne wywołanie nie może należeć do agenta. Workflow zyskuje drugi,
wąski trigger — `push` ograniczony ścieżką `.github/r2-inventory-request`. Zmiana tego pliku
uruchamia odczyt na wypchniętej gałęzi; nie ma triggerów `pull_request`, `pull_request_target`
ani `schedule`, a uprawnienia GitHuba pozostają `contents: read`. Zasada „sekrety nie trafiają
do kodu PR” pozostaje w mocy: zdarzenie `push` nie pochodzi z pull requesta, a kod workflow
i skryptu jest w tym samym repozytorium, do którego push ma wyłącznie właściciel i agent.
Przycisk **Run workflow** zostaje dla właściciela.
