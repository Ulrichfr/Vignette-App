-- Rappels « coin corné » : une échéance optionnelle par note.
alter table public.notes add column remind_at timestamptz;
