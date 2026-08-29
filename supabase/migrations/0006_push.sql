-- Web push : abonnements navigateur + marquage des rappels déjà notifiés.

create table public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy push_select on public.push_subscriptions for select
  using (user_id = auth.uid());

create policy push_insert on public.push_subscriptions for insert
  with check (user_id = auth.uid());

create policy push_update on public.push_subscriptions for update
  using (user_id = auth.uid());

create policy push_delete on public.push_subscriptions for delete
  using (user_id = auth.uid());

-- un rappel n'est poussé qu'une fois ; reposer un rappel réarme la notification
alter table public.notes add column remind_notified_at timestamptz;
alter table public.note_items add column remind_notified_at timestamptz;
