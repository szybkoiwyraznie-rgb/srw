/**
 * Build SRW Database — jeden samowystarczalny plik HTML (ADR 0001).
 *
 * 1. Ładuje treść (content-loader) i WALIDUJE ją (registry) — build nie
 *    wypuszcza artefaktu z martwymi wikilinkami ani złym schematem.
 * 2. Renderuje markdown stron z resolverem wikilinków.
 * 3. Skleja moduły ESM z src/srw w jeden zasięg (tools/module-graph.mjs).
 * 4. Wstrzykuje styl, dane (SRW_DATA) i kod do szkieletu index.html.
 *
 * Uruchomienie: node tools/build.mjs [--out dist/index.html]
 *
 * Artefakt działa identycznie z file:// i przez HTTPS — dlatego routing
 * jest po hashu, a wyszukiwanie po stronie przeglądarki.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { collectModules, assertNoNameCollisions, stripModuleSyntax } from './module-graph.mjs';
import { wczytajStrony, wczytajSkrypty, wczytajCoNowego } from './content-loader.mjs';
import { renderMarkdown } from '../src/srw/markdown.js';
import { parseWikilinks } from '../src/srw/links.js';
import {
  zbudujRejestr, resolverLinkow, walidujStrone, policzBacklinki, policzTagi, policzStatystyki,
  sprawdzWiernoscSceny,
} from '../src/srw/registry.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = 'src/srw/main.js';

/** Pola frontmattera, które są odsyłaczami (liczą się do grafu i backlinków). */
const POLA_ODSYLACZY = ['gra', 'seria', 'epizod', 'postacie', 'mechy', 'bronie', 'serie', 'gry', 'piloci'];

// ── Metadane czasu stron z historii gita ───────────────────────────
let ostrzezonoPlytki = false;
function ostrzezPlytkiKlon() {
  if (ostrzezonoPlytki) return;
  ostrzezonoPlytki = true;
  try {
    const shallow = execFileSync('git', ['rev-parse', '--is-shallow-repository'], { cwd: ROOT, encoding: 'utf8' }).trim();
    if (shallow === 'true') {
      console.warn('UWAGA: płytki klon gita — daty stron będą niepełne. Użyj fetch-depth: 0 w workflow.');
    }
  } catch { /* poza repozytorium — fallback na mtime */ }
}

function datyGit(sciezka) {
  ostrzezPlytkiKlon();
  try {
    const wyjscie = execFileSync('git',
      ['log', '--format=%ad', '--date=format-local:%Y-%m-%d %H:%M', '--', sciezka],
      { cwd: ROOT, encoding: 'utf8', env: { ...process.env, TZ: 'Europe/Warsaw' } });
    const daty = wyjscie.split('\n').filter(Boolean);
    if (daty.length > 0) return { utworzono: daty[daty.length - 1], zaktualizowano: daty[0] };
  } catch { /* git niedostępny */ }
  try {
    const st = fs.statSync(path.resolve(ROOT, sciezka));
    const f = (d) => new Date(d).toLocaleString('sv-SE', { timeZone: 'Europe/Warsaw' }).slice(0, 16);
    return { utworzono: f(st.mtime), zaktualizowano: f(st.mtime) };
  } catch { return { utworzono: null, zaktualizowano: null }; }
}

/** Tekst bez znaczników — dla wyszukiwarki po stronie przeglądarki. */
export function naTekst(md, limit = 8000) {
  const t = String(md)
    .replace(/!\[[^\]]*\]\([^)\s]+\)/g, ' ')
    .replace(/\[\[([^\]|]+?)\|([^\]]+?)\]\]/g, '$2')
    .replace(/\[\[([^\]]+?)\]\]/g, '$1')
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1')
    .replace(/^:::.*$/gm, ' ')
    .replace(/[#>*`|_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return t.length > limit ? t.slice(0, limit) : t;
}

/**
 * Składa dane bazy (walidacja → render markdown → SRW_DATA).
 * Wydzielone od pakowania artefaktu, żeby testy rendererów mogły
 * pracować na dokładnie tych samych danych, co witryna.
 */
export async function zbudujDane({ root = ROOT } = {}) {
  const problemy = [];

  // ── 1. Ładowanie treści ─────────────────────────────────────────
  const suroweStrony = wczytajStrony({ root });
  for (const s of suroweStrony) if (s.problem) problemy.push(s.problem);
  const strony = suroweStrony.filter((s) => !s.problem);

  const skrypty = wczytajSkrypty({ root });

  const coNowegoSurowe = wczytajCoNowego({ root });

  const { bySlug, duplikaty } = zbudujRejestr(strony);
  for (const d of duplikaty) problemy.push(`zduplikowany slug: ${d}`);

  const ctx = { bySlug };
  for (const s of strony) problemy.push(...walidujStrone(s, ctx));

  // Wierność scen (ADR 0008): treść sceny = dosłowny fragment skryptu jej epizodu.
  for (const s of strony) {
    if (s.typ !== 'scena') continue;
    const ep = bySlug.get(s.epizod);
    const tekst = ep?.skrypt ? skrypty.get(ep.skrypt) ?? null : null;
    problemy.push(...sprawdzWiernoscSceny(s, tekst));
  }

  // ── 2. Render markdown + odsyłacze ──────────────────────────────
  const resolver = resolverLinkow(bySlug);
  const wyrenderowane = new Map();
  const uzyteSkrypty = new Set();

  for (const s of strony) {
    const { html, problemy: mdProblemy } = renderMarkdown(s.body, { resolveLink: resolver, wymagajPoziomu: true });
    for (const pr of mdProblemy) problemy.push(`${s.slug}: ${pr}`);

    const linki = new Set(parseWikilinks(s.body).map((w) => w.slug));
    for (const pole of POLA_ODSYLACZY) {
      const wartosc = s[pole];
      if (Array.isArray(wartosc)) for (const cel of wartosc) linki.add(cel);
      else if (typeof wartosc === 'string' && wartosc !== '') linki.add(wartosc);
    }
    linki.delete(s.slug);

    let skryptTekst = null;
    if (s.typ === 'epizod' && s.skrypt) {
      if (skrypty.has(s.skrypt)) {
        skryptTekst = skrypty.get(s.skrypt);
        uzyteSkrypty.add(s.skrypt);
      } else {
        problemy.push(`${s.slug}: odsyłacz "skrypt: ${s.skrypt}" nie istnieje w repozytorium`);
      }
    }

    wyrenderowane.set(s.slug, { html, linki: [...linki], skryptTekst });
  }

  // Parzystość dostawy: skrypt bez wpisu epizodu = materiał do przetworzenia.
  for (const sciezka of skrypty.keys()) {
    if (!uzyteSkrypty.has(sciezka)) {
      problemy.push(`episodes/${sciezka.replace(/^episodes\//, '')}: skrypt bez wpisu epizodu (dodaj content/epizody/<slug>.md i zleć agentowi przetworzenie)`);
    }
  }

  // ── 3. Dziennik zmian ───────────────────────────────────────────
  const coNowego = coNowegoSurowe.map((w) => {
    const { html, problemy: mdProblemy } = renderMarkdown(w.tekst, { resolveLink: resolver });
    for (const pr of mdProblemy) problemy.push(`co-nowego.md (${w.data}): ${pr}`);
    return { data: w.data, tekst: naTekst(w.tekst, 400), html };
  });

  if (problemy.length > 0) {
    console.error('Build przerwany — problemy integralności bazy:');
    for (const p of problemy) console.error(`  - ${p}`);
    throw new Error(`Baza ma ${problemy.length} problem(ów); artefakt nie został zbudowany.`);
  }

  // ── 4. SRW_DATA ─────────────────────────────────────────────────
  const stronyDane = {};
  for (const s of strony) {
    const r = wyrenderowane.get(s.slug);
    const { problem, body, ...pola } = s;
    stronyDane[s.slug] = {
      ...pola,
      html: r.html,
      linki: r.linki,
      tekst: naTekst(body),
      czas: datyGit(s.plik),
      ...(r.skryptTekst ? { skryptTekst: r.skryptTekst, skryptOtwarty: false } : {}),
    };
  }

  const dane = {
    zbudowano: new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Warsaw' }).slice(0, 16).replace('T', ' '),
    strony: stronyDane,
    backlinki: policzBacklinki(strony.map((s) => ({ slug: s.slug, typ: s.typ, linki: wyrenderowane.get(s.slug).linki }))),
    tagi: policzTagi(strony),
    statystyki: policzStatystyki(strony.map((s) => ({ ...s, linki: wyrenderowane.get(s.slug).linki }))),
    coNowego,
  };

  const st = dane.statystyki;
  console.log(`Dane bazy: ${Object.keys(stronyDane).length} stron — gry: ${st.gra}, epizody: ${st.epizod}, postacie: ${st.postac}, mechy: ${st.mech}, bronie: ${st.bron}, serie: ${st.seria}`);
  console.log(`  powiązania: ${st.relacje} · skrypty: ${uzyteSkrypty.size}`);
  return dane;
}

export async function zbuduj({ out, root = ROOT } = {}) {
  out = out ?? path.join(root, 'dist/index.html');
  const dane = await zbudujDane({ root });

  // ── 5. Sklejanie artefaktu ──────────────────────────────────────
  const moduly = collectModules(ENTRY, { rootDir: ROOT });
  assertNoNameCollisions(moduly, { rootDir: ROOT });

  const kod = moduly
    .map(({ abs, source }) => {
      const rel = path.relative(ROOT, abs).replaceAll('\\', '/');
      return `// ===== ${rel} =====\n${stripModuleSyntax(source).trim()}`;
    })
    .join('\n\n');

  const daneJs = `// ===== SRW_DATA (wstrzyknięte przez build) =====\nglobalThis.SRW_DATA = ${JSON.stringify(dane, null, 2)};`;

  const shell = fs.readFileSync(path.join(ROOT, 'src/srw/index.html'), 'utf8');
  for (const znacznik of ['<!--STYL-->', '<!--BUNDLE-->']) {
    if (!shell.includes(znacznik)) throw new Error(`src/srw/index.html nie zawiera ${znacznik}`);
  }
  const css = fs.readFileSync(path.join(ROOT, 'src/srw/style.css'), 'utf8');

  // Zbezpiecznik wstrzykiwania do <script>: jedyna sekwencja kończąca blok
  // skryptu to '</script' — neutralizujemy ją w danych (skrypty epizodów
  // i treść mogą zawierać dowolny tekst).
  const doSkryptu = (s) => s.replaceAll('</script', '<\\/script');

  const html = shell
    .replace('<!--STYL-->', () => `<style>\n${css}\n</style>`)
    .replace('<!--BUNDLE-->', () => `<script>\n${doSkryptu(daneJs)}\n\n${kod}\n</script>`);

  const cel = path.resolve(out);
  fs.mkdirSync(path.dirname(cel), { recursive: true });
  fs.writeFileSync(cel, html);
  console.log(`Zbudowano ${path.relative(ROOT, cel)} (${(html.length / 1024).toFixed(1)} kB, ${moduly.length} modułów)`);
  return cel;
}

const jestMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (jestMain) {
  const i = process.argv.indexOf('--out');
  const out = i >= 0 ? process.argv[i + 1] : undefined;
  zbuduj({ out }).catch((e) => { console.error(e.message); process.exit(1); });
}
