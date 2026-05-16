-- ----------------------------------------------------------------------------
-- 0019_support_tickets.sql
-- ----------------------------------------------------------------------------
-- Support tickets — realtors submit requests for help via /admin/support.
-- Each ticket emails Brand Bonjour AND copies the realtor as a receipt.
-- Status is admin-editable (Open / In progress / Replied / Resolved).
-- ----------------------------------------------------------------------------

-- Sequence drives the human-readable suffix (e.g. SH-0007).
create sequence if not exists support_tickets_seq;

-- Helper: atomically pull the next ticket number with a given prefix.
-- Called from the server action so the prefix can be per-site (lives in
-- site_settings.support_ticket_prefix, editable from /admin/settings).
create or replace function next_support_ticket_number(p_prefix text)
returns text
language plpgsql as $$
declare
  seq_val bigint;
  safe_prefix text;
begin
  safe_prefix := nullif(trim(coalesce(p_prefix, '')), '');
  if safe_prefix is null then
    safe_prefix := 'BB';
  end if;
  seq_val := nextval('support_tickets_seq');
  return safe_prefix || '-' || lpad(seq_val::text, 4, '0');
end $$;

create table if not exists public.support_tickets (
  id              uuid primary key default gen_random_uuid(),
  ticket_number   text unique not null,
  -- Enum-ish (validated in app code; kept as text so we can extend cheaply).
  category        text not null,
  affected_page   text,
  description     text not null,
  urgency         text not null default 'normal',
  -- Each attachment: { media_id?: uuid, url?: string, alt?: string, name?: string }
  attachments     jsonb not null default '[]'::jsonb,
  submitter_email text not null,
  submitter_name  text,
  -- Lifecycle: open → in_progress → replied → resolved
  status          text not null default 'open',
  resolution_notes text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  resolved_at     timestamptz
);

create index if not exists idx_support_tickets_created
  on public.support_tickets (created_at desc);
create index if not exists idx_support_tickets_status
  on public.support_tickets (status, created_at desc);

-- Touch updated_at on every update + auto-set resolved_at the first time
-- status transitions to 'resolved'.
create or replace function support_tickets_touch()
returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    if new.status = 'resolved'
       and (old.status is distinct from 'resolved') then
      new.resolved_at := now();
    elsif new.status <> 'resolved' then
      new.resolved_at := null;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists support_tickets_touch_trg on public.support_tickets;
create trigger support_tickets_touch_trg
  before insert or update on public.support_tickets
  for each row execute function support_tickets_touch();

-- RLS — admin (authenticated) can read and write. Service-role bypasses
-- RLS by default; nothing extra needed there.
alter table public.support_tickets enable row level security;

drop policy if exists "team can read support_tickets" on public.support_tickets;
create policy "team can read support_tickets"
  on public.support_tickets
  for select to authenticated
  using (true);

drop policy if exists "team can write support_tickets" on public.support_tickets;
create policy "team can write support_tickets"
  on public.support_tickets
  for all to authenticated
  using (true) with check (true);

-- Per-site ticket prefix. Defaults to 'BB' (Brand Bonjour). Editable from
-- /admin/settings on each site (e.g. SH for Shoukoufa, SA for Samina).
alter table public.site_settings
  add column if not exists support_ticket_prefix text not null default 'BB';

-- PostgREST schema cache refresh so the new column / function are visible
-- via the Supabase JS client immediately.
notify pgrst, 'reload schema';
