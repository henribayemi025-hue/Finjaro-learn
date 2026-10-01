import { useState } from 'react'
import { FACES, type CustomAgent } from './agents'
import { acu } from './academy-i18n'
import type { Lang } from './i18n'

export default function CustomAgentModal({ lang, onSave, onClose }: { lang: Lang; onSave: (a: CustomAgent) => void; onClose: () => void }) {
  const t = acu(lang)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [personality, setPersonality] = useState('')
  const [face, setFace] = useState(FACES[4])
  const inp = 'w-full rounded-md border border-ink/30 bg-white/60 px-2 py-1.5 text-sm'
  return (
    <div className="fixed inset-0 z-50 bg-ink/60 p-3 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={t.customTitle}>
      <div className="bg-paper rounded-xl border-2 border-brass w-full max-w-lg max-h-[92vh] overflow-y-auto p-4 space-y-3">
        <h3 className="font-serif font-bold text-lg">{t.customTitle}</h3>
        <p className="text-xs text-ink/60">{t.customHelp}</p>
        <label className="block text-sm">{t.name}<input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} className={inp} /></label>
        <label className="block text-sm">{t.role}<input value={role} onChange={(e) => setRole(e.target.value)} maxLength={60} className={inp} /></label>
        <label className="block text-sm">{t.personality}<textarea value={personality} onChange={(e) => setPersonality(e.target.value)} maxLength={400} rows={3} className={inp} /></label>
        <fieldset>
          <legend className="text-sm">{t.face}</legend>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mt-1">
            {FACES.map((f) => (
              <button key={f} type="button" onClick={() => setFace(f)} aria-pressed={face === f} aria-label={f.slice(-6, -4)}
                className={`rounded-full overflow-hidden ${face === f ? 'ring-4 ring-terracotta' : 'ring-1 ring-brass/50'}`}>
                <img src={f} alt="" className="aspect-square object-cover w-full" loading="lazy" />
              </button>
            ))}
          </div>
        </fieldset>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="border border-ink/30 rounded-md px-4 py-2 text-sm">{t.cancel}</button>
          <button disabled={name.trim().length < 2} onClick={() => onSave({ id: 'c' + Date.now(), name: name.trim(), role: role.trim() || 'Coach', personality: personality.trim(), face })}
            className="bg-terracotta text-white rounded-md px-4 py-2 text-sm disabled:opacity-40">{t.save}</button>
        </div>
      </div>
    </div>
  )
}
