const assert = require('assert')
const { apply, prune, initial, GONE_AFTER } = require('../.test-build/coop.cjs')
let s = initial('afficher', 'x')
// prise de main initiale : la plus petite identité gagne, quel que soit l'ordre d'arrivée
const a = apply(apply(s, { t: 'pilot', from: 'b', to: 'b', claim: true }, 0), { t: 'pilot', from: 'a', to: 'a', claim: true }, 0)
const b = apply(apply(s, { t: 'pilot', from: 'a', to: 'a', claim: true }, 0), { t: 'pilot', from: 'b', to: 'b', claim: true }, 0)
assert.equal(a.pilot, 'a'); assert.equal(b.pilot, 'a')
// seul le pilote écrit
assert.equal(apply(a, { t: 'code', from: 'b', code: 'hack', lesson: 'afficher' }, 1).code, 'x')
assert.equal(apply(a, { t: 'code', from: 'a', code: 'ok', lesson: 'variables' }, 1).code, 'ok')
assert.equal(apply(a, { t: 'code', from: 'a', code: 'ok', lesson: 'variables' }, 1).lesson, 'variables')
// passer la main : seulement depuis le pilote
assert.equal(apply(a, { t: 'pilot', from: 'b', to: 'b' }, 2).pilot, 'a')
assert.equal(apply(a, { t: 'pilot', from: 'a', to: 'b' }, 2).pilot, 'b')
// pilote parti → la plus petite identité présente reprend
let p = apply(apply(apply(a, { t: 'hello', from: 'a', name: 'A' }, 0), { t: 'hello', from: 'c', name: 'C' }, 0), { t: 'hello', from: 'b', name: 'B' }, 0)
p = apply(p, { t: 'hello', from: 'b', name: 'B' }, GONE_AFTER + 10); p = apply(p, { t: 'hello', from: 'c', name: 'C' }, GONE_AFTER + 10)
const q = prune(p, 'b', GONE_AFTER + 20)
assert.equal(q.pilot, 'b'); assert.ok(!('a' in q.members))
// un état reçu d'un non-pilote est ignoré quand un pilote existe
assert.equal(apply(a, { t: 'state', from: 'z', pilot: 'z', lesson: 'l', code: 'c' }, 3).pilot, 'a')
console.log('coop: 9 vérifications OK')
