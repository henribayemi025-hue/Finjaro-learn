import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

/**
 * Réponse de l'assistant : le Markdown (gras, listes, code) est mis en forme.
 * Beau, 14/10 : « les étoiles partout » — `**Role**` s'affichait tel quel.
 * Le texte vient d'un modèle : il est assaini avant d'être posé, les liens s'ouvrent dans un autre onglet.
 */
export function Md({ text, className = '' }: { text: string; className?: string }) {
  const html = useMemo(() => {
    const h = DOMPurify.sanitize(marked.parse(text, { async: false, breaks: true }) as string)
    const doc = new DOMParser().parseFromString(`<div>${h}</div>`, 'text/html')
    doc.querySelectorAll('a[href]').forEach((a) => { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener noreferrer') })
    return doc.body.firstElementChild!.innerHTML
  }, [text])
  return <div className={`md ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
}
