import { useEffect, useRef, useState, type ReactNode } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState, Compartment, Prec } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { acceptCompletion, closeCompletion, completionStatus } from '@codemirror/autocomplete'
import { indentMore, indentLess, insertNewlineAndIndent } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { HighlightStyle, syntaxHighlighting, indentUnit } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { setDiagnostics, lintGutter, type Diagnostic } from '@codemirror/lint'

// L'éditeur de l'Atelier : CodeMirror 6 (licence MIT), le même que l'Atelier de Léo, parce qu'il marche au doigt sur téléphone.
// Couleurs : nuit + orange Finjaro.

export type Langage = 'py' | 'js' | 'html' | 'css' | 'texte'
export function langageDe(chemin: string): Langage {
  const ext = chemin.split('.').pop()?.toLowerCase() ?? ''
  if (['js', 'mjs', 'cjs', 'jsx'].includes(ext)) return 'js'
  if (ext === 'py') return 'py'
  if (['html', 'htm'].includes(ext)) return 'html'
  if (ext === 'css') return 'css'
  return 'texte'
}
const LANGAGES: Record<Langage, () => ReturnType<typeof python> | []> = {
  js: () => javascript(), py: () => python(), html: () => html(), css: () => css(), texte: () => [],
}

const theme = EditorView.theme({
  '&': { height: '100%', backgroundColor: '#0B1120', color: '#EDF1F8', fontSize: '13px' },
  '.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', lineHeight: '1.6' },
  '.cm-content': { caretColor: '#FF8A3D' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#FF8A3D' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': { backgroundColor: '#2A3550' },
  '.cm-gutters': { backgroundColor: '#0F172A', color: '#64748B', border: 'none' },
  '.cm-activeLine': { backgroundColor: '#1A233755' },
  '.cm-activeLineGutter': { backgroundColor: '#1A2337', color: '#FF8A3D' },
}, { dark: true })

const couleurs = HighlightStyle.define([
  { tag: [tags.keyword, tags.operatorKeyword, tags.modifier, tags.controlKeyword], color: '#FF8A3D' },
  { tag: [tags.string, tags.special(tags.string), tags.regexp], color: '#5FC8C0' },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: '#F2C98A' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: '#7C8BA1', fontStyle: 'italic' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: '#F2C98A' },
  { tag: [tags.typeName, tags.className, tags.tagName], color: '#F07A5A' },
  { tag: [tags.propertyName, tags.attributeName], color: '#C9D4E5' },
  { tag: [tags.variableName, tags.definition(tags.variableName)], color: '#EDF1F8' },
  { tag: tags.invalid, color: '#FB7185' },
])


// Thème « éditeur professionnel » (Dark Modern de VS Code) : sobre, sans orange.
const themeIde = EditorView.theme({
  '&': { height: '100%', backgroundColor: '#1f1f1f', color: '#cccccc', fontSize: '13px' },
  '.cm-scroller': { fontFamily: '"JetBrains Mono", "Cascadia Code", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', lineHeight: '1.65' },
  '.cm-content': { caretColor: '#aeafad' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#aeafad' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': { backgroundColor: '#264f78' },
  '.cm-gutters': { backgroundColor: '#1f1f1f', color: '#6e7681', border: 'none' },
  '.cm-activeLine': { backgroundColor: '#ffffff0a' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: '#cccccc' },
  '.cm-foldPlaceholder': { backgroundColor: '#3a3d41', border: 'none', color: '#cccccc' },
  '.cm-tooltip': { backgroundColor: '#252526', border: '1px solid #454545', color: '#cccccc' },
  '.cm-tooltip-autocomplete ul li[aria-selected]': { backgroundColor: '#04395e', color: '#ffffff' },
  '.cm-matchingBracket': { backgroundColor: '#0064001a', outline: '1px solid #888888' },
  '.cm-lintRange-error': { backgroundImage: 'none', textDecoration: 'underline wavy #f14c4c', textUnderlineOffset: '3px' },
  '.cm-lintRange-warning': { backgroundImage: 'none', textDecoration: 'underline wavy #cca700', textUnderlineOffset: '3px' },
  '.cm-lint-marker-error': { content: 'none' },
}, { dark: true })
const couleursIde = HighlightStyle.define([
  { tag: [tags.keyword, tags.operatorKeyword, tags.modifier], color: '#569cd6' },
  { tag: [tags.controlKeyword, tags.moduleKeyword], color: '#c586c0' },
  { tag: [tags.string, tags.special(tags.string), tags.regexp], color: '#ce9178' },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: '#b5cea8' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: '#6a9955', fontStyle: 'italic' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: '#dcdcaa' },
  { tag: [tags.typeName, tags.className, tags.namespace], color: '#4ec9b0' },
  { tag: [tags.propertyName, tags.attributeName], color: '#9cdcfe' },
  { tag: [tags.variableName, tags.definition(tags.variableName)], color: '#9cdcfe' },
  { tag: [tags.operator, tags.punctuation], color: '#cccccc' },
  { tag: tags.invalid, color: '#f14c4c' },
])

export interface Diag { ligne: number; message: string; niveau: 'error' | 'warning' | 'info' }

export default function Editeur({ chemin, valeur, onChange, onCurseur, onLancer, label, compagnon, assistants, ide, diagnostics, reveler, onSelection }: {
  chemin: string; valeur: string; onChange: (v: string) => void; onCurseur: (ligne: number, colonne: number) => void; onLancer: () => void; label: string
  /** Un petit élément (le visage d'un agent) qui suit la dernière ligne du code, dans la marge de droite. */
  compagnon?: ReactNode
  /** Un groupe de petits éléments (les assistants) fixé en bas à droite de l'éditeur. */
  assistants?: ReactNode
  /** Thème et comportements d'un éditeur professionnel (espace de travail). */
  ide?: boolean
  /** Erreurs et avertissements soulignés dans le code (ondulé rouge ou jaune, pastille dans la marge). */
  diagnostics?: Diag[]
  /** Aller à une ligne (la clé change à chaque demande). */
  reveler?: { ligne: number; cle: number }
  /** Le texte sélectionné change (pour « explique cette sélection »). */
  onSelection?: (texte: string) => void
}) {
  const [topC, setTopC] = useState(20)
  const hote = useRef<HTMLDivElement>(null)
  const vue = useRef<EditorView | null>(null)
  const langage = useRef(new Compartment())
  const rappel = useRef({ onChange, onCurseur, onLancer, onSelection })
  rappel.current = { onChange, onCurseur, onLancer, onSelection }
  const placerCompagnon = () => {
    const v = vue.current, h = hote.current
    if (!v || !h) return
    const c = v.coordsAtPos(v.state.doc.length)
    const r = h.getBoundingClientRect()
    const haut = c ? (c.top + c.bottom) / 2 - r.top : r.height - 24
    setTopC(Math.max(20, Math.min(r.height - 24, haut)))
  }
  const placer = useRef(placerCompagnon)
  placer.current = placerCompagnon

  useEffect(() => {
    const v = new EditorView({
      parent: hote.current!,
      state: EditorState.create({
        doc: valeur,
        extensions: [
          // Placé AVANT basicSetup : à précédence égale, le premier gagne, et la suggestion ne doit pas capter Entrée.
          // Tab comme dans VS Code (Beau, 26/10 : « j'appuie sur Tab et tout se dérègle ») : il accepte la suggestion si elle est ouverte,
          // sinon il décale de 4 espaces (Maj+Tab : dans l'autre sens). Il ne sort plus de l'éditeur, et jamais de caractère Tab dans le code.
          indentUnit.of('    '), EditorState.tabSize.of(4),
          ...(compagnon ? [EditorView.theme({ '.cm-content': { paddingRight: '56px' } })] : []),
          Prec.highest(keymap.of([
            // Entrée = nouvelle ligne, toujours (Beau, 26/10 : « je tape somme et ça envoie le curseur ailleurs ») : la suggestion ne s'accepte qu'avec Tab.
            { key: 'Enter', run: (v) => { if (!completionStatus(v.state)) return false; closeCompletion(v); return insertNewlineAndIndent(v) } },
            { key: 'Tab', run: (v) => acceptCompletion(v) || indentMore(v) },
            { key: 'Shift-Tab', run: indentLess },
          ])),
          langage.current.of(LANGAGES[langageDe(chemin)]()),
          EditorView.contentAttributes.of({ 'aria-label': label, autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false' }),
          EditorView.domEventHandlers({ keydown: (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); rappel.current.onLancer(); return true } return false } }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged || u.geometryChanged || u.viewportChanged) requestAnimationFrame(() => placer.current())
            if (u.docChanged) rappel.current.onChange(u.state.doc.toString())
            if (u.selectionSet || u.docChanged) {
              const tete = u.state.selection.main.head
              const l = u.state.doc.lineAt(tete)
              rappel.current.onCurseur(l.number, tete - l.from + 1)
              const sel = u.state.selection.main
              rappel.current.onSelection?.(sel.empty ? '' : u.state.sliceDoc(sel.from, sel.to))
            }
          }),
          basicSetup, ...(ide ? [themeIde, syntaxHighlighting(couleursIde), lintGutter()] : [theme, syntaxHighlighting(couleurs)]), EditorView.lineWrapping,
        ],
      }),
    })
    vue.current = v
    const suivre = () => placer.current()
    v.scrollDOM.addEventListener('scroll', suivre, { passive: true })
    requestAnimationFrame(suivre)
    return () => { v.scrollDOM.removeEventListener('scroll', suivre); v.destroy() }
    // Créé une fois ; les changements de fichier passent par l'effet suivant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Erreurs et avertissements : soulignés dans le code.
  useEffect(() => {
    const v = vue.current
    if (!v || !ide) return
    const doc = v.state.doc
    const liste: Diagnostic[] = (diagnostics ?? []).filter((d) => d.ligne >= 1 && d.ligne <= doc.lines).map((d) => {
      const l = doc.line(d.ligne)
      const debut = l.from + (l.text.length - l.text.trimStart().length)
      return { from: debut, to: Math.max(debut + 1, l.to), severity: d.niveau, message: d.message }
    })
    v.dispatch(setDiagnostics(v.state, liste))
  }, [diagnostics, valeur, ide])

  // « Aller à la ligne » depuis le panneau des problèmes ou la recherche.
  useEffect(() => {
    const v = vue.current
    if (!v || !reveler) return
    const n = Math.min(Math.max(1, reveler.ligne), v.state.doc.lines)
    const l = v.state.doc.line(n)
    v.dispatch({ selection: { anchor: l.from, head: l.to }, effects: EditorView.scrollIntoView(l.from, { y: 'center' }) })
    v.focus()
  }, [reveler?.cle])

  // Autre fichier, ou texte changé de l'extérieur (Finia a écrit, import) : on remplace le contenu.
  useEffect(() => {
    const v = vue.current
    if (!v) return
    const actuel = v.state.doc.toString()
    const effets = [langage.current.reconfigure(LANGAGES[langageDe(chemin)]())]
    if (actuel === valeur) { v.dispatch({ effects: effets }); return }
    v.dispatch({ changes: { from: 0, to: actuel.length, insert: valeur }, effects: effets })
  }, [chemin, valeur])

  if (!compagnon) return <div ref={hote} className="h-full min-h-0 overflow-hidden" />
  return (
    <div className="relative h-full min-h-0">
      <div ref={hote} className="h-full min-h-0 overflow-hidden" />
      <div className="absolute right-2 -translate-y-1/2 transition-[top] duration-150" style={{ top: topC }}>{compagnon}</div>
      {assistants && <div className="absolute right-3 bottom-2 flex flex-col-reverse items-center gap-1.5">{assistants}</div>}
    </div>
  )
}
