# Plan — Finjaro Learn (10 jours, du 01/10 au 10/10)

Principe : petits morceaux utilisables, chaque jalon est lancé et essayé à 390 px et 1440 px.
Ordre de valeur : tuteur de code → fiches → CV → newsletter.

| Date | Jalon | Livrable |
|---|---|---|
| 01/10 | **J1 — Tuteur de code, v0** ✅ | App React+Vite+Tailwind, fr/en. 4 leçons (afficher, variables, conditions, boucles), exercices JS exécutés dans le navigateur (Worker isolé), correction automatique, indice, solution. Sans base ni IA : aucune dépense. |
| 01/10 | J2 ✅ (partiel) | Connexion compte commun (redirectTo learn), réponses IA actives, progression `learn_progress`, visages. Reste : connexion à ses agents Léo. |
| 02/10 | J2 (ancien) | Tuteur IA : fonction edge `learn-tutor` (GEMINI_API_KEY) qui explique l'erreur et répond aux questions. Connexion (auth commun) + progression `learn_progress`. **Alpha prévenu avant.** |
| 02–03/10 | J2b | **Espaces d'étude** (apprendre/coder à plusieurs) : conception dans docs/ESPACES.md ; SQL envoyé à Alpha avant tout ; puis salon, éditeur partagé, défis. |
| 03–04/10 | J3–J4 | Parcours « IA pour débutant » (Python dans le navigateur, appeler un modèle, prompts) ; 10+ leçons. |
| 05–06/10 | J5–J6 | Fiches de révision : dépôt texte/PDF/photo → résumé, fiches, quiz (`learn-fiches`). |
| 07–08/10 | J7–J8 | CV et lettres de motivation (`learn-cv`), export PDF. |
| 09/10 | J9 | Newsletter : sources citées, rien d'inventé (`learn-news`). |
| 10/10 | J10 | Finitions, vérif 390/1440 px, mise en ligne Cloudflare si branché par Beau. |

Choix J1 : JavaScript (tourne sans rien installer ni payer). Python arrive avec le parcours IA (J3).

## Carte des parcours (demande de Beau, 01/10 : niveau universitaire, utile aux data scientists, AI engineers, data analysts)

Structure inspirée de la **forme** des cours ouverts publics (progression, exercices notés, projets). Aucun contenu copié, aucune affiliation, aucun « certifié Harvard/MIT » affiché, aucun chiffre inventé.
Tout tourne dans le navigateur (Python via Pyodide ; NumPy et pandas chargés à la demande), gratuit, sans clé. Chaque leçon a des vérifications automatiques ; les modèles d'IA des exercices sont écrits à la main ou simulés (hors ligne).

| Parcours | Contenu | État |
|---|---|---|
| (a) Programmation | JS (4), Python bases (14), algorithmes et structures (14), 2 projets (soit 34) | disponible |
| (b) Data science | NumPy (3), pandas (3), statistiques et apprentissage (6) : normalisation, distances, groupby, nettoyage, jointures, Monte-Carlo, corrélation, régression, k-NN, précision/rappel, train/test | disponible |
| (c) IA / deep learning | neurone, activations, pertes, descente de gradient, régression linéaire et logistique, propagation avant, rétropropagation (XOR), surapprentissage, Adam, mini-lots, convolution, attention, projet « ta première IA » — tout écrit avec NumPy | disponible |
| (d) AI engineering | découpage, similarité cosinus, sac de mots, recherche (RAG), prompt RAG, JSON structuré, boucle d'agent avec outils, évaluation, nouvelles tentatives, limiteur de débit | disponible |
| (e) Prompt engineering | structurer, few-shot, gabarits, extraction de réponse, injection de prompt, comparer des prompts | disponible |

Reste à faire : visualisation (graphiques), PyTorch-like (autograd) à la main, évaluation de modèles de langage, appels réels à un modèle via une fonction edge (accord de Beau pour le coût), projets de fin de parcours par piste.
