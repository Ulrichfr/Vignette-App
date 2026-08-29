-- Partage par email : l'email vit dans auth.users (invisible côté client),
-- donc l'invitation passe par des RPC security definer.

create function public.invite_to_note(nid uuid, invitee_email text, share_role text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  invitee uuid;
begin
  if auth.uid() is null then
    raise exception 'authentification requise';
  end if;
  if not public.is_note_owner(nid) then
    raise exception 'seul le propriétaire peut partager cette note';
  end if;
  if share_role not in ('viewer', 'editor') then
    raise exception 'rôle invalide';
  end if;
  select u.id into invitee from auth.users u where lower(u.email) = lower(trim(invitee_email));
  if invitee is null then
    raise exception 'aucun compte avec cet email';
  end if;
  if invitee = auth.uid() then
    raise exception 'impossible de partager avec soi-même';
  end if;
  insert into public.note_shares (note_id, user_id, role, invited_by)
  values (nid, invitee, share_role, auth.uid())
  on conflict (note_id, user_id) do update set role = excluded.role;
end;
$$;

-- Invitations en attente pour l'utilisateur courant, avec le contexte utile.
create function public.my_invitations()
returns table (note_id uuid, title text, owner_name text, role text, invited_at timestamptz)
language sql security definer set search_path = public stable
as $$
  select s.note_id, n.title, p.display_name, s.role, s.created_at
  from public.note_shares s
  join public.notes n on n.id = s.note_id and n.deleted_at is null
  join public.profiles p on p.id = s.invited_by
  where s.user_id = auth.uid() and s.accepted_at is null;
$$;

create function public.respond_invitation(nid uuid, accept boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if accept then
    update public.note_shares set accepted_at = now()
    where note_id = nid and user_id = auth.uid() and accepted_at is null;
  else
    delete from public.note_shares where note_id = nid and user_id = auth.uid();
  end if;
end;
$$;

-- Qui a accès à une note (pour le panneau de partage du propriétaire).
create function public.note_members(nid uuid)
returns table (user_id uuid, display_name text, role text, accepted boolean)
language sql security definer set search_path = public stable
as $$
  select s.user_id, p.display_name, s.role, s.accepted_at is not null
  from public.note_shares s
  join public.profiles p on p.id = s.user_id
  where s.note_id = nid
    and (public.is_note_owner(nid) or s.user_id = auth.uid());
$$;

revoke execute on function public.invite_to_note(uuid, text, text) from anon;
revoke execute on function public.my_invitations() from anon;
revoke execute on function public.respond_invitation(uuid, boolean) from anon;
revoke execute on function public.note_members(uuid) from anon;
