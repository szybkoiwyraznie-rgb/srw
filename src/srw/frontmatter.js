/**
 * Parser frontmattera — ŚCISŁY podzbiór YAML (ADR 0002).
 *
 * Obsługiwane (dokładnie tyle, ile wymaga schemat stron — ADR 0003):
 *   klucz: wartość            (string / liczba / true / false / null)
 *   klucz: [a, b, c]          (tablica inline)
 *   klucz:                    (tablica blokowa)
 *     - element
 *   klucz:                    (obiekt jednopoziomowy)
 *     pole: wartość
 *   # komentarz (tylko pełna linia)
 *
 * Wszystko inne to BŁĄD. Nieznana składnia nie może być cicho przełknięta:
 * lepszy czerwony test niż zmutowane dane.
 *
 * Wartości bez cudzysłowów są stringami, poza literałami true/false/null
 * i liczbami. Stringi z ':' albo '#' w środku trzeba ująć w cudzysłów.
 */

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const KEY_RE = /^[A-Za-ząćęłńóśźżĄĆĘŁŃÓŚŹŻ][\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ-]*$/;

export function parseFrontmatter(raw) {
  const m = String(raw).match(FM_RE);
  if (!m) return { data: null, body: String(raw) };
  const data = parseYamlSubset(m[1]);
  return { data, body: String(raw).slice(m[0].length) };
}

function parseYamlSubset(text) {
  const lines = text.split(/\r?\n/);
  const out = {};
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '' || /^\s*#/.test(line)) { i += 1; continue; }

    const kv = line.match(/^([A-Za-ząćęłńóśźżĄĆĘŁŃÓŚŹŻ][\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ-]*):\s*(.*)$/);
    if (!kv) throw new Error(`frontmatter: nierozpoznana linia ${i + 1}: ${JSON.stringify(line)}`);
    const key = kv[1];
    if (Object.prototype.hasOwnProperty.call(out, key)) {
      throw new Error(`frontmatter: zduplikowany klucz "${key}" (linia ${i + 1})`);
    }
    const rest = kv[2].trim();

    if (rest === '') {
      const indent = indentOf(lines[i + 1] ?? '');
      if (indent === null) throw new Error(`frontmatter: klucz "${key}" bez wartości (linia ${i + 1})`);
      const children = [];
      let j = i + 1;
      while (j < lines.length) {
        const l = lines[j];
        if (l.trim() === '') { j += 1; continue; }
        const ind = indentOf(l);
        if (ind === null || ind < indent) break;
        if (ind > indent) throw new Error(`frontmatter: zbyt głębokie wcięcie (linia ${j + 1}) — obsługiwany jest tylko jeden poziom`);
        children.push(l.trim());
        j += 1;
      }
      if (children.length === 0) throw new Error(`frontmatter: pusty blok "${key}" (linia ${i + 1})`);

      if (children.every((c) => c.startsWith('- ') || c === '-')) {
        out[key] = children.map((c) => parseScalar(c.replace(/^-\s*/, ''), key, i + 1));
      } else if (children.every((c) => /^[A-Za-ząćęłńóśźżĄĆĘŁŃÓŚŹŻ][\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ-]*:\s*/.test(c))) {
        const obj = {};
        for (const c of children) {
          const ck = c.match(/^([A-Za-ząćęłńóśźżĄĆĘŁŃÓŚŹŻ][\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ-]*):\s*(.*)$/);
          if (Object.prototype.hasOwnProperty.call(obj, ck[1])) {
            throw new Error(`frontmatter: zduplikowane pole "${ck[1]}" w "${key}"`);
          }
          obj[ck[1]] = parseScalar(ck[2].trim(), key, i + 1);
        }
        out[key] = obj;
      } else {
        throw new Error(`frontmatter: mieszany blok pod "${key}" (linia ${i + 1})`);
      }
      i = j;
    } else if (rest.startsWith('[')) {
      if (!rest.endsWith(']')) throw new Error(`frontmatter: niedomknięta tablica inline pod "${key}" (linia ${i + 1})`);
      const inner = rest.slice(1, -1).trim();
      out[key] = inner === '' ? [] : inner.split(',').map((s) => parseScalar(s.trim(), key, i + 1));
      i += 1;
    } else {
      out[key] = parseScalar(rest, key, i + 1);
      i += 1;
    }
  }
  return out;
}

function indentOf(line) {
  const m = line.match(/^(\s+)\S/);
  return m ? m[1].length : null;
}

function parseScalar(s, key, lineno) {
  if (s === '') return '';
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null' || s === '~') return null;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  // Adres URL jest jednoznaczny mimo dwukropka i krzyżyka — pole `zrodla`
  // wypełnia się nimi masowo i wymaganie cudzysłowów byłoby pułapką.
  if (/^https?:\/\/\S+$/.test(s)) return s;
  if (/[:#]/.test(s)) {
    throw new Error(`frontmatter: wartość "${s}" pod "${key}" zawiera ":" lub "#" — ujmij w cudzysłów (linia ${lineno})`);
  }
  return s;
}

export { KEY_RE };
