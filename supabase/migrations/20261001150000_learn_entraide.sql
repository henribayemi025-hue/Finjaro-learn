-- Finjaro Learn — entraide entre membres. PROPOSITION À RELIRE PAR ALPHA : rien n'est appliqué.
-- Additive uniquement, tables learn_. Ne lit aucune table d'une autre application ;
-- seule dépendance : la fonction existante public.compte_reel(uuid) pour exclure les comptes de test des compteurs.

-- ───────────── Pseudos ─────────────
create table if not exists public.learn_profils (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  pseudo     text not null check (length(pseudo) between 3 and 30 and pseudo ~ '^[A-Za-z0-9_.-]+$'),
  created_at timestamptz not null default now()
);
create unique index if not exists learn_profils_pseudo_uniq on public.learn_profils (lower(pseudo));

-- ───────────── Modérateurs (alimentés par Alpha/Beau, jamais par le client) ─────────────
create table if not exists public.learn_entraide_moderateurs (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- ───────────── Contenus ─────────────
create table if not exists public.learn_entraide_questions (
  id                   uuid primary key default gen_random_uuid(),
  auteur_id            uuid not null references auth.users(id) on delete cascade,
  titre                text not null check (length(titre) between 3 and 150),
  corps                text not null check (length(corps) between 1 and 4000),
  code                 text check (code is null or length(code) <= 20000),
  parcours             text not null default 'programmation'
                       check (parcours in ('programmation','data','ia','ai-engineering','prompt','autre')),
  tags                 text[] not null default '{}' check (cardinality(tags) <= 5),
  meilleure_reponse_id uuid,
  masquee              boolean not null default false,
  created_at           timestamptz not null default now()
);
create index if not exists learn_entraide_questions_recent_idx on public.learn_entraide_questions (created_at desc);
create index if not exists learn_entraide_questions_auteur_idx on public.learn_entraide_questions (auteur_id);

create table if not exists public.learn_entraide_reponses (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.learn_entraide_questions(id) on delete cascade,
  auteur_id   uuid references auth.users(id) on delete cascade,          -- null si agent
  agent_id    text check (agent_id is null or length(agent_id) <= 80),
  corps       text not null check (length(corps) between 1 and 4000),
  code        text check (code is null or length(code) <= 20000),
  masquee     boolean not null default false,
  created_at  timestamptz not null default now(),
  check ((auteur_id is null) <> (agent_id is null))                       -- humain XOR agent
);
create index if not exists learn_entraide_reponses_question_idx on public.learn_entraide_reponses (question_id, created_at);
create index if not exists learn_entraide_reponses_auteur_idx on public.learn_entraide_reponses (auteur_id);

alter table public.learn_entraide_questions
  add constraint learn_entraide_questions_meilleure_fk
  foreign key (meilleure_reponse_id) references public.learn_entraide_reponses(id) on delete set null;

create table if not exists public.learn_entraide_signalements (
  id          uuid primary key default gen_random_uuid(),
  cible_type  text not null check (cible_type in ('question','reponse')),
  cible_id    uuid not null,
  auteur_id   uuid not null references auth.users(id) on delete cascade,
  motif       text not null check (length(motif) between 1 and 300),
  traite      boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (auteur_id, cible_type, cible_id)
);

-- Compteurs anti-abus (illisibles côté client).
create table if not exists public.learn_entraide_usage (
  user_id  uuid not null references auth.users(id) on delete cascade,
  day      date not null default (now() at time zone 'utc')::date,
  questions int not null default 0,
  reponses  int not null default 0,
  signalements int not null default 0,
  primary key (user_id, day)
);

-- ───────────── Fonctions utilitaires ─────────────
create or replace function public.learn_est_moderateur()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.learn_entraide_moderateurs where user_id = auth.uid());
$$;

-- Le pseudo est obligatoire pour participer.
create or replace function public.learn_a_pseudo()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.learn_profils where user_id = auth.uid());
$$;

-- ───────────── RLS ─────────────
alter table public.learn_profils               enable row level security;
alter table public.learn_entraide_moderateurs  enable row level security;
alter table public.learn_entraide_questions    enable row level security;
alter table public.learn_entraide_reponses     enable row level security;
alter table public.learn_entraide_signalements enable row level security;
alter table public.learn_entraide_usage        enable row level security;

revoke all on public.learn_profils, public.learn_entraide_moderateurs, public.learn_entraide_questions,
  public.learn_entraide_reponses, public.learn_entraide_signalements, public.learn_entraide_usage from anon;

-- Pseudos : lecture par tout compte connecté ; chacun écrit le sien ; pas de suppression.
create policy learn_profils_select on public.learn_profils for select to authenticated using (true);
create policy learn_profils_insert on public.learn_profils for insert to authenticated with check (user_id = auth.uid());
create policy learn_profils_update on public.learn_profils for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke delete on public.learn_profils from authenticated;
revoke update on public.learn_profils from authenticated;
grant update (pseudo) on public.learn_profils to authenticated;

-- Modérateurs / compteurs : aucun accès direct.
revoke all on public.learn_entraide_moderateurs, public.learn_entraide_usage from authenticated;

-- Questions et réponses : lecture des contenus non masqués (ou les siens, ou modérateur) ; écriture par RPC seulement.
create policy learn_entraide_q_select on public.learn_entraide_questions for select to authenticated
  using (not masquee or auteur_id = auth.uid() or public.learn_est_moderateur());
-- Une réponse n'est visible que si sa question l'est (la règle de la question s'applique dans la sous-requête).
create policy learn_entraide_r_select on public.learn_entraide_reponses for select to authenticated
  using ((not masquee or auteur_id = auth.uid() or public.learn_est_moderateur())
         and exists (select 1 from public.learn_entraide_questions q where q.id = question_id));
revoke insert, update, delete on public.learn_entraide_questions, public.learn_entraide_reponses from authenticated;

-- Signalements : visibles des modérateurs seulement ; création par RPC.
create policy learn_entraide_s_select on public.learn_entraide_signalements for select to authenticated
  using (public.learn_est_moderateur());
revoke insert, update, delete on public.learn_entraide_signalements from authenticated;

-- ───────────── RPC ─────────────
create or replace function public.learn_entraide_poser(p_titre text, p_corps text, p_code text, p_parcours text, p_tags text[])
returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); n int; qid uuid;
begin
  if uid is null then raise exception 'auth'; end if;
  if not public.learn_a_pseudo() then raise exception 'pseudo'; end if;
  if exists (select 1 from unnest(coalesce(p_tags, '{}')) t where length(t) not between 1 and 30) then
    raise exception 'étiquette invalide';
  end if;
  insert into public.learn_entraide_usage (user_id, day, questions) values (uid, (now() at time zone 'utc')::date, 1)
    on conflict (user_id, day) do update set questions = public.learn_entraide_usage.questions + 1
    returning questions into n;
  if n > 10 then raise exception 'limite de questions atteinte'; end if;
  insert into public.learn_entraide_questions (auteur_id, titre, corps, code, parcours, tags)
    values (uid, p_titre, p_corps, nullif(p_code, ''), coalesce(p_parcours, 'programmation'), coalesce(p_tags, '{}'))
    returning id into qid;
  return qid;
end $$;

create or replace function public.learn_entraide_repondre(p_question uuid, p_corps text, p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); n int; rid uuid;
begin
  if uid is null then raise exception 'auth'; end if;
  if not public.learn_a_pseudo() then raise exception 'pseudo'; end if;
  if not exists (select 1 from public.learn_entraide_questions where id = p_question and not masquee) then
    raise exception 'question introuvable';
  end if;
  insert into public.learn_entraide_usage (user_id, day, reponses) values (uid, (now() at time zone 'utc')::date, 1)
    on conflict (user_id, day) do update set reponses = public.learn_entraide_usage.reponses + 1
    returning reponses into n;
  if n > 50 then raise exception 'limite de réponses atteinte'; end if;
  insert into public.learn_entraide_reponses (question_id, auteur_id, corps, code)
    values (p_question, uid, p_corps, nullif(p_code, '')) returning id into rid;
  return rid;
end $$;

-- Réponse d'un agent : appelée UNIQUEMENT par learn-tutor (service_role) ; max 3 par question.
create or replace function public.learn_entraide_reponse_agent(p_question uuid, p_agent text, p_corps text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.learn_entraide_questions where id = p_question and not masquee) then return false; end if;
  if (select count(*) from public.learn_entraide_reponses where question_id = p_question and agent_id is not null) >= 3 then
    return false;
  end if;
  insert into public.learn_entraide_reponses (question_id, agent_id, corps) values (p_question, p_agent, left(p_corps, 4000));
  return true;
end $$;

create or replace function public.learn_entraide_choisir(p_question uuid, p_reponse uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.learn_entraide_questions where id = p_question and auteur_id = auth.uid()) then
    raise exception 'interdit';
  end if;
  if not exists (select 1 from public.learn_entraide_reponses where id = p_reponse and question_id = p_question and not masquee) then
    raise exception 'réponse invalide';
  end if;
  update public.learn_entraide_questions set meilleure_reponse_id = p_reponse where id = p_question;
end $$;

create or replace function public.learn_entraide_signaler(p_type text, p_cible uuid, p_motif text)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); n int;
begin
  if uid is null then raise exception 'auth'; end if;
  if p_type not in ('question','reponse') then raise exception 'type'; end if;
  insert into public.learn_entraide_usage (user_id, day, signalements) values (uid, (now() at time zone 'utc')::date, 1)
    on conflict (user_id, day) do update set signalements = public.learn_entraide_usage.signalements + 1
    returning signalements into n;
  if n > 20 then raise exception 'limite de signalements atteinte'; end if;
  insert into public.learn_entraide_signalements (cible_type, cible_id, auteur_id, motif)
    values (p_type, p_cible, uid, p_motif) on conflict do nothing;
end $$;

-- Modération : masquer / réafficher (jamais de suppression physique), marquer un signalement traité.
create or replace function public.learn_entraide_masquer(p_type text, p_cible uuid, p_masquee boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.learn_est_moderateur() then raise exception 'interdit'; end if;
  if p_type = 'question' then
    update public.learn_entraide_questions set masquee = p_masquee where id = p_cible;
  elsif p_type = 'reponse' then
    update public.learn_entraide_reponses set masquee = p_masquee where id = p_cible;
  else raise exception 'type'; end if;
  update public.learn_entraide_signalements set traite = true where cible_type = p_type and cible_id = p_cible;
end $$;

-- Profil d'entraide : compteurs RÉELS, comptes de test exclus (compte_reel). Valeurs à 0 si compte de test.
create or replace function public.learn_entraide_profil(p_user uuid)
returns table (pseudo text, reponses_donnees int, reponses_retenues int, questions_posees int)
language plpgsql stable security definer set search_path = public as $$
declare est_reel boolean := public.compte_reel(p_user);
begin
  return query
  select
    (select p.pseudo from public.learn_profils p where p.user_id = p_user),
    case when est_reel then (select count(*)::int from public.learn_entraide_reponses r
                         where r.auteur_id = p_user and not r.masquee) else 0 end,
    case when est_reel then (select count(*)::int from public.learn_entraide_questions q
                         join public.learn_entraide_reponses r on r.id = q.meilleure_reponse_id
                         where r.auteur_id = p_user and q.auteur_id <> p_user and not r.masquee and public.compte_reel(q.auteur_id)) else 0 end,
    case when est_reel then (select count(*)::int from public.learn_entraide_questions q
                         where q.auteur_id = p_user and not q.masquee) else 0 end;
end $$;

revoke all on function public.learn_est_moderateur(), public.learn_a_pseudo(),
  public.learn_entraide_poser(text,text,text,text,text[]), public.learn_entraide_repondre(uuid,text,text),
  public.learn_entraide_reponse_agent(uuid,text,text), public.learn_entraide_choisir(uuid,uuid),
  public.learn_entraide_signaler(text,uuid,text), public.learn_entraide_masquer(text,uuid,boolean),
  public.learn_entraide_profil(uuid) from public, anon, authenticated;
grant execute on function public.learn_est_moderateur(), public.learn_a_pseudo(),
  public.learn_entraide_poser(text,text,text,text,text[]), public.learn_entraide_repondre(uuid,text,text),
  public.learn_entraide_choisir(uuid,uuid), public.learn_entraide_signaler(text,uuid,text),
  public.learn_entraide_masquer(text,uuid,boolean), public.learn_entraide_profil(uuid) to authenticated;
grant execute on function public.learn_entraide_reponse_agent(uuid,text,text) to service_role;
