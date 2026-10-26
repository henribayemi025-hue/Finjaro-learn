import type { Lang } from './i18n'

// Un petit contrôle de code Python SANS modèle, pour que la revue du code ne rate jamais l'évident
// (Beau, 26/10 : « c'est un peu grossier » : Traque disait « rien à signaler » alors que `somme` n'était jamais créée).
// Il ne remplace pas Python : il cherche les noms jamais définis et les variables jamais utilisées.

const MOTS_PYTHON = new Set(('False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case').split(' '))
const PREDEFINIS = new Set(('abs all any bin bool bytes callable chr dict dir divmod enumerate eval exec filter float format frozenset getattr hasattr hash hex id input int isinstance issubclass iter len list map max min next object oct open ord pow print range repr reversed round set setattr slice sorted str sum super tuple type vars zip ' +
  'Exception ValueError TypeError KeyError IndexError RuntimeError ZeroDivisionError StopIteration AttributeError NameError ImportError OSError AssertionError NotImplementedError ' +
  'math random json re os sys time datetime np pd plt numpy pandas courbe nuage barres reseau __name__ __file__ self cls').split(' '))

/** Le code sans les commentaires ni les textes (les expressions des f-strings, elles, sont gardées). */
function nettoyer(code: string): string {
  let out = '', i = 0
  while (i < code.length) {
    const c = code[i]
    if (c === '#') { while (i < code.length && code[i] !== '\n') i++; continue }
    const prefixe = /[fF]/.test(code[i - 1] ?? '') && !/\w/.test(code[i - 2] ?? '')
    if (c === '"' || c === "'") {
      const triple = code.slice(i, i + 3) === c.repeat(3)
      const fin = triple ? c.repeat(3) : c
      let j = i + fin.length
      let contenu = ''
      while (j < code.length && code.slice(j, j + fin.length) !== fin) {
        if (code[j] === '\\') { j += 2; continue }
        if (!triple && code[j] === '\n') break
        contenu += code[j]; j++
      }
      if (prefixe) out = out.slice(0, -1)
      if (prefixe) for (const m of contenu.matchAll(/\{([^{}]*)\}/g)) out += ' ' + m[1].replace(/[:!].*$/, '') + ' '
      out += ' '
      i = j + fin.length
      continue
    }
    out += c; i++
  }
  return out
}

export interface Constats { indefinis: { nom: string; ligne: number }[]; inutilises: { nom: string; ligne: number }[] }

export function controlerPython(code: string): Constats {
  const net = nettoyer(code)
  const definis = new Set<string>()
  const ajouter = (liste: string) => { for (const n of liste.split(',')) { const m = n.trim().match(/^\*?([A-Za-z_]\w*)/); if (m) definis.add(m[1]) } }
  for (const m of net.matchAll(/^[ \t]*([A-Za-z_][\w ,.*\[\]()]*?)\s*=(?!=)/gm)) {
    if (!/[.\[]/.test(m[1])) ajouter(m[1].replace(/[()]/g, ''))
  }
  for (const m of net.matchAll(/\bfor\s+([\w ,()*]+?)\s+in\b/g)) ajouter(m[1].replace(/[()]/g, ''))
  for (const m of net.matchAll(/\bdef\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/g)) { definis.add(m[1]); for (const p of m[2].split(',')) { const q = p.trim().match(/^\*{0,2}([A-Za-z_]\w*)/); if (q) definis.add(q[1]) } }
  for (const m of net.matchAll(/\bclass\s+([A-Za-z_]\w*)/g)) definis.add(m[1])
  for (const m of net.matchAll(/\blambda\s+([^:]*):/g)) ajouter(m[1])
  for (const m of net.matchAll(/\bimport\s+([^\n]+)/g)) for (const part of m[1].split(',')) { const q = part.trim().split(/\s+as\s+/); const n = (q[1] ?? q[0]).split('.')[0].trim(); if (n) definis.add(n) }
  for (const m of net.matchAll(/\bas\s+([A-Za-z_]\w*)/g)) definis.add(m[1])
  for (const m of net.matchAll(/\b:=\s*/g)) void m
  for (const m of net.matchAll(/([A-Za-z_]\w*)\s*:=/g)) definis.add(m[1])
  // Noms utilisés : un identifiant qui n'est pas un attribut (précédé d'un point) ni un argument nommé (suivi de = dans un appel).
  const lignes = net.split('\n')
  const utilises: { nom: string; ligne: number }[] = []
  lignes.forEach((l, k) => {
    if (/^\s*(import|from)\b/.test(l)) return
    for (const m of l.matchAll(/(^|[^\w.])([A-Za-z_]\w*)/g)) {
      const nom = m[2]
      const apres = l.slice((m.index ?? 0) + m[0].length)
      if (/^\s*=(?!=)/.test(apres) && /\(/.test(l.slice(0, (m.index ?? 0) + 1)) && !/^[ \t]*[A-Za-z_]/.test(l.slice(0, 0))) { /* argument nommé probable */ if (l.slice(0, m.index ?? 0).includes('(')) continue }
      utilises.push({ nom, ligne: k + 1 })
    }
  })
  const vus = new Set<string>(), indefinis: Constats['indefinis'] = []
  for (const u of utilises) {
    if (MOTS_PYTHON.has(u.nom) || PREDEFINIS.has(u.nom) || definis.has(u.nom) || vus.has(u.nom)) continue
    vus.add(u.nom); indefinis.push(u)
  }
  const compte = new Map<string, number>()
  for (const u of utilises) compte.set(u.nom, (compte.get(u.nom) ?? 0) + 1)
  const inutilises: Constats['inutilises'] = []
  lignes.forEach((l, k) => {
    const m = l.match(/^[ \t]*([A-Za-z_]\w*)\s*=(?!=)/)
    if (m && (compte.get(m[1]) ?? 0) <= 1 && !m[1].startsWith('_') && !inutilises.some((x) => x.nom === m[1])) inutilises.push({ nom: m[1], ligne: k + 1 })
  })
  return { indefinis, inutilises }
}

/** Les constats en phrases, pour le prompt de la revue ou pour l'affichage. */
export function constatsEnTexte(c: Constats, lang: Lang): string {
  const fr = lang === 'fr'
  const liste = (a: { nom: string; ligne: number }[]) => a.map((x) => `« ${x.nom} » (${fr ? 'ligne' : 'line'} ${x.ligne})`).join(', ')
  const p: string[] = []
  if (c.indefinis.length) p.push(fr ? `Noms utilisés mais jamais définis (une erreur NameError au lancement) : ${liste(c.indefinis)}.` : `Names used but never defined (a NameError when run): ${liste(c.indefinis)}.`)
  if (c.inutilises.length) p.push(fr ? `Variables créées mais jamais utilisées : ${liste(c.inutilises)}.` : `Variables created but never used: ${liste(c.inutilises)}.`)
  return p.join(' ')
}
