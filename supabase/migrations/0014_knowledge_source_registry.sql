-- Source registry metadata keeps the knowledge base maintainable without code changes.
alter table public.knowledge_sources
  add column if not exists category text not null default 'general',
  add column if not exists jurisdiction text not null default 'Detroit, Michigan',
  add column if not exists publisher text,
  add column if not exists review_notes text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists expires_at timestamptz;

create index if not exists knowledge_sources_category_idx
  on public.knowledge_sources(category, status);

create index if not exists knowledge_sources_review_idx
  on public.knowledge_sources(expires_at, status);

comment on column public.knowledge_sources.category is
  'Content area such as childcare, housing, transportation, jobs, events, or services.';
comment on column public.knowledge_sources.reviewed_at is
  'Last human review date for freshness and neutrality.';
comment on column public.knowledge_sources.expires_at is
  'Optional freshness deadline; expired sources should be reviewed before re-approval.';
