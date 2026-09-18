-- Academy Hub scalable core
-- Target: Supabase/PostgreSQL
-- Purpose: move shared student/user data out of browser localStorage when cloud mode is enabled.
-- Designed for pagination, indexed search, many staff accounts, and large imports.
--
-- Apply this migration in the Supabase SQL editor before enabling cloud data mode.

create extension if not exists pgcrypto;

create table if not exists public.academy_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_members (
  workspace_id uuid not null references public.academy_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'User' check (role in ('User', 'Manager', 'Admin')),
  permissions jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.academy_shifts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.academy_workspaces(id) on delete cascade,
  name text not null,
  from_time time,
  to_time time,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table if not exists public.academy_students (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.academy_workspaces(id) on delete cascade,
  student_id text not null,
  full_name text not null,
  gender text not null default 'Unspecified' check (gender in ('Male', 'Female', 'Unspecified')),
  phone text,
  course text,
  date_joined date,
  shift text not null default 'Unspecified' check (shift in ('Morning', 'Evening', 'Unspecified')),
  shift_time text,
  total_fees numeric(14,2) not null default 0 check (total_fees >= 0),
  amount_paid numeric(14,2) not null default 0 check (amount_paid >= 0 and amount_paid <= total_fees),
  remaining_fees numeric(14,2) generated always as (greatest(total_fees - amount_paid, 0)) stored,
  payment_status text generated always as (
    case
      when amount_paid <= 0 then 'Pending'
      when amount_paid >= total_fees then 'Paid'
      else 'Partial'
    end
  ) stored,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (workspace_id, student_id)
);

create table if not exists public.academy_student_payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.academy_workspaces(id) on delete cascade,
  student_id uuid not null references public.academy_students(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  payment_date date not null default current_date,
  payment_time time not null default localtime,
  previous_paid numeric(14,2) not null default 0,
  previous_remaining numeric(14,2) not null default 0,
  new_paid numeric(14,2) not null default 0,
  new_remaining numeric(14,2) not null default 0,
  recorded_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.academy_settings (
  workspace_id uuid primary key references public.academy_workspaces(id) on delete cascade,
  academy_name text not null default 'Academy Hub',
  academic_session text not null default '',
  currency_label text not null default 'Rs',
  contact_email text,
  contact_phone text,
  address text,
  updated_at timestamptz not null default now()
);

-- Large-table indexes: queries should filter by workspace first and page results.
create index if not exists academy_students_workspace_created_idx
  on public.academy_students (workspace_id, created_at desc, id desc)
  where deleted_at is null;

create index if not exists academy_students_workspace_gender_idx
  on public.academy_students (workspace_id, gender, created_at desc)
  where deleted_at is null;

create index if not exists academy_students_workspace_shift_idx
  on public.academy_students (workspace_id, shift, created_at desc)
  where deleted_at is null;

create index if not exists academy_students_workspace_student_id_idx
  on public.academy_students (workspace_id, student_id);

create index if not exists academy_students_workspace_name_idx
  on public.academy_students (workspace_id, lower(full_name));

create index if not exists academy_students_workspace_course_idx
  on public.academy_students (workspace_id, lower(course));

create index if not exists academy_payments_workspace_student_date_idx
  on public.academy_student_payments (workspace_id, student_id, payment_date desc, created_at desc);

create index if not exists academy_members_user_idx
  on public.academy_members (user_id, active);

-- PostgreSQL full-text search index for fast name/course/phone/ID lookup.
alter table public.academy_students
  add column if not exists search_document tsvector
  generated always as (
    to_tsvector(
      'simple',
      coalesce(student_id, '') || ' ' ||
      coalesce(full_name, '') || ' ' ||
      coalesce(phone, '') || ' ' ||
      coalesce(course, '') || ' ' ||
      coalesce(notes, '')
    )
  ) stored;

create index if not exists academy_students_search_document_idx
  on public.academy_students using gin (search_document);

-- Shared updated_at trigger.
create or replace function public.academy_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists academy_workspaces_touch on public.academy_workspaces;
create trigger academy_workspaces_touch
before update on public.academy_workspaces
for each row execute function public.academy_touch_updated_at();

drop trigger if exists academy_members_touch on public.academy_members;
create trigger academy_members_touch
before update on public.academy_members
for each row execute function public.academy_touch_updated_at();

drop trigger if exists academy_shifts_touch on public.academy_shifts;
create trigger academy_shifts_touch
before update on public.academy_shifts
for each row execute function public.academy_touch_updated_at();

drop trigger if exists academy_students_touch on public.academy_students;
create trigger academy_students_touch
before update on public.academy_students
for each row execute function public.academy_touch_updated_at();

drop trigger if exists academy_settings_touch on public.academy_settings;
create trigger academy_settings_touch
before update on public.academy_settings
for each row execute function public.academy_touch_updated_at();

-- RLS protects workspace isolation. Granular UI permissions remain in academy_members.permissions.
alter table public.academy_workspaces enable row level security;
alter table public.academy_members enable row level security;
alter table public.academy_shifts enable row level security;
alter table public.academy_students enable row level security;
alter table public.academy_student_payments enable row level security;
alter table public.academy_settings enable row level security;

create or replace function public.academy_is_member(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.academy_members m
    where m.workspace_id = target_workspace
      and m.user_id = auth.uid()
      and m.active = true
  );
$$;

create or replace function public.academy_has_permission(target_workspace uuid, permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.academy_members m
    where m.workspace_id = target_workspace
      and m.user_id = auth.uid()
      and m.active = true
      and (
        m.role = 'Admin'
        or coalesce((m.permissions ->> permission_key)::boolean, false)
      )
  );
$$;

drop policy if exists academy_workspaces_member_select on public.academy_workspaces;
create policy academy_workspaces_member_select
on public.academy_workspaces for select
to authenticated
using (public.academy_is_member(id));

drop policy if exists academy_members_member_select on public.academy_members;
create policy academy_members_member_select
on public.academy_members for select
to authenticated
using (public.academy_is_member(workspace_id));

drop policy if exists academy_students_select on public.academy_students;
create policy academy_students_select
on public.academy_students for select
to authenticated
using (public.academy_has_permission(workspace_id, 'studentsView'));

drop policy if exists academy_students_insert on public.academy_students;
create policy academy_students_insert
on public.academy_students for insert
to authenticated
with check (public.academy_has_permission(workspace_id, 'studentsSave'));

drop policy if exists academy_students_update on public.academy_students;
create policy academy_students_update
on public.academy_students for update
to authenticated
using (
  public.academy_has_permission(workspace_id, 'studentsEdit')
  or public.academy_has_permission(workspace_id, 'studentsSave')
)
with check (
  public.academy_has_permission(workspace_id, 'studentsEdit')
  or public.academy_has_permission(workspace_id, 'studentsSave')
);

drop policy if exists academy_students_delete on public.academy_students;
create policy academy_students_delete
on public.academy_students for delete
to authenticated
using (public.academy_has_permission(workspace_id, 'studentsDelete'));

drop policy if exists academy_shifts_select on public.academy_shifts;
create policy academy_shifts_select
on public.academy_shifts for select
to authenticated
using (public.academy_has_permission(workspace_id, 'shiftManagement'));

drop policy if exists academy_shifts_write on public.academy_shifts;
create policy academy_shifts_write
on public.academy_shifts for all
to authenticated
using (public.academy_has_permission(workspace_id, 'shiftManagement'))
with check (public.academy_has_permission(workspace_id, 'shiftManagement'));

drop policy if exists academy_payments_select on public.academy_student_payments;
create policy academy_payments_select
on public.academy_student_payments for select
to authenticated
using (public.academy_has_permission(workspace_id, 'payments'));

drop policy if exists academy_payments_write on public.academy_student_payments;
create policy academy_payments_write
on public.academy_student_payments for all
to authenticated
using (public.academy_has_permission(workspace_id, 'payments'))
with check (public.academy_has_permission(workspace_id, 'payments'));

drop policy if exists academy_settings_select on public.academy_settings;
create policy academy_settings_select
on public.academy_settings for select
to authenticated
using (public.academy_has_permission(workspace_id, 'settings'));

drop policy if exists academy_settings_write on public.academy_settings;
create policy academy_settings_write
on public.academy_settings for all
to authenticated
using (public.academy_has_permission(workspace_id, 'settings'))
with check (public.academy_has_permission(workspace_id, 'settings'));

grant usage on schema public to authenticated, service_role;
grant select on public.academy_workspaces, public.academy_members, public.academy_students, public.academy_shifts, public.academy_student_payments, public.academy_settings to authenticated;
grant insert, update, delete on public.academy_students, public.academy_shifts, public.academy_student_payments, public.academy_settings to authenticated;
grant select, insert, update, delete on public.academy_workspaces, public.academy_members, public.academy_students, public.academy_shifts, public.academy_student_payments, public.academy_settings to service_role;

comment on table public.academy_students is 'Shared Academy Hub student directory; query with workspace filters and pagination.';
comment on table public.academy_members is 'Workspace staff accounts and granular permissions.';
