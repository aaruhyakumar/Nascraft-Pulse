-- ============================================================
-- NASCRAFT PULSE — Database Schema (Supabase / PostgreSQL)
-- Run this entire file in the Supabase SQL Editor on a new project.
-- Covers: Companies, Profiles/Roles, Attendance, Daily Reports,
-- Weekly Goals & Reviews, Tasks, Departments/Teams, RLS policies.
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. COMPANIES (multi-tenant root)
-- ============================================================
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  plan text not null default 'starter' check (plan in ('starter','professional','enterprise')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. DEPARTMENTS & TEAMS
-- ============================================================
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  department_id uuid references departments(id) on delete set null,
  name text not null,
  leader_id uuid,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3. PROFILES (extends auth.users)
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  team_id uuid references teams(id) on delete set null,
  department_id uuid references departments(id) on delete set null,
  full_name text not null,
  email text not null,
  role text not null default 'employee' check (role in ('super_admin','company_admin','team_leader','employee')),
  avatar_url text,
  job_title text,
  created_at timestamptz not null default now()
);

alter table teams add constraint teams_leader_fk foreign key (leader_id) references profiles(id) on delete set null;

-- ============================================================
-- 4. ATTENDANCE
-- ============================================================
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  work_date date not null default current_date,
  check_in_at timestamptz,
  check_out_at timestamptz,
  device_info text,
  ip_address text,
  total_hours numeric(5,2),
  status text not null default 'present' check (status in ('present','absent','late','half_day','on_leave')),
  work_summary text,
  challenges_faced text,
  tomorrow_plan text,
  created_at timestamptz not null default now(),
  unique (user_id, work_date)
);

-- ============================================================
-- 5. DAILY WORK ITEMS (linked to attendance/day)
-- ============================================================
create table if not exists daily_work_items (
  id uuid primary key default gen_random_uuid(),
  attendance_id uuid not null references attendance(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  task_name text not null,
  description text,
  hours_spent numeric(4,2) default 0,
  completion_percentage int default 0 check (completion_percentage between 0 and 100),
  status text not null default 'in_progress' check (status in ('not_started','in_progress','completed','blocked')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 6. WEEKLY GOALS & REVIEWS
-- ============================================================
create table if not exists weekly_goals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  week_start date not null,
  goal_name text not null,
  description text,
  priority text not null default 'medium' check (priority in ('high','medium','low')),
  estimated_hours numeric(5,2),
  target_date date,
  expected_outcome text,
  review_status text check (review_status in ('achieved','partially_achieved','not_achieved')),
  review_explanation text,
  lessons_learned text,
  improvement_plan text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 7. TASKS (project/kanban tasks)
-- ============================================================
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references profiles(id) on delete set null,
  created_by uuid references profiles(id) on delete set null,
  priority text not null default 'medium' check (priority in ('high','medium','low')),
  status text not null default 'not_started' check (status in ('not_started','in_progress','under_review','completed')),
  due_date date,
  parent_task_id uuid references tasks(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 8. LEAVE MANAGEMENT
-- ============================================================
create table if not exists leave_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  leave_type text not null check (leave_type in ('casual','sick','emergency','paid')),
  start_date date not null,
  end_date date not null,
  reason text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  reviewed_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_attendance_user_date on attendance(user_id, work_date desc);
create index if not exists idx_tasks_assigned on tasks(assigned_to, status);
create index if not exists idx_weekly_goals_user_week on weekly_goals(user_id, week_start desc);
create index if not exists idx_profiles_company on profiles(company_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table companies enable row level security;
alter table departments enable row level security;
alter table teams enable row level security;
alter table profiles enable row level security;
alter table attendance enable row level security;
alter table daily_work_items enable row level security;
alter table weekly_goals enable row level security;
alter table tasks enable row level security;
alter table leave_requests enable row level security;

-- Helper: get current user's company_id
create or replace function current_company_id() returns uuid as $$
  select company_id from profiles where id = auth.uid();
$$ language sql security definer stable;

create or replace function current_user_role() returns text as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

-- Profiles: users can see everyone in their company; only admins can write others
create policy "profiles_select_company" on profiles for select using (company_id = current_company_id());
create policy "profiles_update_self" on profiles for update using (id = auth.uid());
create policy "profiles_insert_self" on profiles for insert with check (id = auth.uid());

-- Companies: visible to members
create policy "companies_select_own" on companies for select using (id = current_company_id());

-- Departments / Teams: company scoped
create policy "departments_company" on departments for all using (company_id = current_company_id());
create policy "teams_company" on teams for all using (company_id = current_company_id());

-- Attendance: user sees own; admins/leaders see company
create policy "attendance_select" on attendance for select using (
  user_id = auth.uid() or current_company_id() = company_id and current_user_role() in ('company_admin','team_leader','super_admin')
);
create policy "attendance_insert_self" on attendance for insert with check (user_id = auth.uid() and company_id = current_company_id());
create policy "attendance_update_self" on attendance for update using (user_id = auth.uid() or current_user_role() in ('company_admin','super_admin'));

-- Daily work items
create policy "daily_items_select" on daily_work_items for select using (
  user_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.company_id = current_company_id() and p.role in ('company_admin','team_leader','super_admin'))
);
create policy "daily_items_write_self" on daily_work_items for all using (user_id = auth.uid());

-- Weekly goals
create policy "weekly_goals_select" on weekly_goals for select using (
  user_id = auth.uid() or company_id = current_company_id() and current_user_role() in ('company_admin','team_leader','super_admin')
);
create policy "weekly_goals_write_self" on weekly_goals for all using (user_id = auth.uid());

-- Tasks
create policy "tasks_company_select" on tasks for select using (company_id = current_company_id());
create policy "tasks_company_write" on tasks for all using (company_id = current_company_id());

-- Leave requests
create policy "leave_select" on leave_requests for select using (
  user_id = auth.uid() or company_id = current_company_id() and current_user_role() in ('company_admin','team_leader','super_admin')
);
create policy "leave_insert_self" on leave_requests for insert with check (user_id = auth.uid());
create policy "leave_update_admin" on leave_requests for update using (current_user_role() in ('company_admin','super_admin') or user_id = auth.uid());

-- ============================================================
-- 9. NOTIFICATIONS
-- ============================================================
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text,
  type text not null default 'info',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on notifications(user_id, is_read, created_at desc);

alter table notifications enable row level security;

create policy "notifications_select_own" on notifications for select using (user_id = auth.uid());
create policy "notifications_update_own" on notifications for update using (user_id = auth.uid());
create policy "notifications_insert_company" on notifications for insert with check (company_id = current_company_id());

-- ============================================================
-- 10. INVITES
-- ============================================================
create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  code text unique not null,
  email text not null,
  role text not null default 'employee' check (role in ('super_admin','company_admin','team_leader','employee')),
  used boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_invites_code on invites(code);
create index if not exists idx_invites_company on invites(company_id);

alter table invites enable row level security;

create policy "invites_select_company" on invites for select using (company_id = current_company_id());
create policy "invites_insert_admin" on invites for insert with check (company_id = current_company_id());
create policy "invites_update_admin" on invites for update using (company_id = current_company_id());
create policy "invites_delete_admin" on invites for delete using (company_id = current_company_id());
-- Allow reading invite by code without auth (for signup page)
create policy "invites_select_by_code" on invites for select using (true);

-- RPC: accept invite — bypasses RLS, creates profile and marks invite used
create or replace function accept_invite(
  p_user_id uuid,
  p_company_id uuid,
  p_full_name text,
  p_email text,
  p_role text,
  p_invite_id uuid
) returns void as $$
begin
  insert into profiles (id, company_id, full_name, email, role)
  values (p_user_id, p_company_id, p_full_name, p_email, p_role);

  update invites set used = true where id = p_invite_id;
end;
$$ language plpgsql security definer;
