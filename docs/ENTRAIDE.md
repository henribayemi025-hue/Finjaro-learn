# Entraide entre membres — conception (à relire par Alpha, rien d'appliqué)

Demande de Beau (01/10) : « une plateforme communautaire d'entraide entre les membres actifs ».

## Principe
Un fil de questions publiques (pour les membres connectés de Learn). Les membres répondent ; un agent répond aussi si on le nomme. L'auteur choisit la meilleure réponse. Chaque membre a un profil d'entraide avec des compteurs **réels**.

## Écrans
1. **Questions** : liste (récentes / sans réponse / résolues), filtre par parcours (programmation, data, IA, prompt) et par étiquette ; bouton « Poser une question ».
2. **Poser** : titre, détail, code optionnel (≤ 20 000 car.), parcours, étiquettes (≤ 5).
3. **Question** : texte + code, réponses des membres, réponses d'agents (badge « agent », jamais présentées comme humaines), bouton « meilleure réponse » visible par l'auteur seulement, « signaler » sur chaque élément.
4. **Profil d'entraide** : réponses données, réponses retenues (meilleures réponses), questions posées. Valeurs calculées en base ; **comptes de test exclus** (`profiles.is_test` / `compte_reel()` — à confirmer avec Alpha comment les lire sans toucher aux tables des autres applications).
5. **Modération simple** : signalements visibles par les animateurs de la communauté (rôle `learn_moderateurs`), masquer un contenu (jamais le supprimer physiquement).

## Tables (préfixe learn_entraide_, additives, RLS)
- `learn_entraide_questions(id, auteur_id → auth.users, titre ≤ 150, corps ≤ 4000, code ≤ 20000, parcours, tags text[] ≤ 5, meilleure_reponse_id null, masquee bool, created_at)`
- `learn_entraide_reponses(id, question_id, auteur_id null si agent, agent_id null, corps ≤ 4000, code, masquee bool, created_at)`
- `learn_entraide_signalements(id, cible_type in ('question','reponse'), cible_id, auteur_id, motif ≤ 300, traite bool, created_at, unique(auteur_id,cible_type,cible_id))`
- `learn_entraide_moderateurs(user_id pk)` — alimentée par Alpha/Beau, jamais par le client.
- Vue/RPC `learn_entraide_profil(user_id)` : compteurs réels (réponses données = lignes non masquées ; retenues = réponses désignées meilleures ; hors comptes de test).

## Règles et sécurité
- Lecture des contenus non masqués : tout membre connecté (pas d'anonyme). Écriture : son propre contenu seulement.
- **Meilleure réponse** : RPC `learn_entraide_choisir(question_id, reponse_id)` — vérifie que l'appelant est l'auteur de la question et que la réponse appartient à la question.
- **Agent** : comme pour les salons, un agent répond via `learn-tutor` (mode `entraide`), qui écrit la réponse côté serveur (service_role) après vérification que l'appelant est connecté ; limite 60/jour/personne inchangée + plafond de réponses d'agent par question (3).
- **Anti-abus** : limite de questions (10/jour/personne) et de réponses (50/jour/personne) via compteur serveur ; 1 signalement par personne et par contenu ; un contenu masqué n'est plus servi mais reste en base.
- Aucun chiffre affiché sans mesure (pas de « X membres actifs » inventé) ; un profil neuf affiche 0.
- Pas de message privé, pas d'e-mail ni de nom réel exposé : pseudo issu du profil Learn (à créer : `learn_profils(user_id, pseudo)`, additif) plutôt que la lecture de `profiles` d'autres applications.

## Questions pour Alpha
1. Comptes de test : puis-je lire `profiles.is_test` (une colonne, lecture seule) pour exclure ces comptes des compteurs, ou préfères-tu une fonction `learn_est_compte_reel(uid)` que tu écris ?
2. Pseudo : OK pour `learn_profils` côté Learn plutôt que lire les profils des autres apps ?
3. Qui alimente `learn_entraide_moderateurs` au départ (Beau seul ?).
