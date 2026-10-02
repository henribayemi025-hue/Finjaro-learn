// L'aperçu d'une page web du projet (repris de l'Atelier de Léo) : index.html assemblé avec ses .css et .js locaux,
// montré dans un cadre isolé (sandbox sans « allow-same-origin » : la page ne voit ni la session ni les données de Learn).
const normaliser = (chemin: string) => {
  const out: string[] = []
  for (const part of chemin.split('/')) {
    if (!part || part === '.') continue
    if (part === '..') out.pop()
    else out.push(part)
  }
  return out.join('/')
}

export function pageDeDepart(chemins: string[]) {
  const html = chemins.filter((c) => /\.html?$/i.test(c))
  return html.find((c) => /^index\.html?$/i.test(c)) || html.find((c) => /(^|\/)index\.html?$/i.test(c)) || html[0] || null
}

// La page n'a pas droit au stockage du navigateur dans le cadre isolé : on lui prête un stockage en mémoire.
const STOCKAGE_PRETE = `<script>(function(){function faux(){var m={};return{getItem:function(k){return Object.prototype.hasOwnProperty.call(m,k)?m[k]:null},setItem:function(k,v){m[k]=String(v)},removeItem:function(k){delete m[k]},clear:function(){m={}},key:function(i){return Object.keys(m)[i]||null},get length(){return Object.keys(m).length}}}['localStorage','sessionStorage'].forEach(function(n){try{window[n].getItem('x')}catch(e){try{Object.defineProperty(window,n,{value:faux(),configurable:true})}catch(e2){}}})})();</script>`

export function assembler(page: string, html: string, contenus: Record<string, string>) {
  const dossier = page.includes('/') ? page.replace(/[^/]+$/, '') : ''
  const cle = (href: string) => normaliser(dossier + href.split(/[?#]/)[0])
  let doc = html.replace(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi, (tout, href: string) => {
    const css = /stylesheet/i.test(tout) ? contenus[cle(href)] : undefined
    return css === undefined ? tout : `<style>\n${css.replace(/<\/style/gi, '<\\/style')}\n</style>`
  })
  doc = doc.replace(/<script\b([^>]*?)\bsrc=["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (tout, avant: string, src: string, apres: string) => {
    const js = contenus[cle(src)]
    return js === undefined ? tout : `<script${avant}${apres}>\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`
  })
  return /<head[^>]*>/i.test(doc) ? doc.replace(/<head[^>]*>/i, (h) => `${h}${STOCKAGE_PRETE}`) : `${STOCKAGE_PRETE}${doc}`
}
