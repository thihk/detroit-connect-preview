-- The public-read RLS policy in 0005 also requires a table/view privilege.
-- Expose only profile fields used by the public directory; do not expose
-- connector email addresses or phone numbers through the anonymous role.
create or replace view public.public_connector_profiles
as
select
  id,
  owner_id,
  kind,
  status,
  name,
  headline,
  bio,
  organization_name,
  website_url,
  preferred_contact_method,
  neighborhood,
  zip_code,
  years_connected,
  languages,
  topics,
  skills,
  availability,
  trust_badges,
  avatar_key,
  avatar_url,
  created_at,
  updated_at
from public.connector_profiles
where status = 'published';

grant select on public.public_connector_profiles to anon, authenticated;

grant select on table public.knowledge_sources to anon, authenticated;
grant select on table public.knowledge_chunks to anon, authenticated;

grant execute on function public.match_knowledge_chunks(
  extensions.vector,
  double precision,
  integer
) to anon, authenticated;
