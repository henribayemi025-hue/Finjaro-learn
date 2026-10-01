import { useEffect, useState } from 'react'

const SIZES = { sm: 'size-10', md: 'size-16', lg: 'size-28', xl: 'size-40' } as const

/** Visage d'agent : photo (ou initiale) avec anneau animé selon l'état, barres de voix quand il parle. */
export default function AgentFace({ src, initial, size = 'md', speaking = false, listening = false, thinking = false }: {
  src?: string; initial: string; size?: keyof typeof SIZES; speaking?: boolean; listening?: boolean; thinking?: boolean
}) {
  const [bar, setBar] = useState([0.4, 0.8, 0.5])
  useEffect(() => {
    if (!speaking) return
    const id = setInterval(() => setBar([Math.random(), Math.random(), Math.random()].map((x) => 0.25 + x * 0.75)), 120)
    return () => clearInterval(id)
  }, [speaking])

  const ring = speaking ? 'ring-4 ring-terracotta animate-pulse' : listening ? 'ring-4 ring-brass animate-pulse' : thinking ? 'ring-4 ring-ink/30 animate-pulse' : 'ring-2 ring-brass/60'
  return (
    <div className="relative inline-block">
      {src ? (
        <img src={src} alt="" className={`${SIZES[size]} rounded-full object-cover ${ring}`} />
      ) : (
        <span className={`${SIZES[size]} rounded-full bg-terracotta text-white grid place-items-center font-serif font-bold ${ring}`}>{initial}</span>
      )}
      {speaking && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-end gap-0.5 h-4 bg-paper rounded-full px-1.5 py-0.5 border border-brass" aria-hidden="true">
          {bar.map((h, i) => <span key={i} className="w-1 bg-terracotta rounded" style={{ height: `${h * 100}%` }} />)}
        </span>
      )}
    </div>
  )
}
