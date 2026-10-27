// Les fichiers d'un projet de l'espace de travail : modules Python, données (csv, json), notes, notebooks.
// Gardés sur l'appareil, un jeu par leçon ou projet. Le fichier de la leçon (main.py) vit à part : c'est lui que les tests vérifient.

export interface Fichier { nom: string; contenu: string }

const CLE = (id: string) => 'learn:fs:' + id
export const TAILLE_MAX = 1_000_000

export function lireFichiers(id: string): Fichier[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLE(id)) ?? '[]')
    return Array.isArray(v) ? v.filter((f) => f && typeof f.nom === 'string' && typeof f.contenu === 'string') : []
  } catch { return [] }
}
export function ecrireFichiers(id: string, f: Fichier[]) { try { localStorage.setItem(CLE(id), JSON.stringify(f)) } catch { /* ignoré */ } }

export const extension = (nom: string) => (nom.includes('.') ? nom.split('.').pop()!.toLowerCase() : '')
export const estNotebook = (nom: string) => extension(nom) === 'ipynb'
export const estCode = (nom: string) => ['py', 'js', 'sql', 'html', 'css', 'json', 'md', 'txt', 'csv', 'yaml', 'yml', 'toml', 'cfg', 'ini'].includes(extension(nom)) || !nom.includes('.')

/** Un nom de fichier acceptable : lettres, chiffres, _ - . et / pour un dossier ; pas de .. ni de point au début. */
export function nomValide(nom: string): boolean {
  return /^[A-Za-z0-9_][A-Za-z0-9_\-./]{0,59}$/.test(nom) && !nom.includes('..') && !nom.endsWith('/') && !nom.includes('//')
}
/** Un nom libre, en ajoutant -2, -3… si besoin. */
export function nomLibre(base: string, pris: string[]): string {
  if (!pris.includes(base)) return base
  const i = base.lastIndexOf('.')
  const [a, b] = i > 0 ? [base.slice(0, i), base.slice(i)] : [base, '']
  for (let n = 2; n < 100; n++) if (!pris.includes(`${a}-${n}${b}`)) return `${a}-${n}${b}`
  return base
}

export function gabarit(nom: string): string {
  const e = extension(nom)
  if (e === 'py') return `# ${nom}\n\n`
  if (e === 'md') return `# ${nom.replace(/\.md$/, '')}\n\n`
  if (e === 'csv') return 'colonne1,colonne2\n1,2\n'
  if (e === 'json') return '{\n  \n}\n'
  if (e === 'ipynb') return JSON.stringify(carnetVide())
  return ''
}

// ───────── Notebooks (cellules de code et de texte) ─────────
export interface Cellule { id: string; type: 'code' | 'texte'; source: string }
export interface Carnet { cellules: Cellule[] }
let compteur = 0
export const idCellule = () => 'c' + Date.now().toString(36) + (compteur++).toString(36)
export const carnetVide = (): Carnet => ({ cellules: [{ id: idCellule(), type: 'texte', source: '# Mon carnet\n\nÉcris du texte ici, puis du code dessous.' }, { id: idCellule(), type: 'code', source: 'print("Bonjour")' }] })
export function lireCarnet(contenu: string): Carnet {
  try {
    const o = JSON.parse(contenu)
    if (o && Array.isArray(o.cellules)) return { cellules: o.cellules.filter((c: Cellule) => c && typeof c.source === 'string').map((c: Cellule) => ({ id: c.id || idCellule(), type: c.type === 'texte' ? 'texte' : 'code', source: c.source })) }
    // Un vrai fichier Jupyter (nbformat) importé : cells / cell_type / source (liste de lignes).
    if (o && Array.isArray(o.cells)) return { cellules: o.cells.map((c: { cell_type?: string; source?: string | string[] }) => ({ id: idCellule(), type: c.cell_type === 'markdown' ? 'texte' as const : 'code' as const, source: Array.isArray(c.source) ? c.source.join('') : String(c.source ?? '') })) }
  } catch { /* contenu invalide */ }
  return carnetVide()
}

// ───────── Instantanés : l'historique local du fichier de la leçon (comme la chronologie de VS Code) ─────────
export interface Instantane { t: number; code: string; etiquette: string }
const CLE_SNAP = (id: string) => 'learn:snap:' + id
export function lireInstantanes(id: string): Instantane[] {
  try { const v = JSON.parse(localStorage.getItem(CLE_SNAP(id)) ?? '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
}
export function ajouterInstantane(id: string, code: string, etiquette: string): Instantane[] {
  const l = lireInstantanes(id)
  if (l[0]?.code === code) return l
  const n = [{ t: Date.now(), code, etiquette }, ...l].slice(0, 30)
  try { localStorage.setItem(CLE_SNAP(id), JSON.stringify(n)) } catch { /* ignoré */ }
  return n
}
