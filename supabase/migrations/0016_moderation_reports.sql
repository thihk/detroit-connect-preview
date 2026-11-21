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
create policy "Users can submit reports" on public.moderation_reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "Reporters can view their reports" on public.moderation_reports for select to authenticated using (reporter_id = auth.uid());
create policy "Admins can manage reports" on public.moderation_reports for all to authenticated using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
