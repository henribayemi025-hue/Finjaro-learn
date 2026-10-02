import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState, Compartment } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

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

export default function Editeur({ chemin, valeur, onChange, onCurseur, onLancer, label }: {
  chemin: string; valeur: string; onChange: (v: string) => void; onCurseur: (ligne: number, colonne: number) => void; onLancer: () => void; label: string
}) {
  const hote = useRef<HTMLDivElement>(null)
  const vue = useRef<EditorView | null>(null)
  const langage = useRef(new Compartment())
  const rappel = useRef({ onChange, onCurseur, onLancer })
  rappel.current = { onChange, onCurseur, onLancer }

  useEffect(() => {
    const v = new EditorView({
      parent: hote.current!,
      state: EditorState.create({
        doc: valeur,
        extensions: [
          basicSetup, theme, syntaxHighlighting(couleurs), EditorView.lineWrapping,
          langage.current.of(LANGAGES[langageDe(chemin)]()),
          EditorView.contentAttributes.of({ 'aria-label': label, autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false' }),
          EditorView.domEventHandlers({ keydown: (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); rappel.current.onLancer(); return true } return false } }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) rappel.current.onChange(u.state.doc.toString())
            if (u.selectionSet || u.docChanged) {
              const tete = u.state.selection.main.head
              const l = u.state.doc.lineAt(tete)
              rappel.current.onCurseur(l.number, tete - l.from + 1)
            }
          }),
        ],
      }),
    })
    vue.current = v
    return () => v.destroy()
    // Créé une fois ; les changements de fichier passent par l'effet suivant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Autre fichier, ou texte changé de l'extérieur (Finia a écrit, import) : on remplace le contenu.
  useEffect(() => {
    const v = vue.current
    if (!v) return
    const actuel = v.state.doc.toString()
    const effets = [langage.current.reconfigure(LANGAGES[langageDe(chemin)]())]
    if (actuel === valeur) { v.dispatch({ effects: effets }); return }
    v.dispatch({ changes: { from: 0, to: actuel.length, insert: valeur }, effects: effets })
  }, [chemin, valeur])

  return <div ref={hote} className="h-full min-h-0 overflow-hidden" />
}
