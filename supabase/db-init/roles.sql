-- Aligne les mots de passe des rôles de service sur POSTGRES_PASSWORD.
-- Tolérant : certains rôles (functions, storage) n'existent pas dans notre stack taillée.
\set pgpass `echo "$POSTGRES_PASSWORD"`

select set_config('init.pgpass', :'pgpass', false);

do $$
declare
  r text;
begin
  foreach r in array array[
    'authenticator', 'pgbouncer', 'supabase_auth_admin',
    'supabase_functions_admin', 'supabase_storage_admin'
  ] loop
    if exists (select from pg_roles where rolname = r) then
      execute format('alter user %I with password %L', r, current_setting('init.pgpass'));
    end if;
  end loop;
end
$$;
