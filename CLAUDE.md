# Finjaro Learn — ce qu'il faut savoir avant de toucher au code

Tout ce qui est ici est une décision prise par Beau, pas une suggestion.

## 1. Ce qu'est Finjaro Learn

Le **hub de l'IA** de Finjaro, décidé par Beau le 01/10 :

1. **Apprendre à coder et l'IA** avec un agent tuteur qui explique, montre,
   fait pratiquer et corrige. Beau lui-même veut devenir ingénieur IA sans
   savoir coder : il est le premier élève. Si un parcours ne marche pas pour
   lui, il ne marche pas.
2. **Fiches de révision** : on dépose un cours (texte, PDF, photo), on reçoit
   un résumé, des fiches et un quiz.
3. **CV et lettres de motivation** générés et améliorés par l'IA.
4. **Newsletter** : les nouveautés de l'IA et celles de Finjaro.

Adresse visée : `https://learn.finjaro.net`.

## 2. Finjaro est MONDIAL

- Aucun texte visible n'enferme Finjaro dans un pays (pas de « camerounais »,
  pas de « partout au pays »). Le Cameroun est une stratégie de démarrage, pas
  l'identité du produit.
- Pas de devise par défaut qui suppose un pays. Pas de mention publique de
  « diaspora ».
- Français d'abord, anglais aussi (i18n dès le départ).

## 3. Vérité des contenus

- **Aucun chiffre inventé** (nombre d'élèves, de cours, de téléchargements).
  Non mesuré = pas écrit.
- La newsletter cite ses sources et n'invente aucune nouveauté.
- Aucune image prise sur le web sans droit.

## 4. Base de données : le projet Supabase est PARTAGÉ

Projet `bokwivwizghdlaedczbw`, commun à la place de marché (finjaro.net),
Finjaro Accounting, la Console et Léo. **Un seul `auth.users`.**

- **Tables à vous : préfixe `learn_`.** On ne lit pas les tables des autres
  applications sans l'accord de Beau.
- **Migrations additives uniquement** : pas de suppression ni de renommage de
  colonne, jamais de suppression de compte.
- **Le Site URL d'authentification ne se change JAMAIS** (il reste
  `https://finjaro.net`). Pour revenir sur Learn après connexion, on AJOUTE
  `https://learn.finjaro.net/**` aux Redirect URLs (demander à Alpha) et le
  code passe `redirectTo`.
- **Fonctions edge préfixées `learn-`.** Elles sont communes à toutes les
  applications. Ne jamais modifier une fonction qui ne commence pas par
  `learn-`.
- `profiles.is_test` et `compte_reel()` : aucun chiffre montré ne compte les
  comptes de test.
- **Avant toute migration, fonction edge ou réglage d'authentification :
  prévenir Alpha** (voir § 7). Il garde la vue d'ensemble de la base commune.

## 5. Argent

- **Aucune dépense sans l'accord de Beau** : pas de nouveau service payant,
  pas de nouvelle clé payante.
- Pour l'IA, utiliser les fournisseurs déjà branchés sur le projet (secret
  `GEMINI_API_KEY`, côté fonctions edge, jamais côté navigateur), dans des
  limites raisonnables.
- Jamais de clé ou de jeton dans le code, les commits ou la discussion.

## 6. Branches et mise en ligne

- Travail sur `main`. **Jamais de pull request sans que Beau l'ait demandé.**
- La mise en ligne (Cloudflare) se fera quand Beau aura branché le dépôt sur
  Cloudflare. Ne pas annoncer « en ligne » sans l'avoir vu servi.
- « Terminé » = l'appli a été lancée, chaque fonction touchée a été essayée
  (téléphone 390 px **et** grand écran 1440 px), avec des captures ou des
  sorties de commandes à l'appui. Sinon, ce n'est pas terminé.

## 7. Qui est qui, et comment se parler

- **Beau** : fondateur, francophone, ne code pas, a un emploi à côté, lit sur
  téléphone, dicte souvent à la voix (lire l'intention, pas la lettre).
  **Trois lignes, pas trois écrans** : le résultat d'abord, le détail dans le
  dépôt.
- **Alpha** : la session Claude de la place de marché (session
  `session_015PBwRnLtCjPX8zj12rkDdQ`). Coordonne la base commune.
- **Claudinette** : la session Claude de Finjaro Accounting (session
  `session_01Gjs9i62dyinT13eeFbd7Xh`).
- **Pour écrire à Alpha ou à Claudinette** : `create_trigger` avec
  `persistent_session_id` = sa session, sans cron, `initiation: human_request`,
  puis `fire_trigger`. Messages courts, signés « Learn → Alpha : … ».
- **Journal commun** : `docs/COORDINATION.md` dans ce dépôt (date, qui, quoi).

## 8. Tout noter

Chaque demande de Beau va le jour même dans `docs/A-FAIRE.md`, section
« Carnet de Beau ». On coche ✅ avec la date, on ne supprime jamais.

## 9. Le temps compte

L'abonnement de Beau finit dans environ deux semaines (au 01/10). **Livrer
tôt et par petits morceaux utilisables**, plutôt qu'un grand tout inachevé.
Ordre de valeur : le tuteur de code (Beau l'utilise lui-même) → les fiches de
révision → les CV → la newsletter.
