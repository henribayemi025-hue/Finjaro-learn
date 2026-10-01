import { diffLines } from './diff'
import type { FixProposal } from './tutor'
import { ui, type Lang } from './i18n'

export default function DiffModal({ lang, original, fix, onAccept, onClose }: {
  lang: Lang; original: string; fix: FixProposal; onAccept: () => void; onClose: () => void
}) {
  const t = ui[lang]
  const lines = diffLines(original, fix.fixed_code)
  return (
    <div className="fixed inset-0 z-50 bg-ink/60 p-3 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={t.fixTitle}>
      <div className="bg-paper rounded-xl border-2 border-brass w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 space-y-3">
        <h3 className="font-serif font-bold text-lg">{t.fixTitle}</h3>
        <p className="text-sm whitespace-pre-wrap">{fix.explanation}</p>
        <p className="text-xs text-ink/60">{t.fixHelp}</p>
        <pre className="rounded-lg bg-ink text-cream p-3 text-sm overflow-x-auto font-mono">
          {lines.map((l, i) => (
            <div key={i} className={l.kind === 'add' ? 'bg-green-900/50' : l.kind === 'del' ? 'bg-red-900/50 line-through opacity-80' : ''}>
              {l.kind === 'add' ? '+ ' : l.kind === 'del' ? '- ' : '  '}{l.text}
            </div>
          ))}
        </pre>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="border border-ink/30 rounded-md px-4 py-2 text-sm">{t.refuse}</button>
          <button onClick={onAccept} className="bg-terracotta text-white rounded-md px-4 py-2 text-sm font-medium">{t.accept}</button>
        </div>
      </div>
    </div>
  )
}
