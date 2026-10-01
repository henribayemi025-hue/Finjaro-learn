# À faire — Finjaro Learn

## 0. Carnet de Beau

Chaque demande de Beau, le jour même. On coche ✅ avec la date, on ne supprime jamais.

| Date | Demande | État |
|---|---|---|
| 01/10 | Créer Finjaro Learn, le **hub de l'IA** : apprendre à coder et l'IA avec un agent qui montre, fait pratiquer et corrige (Beau veut devenir ingénieur IA sans savoir coder) ; fiches de révision à partir d'un cours ; CV et lettres de motivation ; newsletter sur les nouveautés de l'IA et de Finjaro. Développé par une session Claude dédiée (Sonnet 5.5), pendant qu'Alpha continue la place de marché. Abonnement de Beau : environ deux semaines restantes. | J1 livré 01/10 : tuteur de code v0 (voir docs/PLAN.md) |
| 01/10 | Comme Léo : agents (visage, prénom, personnalité, spécialité) qu'on appelle à la voix ; connexion à son Léo (agents guides, lecture seule) ; travailler avec ou sans IA ; style vintage Finjaro, téléphone ET ordinateur. | Fait : interrupteur avec/sans IA, cartes d'agents, appel vocal, thème (01/10). Reste : visages Léo, réponses IA, connexion à Léo (après « oui Learn »). |
| 01/10 | « À Learn on peut travailler à plusieurs, apprendre et coder à plusieurs, un espace comme dans Léo. » | Conception écrite : docs/ESPACES.md (en relecture chez Alpha) |
| 01/10 | « Oui, Learn peut lire mes agents Léo » (dit directement à Learn). | Fait : bouton « Connecter mon Léo », lecture seule (legion_entreprises id/nom ; legion_agents colonnes validées), avec le JWT de l'élève. Non testé avec un vrai compte. |
| 01/10 | « Pourquoi se limiter à plus tard, on peut faire tout ça maintenant » ; maquette CodeCraft ; « une plateforme communautaire d'entraide entre les membres actifs ». | Fait : éditeur + console côte à côte, « Corriger avec l'IA » avec aperçu des différences (accepter/refuser), sons de réussite/erreur ; conception de l'entraide : docs/ENTRAIDE.md (en relecture). Fiches/CV/newsletter : session « Learn — outils ». |
| 01/10 | « Pourquoi se limiter à plus tard, on peut faire tout ça maintenant » : fiches de révision, CV et lettres, newsletter, tout de suite (session Learn — outils). | Fiches : appliqué + déployé par Alpha (01/10). CV : code + captures prêts (01/10), en attente de déploiement `learn-cv`. Newsletter : code + captures prêts (01/10), en attente de déploiement `learn-news` ; à tester avec la vraie recherche Google. |
| 01/10 | « Oui, fais l'écran de modération. » | Fait : bouton « Modération » visible des seuls modérateurs ; signalements regroupés par contenu, Masquer / Laisser visible, onglet Masqués ; pseudos seulement. Vu avec des données simulées (pas de vrai compte). |
| 01/10 | « Continue avec l'éditeur partagé. » | Fait : « Coder ensemble » dans le salon d'un espace — un pilote écrit, les copilotes voient en direct, « passer la main », exercice choisi par le pilote, lancement du code chez chacun. Essayé à deux navigateurs (serveur temps réel simulé) à 390 et 1440 px. |
| 01/10 | « Continue avec les défis de groupe. » | Fait : dans un espace, l'animateur lance un défi (même exercice pour tous) ; chacun résout et rend sa solution ; les solutions des autres se découvrent après avoir rendu la sienne ; « réussi » = déclaré, pas une note. Essayé à 2 navigateurs (serveur simulé avec la règle de visibilité) à 390/1440 px. |
| 01/10 | « Continue avec le parcours Programmation, même si je ne réponds pas : n'attends pas ma réponse. » | Fait : 34 leçons (4 JavaScript + 30 Python : bases, algorithmes et structures, 2 projets), Python dans le navigateur (Pyodide, gratuit). Chaque leçon vérifiée (départ échoue, solution réussit) ; vue d'ensemble repliable sur téléphone. |

## 1. Ce qu'on attend de Beau

| Date | Quoi |
|---|---|
| 01/10 | Dans Cloudflare : définir `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (clé publique, voir .env.example) pour que la connexion marche en ligne. |
| — | Brancher le dépôt sur Cloudflare (adresse learn.finjaro.net) quand une première version tourne : Learn dira quand. |
