# Journal commun — Learn, Alpha, Claudinette

Une ligne par échange important (date, qui, quoi). Le détail reste dans les
messages directs (create_trigger vers la session concernée).

| Date | Qui | Quoi |
|---|---|---|
| 01/10 | Alpha | Dépôt créé par Beau, règles posées (CLAUDE.md), session Learn lancée. Base Supabase commune : tables `learn_`, fonctions `learn-`, migrations additives, prévenir Alpha avant. |
| 01/10 | Learn → Alpha | Plan posé (docs/PLAN.md). J1 livré, sans base. Demandé à Alpha (J2) : migration `learn_progress`, fonction `learn-tutor`, Redirect URL `https://learn.finjaro.net/**`. Rien fait avant son feu vert. |
| 01/10 | Alpha → Learn | Feu orange : préparer sans appliquer. Fait : `supabase/migrations/20261001120000_learn_progress.sql` (learn_progress + learn_tutor_usage + RPC `learn_tutor_consume`, RLS, pas d'anon) et `supabase/functions/learn-tutor/` (JWT obligatoire, 60 appels/jour, entrées bornées, GEMINI_API_KEY côté serveur). Rien appliqué ni déployé. Attente relecture d'Alpha + oui de Beau. |
| 01/10 | Alpha → Learn | Relecture dc7af96 : 5 corrections (thinkingBudget 0 + réponse vide = erreur, timeout 25 s → 504, limite 60 en dur dans le SQL, verify_jwt dans supabase/config.toml, CORS restreint). Appliquées, rien déployé. |
| 01/10 | Learn | Thème Finjaro vintage appliqué (crème, terracotta #C25E38, laiton, encre #171B26, titres Fraunces). Captures 390/1440 refaites. |
| 01/10 | Alpha → Learn | Demande de Beau : agents comme Léo, appel vocal, avec/sans IA, connexion à Léo. Fait sans base : interrupteur, 4 cartes d'agents (initiales, pas de visage : fetch des visages refusé par le garde-fou de la session), micro/voix navigateur, champ `agent` dans learn-tutor. Réponses IA et connexion Léo : après « oui Learn ». |
| 01/10 | Alpha → Learn | « oui pour tout » de Beau : migration learn_progress appliquée, learn-tutor déployée, Redirect URL ajoutée, 20 visages dans public/visages. Learn : connexion + IA active + progression + visages poussés ; conception des espaces dans docs/ESPACES.md (aucun SQL espaces avant relecture). |
| 01/10 | Learn → Alpha | SQL espaces proposé (20261001140000_learn_espaces.sql), carte des parcours dans PLAN.md. Connexion à Léo (lecture legion_*) : NON faite — le garde-fou de ma session a bloqué le code qui lit ces tables ; à trancher avec Beau. |
