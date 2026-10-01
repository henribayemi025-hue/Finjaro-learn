import { useEffect, useState } from 'react'
import type { Lang } from './i18n'

interface Prefs { lisible: boolean; contraste: boolean; grand: boolean }
const KEY = 'learn:a11y'
const load = (): Prefs => { try { return { lisible: false, contraste: false, grand: false, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return { lisible: false, contraste: false, grand: false } } }

const T = {
  fr: { btn: 'Accessibilité', lisible: 'Police très lisible (dyslexie)', contraste: 'Contraste élevé', grand: 'Texte plus grand', close: 'Fermer', hint: 'Tout se règle au clavier : Tab pour avancer, Entrée pour valider.' },
  en: { btn: 'Accessibility', lisible: 'Highly legible font (dyslexia)', contraste: 'High contrast', grand: 'Larger text', close: 'Close', hint: 'Everything works with the keyboard: Tab to move, Enter to confirm.' },
} as const

/** Réglages d'accessibilité gardés sur l'appareil (police lisible, contraste, taille). */
export default function Access({ lang }: { lang: Lang }) {
  const t = T[lang]
  const [prefs, setPrefs] = useState<Prefs>(load)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const d = document.documentElement.dataset
    d.lisible = prefs.lisible ? '1' : ''; d.contraste = prefs.contraste ? '1' : ''; d.grand = prefs.grand ? '1' : ''
    try { localStorage.setItem(KEY, JSON.stringify(prefs)) } catch { /* ignoré */ }
  }, [prefs])

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label={t.btn} title={t.btn} className="text-sm border border-ink/30 rounded-md px-2.5 py-1.5 font-semibold">Aa</button>
      {open && (
        <div role="dialog" aria-label={t.btn} className="fixed left-3 right-3 top-24 sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-64 z-20 rounded-xl border-2 border-brass bg-paper p-3 space-y-2 shadow-lg text-sm">
          {(['lisible', 'contraste', 'grand'] as const).map((k) => (
            <label key={k} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={prefs[k]} onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })} className="size-4 accent-[var(--color-terracotta)]" />
              {t[k]}
            </label>
          ))}
          <p className="text-xs text-ink/60">{t.hint}</p>
          <button onClick={() => setOpen(false)} className="text-xs underline">{t.close}</button>
        </div>
      )}
    </div>
  )
}
