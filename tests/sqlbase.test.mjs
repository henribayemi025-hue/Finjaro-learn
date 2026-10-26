// Vérifie la lecture de la base des leçons SQL (src/sqlBase.ts) : les tables et colonnes que le prof reçoit comme contexte.
// Sans ça, le prof inventait une table « clients » (Beau, 26/10 : « no such table: clients »).
// Lancer : npm run test:sqlbase
import assert from 'node:assert/strict'
import { lessons } from '../.test-build/lessons.mjs'
import { tablesDe, resumeBase, contexteSql } from '../.test-build/sqlbase.mjs'
import { expliqueErreur } from '../.test-build/explainerror.mjs'

let n = 0
const ok = (cond, msg) => { assert.ok(cond, msg); n++ }

// 1. Chaque leçon SQL : toutes les tables du script sont lues, avec leurs colonnes.
const sql = lessons.filter((l) => l.lang === 'sql' && l.sql)
ok(sql.length >= 7, 'au moins 7 leçons SQL attendues, trouvées : ' + sql.length)
for (const l of sql) {
  for (const setup of [l.sql.setup, l.sql.setupEn ?? l.sql.setup]) {
    const attendu = (setup.match(/CREATE\s+TABLE/gi) ?? []).length
    const t = tablesDe(setup)
    ok(t.length === attendu && attendu > 0, `${l.id} : ${t.length} tables lues sur ${attendu}`)
    const noms = t.map((x) => x.nom)
    ok(noms.includes('products') && noms.includes('sales'), `${l.id} : products et sales attendues, lues : ${noms.join(',')}`)
    const p = t.find((x) => x.nom === 'products')
    ok(p && p.colonnes.join(',') === 'id,name,category,price,stock', `${l.id} : colonnes de products : ${p?.colonnes}`)
    const s = t.find((x) => x.nom === 'sales')
    ok(s && s.colonnes.join(',') === 'id,product_id,quantity,day', `${l.id} : colonnes de sales : ${s?.colonnes}`)
  }
}

// 2. Cas limites : contraintes, guillemets, parenthèses imbriquées.
const t2 = tablesDe(`CREATE TABLE IF NOT EXISTS "notes" (a INTEGER, b TEXT, c NUMERIC(10, 2), PRIMARY KEY (a, b), UNIQUE (b));
CREATE TABLE autre(x INT,y TEXT);`)
ok(t2.length === 2, 'deux tables attendues')
ok(t2[0].nom === 'notes' && t2[0].colonnes.join(',') === 'a,b,c', 'colonnes sans contraintes : ' + t2[0].colonnes)
ok(t2[1].nom === 'autre' && t2[1].colonnes.join(',') === 'x,y', 'table sans espace : ' + t2[1].colonnes)
ok(resumeBase(t2) === 'notes(a, b, c) ; autre(x, y)', 'résumé : ' + resumeBase(t2))
ok(tablesDe('SELECT 1;').length === 0, 'aucune table dans un script sans CREATE')

// 3. Le contexte du prof : la vraie base, jamais une table inventée, dans les deux langues.
const setup = sql[0].sql.setup
const fr = contexteSql('Lire une table : SELECT', setup, 'fr')
const en = contexteSql('Reading a table: SELECT', setup, 'en')
ok(fr.startsWith('[SQL] Lire une table : SELECT') && fr.includes('products(id, name, category, price, stock)') && fr.includes('sales(id, product_id, quantity, day)'), 'contexte fr : ' + fr)
ok(en.startsWith('[SQL] Reading a table: SELECT') && en.includes('products(') && /never invent/i.test(en), 'contexte en : ' + en)
ok(!/clients/i.test(fr + en), 'aucune table « clients » dans le contexte')
ok(contexteSql('X', 'SELECT 1;', 'fr') === '[SQL] X', 'sans base lue : contexte simple')
ok(fr.length < 1000, 'contexte court (la fonction edge coupe à 4000 caractères) : ' + fr.length)

// 4. Les messages d'erreur que Beau a rencontrés (26/10) reçoivent une explication simple, dans les deux langues.
const e1 = expliqueErreur("AttributeError: 'NoneType' object has no attribute 'mean'", 'fr')
ok(e1 && /ne renvoie rien/.test(e1) && /return/.test(e1), 'NoneType (fr) : ' + e1)
const e2 = expliqueErreur("TypeError: unsupported operand type(s) for +: 'NoneType' and 'int'", 'en')
ok(e2 && /returns nothing/.test(e2), 'NoneType avec opérande (en) : ' + e2)
const e3 = expliqueErreur('no such table: clients', 'fr')
ok(e3 && e3.includes('« clients »') && /Base de données/.test(e3), 'no such table (fr) : ' + e3)
const e4 = expliqueErreur('no such column: prenom', 'en')
ok(e4 && e4.includes('“prenom”') && /Database/.test(e4), 'no such column (en) : ' + e4)
ok(/SELECT … FROM/.test(expliqueErreur('near "FORM": syntax error', 'fr') ?? ''), 'erreur de syntaxe SQL')
ok(/not finished/.test(expliqueErreur('incomplete input', 'en') ?? ''), 'requête incomplète')
// les règles Python d'avant n'ont pas bougé
ok(/Tu mélanges du texte/.test(expliqueErreur("TypeError: can only concatenate str (not \"int\") to str", 'fr') ?? ''), 'concaténation texte et nombre toujours reconnue')

console.log(`sqlbase : ${n} vérifications passées`)
