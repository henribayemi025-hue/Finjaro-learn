-- Finjaro Learn — progression des élèves + compteur d'usage du tuteur IA.
-- Additive uniquement. Tables préfixées learn_. Aucune lecture d'autres tables.

create table if not exists public.learn_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  lesson_id   text not null,
  status      text not null default 'started' check (status in ('started','done')),
  code        text check (code is null or length(code) <= 20000),
  updated_at  timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index if not exists learn_progress_user_id_idx on public.learn_progress (user_id);

alter table public.learn_progress enable row level security;

create policy learn_progress_select on public.learn_progress
  for select to authenticated using (auth.uid() = user_id);
create policy learn_progress_insert on public.learn_progress
  for insert to authenticated with check (auth.uid() = user_id);
create policy learn_progress_update on public.learn_progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy learn_progress_delete on public.learn_progress
  for delete to authenticated using (auth.uid() = user_id);

revoke all on public.learn_progress from anon;

-- Compteur d'appels au tuteur IA (limite par utilisateur et par jour).
create table if not exists public.learn_tutor_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null default (now() at time zone 'utc')::date,
  calls   int  not null default 0,
  primary key (user_id, day)
);

alter table public.learn_tutor_usage enable row level security;
revoke all on public.learn_tutor_usage from anon, authenticated;
-- Aucune policy : seule la fonction ci-dessous (security definer) y touche.

-- Incrémente le compteur du jour de l'appelant ; renvoie false si la limite est atteinte.
create or replace function public.learn_tutor_consume(max_calls int default 60)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  n   int;
begin
  if uid is null then
    return false;
  end if;
  insert into public.learn_tutor_usage (user_id, day, calls)
  values (uid, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day)
  do update set calls = public.learn_tutor_usage.calls + 1
  returning calls into n;
  return n <= max_calls;
end;
$$;

revoke all on function public.learn_tutor_consume(int) from public, anon;
grant execute on function public.learn_tutor_consume(int) to authenticated;
