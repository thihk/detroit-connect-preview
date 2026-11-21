-- Detroit Connect production finalization: saved places + moderation reports.
-- Safe to run once in Supabase SQL Editor.

-- Supabase projects created through SQL Editor may not retain the default
-- PostgREST table grants. RLS still controls every row after these grants.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.user_profiles to authenticated;
grant select on public.connector_profiles to anon, authenticated;
grant select, insert, update, delete on public.friendships to authenticated;
grant select, insert, update, delete on public.favorite_profiles to authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;

create table if not exists public.favorite_places (
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  place_id text not null,
  place_name text not null,
  category text not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, place_id)
);
alter table public.favorite_places enable row level security;
drop policy if exists "Users can manage their saved places" on public.favorite_places;
create policy "Users can manage their saved places" on public.favorite_places for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists favorite_places_user_idx on public.favorite_places(user_id, created_at desc);

create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.user_profiles(id) on delete cascade,
  target_type text not null check (target_type in ('forum_post', 'forum_comment', 'profile')),
  target_id text not null,
  reason text not null check (reason in ('spam', 'harassment', 'misinformation', 'unsafe', 'other')),
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewer_id uuid references public.user_profiles(id) on delete set null
);
alter table public.moderation_reports enable row level security;
create index if not exists moderation_reports_status_idx on public.moderation_reports(status, created_at desc);
grant select, insert, update on public.favorite_places to authenticated;
grant select, insert, update on public.moderation_reports to authenticated;
drop policy if exists "Users can submit reports" on public.moderation_reports;
create policy "Users can submit reports" on public.moderation_reports for insert to authenticated with check (reporter_id = auth.uid());
drop policy if exists "Reporters can view their reports" on public.moderation_reports;
create policy "Reporters can view their reports" on public.moderation_reports for select to authenticated using (reporter_id = auth.uid());
drop policy if exists "Admins can manage reports" on public.moderation_reports;
create policy "Admins can manage reports" on public.moderation_reports for all to authenticated using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
