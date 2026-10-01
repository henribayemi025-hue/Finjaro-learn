-- Finjaro Learn — quotas par personne et par jour pour les fonctions IA supplémentaires.
-- PROPOSITION À RELIRE PAR ALPHA : rien n'est appliqué. Additive uniquement.
-- Les plafonds vivent ICI, à un seul endroit (comme learn_tutor_consume).

create table if not exists public.learn_quotas (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null default (now() at time zone 'utc')::date,
  kind    text not null check (kind in ('exos', 'voix', 'entretien')),
  calls   int  not null default 0,
  primary key (user_id, day, kind)
);

alter table public.learn_quotas enable row level security;
revoke all on public.learn_quotas from anon, authenticated;
-- Aucune policy : seule la fonction ci-dessous (security definer) y touche.

-- Incrémente le compteur du jour pour ce type ; renvoie false si le plafond est atteint.
create or replace function public.learn_quota_consume(p_kind text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  n   int;
  max_calls int;
begin
  if uid is null then return false; end if;
  max_calls := case p_kind when 'exos' then 20 when 'voix' then 40 when 'entretien' then 10 else 0 end;
  if max_calls = 0 then return false; end if;
  insert into public.learn_quotas (user_id, day, kind, calls)
  values (uid, (now() at time zone 'utc')::date, p_kind, 1)
  on conflict (user_id, day, kind)
  do update set calls = public.learn_quotas.calls + 1
  returning calls into n;
  return n <= max_calls;
end;
$$;

revoke all on function public.learn_quota_consume(text) from public, anon;
grant execute on function public.learn_quota_consume(text) to authenticated;
