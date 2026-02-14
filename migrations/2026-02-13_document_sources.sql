-- Google Drive / external source mapping for documents
create table if not exists public.document_sources (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  provider text not null,
  external_file_id text not null,
  external_file_name text,
  external_mime_type text,
  external_modified_time text,
  last_pulled_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, provider)
);

create index if not exists idx_document_sources_document_id on public.document_sources(document_id);
create index if not exists idx_document_sources_provider_external on public.document_sources(provider, external_file_id);

alter table public.document_sources enable row level security;

create policy if not exists "Owners can read document sources"
on public.document_sources
for select
using (
  exists (
    select 1 from public.documents d
    where d.id = document_sources.document_id
      and d.owner_id = auth.uid()
  )
);

create policy if not exists "Owners can insert document sources"
on public.document_sources
for insert
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.documents d
    where d.id = document_sources.document_id
      and d.owner_id = auth.uid()
  )
);

create policy if not exists "Owners can update document sources"
on public.document_sources
for update
using (
  exists (
    select 1 from public.documents d
    where d.id = document_sources.document_id
      and d.owner_id = auth.uid()
  )
);
