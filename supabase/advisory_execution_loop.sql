-- Advisory Execution Loop v0
create extension if not exists pgcrypto;

create table if not exists public.advisors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text,
  handle text,
  created_at timestamptz not null default now(),
  unique(name, channel, handle)
);

create table if not exists public.advisory_sessions (
  id uuid primary key default gen_random_uuid(),
  advisor_id uuid not null references public.advisors(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  raw_guidance text not null,
  source_url text,
  ask text,
  created_at timestamptz not null default now()
);

create table if not exists public.advisory_actions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.advisory_sessions(id) on delete cascade,
  owner text not null default 'me',
  title text not null,
  next_step text not null,
  success_criteria text not null,
  due_at timestamptz,
  status text not null default 'OPEN' check (status in ('OPEN','IN_PROGRESS','WAITING_EXTERNAL','DONE','FAILED','KILLED')),
  receipt_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.advisory_attempts (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.advisory_actions(id) on delete cascade,
  attempted_at timestamptz not null default now(),
  observed_result text not null,
  attempt_status text not null check (attempt_status in ('SUCCESS','PARTIAL','FAILURE','WAITING')),
  next_transition text,
  created_at timestamptz not null default now()
);

create table if not exists public.advisory_receipts (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.advisory_attempts(id) on delete cascade,
  receipt_type text not null check (receipt_type in ('URL','TEXT','FILE','HUMAN_CONFIRMATION')),
  receipt_value text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.advisory_briefs (
  id uuid primary key default gen_random_uuid(),
  advisor_id uuid not null references public.advisors(id) on delete cascade,
  generated_at timestamptz not null default now(),
  brief_markdown text not null,
  state_hash text,
  created_at timestamptz not null default now()
);

create index if not exists advisory_sessions_advisor_idx on public.advisory_sessions(advisor_id, occurred_at desc);
create index if not exists advisory_actions_session_idx on public.advisory_actions(session_id, status);
create index if not exists advisory_attempts_action_idx on public.advisory_attempts(action_id, attempted_at desc);
create index if not exists advisory_receipts_attempt_idx on public.advisory_receipts(attempt_id);

alter table public.advisors enable row level security;
alter table public.advisory_sessions enable row level security;
alter table public.advisory_actions enable row level security;
alter table public.advisory_attempts enable row level security;
alter table public.advisory_receipts enable row level security;
alter table public.advisory_briefs enable row level security;

revoke all on public.advisors, public.advisory_sessions, public.advisory_actions, public.advisory_attempts, public.advisory_receipts, public.advisory_briefs from anon, authenticated;
grant select, insert, update, delete on public.advisors, public.advisory_sessions, public.advisory_actions, public.advisory_attempts, public.advisory_receipts, public.advisory_briefs to service_role;

create or replace function public.touch_advisory_action_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_advisory_action_updated_at on public.advisory_actions;
create trigger trg_touch_advisory_action_updated_at before update on public.advisory_actions for each row execute function public.touch_advisory_action_updated_at();

create or replace function public.advisory_action_can_be_done(p_action_id uuid)
returns boolean language sql security invoker set search_path = public as $$
  select case when a.receipt_required = false then true else exists (
    select 1 from public.advisory_attempts at
    join public.advisory_receipts r on r.attempt_id = at.id
    where at.action_id = a.id
  ) end
  from public.advisory_actions a where a.id = p_action_id;
$$;

revoke execute on function public.touch_advisory_action_updated_at() from public, anon, authenticated;
revoke execute on function public.advisory_action_can_be_done(uuid) from public, anon, authenticated;
grant execute on function public.advisory_action_can_be_done(uuid) to service_role;