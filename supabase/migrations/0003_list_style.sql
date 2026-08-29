-- Style de liste par note : tirets manuscrits (maquettes) ou cases à cocher.
alter table public.notes add column list_style text not null default 'dashes'
  check (list_style in ('dashes', 'checks'));
