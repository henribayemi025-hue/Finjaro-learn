import type { Lang } from './i18n'

export interface TableSql { nom: string; colonnes: string[] }

/** Découpe « a, b, c » sur les virgules qui ne sont dans aucune parenthèse. */
function decoupe(s: string): string[] {
  const out: string[] = []
  let prof = 0
  let cur = ''
  for (const ch of s) {
    if (ch === '(') prof++
    if (ch === ')') prof--
    if (ch === ',' && prof === 0) { out.push(cur); cur = '' } else cur += ch
  }
  if (cur.trim()) out.push(cur)
  return out
}

const CONTRAINTES = /^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)$/i

/** Les tables et leurs colonnes, lues dans le script de départ d'une leçon SQL (les CREATE TABLE). */
export function tablesDe(setup: string): TableSql[] {
  const res: TableSql[] = []
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?(\w+)["`]?\s*\(/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(setup))) {
    const debut = re.lastIndex
    let i = debut
    let prof = 1
    while (i < setup.length && prof > 0) {
      const c = setup[i]
      if (c === '(') prof++
      else if (c === ')') prof--
      i++
    }
    const colonnes = decoupe(setup.slice(debut, i - 1))
      .map((c) => c.trim().split(/\s+/)[0].replace(/["`]/g, ''))
      .filter((c) => c && !CONTRAINTES.test(c))
    res.push({ nom: m[1], colonnes })
  }
  return res
}

/** « products(id, name, price) ; sales(id, product_id) » */
export const resumeBase = (tables: TableSql[]) => tables.map((t) => `${t.nom}(${t.colonnes.join(', ')})`).join(' ; ')

/**
 * Ce qu'on dit au prof d'une leçon SQL : la vraie base de l'exercice.
 * Sans ça (Beau, 26/10 : « no such table: clients »), le prof inventait une table « clients » et l'élève
 * recopiait une requête qui ne pouvait pas marcher.
 */
export function contexteSql(titre: string, setup: string, lang: Lang): string {
  const r = resumeBase(tablesDe(setup))
  if (!r) return `[SQL] ${titre}`
  return lang === 'en'
    ? `[SQL] ${titre} — The exercise database already exists, with these tables only: ${r}. Never invent another table or column.`
    : `[SQL] ${titre} — La base de l’exercice existe déjà, avec ces tables seulement : ${r}. N’invente jamais une autre table ni une autre colonne.`
}
