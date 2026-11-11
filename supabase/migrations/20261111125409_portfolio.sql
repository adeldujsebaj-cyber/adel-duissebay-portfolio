-- Prepared for a dedicated portfolio Supabase project; not yet applied.
-- Content/data import and administrator enrollment are separate operations.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon,authenticated;
create function private.portfolio_is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select (select auth.uid()) is not null and exists(select 1 from auth.users u where u.id=(select auth.uid()) and u.email='adeldujsebaj@gmail.com' and u.email_confirmed_at is not null); $$;
revoke all on function private.portfolio_is_admin() from public;
grant execute on function private.portfolio_is_admin() to anon,authenticated;

create table public.portfolio_profile (
 id text primary key check(id='primary'),
 data jsonb not null check(jsonb_typeof(data)='object'),
 updated_at timestamptz not null default now()
);
create table public.portfolio_records (
 id text primary key,
 data jsonb not null check(jsonb_typeof(data)='object'),
 updated_at timestamptz not null default now()
);
create table public.portfolio_documents (
 id text primary key,
 record_id text not null,
 name text not null,
 storage_key text not null unique,
 mime text not null,
 size bigint not null check(size>0),
 sha256 text check(sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
 created_at timestamptz not null default now()
);
create index portfolio_documents_record_date on public.portfolio_documents(record_id,created_at desc);
alter table public.portfolio_profile enable row level security;
alter table public.portfolio_records enable row level security;
alter table public.portfolio_documents enable row level security;
revoke all on public.portfolio_profile,public.portfolio_records,public.portfolio_documents from anon,authenticated;
grant select on public.portfolio_profile,public.portfolio_records,public.portfolio_documents to anon,authenticated;
grant insert,update,delete on public.portfolio_profile,public.portfolio_records,public.portfolio_documents to authenticated;
create policy profile_read on public.portfolio_profile for select to anon,authenticated using(true);
create policy profile_admin_write on public.portfolio_profile for all to authenticated using((select private.portfolio_is_admin())) with check((select private.portfolio_is_admin()));
-- The explicit public record allowlist is filled in the generated statement below.
create policy documents_read on public.portfolio_documents for select to anon,authenticated using(true);
create policy documents_admin_write on public.portfolio_documents for all to authenticated using((select private.portfolio_is_admin())) with check((select private.portfolio_is_admin()));
create policy records_admin_write on public.portfolio_records for all to authenticated using((select private.portfolio_is_admin())) with check((select private.portfolio_is_admin()));
commit;

create policy records_public_read on public.portfolio_records for select to anon,authenticated using(id in ('RESEARCH','ABOUT','COMPANIES','COMPANY-A','COMPANY-B','FOUNDER-A','HISTORY-A','SERVICES-A','FOUNDER-B','HISTORY-B','SERVICES-B','W1','W2','W3','W4','W5','W6','W7','W8','W9','ART1','ART2','ART3','ART4','ART5','ART6','ART7','ART8','ART9','A1','A2','A3','A4','CAPSTONE','EVIDENCE','AI','EVIDENCE_SOURCE_EDITS') or (select private.portfolio_is_admin()));

create policy storage_admin_insert on storage.objects for insert to authenticated with check(bucket_id='portfolio-files' and (select private.portfolio_is_admin()));
create policy storage_admin_update on storage.objects for update to authenticated using(bucket_id='portfolio-files' and (select private.portfolio_is_admin())) with check(bucket_id='portfolio-files' and (select private.portfolio_is_admin()));
create policy storage_admin_delete on storage.objects for delete to authenticated using(bucket_id='portfolio-files' and (select private.portfolio_is_admin()));
create policy storage_admin_select on storage.objects for select to authenticated using(bucket_id='portfolio-files' and (select private.portfolio_is_admin()));
