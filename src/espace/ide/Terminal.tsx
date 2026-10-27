import { useEffect, useRef, useState } from 'react'
import { Ico } from '../../Icones'
import { paquetsCharges, pipInstaller, redemarrerTerminal, terminalPython } from '../../runner'
import type { Lang } from '../../i18n'

export interface LigneTerm { k: 'in' | 'out' | 'val' | 'err' | 'info' | 'img'; t: string }
const T = {
  fr: { invite: 'Tape du Python (Maj+Entrée pour une ligne de plus) ou une commande : help', aide: ['help : cette aide', 'clear : vider le terminal', 'ls : les fichiers du projet', 'pip install nom : installer un paquet PyPI', 'pip list : les bibliothèques chargées', 'restart : repartir d’un interpréteur neuf'], vide: 'Terminal Python : les variables restent d’une commande à l’autre.', exec: 'Exécution…', redemarre: 'Interpréteur redémarré.', pipDebut: (n: string) => `Installation de ${n}…`, pipOk: (n: string) => `${n} installé.`, effacer: 'Vider', redemarrer: 'Redémarrer', pipUsage: 'Usage : pip install nom-du-paquet' },
  en: { invite: 'Type Python (Shift+Enter for a new line) or a command: help', aide: ['help: this help', 'clear: empty the terminal', 'ls: the project files', 'pip install name: install a PyPI package', 'pip list: the loaded libraries', 'restart: start from a fresh interpreter'], vide: 'Python terminal: variables stay from one command to the next.', exec: 'Running…', redemarre: 'Interpreter restarted.', pipDebut: (n: string) => `Installing ${n}…`, pipOk: (n: string) => `${n} installed.`, effacer: 'Clear', redemarrer: 'Restart', pipUsage: 'Usage: pip install package-name' },
}

export default function Terminal({ lang, lignes, setLignes, fichiers, onAgent }: {
  lang: Lang; lignes: LigneTerm[]; setLignes: React.Dispatch<React.SetStateAction<LigneTerm[]>>; fichiers: string[]
  /** Demander de l'aide à l'agent sur la dernière erreur du terminal. */
  onAgent?: (erreur: string) => void
}) {
  const t = T[lang]
  const [saisie, setSaisie] = useState('')
  const [occupe, setOccupe] = useState(false)
  const [histo, setHisto] = useState<string[]>([])
  const [pos, setPos] = useState(-1)
  const fin = useRef<HTMLDivElement>(null)
  useEffect(() => { fin.current?.scrollIntoView({ block: 'end' }) }, [lignes, occupe])
  const ajouter = (...l: LigneTerm[]) => setLignes((x) => [...x, ...l].slice(-300))

  const lancer = async () => {
    const cmd = saisie.trim()
    if (!cmd || occupe) return
    setSaisie(''); setPos(-1); setHisto((h) => [cmd, ...h.filter((x) => x !== cmd)].slice(0, 50))
    ajouter({ k: 'in', t: cmd })
    if (cmd === 'clear') { setLignes([]); return }
    if (cmd === 'help' || cmd === '?') { ajouter(...t.aide.map((x) => ({ k: 'info' as const, t: x }))); return }
    if (cmd === 'ls') { ajouter({ k: 'out', t: fichiers.join('   ') || '.' }); return }
    if (cmd === 'restart') { setOccupe(true); await redemarrerTerminal(); setOccupe(false); ajouter({ k: 'info', t: t.redemarre }); return }
    const pip = /^(?:!|%)?pip\s+(install|list)\b\s*(.*)$/.exec(cmd)
    if (pip) {
      setOccupe(true)
      if (pip[1] === 'list') { const l = await paquetsCharges(); ajouter({ k: 'out', t: l.length ? l.join('\n') : '(vide)' }) }
      else {
        const noms = pip[2].trim()
        if (!noms) ajouter({ k: 'err', t: t.pipUsage })
        else {
          ajouter({ k: 'info', t: t.pipDebut(noms) })
          const r = await pipInstaller(noms.split(/\s+/))
          ajouter(r.ok ? { k: 'info', t: t.pipOk(noms) } : { k: 'err', t: r.error ?? 'Erreur' })
        }
      }
      setOccupe(false); return
    }
    setOccupe(true)
    const r = await terminalPython(cmd)
    setOccupe(false)
    const l: LigneTerm[] = []
    if (r.output.length) l.push({ k: 'out', t: r.output.join('\n') })
    if (r.valeur !== null) l.push({ k: 'val', t: r.valeur })
    for (const src of r.images) l.push({ k: 'img', t: src })
    if (r.error) l.push({ k: 'err', t: r.error })
    ajouter(...l)
  }
  const derniereErreur = [...lignes].reverse().find((l) => l.k === 'err')?.t

  return (
    <div className="h-full flex flex-col min-h-0 font-mono text-[12.5px] text-[var(--tx)]">
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 leading-relaxed" aria-live="polite" onClick={() => document.getElementById('ide-term-input')?.focus()}>
        {lignes.length === 0 && <p className="text-[var(--tx3)] font-sans">{t.vide}</p>}
        {lignes.map((l, i) => l.k === 'img'
          ? <img key={i} src={l.t} alt="" className="my-1 max-w-full max-h-[300px] rounded border border-[var(--bd)] bg-white" />
          : <pre key={i} className={`whitespace-pre-wrap break-words ${l.k === 'in' ? 'text-white' : l.k === 'err' ? 'text-[var(--er)]' : l.k === 'val' ? 'text-[#4ec9b0]' : l.k === 'info' ? 'text-[var(--tx2)] font-sans' : ''}`}>{l.k === 'in' ? <><span className="text-[var(--ac2)] select-none">&gt;&gt;&gt; </span>{l.t}</> : l.t}</pre>)}
        {occupe && <p className="text-[var(--tx2)] font-sans animate-pulse">{t.exec}</p>}
        <div ref={fin} />
      </div>
      <div className="shrink-0 border-t border-[var(--bd)] flex items-start gap-2 px-3 py-1.5 bg-[var(--b1)]">
        <span className="pt-0.5 text-[var(--ac2)] select-none">&gt;&gt;&gt;</span>
        <textarea id="ide-term-input" value={saisie} rows={Math.min(5, Math.max(1, saisie.split('\n').length))} onChange={(e) => setSaisie(e.target.value)} placeholder={t.invite} aria-label="Terminal" spellCheck={false} autoCapitalize="off" autoCorrect="off"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void lancer() }
            else if (e.key === 'ArrowUp' && !saisie.includes('\n') && histo.length) { e.preventDefault(); const n = Math.min(histo.length - 1, pos + 1); setPos(n); setSaisie(histo[n]) }
            else if (e.key === 'ArrowDown' && pos >= 0) { e.preventDefault(); const n = pos - 1; setPos(n); setSaisie(n >= 0 ? histo[n] : '') }
          }}
          className="flex-1 min-w-0 resize-none bg-transparent outline-none text-white placeholder:text-[var(--tx3)] leading-relaxed" />
        {onAgent && derniereErreur && <button onClick={() => onAgent(derniereErreur)} className="shrink-0 h-6 px-2 rounded border border-[var(--bd)] hover:bg-[#2a2d2e] font-sans text-[11.5px] text-[var(--ac2)]">{lang === 'fr' ? 'Expliquer l’erreur' : 'Explain the error'}</button>}
        <button onClick={() => setLignes([])} title={t.effacer} aria-label={t.effacer} className="shrink-0 size-6 grid place-items-center rounded hover:bg-[#ffffff1a] text-[var(--tx2)]"><Ico n="eraser" className="size-3.5" /></button>
      </div>
    </div>
  )
}
