-- Vignette — schéma initial
-- Conventions : snake_case en base, RLS activée partout, soft delete via deleted_at.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- profiles

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  custom_colors text[] not null default '{}',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Un profil est créé automatiquement à l'inscription.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------- notes

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default '',
  color text not null default 'blue',
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  dock_position double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index notes_owner_idx on public.notes (owner_id) where deleted_at is null;

create table public.note_items (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes (id) on delete cascade,
  position double precision not null,
  text text not null default '',
  checked boolean not null default false
);

create index note_items_note_idx on public.note_items (note_id);

create table public.note_shares (
  note_id uuid not null references public.notes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer', 'editor')),
  invited_by uuid not null references public.profiles (id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (note_id, user_id)
);

create index note_shares_user_idx on public.note_shares (user_id);

-- updated_at automatique ; la modification d'un item rafraîchit la note parente.
create function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger notes_touch before update on public.notes
  for each row execute function public.touch_updated_at();

create function public.touch_parent_note()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.notes set updated_at = now()
  where id = coalesce(new.note_id, old.note_id);
  return coalesce(new, old);
end;
$$;

create trigger note_items_touch after insert or update or delete on public.note_items
  for each row execute function public.touch_parent_note();

-- ----------------------------------------------------------- helpers RLS
-- security definer pour éviter la récursion RLS entre notes et note_shares.

-- Test de partage seul (sans lookup de notes) : utilisable dans les policies de
-- notes elles-mêmes — un lookup de la table dans sa propre policy ne voit pas la
-- ligne en cours d'insertion (snapshot), ce qui casse INSERT … RETURNING.
create function public.has_note_share(nid uuid, need_edit boolean)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.note_shares s
    where s.note_id = nid and s.user_id = auth.uid() and s.accepted_at is not null
      and (not need_edit or s.role = 'editor')
  );
$$;

create function public.can_read_note(nid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.notes n
    where n.id = nid and n.owner_id = auth.uid()
  ) or exists (
    select 1 from public.note_shares s
    where s.note_id = nid and s.user_id = auth.uid() and s.accepted_at is not null
  );
$$;

create function public.can_edit_note(nid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.notes n
    where n.id = nid and n.owner_id = auth.uid()
  ) or exists (
    select 1 from public.note_shares s
    where s.note_id = nid and s.user_id = auth.uid()
      and s.accepted_at is not null and s.role = 'editor'
  );
$$;

create function public.is_note_owner(nid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.notes n where n.id = nid and n.owner_id = auth.uid()
  );
$$;

-- Un éditeur ne peut toucher ni au propriétaire ni au soft delete.
create function public.guard_note_update()
returns trigger language plpgsql as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'owner_id est immuable';
  end if;
  if new.deleted_at is distinct from old.deleted_at and not public.is_note_owner(old.id) then
    raise exception 'seul le propriétaire peut supprimer ou restaurer une note';
  end if;
  return new;
end;
$$;

create trigger notes_guard before update on public.notes
  for each row execute function public.guard_note_update();

-- -------------------------------------------------------------------- RLS

alter table public.profiles enable row level security;
alter table public.notes enable row level security;
alter table public.note_items enable row level security;
alter table public.note_shares enable row level security;

-- profiles : soi-même, plus les profils des personnes avec qui on partage
-- (nécessaire pour afficher les noms dans l'UI de partage).
create policy profiles_select on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from public.note_shares s
      where (s.user_id = auth.uid() and s.invited_by = profiles.id)
         or (s.invited_by = auth.uid() and s.user_id = profiles.id)
    )
  );

create policy profiles_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- notes : expressions directes sur la ligne (jamais de lookup de notes ici).
create policy notes_select on public.notes for select
  using (owner_id = auth.uid() or public.has_note_share(id, false));

create policy notes_insert on public.notes for insert
  with check (owner_id = auth.uid());

create policy notes_update on public.notes for update
  using (owner_id = auth.uid() or public.has_note_share(id, true));

create policy notes_delete on public.notes for delete
  using (owner_id = auth.uid());

-- note_items : mêmes droits que la note parente.
create policy note_items_select on public.note_items for select
  using (public.can_read_note(note_id));

create policy note_items_write on public.note_items for insert
  with check (public.can_edit_note(note_id));

create policy note_items_update on public.note_items for update
  using (public.can_edit_note(note_id));

create policy note_items_delete on public.note_items for delete
  using (public.can_edit_note(note_id));

-- note_shares : le propriétaire gère ; l'invité voit sa ligne, accepte, ou part.
create policy note_shares_select on public.note_shares for select
  using (user_id = auth.uid() or public.is_note_owner(note_id));

create policy note_shares_insert on public.note_shares for insert
  with check (public.is_note_owner(note_id) and invited_by = auth.uid());

create policy note_shares_update on public.note_shares for update
  using (user_id = auth.uid() or public.is_note_owner(note_id));

create policy note_shares_delete on public.note_shares for delete
  using (user_id = auth.uid() or public.is_note_owner(note_id));

-- --------------------------------------------------------------- realtime

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end
$$;

alter publication supabase_realtime add table public.notes;
alter publication supabase_realtime add table public.note_items;
alter publication supabase_realtime add table public.note_shares;
