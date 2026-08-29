-- Rappels par item : une date/heure « écrite à la main » à côté d'une tâche.
alter table public.note_items add column remind_at timestamptz;
