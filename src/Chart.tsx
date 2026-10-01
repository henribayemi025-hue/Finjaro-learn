import type { Figure } from './runner'

const W = 480, H = 280, L = 44, R = 12, T = 28, B = 36

const nice = (v: number) => (Math.abs(v) >= 1000 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2)).replace(/\.?0+$/, '')

/** Graphique SVG minimal (courbe, nuage de points, barres), aux couleurs du thème actif. */
export default function Chart({ fig }: { fig: Figure }) {
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
        <text x={W / 2} y={16} textAnchor="middle" fontSize="13" fill="currentColor" fontFamily="Fraunces, Georgia, serif">{fig.titre}</text>
        <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="currentColor" strokeOpacity=".4" />
        <line x1={L} y1={T} x2={L} y2={H - B} stroke="currentColor" strokeOpacity=".4" />
        <text x={L - 6} y={sy(ymax) + 4} textAnchor="end" fontSize="10" fill="currentColor">{nice(ymax)}</text>
        <text x={L - 6} y={sy(ymin) + 4} textAnchor="end" fontSize="10" fill="currentColor">{nice(ymin)}</text>
        {fig.type === 'barres' ? (
          <>
            {fig.y.map((v, i) => (
              <g key={i}>
                <rect x={bx(i) - barW / 2} y={Math.min(sy(v), sy(0))} width={barW} height={Math.abs(sy(v) - sy(0))} fill="var(--color-terracotta)" rx="2" />
                <text x={bx(i)} y={H - B + 13} textAnchor="middle" fontSize="9" fill="currentColor">{String(fig.x[i]).slice(0, 8)}</text>
              </g>
            ))}
          </>
        ) : (
          <>
            <text x={L} y={H - B + 14} textAnchor="start" fontSize="10" fill="currentColor">{nice(x0)}</text>
            <text x={W - R} y={H - B + 14} textAnchor="end" fontSize="10" fill="currentColor">{nice(x1)}</text>
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
