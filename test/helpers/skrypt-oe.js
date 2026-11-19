// Surowa dostawa zachowuje etykiety ekstraktu. Log rozgrywki i strony OE — nie.
export function bezEtykietDialogow(tekst) {
  return tekst.replace(/^#{1,6} (?:Dialogi (?:bojowe|treningowe|warunkowe|sytuacyjne)\b[^\n]*|Warunkowe dialogi bitewne)\n(?:\n)?/gm, '');
}
