import type { ReactNode } from 'react'

// De vraies icônes (traits fins, comme Lucide, licence ISC) à la place des émojis, qui prennent le style de chaque système :
// Beau (26/10) : « tu me mets les icônes de Windows 2000 ». Dessinées en SVG, elles suivent la couleur du texte.
const CHEMINS: Record<string, ReactNode> = {
  play: <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" />,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" x2="4" y1="22" y2="15" /></>,
  sos: <><circle cx="12" cy="12" r="10" /><path d="m4.93 4.93 4.24 4.24" /><path d="m14.83 9.17 4.24-4.24" /><path d="m14.83 14.83 4.24 4.24" /><path d="m9.17 14.83-4.24 4.24" /><circle cx="12" cy="12" r="4" /></>,
  bulb: <><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  ok: <><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>,
  spin: <path d="M21 12a9 9 0 1 1-6.219-8.56" className="origin-center animate-spin" />,
  x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  pencil: <><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></>,
  db: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5V19A9 3 0 0 0 21 19V5" /><path d="M3 12A9 3 0 0 0 21 12" /></>,
  sparkles: <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />,
  down: <path d="m6 9 6 6 6-6" />,
  right: <path d="m9 18 6-6-6-6" />,
  left: <path d="m15 18-6-6 6-6" />,
  send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
  copy: <><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></>,
  compare: <><circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M13 6h3a2 2 0 0 1 2 2v7" /><path d="M11 18H8a2 2 0 0 1-2-2V9" /></>,
  maximize: <><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" x2="14" y1="3" y2="10" /><line x1="3" x2="10" y1="21" y2="14" /></>,
  minimize: <><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" x2="21" y1="10" y2="3" /><line x1="3" x2="10" y1="21" y2="14" /></>,
  terminal: <><polyline points="4 17 10 11 4 5" /><line x1="12" x2="20" y1="19" y2="19" /></>,
  book: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>,
  chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  code: <><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>,
  cap: <><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></>,
  news: <><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" /><path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" /></>,
}
export type NomIcone = keyof typeof CHEMINS

export function Ico({ n, className = 'size-4' }: { n: NomIcone; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`inline-block shrink-0 ${className}`} aria-hidden="true">{CHEMINS[n]}</svg>
  )
}

/** Les signes d'un texte (🔍, ✕, ▶…) deviennent de vraies icônes ; le reste du texte ne change pas. */
const SIGNES: [string, NomIcone][] = [
  ['🗄️', 'db'], ['🗄', 'db'], ['‹/›', 'code'], ['›_', 'terminal'], ['🔍', 'search'], ['🏁', 'flag'], ['🆘', 'sos'], ['💡', 'bulb'], ['✅', 'ok'], ['⏳', 'spin'],
  ['✨', 'sparkles'], ['✦', 'sparkles'], ['✎', 'pencil'], ['▶', 'play'], ['✕', 'x'], ['➤', 'send'], ['▾', 'down'], ['▸', 'right'], ['⤡', 'minimize'], ['⤢', 'maximize'],
  ['👤', 'user'], ['📖', 'book'], ['💬', 'chat'], ['🎓', 'cap'], ['📰', 'news'], ['✓', 'check'], ['‹', 'left'], ['›', 'right'],
]
const MOTIF = new RegExp(SIGNES.map(([s]) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g')

export function Gl({ children, className = 'size-[1.05em] align-[-0.16em]' }: { children: ReactNode; className?: string }): ReactNode {
  if (Array.isArray(children)) return <>{children.map((c, i) => <Gl key={i} className={className}>{c}</Gl>)}</>
  if (typeof children !== 'string') return <>{children}</>
  const parts: ReactNode[] = []
  let dernier = 0, k = 0
  for (const m of children.matchAll(MOTIF)) {
    const i = m.index ?? 0
    if (i > dernier) parts.push(children.slice(dernier, i))
    const nom = SIGNES.find(([s]) => s === m[0])![1]
    const avant = i > 0 && children[i - 1] === ' ', apres = children[i + m[0].length] === ' '
    parts.push(<Ico key={k++} n={nom} className={`${className} ${apres ? 'mr-1.5' : avant ? 'ml-1.5' : ''}`} />)
    dernier = i + m[0].length + (apres ? 1 : 0)
  }
  if (dernier < children.length) parts.push(children.slice(dernier))
  return <>{parts}</>
}
