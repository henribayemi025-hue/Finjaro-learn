-- Finjaro Learn — quotas par personne ET globaux, par jour, pour les fonctions IA supplémentaires.
-- PROPOSITION RELUE PAR ALPHA : à appliquer sur l'accord de Beau. Additive uniquement.
-- Les plafonds vivent ICI, à un seul endroit (comme learn_tutor_consume).
-- La voix est à 0 (personne et global) tant que Beau n'a pas dit oui : changer le chiffre par migration.

create table if not exists public.learn_quotas (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null default (now() at time zone 'utc')::date,
  kind    text not null check (kind in ('exos', 'voix', 'entretien')),
  calls   int  not null default 0,
  primary key (user_id, day, kind)
);

create table if not exists public.learn_quota_global (
  day   date not null default (now() at time zone 'utc')::date,
  kind  text not null check (kind in ('exos', 'voix', 'entretien')),
  calls int  not null default 0,
  primary key (day, kind)
);

alter table public.learn_quotas enable row level security;
alter table public.learn_quota_global enable row level security;
revoke all on public.learn_quotas from anon, authenticated;
revoke all on public.learn_quota_global from anon, authenticated;
-- Aucune policy : seule la fonction ci-dessous (security definer) y touche.

-- Incrémente les compteurs du jour ; renvoie false si un plafond est atteint.
create or replace function public.learn_quota_consume(p_kind text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  d   date := (now() at time zone 'utc')::date;
  n   int;
  g   int;
  max_user   int;
  max_global int;
begin
  if uid is null then return false; end if;
  max_user   := case p_kind when 'exos' then 20   when 'voix' then 0 when 'entretien' then 10  else 0 end;
  max_global := case p_kind when 'exos' then 1000 when 'voix' then 0 when 'entretien' then 500 else 0 end;
  if max_user = 0 or max_global = 0 then return false; end if;

  -- Global d'abord : un emballement ne peut pas vider le crédit.
  insert into public.learn_quota_global (day, kind, calls) values (d, p_kind, 1)
  on conflict (day, kind) do update set calls = public.learn_quota_global.calls + 1
  returning calls into g;
  if g > max_global then return false; end if;

  insert into public.learn_quotas (user_id, day, kind, calls) values (uid, d, p_kind, 1)
  on conflict (user_id, day, kind) do update set calls = public.learn_quotas.calls + 1
  returning calls into n;
  return n <= max_user;
end;
$$;

revoke all on function public.learn_quota_consume(text) from public, anon;
grant execute on function public.learn_quota_consume(text) to authenticated;
