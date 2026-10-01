-- Finjaro Learn — espaces d'étude (apprendre et coder à plusieurs).
-- PROPOSITION À RELIRE PAR ALPHA : rien n'est appliqué. Additive uniquement, tables learn_.
-- Aucune lecture ni écriture des tables legion_* (l'agent Léo est copié dans learn_espaces.agent_leo).

-- ───────────── Tables ─────────────
create table if not exists public.learn_espaces (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null check (length(nom) between 1 and 80),
  type        text not null default 'amis' check (type in ('classe','equipe','amis')),
  created_by  uuid not null references auth.users(id) on delete cascade,
  -- Copie {nom, personnalite, avatar_url} choisie par l'animateur au moment du choix.
  agent_leo   jsonb check (agent_leo is null or length(agent_leo::text) <= 2000),
  created_at  timestamptz not null default now()
);

create table if not exists public.learn_membres (
  espace_id uuid not null references public.learn_espaces(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'membre' check (role in ('animateur','membre')),
  joined_at timestamptz not null default now(),
  primary key (espace_id, user_id)
);
create index if not exists learn_membres_user_idx on public.learn_membres (user_id);

create table if not exists public.learn_invitations (
  id          uuid primary key default gen_random_uuid(),
  espace_id   uuid not null references public.learn_espaces(id) on delete cascade,
  token       text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  created_by  uuid not null references auth.users(id) on delete cascade,
  expires_at  timestamptz not null default now() + interval '7 days',
  revoked_at  timestamptz
);
create index if not exists learn_invitations_espace_idx on public.learn_invitations (espace_id);

create table if not exists public.learn_messages (
  id          bigint generated always as identity primary key,
  espace_id   uuid not null references public.learn_espaces(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  agent_id    text check (agent_id is null or length(agent_id) <= 80),
  texte       text not null check (length(texte) between 1 and 4000),
  created_at  timestamptz not null default now()
);
create index if not exists learn_messages_espace_idx on public.learn_messages (espace_id, id desc);

-- Compteur des messages d'agent par espace et par jour.
create table if not exists public.learn_agent_usage (
  espace_id uuid not null references public.learn_espaces(id) on delete cascade,
  day       date not null default (now() at time zone 'utc')::date,
  messages  int  not null default 0,
  primary key (espace_id, day)
);

create table if not exists public.learn_defis (
  id          uuid primary key default gen_random_uuid(),
  espace_id   uuid not null references public.learn_espaces(id) on delete cascade,
  lesson_id   text not null check (length(lesson_id) <= 80),
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index if not exists learn_defis_espace_idx on public.learn_defis (espace_id);

create table if not exists public.learn_solutions (
  defi_id     uuid not null references public.learn_defis(id) on delete cascade,
  espace_id   uuid not null references public.learn_espaces(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  code        text not null check (length(code) <= 20000),
  passed      boolean not null default false,
  created_at  timestamptz not null default now(),
  primary key (defi_id, user_id)
);

-- ───────────── Fonctions d'appartenance (séparées de legion_est_membre) ─────────────
create or replace function public.learn_est_membre(eid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.learn_membres where espace_id = eid and user_id = auth.uid());
$$;

create or replace function public.learn_est_animateur(eid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.learn_membres
                 where espace_id = eid and user_id = auth.uid() and role = 'animateur');
$$;

-- Vrai s'il existe un autre animateur que l'appelant (le dernier animateur ne peut pas partir).
create or replace function public.learn_autre_animateur(eid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.learn_membres
                 where espace_id = eid and role = 'animateur' and user_id <> auth.uid());
$$;

-- Évite la récursion RLS dans la policy de learn_solutions.
create or replace function public.learn_a_rendu(did uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.learn_solutions where defi_id = did and user_id = auth.uid());
$$;

revoke all on function public.learn_est_membre(uuid), public.learn_est_animateur(uuid), public.learn_a_rendu(uuid), public.learn_autre_animateur(uuid) from public, anon;
grant execute on function public.learn_est_membre(uuid), public.learn_est_animateur(uuid), public.learn_a_rendu(uuid), public.learn_autre_animateur(uuid) to authenticated;

-- ───────────── RLS ─────────────
alter table public.learn_espaces     enable row level security;
alter table public.learn_membres     enable row level security;
alter table public.learn_invitations enable row level security;
alter table public.learn_messages    enable row level security;
alter table public.learn_agent_usage enable row level security;
alter table public.learn_defis       enable row level security;
alter table public.learn_solutions   enable row level security;

revoke all on public.learn_espaces, public.learn_membres, public.learn_invitations, public.learn_messages,
              public.learn_agent_usage, public.learn_defis, public.learn_solutions from anon;

-- Espaces : lecture par les membres ; modification/suppression par un animateur ; création via RPC seulement.
create policy learn_espaces_select on public.learn_espaces for select to authenticated
  using (public.learn_est_membre(id));
create policy learn_espaces_update on public.learn_espaces for update to authenticated
  using (public.learn_est_animateur(id)) with check (public.learn_est_animateur(id));
create policy learn_espaces_delete on public.learn_espaces for delete to authenticated
  using (public.learn_est_animateur(id));
revoke insert, update on public.learn_espaces from authenticated;
grant update (nom, type, agent_leo) on public.learn_espaces to authenticated;

-- Membres : on voit les membres de ses espaces ; on se retire soi-même ; un animateur retire quelqu'un.
-- Ajout uniquement via learn_creer_espace / learn_rejoindre.
create policy learn_membres_select on public.learn_membres for select to authenticated
  using (public.learn_est_membre(espace_id));
create policy learn_membres_delete on public.learn_membres for delete to authenticated
  using (
    (user_id = auth.uid() and (role <> 'animateur' or public.learn_autre_animateur(espace_id)))
    or (public.learn_est_animateur(espace_id) and user_id <> auth.uid())
  );
revoke insert, update on public.learn_membres from authenticated;

-- Invitations : AUCUN accès direct (le jeton ne doit pas être lisible) ; tout passe par les RPC.
revoke all on public.learn_invitations from authenticated;

-- Messages : lecture par les membres ; un membre écrit ses propres messages (jamais comme agent).
create policy learn_messages_select on public.learn_messages for select to authenticated
  using (public.learn_est_membre(espace_id));
create policy learn_messages_insert on public.learn_messages for insert to authenticated
  with check (user_id = auth.uid() and agent_id is null and public.learn_est_membre(espace_id));
revoke update, delete on public.learn_messages from authenticated;

-- Compteur d'agents : illisible côté client.
revoke all on public.learn_agent_usage from authenticated;

-- Défis : lecture par les membres ; création par un animateur.
create policy learn_defis_select on public.learn_defis for select to authenticated
  using (public.learn_est_membre(espace_id));
create policy learn_defis_insert on public.learn_defis for insert to authenticated
  with check (created_by = auth.uid() and public.learn_est_animateur(espace_id));

-- Solutions : on écrit la sienne ; on ne voit celles des autres qu'après avoir rendu la sienne.
create policy learn_solutions_select on public.learn_solutions for select to authenticated
  using (
    user_id = auth.uid()
    or (public.learn_est_membre(espace_id) and public.learn_a_rendu(defi_id))
  );
create policy learn_solutions_insert on public.learn_solutions for insert to authenticated
  with check (user_id = auth.uid() and public.learn_est_membre(espace_id)
              and exists (select 1 from public.learn_defis d where d.id = defi_id and d.espace_id = learn_solutions.espace_id));
create policy learn_solutions_update on public.learn_solutions for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on public.learn_solutions from authenticated;
grant update (code, passed) on public.learn_solutions to authenticated;
-- `passed` est déclaré par le client : jamais présenté comme une note officielle.

-- ───────────── RPC ─────────────
create or replace function public.learn_creer_espace(p_nom text, p_type text default 'amis')
returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); eid uuid;
begin
  if uid is null then raise exception 'auth'; end if;
  if (select count(*) from public.learn_espaces where created_by = uid) >= 20 then
    raise exception 'limite d''espaces atteinte';
  end if;
  insert into public.learn_espaces (nom, type, created_by) values (p_nom, p_type, uid) returning id into eid;
  insert into public.learn_membres (espace_id, user_id, role) values (eid, uid, 'animateur');
  return eid;
end $$;

create or replace function public.learn_creer_invitation(p_espace uuid, p_heures int default 168)
returns text language plpgsql security definer set search_path = public as $$
declare tok text;
begin
  if not public.learn_est_animateur(p_espace) then raise exception 'interdit'; end if;
  insert into public.learn_invitations (espace_id, created_by, expires_at)
  values (p_espace, auth.uid(), now() + make_interval(hours => least(greatest(p_heures, 1), 720)))
  returning token into tok;
  return tok;
end $$;

create or replace function public.learn_revoquer_invitations(p_espace uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.learn_est_animateur(p_espace) then raise exception 'interdit'; end if;
  update public.learn_invitations set revoked_at = now() where espace_id = p_espace and revoked_at is null;
end $$;

create or replace function public.learn_rejoindre(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); eid uuid;
begin
  if uid is null then raise exception 'auth'; end if;
  select espace_id into eid from public.learn_invitations
   where token = p_token and revoked_at is null and expires_at > now();
  if eid is null then raise exception 'invitation invalide'; end if;
  if (select count(*) from public.learn_membres where espace_id = eid) >= 100 then
    raise exception 'espace complet';
  end if;
  insert into public.learn_membres (espace_id, user_id) values (eid, uid) on conflict do nothing;
  return eid;
end $$;

-- Message d'un agent dans le salon (après l'appel à learn-tutor) ; limite 100 messages d'agent / espace / jour.
-- Appelée UNIQUEMENT par learn-tutor (service_role) après vérification d'appartenance avec le JWT de l'élève.
create or replace function public.learn_message_agent(p_espace uuid, p_agent text, p_texte text)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into public.learn_agent_usage (espace_id, day, messages)
  values (p_espace, (now() at time zone 'utc')::date, 1)
  on conflict (espace_id, day) do update set messages = public.learn_agent_usage.messages + 1
  returning messages into n;
  if n > 100 then return false; end if;
  insert into public.learn_messages (espace_id, user_id, agent_id, texte) values (p_espace, null, p_agent, left(p_texte, 4000));
  return true;
end $$;

revoke all on function public.learn_creer_espace(text,text), public.learn_creer_invitation(uuid,int),
  public.learn_revoquer_invitations(uuid), public.learn_rejoindre(text),
  public.learn_message_agent(uuid,text,text) from public, anon, authenticated;
grant execute on function public.learn_creer_espace(text,text), public.learn_creer_invitation(uuid,int),
  public.learn_revoquer_invitations(uuid), public.learn_rejoindre(text) to authenticated;
grant execute on function public.learn_message_agent(uuid,text,text) to service_role;

-- ───────────── Realtime privé : canal learn:espace:<uuid> (broadcast + presence) ─────────────
-- Policies additives sur realtime.messages ; ne concernent que les sujets 'learn:espace:%'.
create policy learn_rt_select on realtime.messages for select to authenticated
  using (
    case when realtime.topic() ~ '^learn:espace:[0-9a-f-]{36}$'
         then public.learn_est_membre(substr(realtime.topic(), 14)::uuid)
         else false end
  );
create policy learn_rt_insert on realtime.messages for insert to authenticated
  with check (
    case when realtime.topic() ~ '^learn:espace:[0-9a-f-]{36}$'
         then public.learn_est_membre(substr(realtime.topic(), 14)::uuid)
         else false end
  );
