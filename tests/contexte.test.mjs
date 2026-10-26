// Le prof doit savoir où en est l'élève : module, leçon, cours, exercice, et la règle de cohérence.
import assert from 'node:assert/strict'
import { lessons } from '../.test-build/lessons.mjs'
import { contexteCours } from '../.test-build/contextecours.mjs'
let n = 0
const ok = (c, m) => { assert.ok(c, m); n++ }
const l = lessons.find((x) => x.id === 'py-vars')
const c = contexteCours(l, 'fr', ['py-print'], 'EXTRA')
ok(c.startsWith('[Python] Variables et types'), 'titre : ' + c.slice(0, 40))
ok(/module 1\/14/.test(c) && /leçon 2\/\d+/.test(c) && /1 réussies en tout/.test(c), 'place : ' + c.split('\n')[1])
ok(c.includes('boîte avec une étiquette'), 'le cours est transmis')
ok(c.includes('Exercice demandé') && c.includes('EXTRA') && /ne le contredis jamais/.test(c), 'exercice, extra et règle')
ok(c.length <= 3900, 'longueur : ' + c.length)
const e = contexteCours(l, 'en', [])
ok(/module 1\/14/.test(e) && /never contradict/.test(e), 'anglais')
for (const x of lessons) ok(contexteCours(x, 'fr', []).length <= 3900, x.id + ' trop long')
console.log(`contexte : ${n} vérifications passées`)
