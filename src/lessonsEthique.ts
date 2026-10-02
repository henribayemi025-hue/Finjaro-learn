import type { Lesson } from './lessons'

// Parcours Éthique et responsabilité de l'IA : biais, équité des erreurs, k-anonymat, explicabilité (données fictives écrites pour l'exercice). Contenu original.
export const ethiqueLessons: Lesson[] = [
  {
    id: "eth-biais", lang: 'py', group: "ethique",
    title: { fr: "Mesurer un biais : taux par groupe", en: "Measuring bias: rate per group" },
    explain: { fr: "Un modèle peut être juste « en moyenne » et injuste envers un groupe. Première mesure, toute simple : le TAUX DE DÉCISIONS POSITIVES par groupe (par exemple, la part de dossiers acceptés). Si un groupe est accepté à 60 % et l'autre à 30 %, il faut comprendre pourquoi avant de déployer. Les données ici sont fictives, écrites pour l'exercice.", en: "A model can be fair “on average” and unfair to one group. First, very simple measure: the POSITIVE DECISION RATE per group (e.g. the share of accepted applications). If one group is accepted at 60% and the other at 30%, you must understand why before deploying. The data here is fictional, written for the exercise." },
    example: "decisions = [('A', 1), ('A', 0), ('B', 1)]\nprint(sum(d for g, d in decisions if g == 'A'))",
    task: { fr: "Écris taux_par_groupe(decisions) → dict {groupe: taux}, decisions étant une liste de (groupe, décision 0/1). Puis ecart(decisions) → la plus grande différence entre deux taux.", en: "Write taux_par_groupe(decisions) → dict {group: rate}, decisions being a list of (group, decision 0/1). Then ecart(decisions) → the largest difference between two rates." },
    starter: "def taux_par_groupe(decisions):\n    pass\n\ndef ecart(decisions):\n    pass\n",
    hint: { fr: "Compte, par groupe, le total et les positifs ; ecart = max(taux) - min(taux).", en: "Count, per group, the total and positives; ecart = max(rates) - min(rates)." },
    solution: "def taux_par_groupe(decisions):\n    tot, pos = {}, {}\n    for g, d in decisions:\n        tot[g] = tot.get(g, 0) + 1\n        pos[g] = pos.get(g, 0) + d\n    return {g: pos[g] / tot[g] for g in tot}\n\ndef ecart(decisions):\n    t = taux_par_groupe(decisions).values()\n    return max(t) - min(t)",
    checks: ["taux_par_groupe([('A', 1), ('A', 0), ('B', 1), ('B', 1)]) == {'A': 0.5, 'B': 1.0}", "abs(ecart([('A', 1), ('A', 0), ('B', 1), ('B', 1)]) - 0.5) < 1e-12", "ecart([('A', 1), ('B', 1)]) == 0", "taux_par_groupe([('X', 0)]) == {'X': 0.0}"],
  },
  {
    id: "eth-erreurs", lang: 'py', group: "ethique",
    title: { fr: "Équité des erreurs : qui le modèle rate-t-il ?", en: "Error fairness: whom does the model miss?" },
    explain: { fr: "Même avec le même taux d'acceptation, un modèle peut se tromper plus souvent pour un groupe. On compare le TAUX DE FAUX NÉGATIFS (personnes qui auraient dû être acceptées mais ne l'ont pas été) d'un groupe à l'autre : c'est l'idée de « l'égalité des chances ». Un détecteur de maladie qui rate surtout les malades d'un groupe est dangereux pour ce groupe, même s'il est « précis à 95 % » globalement.", en: "Even with the same acceptance rate, a model can be wrong more often for one group. Compare the FALSE NEGATIVE RATE (people who should have been accepted but weren't) across groups: that is the idea of “equal opportunity”. A disease detector that mostly misses one group's patients is dangerous for that group, even if it is “95% accurate” overall." },
    example: "lignes = [('A', 1, 0)]  # (groupe, vrai, prédit)\nprint(lignes[0][1] == 1 and lignes[0][2] == 0)",
    task: { fr: "Écris faux_negatifs(lignes) → dict {groupe: taux de faux négatifs} avec lignes = (groupe, vrai, prédit) ; le taux = nombre de (vrai=1, prédit=0) / nombre de vrai=1. Ignore un groupe sans aucun vrai=1.", en: "Write faux_negatifs(lignes) → dict {group: false negative rate} with lignes = (group, true, predicted); the rate = count of (true=1, predicted=0) / count of true=1. Skip a group with no true=1." },
    starter: "def faux_negatifs(lignes):\n    pass\n",
    hint: { fr: "Pour chaque groupe, compte les positifs réels (vrai == 1) et parmi eux ceux prédits 0.", en: "For each group, count real positives (true == 1) and among them those predicted 0." },
    solution: "def faux_negatifs(lignes):\n    pos, rate = {}, {}\n    for g, v, p in lignes:\n        if v == 1:\n            pos[g] = pos.get(g, 0) + 1\n            rate[g] = rate.get(g, 0) + (p == 0)\n    return {g: rate[g] / pos[g] for g in pos}",
    checks: ["faux_negatifs([('A', 1, 1), ('A', 1, 0), ('B', 1, 1), ('B', 1, 1)]) == {'A': 0.5, 'B': 0.0}", "faux_negatifs([('A', 0, 1), ('B', 1, 0)]) == {'B': 1.0}", "faux_negatifs([]) == {}"],
  },
  {
    id: "eth-anonymat", lang: 'py', group: "ethique",
    title: { fr: "Anonymiser : le k-anonymat", en: "Anonymising: k-anonymity" },
    explain: { fr: "Retirer le nom ne suffit pas à anonymiser : l'âge, la ville et le métier ensemble peuvent désigner UNE seule personne. Le k-ANONYMAT exige que chaque combinaison de ces attributs « quasi-identifiants » corresponde à au moins k personnes. On y arrive en GÉNÉRALISANT : âge exact → tranche de 10 ans, adresse précise → région. C'est la base du respect de la vie privée dans les jeux de données.", en: "Removing the name is not enough to anonymise: age, city and job together may single out ONE person. k-ANONYMITY requires every combination of these “quasi-identifier” attributes to match at least k people. You get there by GENERALISING: exact age → 10-year band, postcode → region. It is the basis of privacy in datasets." },
    example: "from collections import Counter\nprint(Counter([('30-39', 'Ville A'), ('30-39', 'Ville A')]).most_common(1))",
    task: { fr: "Écris k_anonymat(lignes, colonnes) → le plus petit nombre de personnes partageant une même combinaison des colonnes données (lignes = liste de dict). Puis tranche(age) → '30-39' pour 34, etc.", en: "Write k_anonymat(lignes, colonnes) → the smallest number of people sharing one combination of the given columns (lignes = list of dicts). Then tranche(age) → '30-39' for 34, etc." },
    starter: "from collections import Counter\n\ndef k_anonymat(lignes, colonnes):\n    pass\n\ndef tranche(age):\n    pass\n",
    hint: { fr: "Counter(tuple(l[c] for c in colonnes) for l in lignes) ; min des comptes. tranche : d = age // 10 * 10 → f'{d}-{d + 9}'.", en: "Counter(tuple(l[c] for c in colonnes) for l in lignes); min of counts. tranche: d = age // 10 * 10 → f'{d}-{d + 9}'." },
    solution: "from collections import Counter\n\ndef k_anonymat(lignes, colonnes):\n    c = Counter(tuple(l[col] for col in colonnes) for l in lignes)\n    return min(c.values())\n\ndef tranche(age):\n    d = age // 10 * 10\n    return f'{d}-{d + 9}'",
    checks: ["k_anonymat([{'age': 34, 'ville': 'X'}, {'age': 35, 'ville': 'X'}], ['age', 'ville']) == 1", "k_anonymat([{'age': tranche(34), 'ville': 'X'}, {'age': tranche(35), 'ville': 'X'}], ['age', 'ville']) == 2", "tranche(34) == '30-39'", "tranche(9) == '0-9'", "k_anonymat([{'a': 1}, {'a': 1}, {'a': 2}], ['a']) == 1"],
  },
  {
    id: "eth-explicabilite", lang: 'py', group: "ethique",
    title: { fr: "Expliquer un modèle : l'importance par permutation", en: "Explaining a model: permutation importance" },
    explain: { fr: "Pourquoi le modèle a-t-il décidé ça ? Une méthode honnête et simple : l'IMPORTANCE PAR PERMUTATION. On mélange les valeurs d'UNE colonne (on casse son lien avec la réponse) et on regarde de combien la précision baisse. Grosse baisse → le modèle s'appuie beaucoup sur cette colonne. S'il s'appuie sur une colonne qui ne devrait pas compter (un code postal, par exemple), c'est un signal d'alerte.", en: "Why did the model decide that? An honest, simple method: PERMUTATION IMPORTANCE. Shuffle the values of ONE column (break its link with the answer) and see how much accuracy drops. Big drop → the model relies heavily on that column. If it relies on a column that shouldn't matter (a postcode, say), that's a warning sign." },
    example: "import random\nr = random.Random(0)\nv = [1, 2, 3]\nr.shuffle(v)\nprint(v)",
    task: { fr: "Écris importance(modele, X, y, col, graine=0) → précision(X) − précision(X avec la colonne col mélangée). modele(ligne) renvoie une prédiction ; X est une liste de listes ; utilise random.Random(graine).shuffle sur une copie de la colonne.", en: "Write importance(modele, X, y, col, graine=0) → accuracy(X) − accuracy(X with column col shuffled). modele(row) returns a prediction; X is a list of lists; use random.Random(graine).shuffle on a copy of the column." },
    starter: "import random\n\ndef importance(modele, X, y, col, graine=0):\n    pass\n",
    hint: { fr: "precision = sum(modele(x) == t for x, t in zip(X, y)) / len(y). Copie les lignes avant de remplacer la colonne.", en: "accuracy = sum(modele(x) == t for x, t in zip(X, y)) / len(y). Copy the rows before replacing the column." },
    solution: "import random\n\ndef importance(modele, X, y, col, graine=0):\n    prec = lambda XX: sum(modele(x) == t for x, t in zip(XX, y)) / len(y)\n    valeurs = [x[col] for x in X]\n    random.Random(graine).shuffle(valeurs)\n    X2 = [list(x) for x in X]\n    for x, v in zip(X2, valeurs):\n        x[col] = v\n    return prec(X) - prec(X2)",
    checks: ["(lambda X, y: importance(lambda x: int(x[0] > 5), X, y, 1) == 0)([[i, i % 2] for i in range(10)], [int(i > 5) for i in range(10)])", "(lambda X, y: importance(lambda x: int(x[0] > 5), X, y, 0) > 0.2)([[i, i % 2] for i in range(10)], [int(i > 5) for i in range(10)])", "(lambda X: X == [[1, 0], [2, 1]])((lambda X: (importance(lambda x: 1, X, [1, 1], 0), X)[1])([[1, 0], [2, 1]]))"],
  },
]
