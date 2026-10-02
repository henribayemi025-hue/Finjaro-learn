# Plan — Veille IA quotidienne et lettre « Bloomberg de l'IA » (demande D de Beau, 02/10)

Rien n'est appliqué. À relire par Alpha. L'onglet « Nouveautés » actuel (`learn-news`) appartient à la session « Learn — outils » : on coordonne avec elle pour ne pas faire deux fois la même chose.

## Règles (non négociables)
- Chaque nouvelle a une **source (lien)** et une **date de publication**. Sans source, pas de nouvelle.
- **Aucun chiffre** qui ne figure pas dans la source. Un résumé automatique est signalé comme tel.
- **Le vocabulaire nouveau** (par exemple « superintelligence ») n'est adopté que s'il apparaît dans les sources, avec la définition sourcée. Learn ne présente pas comme un fait ce qui n'est qu'un terme à la mode.

## Pourquoi pas la recherche web par l'IA
Le quota de recherche Gemini est épuisé. Proposition : lire chaque jour des **flux officiels (RSS/Atom)**, gratuits et sourcés par nature. Ce sont les blogs officiels des laboratoires et outils d'IA ; la liste exacte est à valider par Beau, sans payer d'abonnement.

## Architecture proposée
1. **Fonction planifiée `learn-veille`** : une fois par jour, par pg_cron ou par le Cron Trigger de Cloudflare, au choix d'Alpha.
   - Elle lit les flux de la liste, garde les articles des dernières 48 h et ignore les doublons (lien unique).
   - Elle enregistre titre, lien, source et date.
   - Résumé en 2 phrases par Gemini 2.5 Flash (texte, **sans** recherche), à partir du seul texte de l'article et avec un plafond quotidien. Si le quota est atteint : titre et lien seulement.
2. **Table `learn_veille`** : id, source, url (unique), titre, publie_le, resume, resume_auto (booléen), created_at. Lecture publique, écriture par la fonction seulement.
3. **Table `learn_glossaire`** : terme, definition, source_url, vu_le. Proposée par la fonction, publiée après relecture par un modérateur.
4. **Écran « Veille »** dans Learn : le fil du jour, un filtre par source, « nouveaux mots », et une lettre de la semaine (les 10 plus importantes, choisies par un humain).
5. **Lettre par e-mail** : demande un service d'envoi, donc une **décision de Beau** (coût). En attendant : page web et lien à partager.

## Ce qu'il faut à Alpha
- Qui planifie la tâche (Supabase ou Cloudflare) ?
- Quel plafond quotidien d'appels Gemini pour les résumés ?
- Accord pour les deux tables (migration additive, SQL fourni quand le plan est validé).
