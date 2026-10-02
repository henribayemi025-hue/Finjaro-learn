import { useEffect, useRef, useState } from 'react'
import type { Lang } from './i18n'

export interface Diapo {
  key: string
  /** Photo du parcours (public/images/parcours/<clé>.jpg, licence Unsplash — voir public/images/CREDITS.md). */
  image: string
  badge: string
  titre: string
  sousTitre: string
  action: string
  onClick: () => void
}

/** Grand carrousel de l'accueil : une photo par parcours, glissable au doigt, avance seul tant qu'on n'y touche pas. */
export default function Carrousel({ lang, diapos }: { lang: Lang; diapos: Diapo[] }) {
  const piste = useRef<HTMLDivElement>(null)
  const [i, setI] = useState(0)
  const [pause, setPause] = useState(false)

  const aller = (k: number) => {
    const el = piste.current
    if (!el) return
    const n = (k + diapos.length) % diapos.length
    el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' })
  }

  // L'indice suit le défilement (doigt, souris, flèches ou avance automatique).
  useEffect(() => {
    const el = piste.current
    if (!el) return
    const f = () => setI(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
    el.addEventListener('scroll', f, { passive: true })
    return () => el.removeEventListener('scroll', f)
  }, [])

  useEffect(() => {
    const calme = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (pause || calme || diapos.length < 2) return
    const h = setInterval(() => aller(i + 1), 6000)
    return () => clearInterval(h)
  })

  const fr = lang === 'fr'
  return (
    <section aria-roledescription={fr ? 'carrousel' : 'carousel'} aria-label={fr ? 'Tes leçons' : 'Your lessons'}
      className="relative rounded-3xl overflow-hidden shadow-xl rise"
      onMouseEnter={() => setPause(true)} onMouseLeave={() => setPause(false)} onFocusCapture={() => setPause(true)} onTouchStart={() => setPause(true)}>
      <div ref={piste} className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {diapos.map((d, k) => (
          <div key={d.key} role="group" aria-roledescription={fr ? 'diapositive' : 'slide'} aria-label={`${k + 1} / ${diapos.length}`}
            className="relative shrink-0 w-full snap-start aspect-[4/5] sm:aspect-[16/7] bg-ink">
            <img src={d.image} alt="" loading={k === 0 ? 'eager' : 'lazy'} decoding="async" className="absolute inset-0 size-full object-cover" />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/5 sm:bg-gradient-to-r sm:from-black/80 sm:via-black/40 sm:to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 pb-10 sm:p-9 sm:pb-12 sm:max-w-[60%] text-white space-y-2.5">
              <span className="inline-block rounded-full bg-terracotta px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider shadow">{d.badge}</span>
              <h2 className="font-display text-2xl sm:text-4xl leading-[1.1] drop-shadow">{d.titre}</h2>
              <p className="text-sm sm:text-base text-white/85 line-clamp-2">{d.sousTitre}</p>
              <button className="btn btn-primary text-base px-5 py-3 mt-1" onClick={d.onClick} tabIndex={k === i ? 0 : -1}>▶ {d.action}</button>
            </div>
          </div>
        ))}
      </div>
      {diapos.length > 1 && (
        <>
          <button className="hidden sm:grid absolute left-3 top-1/2 -translate-y-1/2 size-11 place-items-center rounded-full bg-black/35 text-white text-xl hover:bg-black/55"
            onClick={() => aller(i - 1)} aria-label={fr ? 'Précédente' : 'Previous'}>‹</button>
          <button className="hidden sm:grid absolute right-3 top-1/2 -translate-y-1/2 size-11 place-items-center rounded-full bg-black/35 text-white text-xl hover:bg-black/55"
            onClick={() => aller(i + 1)} aria-label={fr ? 'Suivante' : 'Next'}>›</button>
          <div className="absolute bottom-0 right-3 flex">
            {diapos.map((d, k) => (
              <button key={d.key} onClick={() => aller(k)} aria-label={`${fr ? 'Aller à la diapositive' : 'Go to slide'} ${k + 1}`} aria-current={k === i ? 'true' : undefined}
                className="h-11 w-5 grid place-items-center"><span className={`block h-1.5 rounded-full transition-all ${k === i ? 'w-6 bg-white' : 'w-1.5 bg-white/55'}`} /></button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
