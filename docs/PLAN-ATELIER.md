# Plan — « Un espace code comme avec Léo » (demande A de Beau, 02/10)

Rien n'est appliqué : ni table, ni fonction, ni lecture des tables de Léo. Ce plan est à relire par Alpha. La liaison avec Léo demande en plus l'accord de l'équipe de Léo.

## Ce que Beau veut
Faire un **vrai projet**, avec plusieurs fichiers, aidé par des **agents**. Pouvoir **relier** son espace Learn à son **atelier Léo**.

## Écrans
1. **Atelier** : un nouvel onglet, ou un bouton « Ouvrir l'atelier » dans Leçons.
   - À gauche : la liste des fichiers du projet (créer, renommer, supprimer).
   - Au centre : l'éditeur, avec la barre de symboles sur téléphone.
   - À droite : la console avec le résultat et les erreurs expliquées.
   - **Agents du projet** : le tuteur qui explique, un relecteur qui propose des changements à accepter (le diff existe déjà), un testeur qui écrit des vérifications.
2. **Mes projets** : la liste, les modèles de départ (calculatrice, robot, assistant FAQ, repris des projets guidés), l'export et l'import.
3. **À plusieurs** : on ouvre un projet dans un espace. L'éditeur partagé (pilote et copilotes) existe déjà.

## En trois versions
| Version | Contenu | Base / fonctions |
|---|---|---|
| V1 | Projets multi-fichiers **sur l'appareil** (IndexedDB), exécution Python/JS dans le navigateur, agents via `learn-tutor` (existant), export et import en fichier | **Rien** de neuf |
| V2 | Projets **en compte** : sauvegarde, partage avec un espace, historique des versions | Tables `learn_projets` (id, user_id, titre, visibilite, created_at) et `learn_projet_fichiers` (projet_id, chemin, contenu, updated_at). RLS : propriétaire + membres de l'espace lié. Migration additive, SQL envoyé à Alpha d'abord |
| V3 | **Liaison avec l'atelier de Léo** | Voir ci-dessous |

## Liaison Learn ↔ Léo (V3) : à décider avec Alpha et l'équipe de Léo
- **Même compte** : un seul `auth.users`, donc aucune connexion en plus.
- **Learn ne lit jamais les tables de Léo en direct.** Proposition : Léo expose une **RPC en lecture seule** (`leo_atelier_projets_de_moi()`, security definer, filtrée sur `auth.uid()`). Learn l'appelle pour afficher « Mes projets Léo » et importer une copie.
- **Learn → Léo** : une RPC côté Léo (`leo_atelier_importer(titre, fichiers)`) que Léo contrôle. Learn n'écrit jamais dans les tables de Léo.
- Questions pour Alpha :
  1. Comment s'appellent l'atelier de Léo et son format de projet (fichiers ? agents attachés ?) ?
  2. Qui écrit ces deux RPC ?
  3. Faut-il afficher l'accord de la personne avant chaque import ?

## Ordre proposé
La V1 tout de suite (aucun risque pour la base). La V2 après relecture du SQL. La V3 quand Léo a validé ses RPC.
