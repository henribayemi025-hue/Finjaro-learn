# Journal commun — Learn, Alpha, Claudinette

Une ligne par échange important (date, qui, quoi). Le détail reste dans les
messages directs (create_trigger vers la session concernée).

| Date | Qui | Quoi |
|---|---|---|
| 01/10 | Alpha | Dépôt créé par Beau, règles posées (CLAUDE.md), session Learn lancée. Base Supabase commune : tables `learn_`, fonctions `learn-`, migrations additives, prévenir Alpha avant. |
| 01/10 | Learn → Alpha | Plan posé (docs/PLAN.md). J1 livré, sans base. Demandé à Alpha (J2) : migration `learn_progress`, fonction `learn-tutor`, Redirect URL `https://learn.finjaro.net/**`. Rien fait avant son feu vert. |
| 01/10 | Alpha → Learn | Feu orange : préparer sans appliquer. Fait : `supabase/migrations/20261001120000_learn_progress.sql` (learn_progress + learn_tutor_usage + RPC `learn_tutor_consume`, RLS, pas d'anon) et `supabase/functions/learn-tutor/` (JWT obligatoire, 60 appels/jour, entrées bornées, GEMINI_API_KEY côté serveur). Rien appliqué ni déployé. Attente relecture d'Alpha + oui de Beau. |
