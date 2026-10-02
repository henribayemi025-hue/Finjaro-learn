-- Finjaro Learn — Atelier V2 : projets de code enregistrés dans le compte.
-- PROPOSITION À RELIRE PAR ALPHA : rien n'est appliqué. Additive uniquement (nouvelles tables learn_, aucune modification existante).
-- V1 (déjà livrée) garde les projets sur l'appareil ; la V2 ajoute la sauvegarde dans le compte et le partage avec un espace.

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
  contenu    text not null default '' check (char_length(contenu) <= 200000),
  updated_at timestamptz not null default now(),
  primary key (projet_id, chemin)
);

alter table public.learn_projets enable row level security;
alter table public.learn_projet_fichiers enable row level security;
revoke all on public.learn_projets, public.learn_projet_fichiers from anon;

-- Propriétaire : tout ; membres de l'espace lié : lecture seule.
create policy learn_projets_proprio on public.learn_projets
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and (espace_id is null or public.learn_est_membre(espace_id)));
create policy learn_projets_espace_lecture on public.learn_projets
  for select to authenticated using (espace_id is not null and public.learn_est_membre(espace_id));

create policy learn_fichiers_proprio on public.learn_projet_fichiers
  for all to authenticated
  using (exists (select 1 from public.learn_projets p where p.id = projet_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.learn_projets p where p.id = projet_id and p.user_id = auth.uid()));
create policy learn_fichiers_espace_lecture on public.learn_projet_fichiers
  for select to authenticated
  using (exists (select 1 from public.learn_projets p where p.id = projet_id and p.espace_id is not null and public.learn_est_membre(p.espace_id)));

-- Limites raisonnables par personne (protège la base commune) : 100 projets, 50 fichiers par projet.
create or replace function public.learn_projets_limites()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'learn_projets' and (select count(*) from public.learn_projets where user_id = new.user_id) >= 100 then
    raise exception 'limite de 100 projets atteinte';
  end if;
  if tg_table_name = 'learn_projet_fichiers' and (select count(*) from public.learn_projet_fichiers where projet_id = new.projet_id) >= 50 then
    raise exception 'limite de 50 fichiers par projet atteinte';
  end if;
  return new;
end;
$$;
drop trigger if exists learn_projets_limite on public.learn_projets;
create trigger learn_projets_limite before insert on public.learn_projets for each row execute function public.learn_projets_limites();
drop trigger if exists learn_fichiers_limite on public.learn_projet_fichiers;
create trigger learn_fichiers_limite before insert on public.learn_projet_fichiers for each row execute function public.learn_projets_limites();
revoke all on function public.learn_projets_limites() from public, anon, authenticated;
