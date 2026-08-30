-- Espaces de travail : Personnel, Pro, un projet… Chaque note peut appartenir
-- à un espace de son propriétaire ; l'app filtre liste ET deck sur l'espace
-- actif. Une note sans espace est visible partout (« Sans espace »), et les
-- notes partagées avec moi restent visibles quel que soit l'espace (les
-- espaces organisent MES notes, ils ne cloisonnent pas le partage).

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  position double precision not null default 0,
  created_at timestamptz not null default now()
);

alter table public.spaces enable row level security;

-- expressions directes sur la ligne (piège RLS payé cash : jamais de lookup
-- de la table dans sa propre policy)
create policy spaces_select on public.spaces for select
  using (owner_id = auth.uid());
create policy spaces_insert on public.spaces for insert
  with check (owner_id = auth.uid());
create policy spaces_update on public.spaces for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy spaces_delete on public.spaces for delete
  using (owner_id = auth.uid());

-- une note peut être rangée dans un espace ; l'espace supprimé, la note
-- redevient « sans espace » (jamais de perte de notes)
alter table public.notes add column space_id uuid
  references public.spaces (id) on delete set null;

create index notes_space_idx on public.notes (space_id);

-- garde-fou : 50 espaces par compte, largement au-delà de l'usage réel
create or replace function public.check_space_quota()
returns trigger language plpgsql security definer as $$
begin
  if (select count(*) from public.spaces where owner_id = new.owner_id) >= 50 then
    raise exception 'trop d''espaces (50 max)';
  end if;
  return new;
end $$;

create trigger spaces_quota before insert on public.spaces
  for each row execute function public.check_space_quota();
