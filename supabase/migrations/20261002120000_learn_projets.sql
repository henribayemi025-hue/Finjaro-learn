-- Finjaro Learn — Atelier V2 : projets de code enregistrés dans le compte.
-- PROPOSITION RELUE PAR ALPHA (2e version) : rien n'est appliqué tant qu'Alpha ne l'a pas fait. Additive uniquement, ré-exécutable.
-- V1 (livrée) garde les projets sur l'appareil, sans limite ; la V2 ajoute la sauvegarde dans le compte, avec des plafonds
-- serrés car la base est commune (place de marché, Accounting, Léo) : 30 projets, 100 000 caractères par fichier,
-- 5 Mo au total par personne. L'export en fichier depuis l'appareil reste illimité.

create table if not exists public.learn_projets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  titre      text not null check (char_length(titre) between 1 and 80),
  langage    text not null check (langage in ('py', 'js')),
  principal  text not null check (char_length(principal) between 1 and 80),
  -- Partage en lecture avec un espace d'étude (facultatif) : les membres peuvent ouvrir et copier, pas modifier.
  espace_id  uuid references public.learn_espaces(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists learn_projets_user_idx on public.learn_projets (user_id, updated_at desc);
create index if not exists learn_projets_espace_idx on public.learn_projets (espace_id) where espace_id is not null;

create table if not exists public.learn_projet_fichiers (
  projet_id  uuid not null references public.learn_projets(id) on delete cascade,
  chemin     text not null check (char_length(chemin) between 1 and 80 and chemin !~ '\.\.' and chemin ~ '^[[:alnum:]_./-]+$'),
  contenu    text not null default '' check (char_length(contenu) <= 100000),
  updated_at timestamptz not null default now(),
  primary key (projet_id, chemin)
);

alter table public.learn_projets enable row level security;
alter table public.learn_projet_fichiers enable row level security;
revoke all on public.learn_projets, public.learn_projet_fichiers from anon;
-- Droits explicites (les droits par défaut sur les nouvelles tables disparaissent le 30/10) ; les politiques RLS restent le vrai filtre.
grant select, insert, update, delete on public.learn_projets, public.learn_projet_fichiers to authenticated;

-- Propriétaire : tout ; membres de l'espace lié : lecture seule.
drop policy if exists learn_projets_proprio on public.learn_projets;
create policy learn_projets_proprio on public.learn_projets
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and (espace_id is null or public.learn_est_membre(espace_id)));
drop policy if exists learn_projets_espace_lecture on public.learn_projets;
create policy learn_projets_espace_lecture on public.learn_projets
  for select to authenticated using (espace_id is not null and public.learn_est_membre(espace_id));

drop policy if exists learn_fichiers_proprio on public.learn_projet_fichiers;
create policy learn_fichiers_proprio on public.learn_projet_fichiers
  for all to authenticated
  using (exists (select 1 from public.learn_projets p where p.id = projet_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.learn_projets p where p.id = projet_id and p.user_id = auth.uid()));
drop policy if exists learn_fichiers_espace_lecture on public.learn_projet_fichiers;
create policy learn_fichiers_espace_lecture on public.learn_projet_fichiers
  for select to authenticated
  using (exists (select 1 from public.learn_projets p where p.id = projet_id and p.espace_id is not null and public.learn_est_membre(p.espace_id)));

-- Plafonds par personne. Les messages commencent par « learn_limite: » : l'appli les reconnaît et affiche
-- « Limite atteinte : exporte ou supprime un projet » au lieu d'une erreur technique.
create or replace function public.learn_projets_limites()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  proprio uuid;
  total   bigint;
begin
  if tg_table_name = 'learn_projets' then
    if tg_op = 'INSERT' and (select count(*) from public.learn_projets where user_id = new.user_id) >= 30 then
      raise exception 'learn_limite: 30 projets au maximum dans le compte';
    end if;
    new.updated_at := now();
    return new;
  end if;
  -- learn_projet_fichiers (insert ou update) : 50 fichiers par projet, 5 Mo au total par personne.
  select user_id into proprio from public.learn_projets where id = new.projet_id;
  if tg_op = 'INSERT' and (select count(*) from public.learn_projet_fichiers where projet_id = new.projet_id) >= 50 then
    raise exception 'learn_limite: 50 fichiers au maximum par projet';
  end if;
  select coalesce(sum(octet_length(f.contenu)), 0) into total
    from public.learn_projet_fichiers f join public.learn_projets p on p.id = f.projet_id
   where p.user_id = proprio and not (f.projet_id = new.projet_id and f.chemin = coalesce(case when tg_op = 'UPDATE' then old.chemin end, new.chemin));
  if total + octet_length(new.contenu) > 5 * 1024 * 1024 then
    raise exception 'learn_limite: 5 Mo au maximum pour l''ensemble de tes fichiers';
  end if;
  new.updated_at := now();
  update public.learn_projets set updated_at = now() where id = new.projet_id;
  return new;
end;
$$;
drop trigger if exists learn_projets_limite on public.learn_projets;
create trigger learn_projets_limite before insert or update on public.learn_projets for each row execute function public.learn_projets_limites();
drop trigger if exists learn_fichiers_limite on public.learn_projet_fichiers;
create trigger learn_fichiers_limite before insert or update on public.learn_projet_fichiers for each row execute function public.learn_projets_limites();
revoke all on function public.learn_projets_limites() from public, anon, authenticated;
