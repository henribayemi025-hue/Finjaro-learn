import type { Figure } from './runner'

const W = 480, H = 280, L = 48, R = 14, T = 30, B = 38

const nice = (v: number) => (Math.abs(v) >= 1000 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2)).replace(/\.?0+$/, '')

/** Graphique SVG minimal (courbe, nuage de points, barres), aux couleurs du thème actif. */
export default function Chart({ fig }: { fig: Figure }) {
  if (fig.type === 'reseau') return <Network fig={fig} />
  const ys = fig.y.length ? fig.y : [0]
  const numeric = fig.type !== 'barres'
  const xs = numeric ? (fig.x as number[]) : fig.y.map((_, i) => i)
  const xmin = xs.length ? Math.min(...xs) : 0, xmax = xs.length ? Math.max(...xs) : 1
  let ymin = Math.min(...ys), ymax = Math.max(...ys)
  if (fig.type === 'barres') ymin = Math.min(0, ymin)
  if (ymin === ymax) { ymin -= 1; ymax += 1 }
  const x0 = Number.isFinite(xmin) ? xmin : 0, x1 = Number.isFinite(xmax) && xmax !== x0 ? xmax : x0 + 1
  const sx = (v: number) => L + ((v - x0) / (x1 - x0)) * (W - L - R)
  const sy = (v: number) => H - B - ((v - ymin) / (ymax - ymin)) * (H - B - T)
  const barW = fig.type === 'barres' ? Math.max(4, ((W - L - R) / Math.max(1, fig.y.length)) * 0.7) : 0
  const bx = (i: number) => L + ((i + 0.5) / Math.max(1, fig.y.length)) * (W - L - R)

  return (
    <figure className="rounded-lg border border-brass/50 bg-paper p-2">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={fig.titre || fig.type} className="w-full h-auto">
        <text x={W / 2} y={16} textAnchor="middle" fontSize="14" fill="currentColor" fontFamily="Fraunces, Georgia, serif">{fig.titre}</text>
        <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="currentColor" strokeOpacity=".4" />
        <line x1={L} y1={T} x2={L} y2={H - B} stroke="currentColor" strokeOpacity=".4" />
        <text x={L - 6} y={sy(ymax) + 4} textAnchor="end" fontSize="12" fill="currentColor">{nice(ymax)}</text>
        <text x={L - 6} y={sy(ymin) + 4} textAnchor="end" fontSize="12" fill="currentColor">{nice(ymin)}</text>
        {fig.type === 'barres' ? (
          <>
            {fig.y.map((v, i) => (
              <g key={i}>
                <rect x={bx(i) - barW / 2} y={Math.min(sy(v), sy(0))} width={barW} height={Math.abs(sy(v) - sy(0))} fill="var(--color-terracotta)" rx="2" />
                <text x={bx(i)} y={H - B + 13} textAnchor="middle" fontSize="11" fill="currentColor">{String(fig.x[i]).slice(0, 8)}</text>
              </g>
            ))}
          </>
        ) : (
          <>
            <text x={L} y={H - B + 14} textAnchor="start" fontSize="12" fill="currentColor">{nice(x0)}</text>
            <text x={W - R} y={H - B + 14} textAnchor="end" fontSize="12" fill="currentColor">{nice(x1)}</text>
            {fig.type === 'courbe' ? (
              <polyline fill="none" stroke="var(--color-terracotta)" strokeWidth="2" strokeLinejoin="round" points={xs.map((v, i) => `${sx(v)},${sy(fig.y[i])}`).join(' ')} />
            ) : (
              xs.map((v, i) => <circle key={i} cx={sx(v)} cy={sy(fig.y[i])} r="3.5" fill="var(--color-terracotta)" fillOpacity=".85" />)
            )}
          </>
        )}
      </svg>
    </figure>
  )
}

/** Réseau de neurones : une colonne par couche ; l'opacité d'un neurone = son activation (0 à 1). */
function Network({ fig }: { fig: Figure }) {
  const sizes = fig.x as number[]
  const acts = fig.y
  const W = 480, H = 280, padX = 50
  const cx = (l: number) => padX + (l * (W - 2 * padX)) / Math.max(1, sizes.length - 1)
  const cy = (n: number, i: number) => 40 + ((i + 0.5) * (H - 80)) / n
  const offsets = sizes.map((_, l) => sizes.slice(0, l).reduce((a, b) => a + b, 0))
  return (
    <figure className="rounded-lg border border-brass/50 bg-paper p-2">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={fig.titre || 'réseau'} className="w-full h-auto">
        <text x={W / 2} y={16} textAnchor="middle" fontSize="14" fill="currentColor" fontFamily="Fraunces, Georgia, serif">{fig.titre}</text>
        {sizes.slice(0, -1).map((n, l) => Array.from({ length: n }).map((_, i) => Array.from({ length: sizes[l + 1] }).map((__, j) => (
          <line key={`${l}-${i}-${j}`} x1={cx(l)} y1={cy(n, i)} x2={cx(l + 1)} y2={cy(sizes[l + 1], j)} stroke="currentColor" strokeOpacity=".15" />
        ))))}
        {sizes.map((n, l) => Array.from({ length: n }).map((_, i) => {
          const a = acts[offsets[l] + i]
          const v = a === undefined ? 0.15 : Math.max(0.08, Math.min(1, Math.abs(a)))
          return (
            <g key={`${l}-${i}`}>
              <circle cx={cx(l)} cy={cy(n, i)} r="13" fill="var(--color-terracotta)" fillOpacity={v} stroke="currentColor" strokeOpacity=".5" />
              {a !== undefined && <text x={cx(l)} y={cy(n, i) + 4} textAnchor="middle" fontSize="10" fill="currentColor">{Math.abs(a) >= 10 ? a.toFixed(0) : a.toFixed(2)}</text>}
            </g>
          )
        }))}
      </svg>
    </figure>
  )
}
