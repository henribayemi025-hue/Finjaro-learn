-- Finjaro Learn — outils (fiches, CV, newsletter) : compteur d'usage par personne et par jour.
-- Additive uniquement. Tables préfixées learn_outils_. Aucune lecture d'autres tables.

create table if not exists public.learn_outils_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null default (now() at time zone 'utc')::date,
  outil   text not null check (outil in ('fiches','cv','news')),
  calls   int  not null default 0,
  primary key (user_id, day, outil)
);

alter table public.learn_outils_usage enable row level security;
revoke all on public.learn_outils_usage from anon, authenticated;
-- Aucune policy : seule la fonction ci-dessous (security definer) y touche.

-- Incrémente le compteur du jour de l'appelant pour un outil ; false si la limite est atteinte.
create or replace function public.learn_outils_consume(p_outil text)
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
  if uid is null then
    return false;
  end if;
  -- limites par personne et par jour, définies ici seulement
  max_calls := case p_outil when 'fiches' then 20 when 'cv' then 20 when 'news' then 10 else null end;
  if max_calls is null then
    return false;
  end if;
  insert into public.learn_outils_usage (user_id, day, outil, calls)
  values (uid, (now() at time zone 'utc')::date, p_outil, 1)
  on conflict (user_id, day, outil)
  do update set calls = public.learn_outils_usage.calls + 1
  returning calls into n;
  return n <= max_calls;
end;
$$;

revoke all on function public.learn_outils_consume(text) from public, anon;
grant execute on function public.learn_outils_consume(text) to authenticated;
