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

## Carte des parcours (demande de Beau, 01/10 : niveau universitaire)

Structure inspirée de la **forme** des cours ouverts publics (progression, exercices notés, projets). Aucun contenu copié, aucune affiliation, aucun « certifié Harvard/MIT » affiché, aucun chiffre inventé.

| Parcours | Contenu | État |
|---|---|---|
| (a) Programmation | JS puis Python, algorithmique, structures de données | **en cours — d'abord, complet avant d'ouvrir un autre** |
| (b) Data science | statistiques, probabilités, pandas, visualisation, ML classique | à venir |
| (c) IA / deep learning | réseaux de neurones, entraînement, évaluation | à venir |
| (d) AI engineering | appeler des modèles, RAG, agents, évaluation, mise en production | à venir |
| (e) Prompt engineering | méthodes, évaluation, sécurité | à venir |

Python dans le navigateur : Pyodide (gratuit), chargé à la demande.
