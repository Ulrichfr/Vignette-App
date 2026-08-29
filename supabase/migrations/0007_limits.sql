-- Garde-fous : bornes raisonnables pour empêcher un client (même authentifié)
-- de gonfler la base avec des valeurs absurdes. Larges pour l'usage réel.

alter table public.notes
  add constraint notes_title_len check (char_length(title) <= 500),
  add constraint notes_color_len check (char_length(color) <= 32);

alter table public.note_items
  add constraint note_items_text_len check (char_length(text) <= 4000);

alter table public.profiles
  add constraint profiles_name_len check (char_length(display_name) <= 120);

-- une note ne déborde pas en items (plafond large)
create or replace function public.check_items_cap()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.note_items where note_id = new.note_id) >= 500 then
    raise exception 'trop d''items sur cette note (500 max)';
  end if;
  return new;
end;
$$;

create trigger note_items_cap before insert on public.note_items
  for each row execute function public.check_items_cap();
