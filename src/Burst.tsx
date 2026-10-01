import { useMemo } from 'react'

/** Gerbe de particules à la réussite (désactivée si l'utilisateur réduit les animations). */
export default function Burst() {
  const parts = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    id: i, left: 15 + Math.random() * 70, dx: (Math.random() - 0.5) * 220, delay: Math.random() * 0.15,
    size: 6 + Math.random() * 7, hue: i % 3,
  })), [])
  return (
    <div className="burst" aria-hidden="true">
      {parts.map((p) => (
        <span key={p.id} style={{ left: `${p.left}%`, width: p.size, height: p.size * 1.6, animationDelay: `${p.delay}s`, ['--dx' as string]: `${p.dx}px`,
          background: p.hue === 0 ? 'var(--color-terracotta)' : p.hue === 1 ? 'var(--color-brass)' : 'var(--color-ink)' }} />
      ))}
    </div>
  )
}
