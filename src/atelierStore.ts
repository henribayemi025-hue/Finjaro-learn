// Atelier : la copie de travail des projets reste SUR L'APPAREIL (IndexedDB). La V2 (atelierCompte.ts) ajoute une sauvegarde
// dans le compte, seulement quand la personne la demande.

export interface Fichier { chemin: string; contenu: string }
export interface Projet {
  id: string; titre: string; lang: 'py' | 'js'; principal: string; fichiers: Fichier[]; maj: string
  /** Sauvegarde dans le compte (V2) : identifiant côté base, empreinte de chaque fichier envoyé, date de la sauvegarde. */
  compteId?: string; compteSnap?: Record<string, string>; compteMaj?: string
}

const DB = 'learn-atelier'
const STORE = 'projets'

function ouvrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => { r.result.createObjectStore(STORE, { keyPath: 'id' }) }
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await ouvrir()
  return new Promise((resolve, reject) => {
    const req = f(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export const listeProjets = async () => ((await tx<Projet[]>('readonly', (s) => s.getAll())) ?? []).sort((a, b) => b.maj.localeCompare(a.maj))
export const lireProjet = (id: string) => tx<Projet | undefined>('readonly', (s) => s.get(id))
export const sauverProjet = (p: Projet) => tx('readwrite', (s) => s.put({ ...p, maj: new Date().toISOString() }))
export const supprimerProjet = (id: string) => tx('readwrite', (s) => s.delete(id))

export const nouvelId = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

/** Fichier d'export : un JSON lisible, réimportable. */
export function exporter(p: Projet) {
  const { compteId: _c, compteSnap: _s, compteMaj: _m, ...projet } = p
  const blob = new Blob([JSON.stringify({ format: 'finjaro-learn-atelier', version: 1, projet }, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = p.titre.replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '') + '.finjaro.json'
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

/** Lecture prudente d'un fichier importé : seuls des fichiers texte simples sont acceptés. */
export function importer(texte: string): Projet | null {
  try {
    const d = JSON.parse(texte)
    const p = d?.projet
    if (d?.format !== 'finjaro-learn-atelier' || !p || !Array.isArray(p.fichiers)) return null
    const fichiers: Fichier[] = p.fichiers
      .filter((f: Fichier) => typeof f?.chemin === 'string' && typeof f?.contenu === 'string' && /^[\p{L}\p{N}_./-]{1,80}$/u.test(f.chemin) && !f.chemin.includes('..'))
      .slice(0, 50)
      .map((f: Fichier) => ({ chemin: f.chemin, contenu: f.contenu.slice(0, 200_000) }))
    if (!fichiers.length) return null
    const lang = p.lang === 'js' ? 'js' : 'py'
    const principal = fichiers.some((f) => f.chemin === p.principal) ? p.principal : fichiers[0].chemin
    return { id: nouvelId(), titre: String(p.titre ?? 'Projet importé').slice(0, 80), lang, principal, fichiers, maj: new Date().toISOString() }
  } catch {
    return null
  }
}

/** Python multi-fichiers : les autres fichiers sont écrits dans le disque virtuel de Python, puis le fichier principal s'exécute. */
export function codePython(p: Projet) {
  const autres = Object.fromEntries(p.fichiers.filter((f) => f.chemin !== p.principal).map((f) => [f.chemin, f.contenu]))
  const principal = p.fichiers.find((f) => f.chemin === p.principal)?.contenu ?? ''
  const prelude = [
    'import os as __os, sys as __sys, json as __json',
    "__os.makedirs('/atelier', exist_ok=True)",
    "__os.chdir('/atelier')",
    `for __c, __t in __json.loads(${JSON.stringify(JSON.stringify(autres))}).items():`,
    "    __d = __os.path.dirname(__c)",
    '    if __d: __os.makedirs(__d, exist_ok=True)',
    "    open(__c, 'w', encoding='utf-8').write(__t)",
    "if '/atelier' not in __sys.path: __sys.path.insert(0, '/atelier')",
    // Les fonctions de dessin (courbe, nuage, barres, reseau) servent aussi dans les autres fichiers du projet.
    'import builtins as __b',
    "for __n in ('courbe', 'nuage', 'barres', 'reseau'):",
    '    if __n in globals(): setattr(__b, __n, globals()[__n])',
    "for __m in [m for m, v in list(__sys.modules.items()) if getattr(v, '__file__', '') and str(getattr(v, '__file__', '')).startswith('/atelier')]: del __sys.modules[__m]",
  ].join('\n')
  return prelude + '\n' + principal
}

/** JavaScript : les autres fichiers .js passent avant le principal (fonctions partagées). */
export function codeJs(p: Projet) {
  const autres = p.fichiers.filter((f) => f.chemin !== p.principal && f.chemin.endsWith('.js')).map((f) => `// ── ${f.chemin}\n${f.contenu}`)
  const principal = p.fichiers.find((f) => f.chemin === p.principal)?.contenu ?? ''
  return [...autres, principal].join('\n\n')
}
