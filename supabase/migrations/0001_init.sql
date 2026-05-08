-- =============================================================================
-- PantryChef — Supabase-side migration
--
-- This file holds everything Prisma cannot express:
--   1. Trigger that mirrors auth.users into public.users
--   2. Row Level Security policies on every user-owned table
--   3. Storage buckets (recipe-images, avatars) + access policies
--
-- Run order:
--   1. `npm run prisma:migrate -- --name init`   (creates tables)
--   2. Paste this file into Supabase Dashboard → SQL Editor and run.
--
-- Idempotent: every CREATE uses IF NOT EXISTS and every policy is dropped
-- before being recreated, so this file is safe to re-run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Mirror trigger: auth.users -> public.users
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. Row Level Security
-- -----------------------------------------------------------------------------

-- Enable RLS on every table that holds user-owned data.
alter table public.users              enable row level security;
alter table public.user_preferences   enable row level security;
alter table public.pantry_items       enable row level security;
alter table public.saved_recipes      enable row level security;

-- Recipes, recipe_ingredients, recipe_steps, ingredient_aliases are global
-- read-only data. RLS is enabled but with permissive read policies.
alter table public.recipes            enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_steps       enable row level security;
alter table public.ingredient_aliases enable row level security;

-- ---- users ----
drop policy if exists "users select own"  on public.users;
drop policy if exists "users update own"  on public.users;
drop policy if exists "users insert self" on public.users;

create policy "users select own"
  on public.users for select
  using (auth.uid() = id);

create policy "users update own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users insert self"
  on public.users for insert
  with check (auth.uid() = id);

-- ---- user_preferences ----
drop policy if exists "prefs select own" on public.user_preferences;
drop policy if exists "prefs insert own" on public.user_preferences;
drop policy if exists "prefs update own" on public.user_preferences;
drop policy if exists "prefs delete own" on public.user_preferences;

create policy "prefs select own"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "prefs insert own"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "prefs update own"
  on public.user_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "prefs delete own"
  on public.user_preferences for delete
  using (auth.uid() = user_id);

-- ---- pantry_items ----
drop policy if exists "pantry select own" on public.pantry_items;
drop policy if exists "pantry insert own" on public.pantry_items;
drop policy if exists "pantry update own" on public.pantry_items;
drop policy if exists "pantry delete own" on public.pantry_items;

create policy "pantry select own"
  on public.pantry_items for select
  using (auth.uid() = user_id);

create policy "pantry insert own"
  on public.pantry_items for insert
  with check (auth.uid() = user_id);

create policy "pantry update own"
  on public.pantry_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "pantry delete own"
  on public.pantry_items for delete
  using (auth.uid() = user_id);

-- ---- saved_recipes ----
drop policy if exists "saved select own" on public.saved_recipes;
drop policy if exists "saved insert own" on public.saved_recipes;
drop policy if exists "saved delete own" on public.saved_recipes;

create policy "saved select own"
  on public.saved_recipes for select
  using (auth.uid() = user_id);

create policy "saved insert own"
  on public.saved_recipes for insert
  with check (auth.uid() = user_id);

create policy "saved delete own"
  on public.saved_recipes for delete
  using (auth.uid() = user_id);

-- ---- recipes / recipe_ingredients / recipe_steps / ingredient_aliases ----
-- Global read-only data: any authenticated user can read.
-- Writes are reserved for the service role (which bypasses RLS).
drop policy if exists "recipes read"   on public.recipes;
drop policy if exists "ri read"        on public.recipe_ingredients;
drop policy if exists "rs read"        on public.recipe_steps;
drop policy if exists "aliases read"   on public.ingredient_aliases;

create policy "recipes read" on public.recipes
  for select to authenticated, anon using (true);

create policy "ri read" on public.recipe_ingredients
  for select to authenticated, anon using (true);

create policy "rs read" on public.recipe_steps
  for select to authenticated, anon using (true);

create policy "aliases read" on public.ingredient_aliases
  for select to authenticated, anon using (true);

-- -----------------------------------------------------------------------------
-- 3. Storage buckets
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('recipe-images', 'recipe-images', true, 5242880,
    array['image/jpeg','image/png','image/webp','image/avif']),
  ('avatars', 'avatars', true, 2097152,
    array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---- recipe-images: public read, write only via service role ----
drop policy if exists "recipe-images public read" on storage.objects;
create policy "recipe-images public read"
  on storage.objects for select
  using (bucket_id = 'recipe-images');

-- ---- avatars: public read, owner-only write ----
drop policy if exists "avatars public read"   on storage.objects;
drop policy if exists "avatars owner upload"  on storage.objects;
drop policy if exists "avatars owner update"  on storage.objects;
drop policy if exists "avatars owner delete"  on storage.objects;

create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Avatar files live under <user_id>/<filename>; first path segment must equal auth.uid().
create policy "avatars owner upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
