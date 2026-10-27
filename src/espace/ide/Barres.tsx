import { Ico, type NomIcone } from '../../Icones'
import type { Lang } from '../../i18n'

export type VueLaterale = 'lecon' | 'fichiers' | 'recherche' | 'paquets' | 'plan' | 'historique'

/** La barre d'activité (à gauche) : les vues de la barre latérale, comme dans VS Code. */
export function BarreActivite({ lang, vue, ouverte, onVue, onPalette, onReglages }: {
  lang: Lang; vue: VueLaterale; ouverte: boolean; onVue: (v: VueLaterale) => void; onPalette: () => void; onReglages: () => void
}) {
  const fr = lang === 'fr'
  const items: { v: VueLaterale; n: NomIcone; titre: string }[] = [
    { v: 'lecon', n: 'book', titre: fr ? 'Leçon' : 'Lesson' },
    { v: 'fichiers', n: 'files', titre: fr ? 'Explorateur' : 'Explorer' },
    { v: 'recherche', n: 'search', titre: fr ? 'Recherche' : 'Search' },
    { v: 'paquets', n: 'pkg', titre: fr ? 'Bibliothèques' : 'Libraries' },
    { v: 'plan', n: 'tree', titre: fr ? 'Plan du fichier' : 'Outline' },
    { v: 'historique', n: 'history', titre: fr ? 'Historique local' : 'Local history' },
  ]
  const b = 'relative size-12 grid place-items-center text-[var(--tx2)] hover:text-white'
  return (
    <nav className="hidden lg:flex shrink-0 w-12 flex-col bg-[var(--b0)] border-r border-[var(--bd)]" aria-label={fr ? 'Barre d’activité' : 'Activity bar'}>
      {items.map((i) => {
        const actif = ouverte && vue === i.v
        return (
          <button key={i.v} onClick={() => onVue(i.v)} title={i.titre} aria-label={i.titre} aria-pressed={actif} className={b + (actif ? ' !text-white' : '')}>
            {actif && <span className="absolute left-0 inset-y-2 w-0.5 bg-[var(--ac2)]" />}
            <Ico n={i.n} className="size-[22px]" />
          </button>
        )
      })}
      <span className="flex-1" />
      <button onClick={onPalette} title={(fr ? 'Palette de commandes' : 'Command palette') + ' (Ctrl+K)'} aria-label={fr ? 'Palette de commandes' : 'Command palette'} className={b}><Ico n="command" className="size-5" /></button>
      <button onClick={onReglages} title={fr ? 'Réglages' : 'Settings'} aria-label={fr ? 'Réglages' : 'Settings'} className={b}><Ico n="sliders" className="size-5" /></button>
    </nav>
  )
}

/** La barre d'état (en bas) : branche, problèmes, interpréteur, curseur, agent, tests. */
export function BarreEtat({ lang, erreurs, avertissements, onProblemes, ligne, colonne, langage, bibliotheques, onBibliotheques, agent, agentEtat, tests, onTests, instantanes, onHistorique }: {
  lang: Lang; erreurs: number; avertissements: number; onProblemes: () => void; ligne: number; colonne: number; langage: string
  bibliotheques: number; onBibliotheques: () => void; agent: { nom: string; face?: string }; agentEtat: 'pret' | 'reflechit' | 'hors'
  tests: { ok: number; total: number } | null; onTests: () => void; instantanes: number; onHistorique: () => void
}) {
  const fr = lang === 'fr'
  const cell = 'h-full px-2 flex items-center gap-1.5 hover:bg-[#ffffff14] whitespace-nowrap'
  return (
    <footer className="hidden lg:flex shrink-0 h-[22px] items-stretch text-[11.5px] text-[var(--tx2)] bg-[var(--b0)] border-t border-[var(--bd)] select-none" role="status">
      <button onClick={onHistorique} className={cell} title={fr ? 'Historique local' : 'Local history'}><Ico n="branch" className="size-3" />{fr ? 'local' : 'local'}{instantanes > 0 && <span className="text-[var(--tx3)]">· {instantanes}</span>}</button>
      <button onClick={onProblemes} className={cell} title={fr ? 'Problèmes' : 'Problems'}>
        <Ico n="x" className={`size-3 ${erreurs ? 'text-[var(--er)]' : ''}`} />{erreurs}
        <Ico n="warn" className={`size-3 ml-1 ${avertissements ? 'text-[var(--wa)]' : ''}`} />{avertissements}
      </button>
      {tests && <button onClick={onTests} className={cell} title="Tests"><Ico n={tests.ok === tests.total ? 'ok' : 'bug'} className={`size-3 ${tests.ok === tests.total ? 'text-[var(--ok)]' : 'text-[var(--wa)]'}`} />Tests {tests.ok}/{tests.total}</button>}
      <span className="flex-1" />
      <span className={cell + ' cursor-default'}>{fr ? 'Ln' : 'Ln'} {ligne}, {fr ? 'Col' : 'Col'} {colonne}</span>
      <span className={cell + ' cursor-default'}>{fr ? 'Espaces' : 'Spaces'} : 4</span>
      <span className={cell + ' cursor-default'}>UTF-8</span>
      <span className={cell + ' cursor-default'}>{langage}</span>
      <button onClick={onBibliotheques} className={cell} title={fr ? 'Bibliothèques chargées' : 'Loaded libraries'}><Ico n="cpu" className="size-3" />Pyodide{bibliotheques > 0 ? ` · ${bibliotheques}` : ''}</button>
      <span className={cell + ' cursor-default'}>
        {agent.face ? <img src={agent.face} alt="" className="size-3.5 rounded-full object-cover" /> : <Ico n="sparkles" className="size-3" />}
        {agent.nom}<span className={`size-1.5 rounded-full ${agentEtat === 'pret' ? 'bg-[var(--ok)]' : agentEtat === 'reflechit' ? 'bg-[var(--wa)] animate-pulse' : 'bg-[var(--tx3)]'}`} />
      </span>
    </footer>
  )
}
