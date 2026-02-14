-- Sharing hardening + audit logging support

alter table public.document_shares
  add column if not exists invited_email text;

create index if not exists idx_document_shares_invited_email
  on public.document_shares (invited_email);

create table if not exists public.document_audit_events (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_document_audit_events_document_id
  on public.document_audit_events (document_id, created_at desc);

create index if not exists idx_document_audit_events_actor_id
  on public.document_audit_events (actor_id, created_at desc);

alter table public.document_audit_events enable row level security;

create policy if not exists "Users can insert their own audit events"
on public.document_audit_events
for insert
with check (
  actor_id = auth.uid()
);

create policy if not exists "Users can read owner-scoped audit events"
on public.document_audit_events
for select
using (
  actor_id = auth.uid()
  or (
    document_id is not null
    and exists (
      select 1
      from public.documents d
      where d.id = document_audit_events.document_id
        and d.owner_id = auth.uid()
    )
  )
);
