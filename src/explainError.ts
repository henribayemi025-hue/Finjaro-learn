import type { Lang } from './i18n'

type R = { re: RegExp; fr: (m: RegExpMatchArray) => string; en: (m: RegExpMatchArray) => string }

/** Phrase simple pour les erreurs les plus courantes. null si on ne reconnaît pas l'erreur (on montre alors le message brut). */
const REGLES: R[] = [
  { re: /Timeout/i, fr: () => 'Ton programme tourne sans fin : une boucle ne s’arrête jamais. Vérifie que sa condition finit par devenir fausse.', en: () => 'Your program never ends: a loop never stops. Check that its condition eventually becomes false.' },
  { re: /IndentationError|unexpected indent|expected an indented block|unindent does not match/i, fr: () => 'Problème de décalage (indentation) : en Python, les lignes d’un même bloc doivent commencer exactement au même endroit, et un bloc après « : » doit être décalé de 4 espaces.', en: () => 'Indentation problem: in Python, lines of the same block must start at exactly the same place, and a block after “:” must be indented by 4 spaces.' },
  { re: /expected ':'/i, fr: () => 'Il manque les deux-points « : » à la fin d’une ligne qui commence par if, for, while, def, else…', en: () => 'A colon “:” is missing at the end of a line starting with if, for, while, def, else…' },
  { re: /was never closed|unexpected EOF|EOF while parsing|Unexpected end of input|missing \) after argument list|unmatched|does not match opening parenthesis/i, fr: () => 'Une parenthèse, un crochet ou une accolade n’est pas fermé (ou fermé en trop). Compte les ( ) [ ] { } ligne par ligne.', en: () => 'A parenthesis, bracket or brace is not closed (or closed once too often). Count the ( ) [ ] { } line by line.' },
  { re: /unterminated string|EOL while scanning|Invalid or unexpected token|unterminated string literal/i, fr: () => 'Un guillemet n’est pas fermé : chaque texte doit commencer ET finir par le même guillemet, " ou \'.', en: () => 'A quote is not closed: every text must start AND end with the same quote, " or \'.' },
  { re: /name '([^']+)' is not defined|(\w+) is not defined/, fr: (m) => `Le nom « ${m[1] ?? m[2]} » est inconnu : faute de frappe, majuscule oubliée, ou variable utilisée avant d’être créée.`, en: (m) => `The name “${m[1] ?? m[2]}” is unknown: a typo, a missing capital, or a variable used before it was created.` },
  { re: /can only concatenate str|unsupported operand type|must be str, not int|can't multiply sequence/i, fr: () => 'Tu mélanges du texte et des nombres. Convertis d’abord : str(nombre) pour coller à un texte, int(texte) pour calculer.', en: () => 'You are mixing text and numbers. Convert first: str(number) to join with text, int(text) to compute.' },
  { re: /ZeroDivisionError|division by zero/i, fr: () => 'Division par zéro : vérifie le nombre par lequel tu divises (une liste vide donne souvent 0).', en: () => 'Division by zero: check the number you divide by (an empty list often gives 0).' },
  { re: /index out of range/i, fr: () => 'Tu demandes une position qui n’existe pas : une liste de 3 éléments a les positions 0, 1 et 2.', en: () => 'You ask for a position that does not exist: a 3-item list has positions 0, 1 and 2.' },
  { re: /KeyError: '?([^'\n]+)'?/, fr: (m) => `La clé « ${m[1]} » n’existe pas dans le dictionnaire. Utilise d.get(clé, valeur_par_défaut) ou vérifie avec « in ».`, en: (m) => `The key “${m[1]}” is not in the dictionary. Use d.get(key, default) or check with “in”.` },
  { re: /has no attribute '([^']+)'/, fr: (m) => `« ${m[1]} » n’existe pas pour ce type de valeur : vérifie l’orthographe, ou le type (liste, texte, nombre…).`, en: (m) => `“${m[1]}” does not exist for this kind of value: check the spelling, or the type (list, text, number…).` },
  { re: /is not a function|object is not callable/i, fr: () => 'Tu appelles avec ( ) quelque chose qui n’est pas une fonction : vérifie le nom, ou retire les parenthèses.', en: () => 'You call with ( ) something that is not a function: check the name, or remove the parentheses.' },
  { re: /missing \d+ required positional argument|takes \d+ positional argument/i, fr: () => 'Le nombre de valeurs données à la fonction ne correspond pas à sa définition : compare l’appel et la ligne def.', en: () => 'The number of values given to the function does not match its definition: compare the call and the def line.' },
  { re: /invalid literal for int\(\)/i, fr: () => 'int() ne peut convertir qu’un texte qui contient un nombre entier (pas de lettres, pas de virgule).', en: () => 'int() can only convert text containing a whole number (no letters, no decimal point).' },
  { re: /SyntaxError|Unexpected token/i, fr: () => 'Le code est mal écrit à un endroit (symbole en trop ou manquant). Regarde la ligne indiquée et celle juste avant.', en: () => 'The code is malformed somewhere (a symbol too many or missing). Look at the indicated line and the one just before.' },
]

export function expliqueErreur(err: string, lang: Lang): string | null {
  for (const r of REGLES) {
    const m = err.match(r.re)
    if (m) return r[lang](m)
  }
  return null
}
