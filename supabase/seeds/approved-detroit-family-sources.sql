-- Curated primary sources for Detroit-area childcare and family support.
-- Keep these records approved only while the URLs and guidance remain current.
alter table public.knowledge_sources
  add column if not exists category text not null default 'general',
  add column if not exists jurisdiction text not null default 'Detroit, Michigan',
  add column if not exists publisher text,
  add column if not exists review_notes text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists expires_at timestamptz;

insert into public.knowledge_sources
  (kind, title, source_url, status, category, jurisdiction, publisher, reviewed_at, review_notes)
values
  ('website', 'Michigan Statewide Search for Licensed Child Care Centers and Homes', 'https://cclb.michigan.gov/s/statewide-facility-search', 'approved', 'childcare', 'Michigan, including Detroit', 'Michigan Department of Lifelong Education, Advancement, and Potential', now(), 'Use this live registry to verify provider license status, location, and inspection information.'),
  ('website', 'Michigan Child Care Licensing Bureau Public Resources', 'https://www.michigan.gov/mileap/early-childhood-education/cclb/public-resources', 'approved', 'childcare', 'Michigan, including Detroit', 'Michigan Department of Lifelong Education, Advancement, and Potential', now(), 'Official licensing, complaint, provider-map, and parent-resource hub.'),
  ('website', 'Michigan Child Development and Care for Parents', 'https://www.michigan.gov/mileap/early-childhood-education/early-learners-and-care/cdc/parents', 'approved', 'childcare-assistance', 'Michigan', 'Michigan Department of Lifelong Education, Advancement, and Potential', now(), 'Official information about Child Development and Care support and provider verification.'),
  ('website', 'Michigan Child Care Assistance', 'https://www.michigan.gov/mdhhs/assistance-programs/child-care-assistance', 'approved', 'childcare-assistance', 'Michigan', 'Michigan Department of Health and Human Services', now(), 'Official assistance-program overview and links to licensing and provider resources.'),
  ('website', 'Michigan Child Care Hub Information Records Portal', 'https://www.michigan.gov/mileap/early-childhood-education/cclb/cchirp', 'approved', 'childcare', 'Michigan', 'Michigan Department of Lifelong Education, Advancement, and Potential', now(), 'Official portal information; public users can search the statewide database and file a complaint.'),
  ('website', 'Michigan Child Welfare Licensing', 'https://www.michigan.gov/mdhhs/doing-business/licensing/child-welfare', 'approved', 'family-services', 'Michigan', 'Michigan Department of Health and Human Services', now(), 'Official licensing and child-welfare facility information.'),
  ('website', 'Michigan Finding Your Way: Education and Early Childhood Resources', 'https://www.michigan.gov/mdhhs/keep-mi-healthy/chronicdiseases/disabhealth/finding-your-way/finding-your-way-education', 'approved', 'family-services', 'Michigan', 'Michigan Department of Health and Human Services', now(), 'Official guidance linking families to early-childhood, childcare, and related supports.')
on conflict do nothing;
