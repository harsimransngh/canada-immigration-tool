-- Canada Immigration Tool: profiles table for saved user profiles
-- Safe to re-run: drops and recreates the four RLS policies.
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text default 'My profile' check (char_length(label) <= 120),
  profile jsonb not null default '{}'::jsonb,
  crs integer check (crs is null or (crs >= 0 and crs <= 1270)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_user_id_idx on public.profiles (user_id);
alter table public.profiles enable row level security;
drop policy if exists "Users can view own profiles" on public.profiles;
drop policy if exists "Users can insert own profiles" on public.profiles;
drop policy if exists "Users can update own profiles" on public.profiles;
drop policy if exists "Users can delete own profiles" on public.profiles;
create policy "Users can view own profiles" on public.profiles for select using (auth.uid() = user_id);
create policy "Users can insert own profiles" on public.profiles for insert with check (auth.uid() = user_id);
create policy "Users can update own profiles" on public.profiles for update using (auth.uid() = user_id);
create policy "Users can delete own profiles" on public.profiles for delete using (auth.uid() = user_id);
