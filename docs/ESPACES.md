# Espaces d'étude — conception (à relire par Alpha, rien d'appliqué)

Demande de Beau (01/10) : apprendre et coder à plusieurs, un espace comme dans Léo.

## Écrans
1. **Mes espaces** : liste + « Créer un espace » (nom, type : classe / équipe / amis).
2. **Inviter** : lien d'invitation (jeton aléatoire, révocable, expiration optionnelle). « Rejoindre » = ouvrir le lien connecté.
3. **Salon** : fil de messages du groupe ; on nomme un agent (@Maya, @Idris, ou un agent Léo du créateur) → il répond via `learn-tutor`. Compte dans la limite de 60/jour de la personne qui pose la question.
4. **Coder ensemble** : un exercice, un éditeur partagé. Supabase Realtime (broadcast + presence, gratuit) : curseur/texte diffusés, liste « qui est là / qui tape », bouton « je passe la main » (pilote/copilote ; un seul pilote écrit à la fois).
5. **Défi du groupe** : même exercice pour tous, chacun résout seul ; après coup on compare les solutions. Progression du groupe = comptes réels uniquement, comptes de test exclus.
6. **Réviser ensemble** : fiches partagées dans l'espace, quiz en direct (après le module fiches).

## Tables (préfixe learn_, additives, RLS par appartenance)
- `learn_espaces(id, nom, type, created_by → auth.users, created_at)`
- `learn_membres(espace_id → learn_espaces, user_id → auth.users, role in ('animateur','membre'), joined_at, pk(espace_id,user_id))`
- `learn_invitations(id, espace_id, token unique, created_by, expires_at, revoked_at)`
- `learn_messages(id, espace_id, user_id null si agent, agent_id null, texte ≤ 4000, created_at)`
- `learn_defis(id, espace_id, lesson_id, created_by, created_at)` et `learn_solutions(defi_id, user_id, code ≤ 20000, passed, created_at)`

Sécurité : fonction `learn_est_membre(espace_id)` (security definer, stable) utilisée par toutes les policies — séparée de `legion_est_membre`. Seul un animateur invite, retire, supprime. Rejoindre par jeton = RPC `learn_rejoindre(token)` (le jeton n'est jamais lisible par les non-animateurs). Temps réel : canal par espace, autorisation Realtime limitée aux membres.

## Questions pour Alpha
- Realtime sur le projet commun : OK d'activer un canal privé `learn:espace:<id>` avec policy sur `realtime.messages` ?
- Un agent Léo du créateur dans un salon : lecture de `legion_agents` au nom du créateur (RLS) suffisante, ou prévoir une copie de nom/personnalité dans `learn_espaces` ?
