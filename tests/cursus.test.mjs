// Vérifie le cursus « De zéro à chercheur IA » : chaque module a des leçons, aucune leçon n'est dans deux modules, l'avancement est exact.
import assert from 'node:assert/strict'
import { modulesVus, cursusTotal, moduleCourant, MODULES } from '../.test-build/cursusdata.mjs'
let n = 0
const ok = (c, m) => { assert.ok(c, m); n++ }
const vide = modulesVus([])
ok(vide.length === MODULES.length && vide.length >= 10, 'modules : ' + vide.length)
for (const v of vide) ok(v.ls.length > 0, v.m.id + ' sans leçon')
const ids = vide.flatMap((v) => v.ls.map(({ l }) => l.id))
ok(new Set(ids).size === ids.length, 'une leçon est dans deux modules')
ok(cursusTotal(vide).fait === 0 && cursusTotal(vide).total === ids.length, 'total à zéro')
ok(moduleCourant(vide).m.id === 'm1', 'on commence au module 1')
ok(vide[0].ls[0].l.id === 'py-print', 'la première leçon est la première ligne de code : ' + vide[0].ls[0].l.id)
const m1 = vide[0].ls.map(({ l }) => l.id)
const apres = modulesVus(m1)
ok(apres[0].pct === 100 && moduleCourant(apres).m.id === 'm2', 'module 1 fini, on passe au 2')
ok(cursusTotal(apres).fait === m1.length, 'avancement exact')
for (const v of vide) { ok(v.m.titre.fr && v.m.titre.en && v.m.sauras.fr && v.m.sauras.en, v.m.id + ' textes fr/en') }
console.log(`cursus : ${n} vérifications passées`)
