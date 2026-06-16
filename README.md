# Nascraft Pulse

Workforce Intelligence Platform for Nascraft Digitals — built with React + TypeScript + Vite + Supabase + Tailwind CSS.

This build delivers the core, fully-working modules: **Authentication, Attendance, Daily Reporting, Weekly Goals & Review, Task Management, Team Directory, and the Executive Dashboard** (with live "Pulse Bar"). The remaining modules from the original spec (activity/screenshot monitoring, AI insights, burnout detection, billing, etc.) are documented in `ROADMAP.md` and the schema is designed to extend cleanly into them.

## 1. Create a Supabase project

1. Go to supabase.com → New project.
2. Once created, open **SQL Editor** → paste the entire contents of `supabase/schema.sql` → Run.
   This creates all tables, indexes, and Row-Level Security policies.
3. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon public` key

## 2. Configure the app

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## 3. Install & run

```bash
npm install
npm run dev
```

Open the printed local URL. Click **Create your workspace** to sign up — this creates your company and makes you the Company Admin. Invite teammates by having them sign up under their own account for now (a dedicated invite flow is a near-term addition — see `ROADMAP.md`).

> Note: Supabase sends a confirmation email by default. For local testing, you can disable "Confirm email" under **Authentication → Providers → Email** in your Supabase dashboard so you can sign in immediately after signup.

## 4. Build for production

```bash
npm run build
```

Output is in `dist/` — deploy to Vercel, Netlify, Cloudflare Pages, or any static host, with the same two env vars configured.

## Architecture

```
src/
  context/AuthContext.tsx   - session, profile, sign in/up/out
  lib/supabase.ts           - Supabase client
  lib/types.ts              - TypeScript types mirroring the DB schema
  components/               - AppShell (nav), PulseBar (live status), ui.tsx (primitives)
  pages/
    LoginPage / SignupPage
    DashboardPage            - executive overview + live pulse
    AttendancePage           - check in/out + end-of-day report
    TasksPage                - kanban board
    GoalsPage                - Monday planning + Friday review
    TeamPage                 - company directory + live status
supabase/schema.sql          - full DB schema + RLS policies
```

Multi-tenancy is enforced at the database level: every table carries `company_id`, and Row-Level Security policies ensure a user can only read/write data belonging to their own company (or their own records, for personal data like attendance and goals).

## Roles

- **company_admin** - created automatically on signup; full access to company data.
- **team_leader**, **employee** - assign manually by updating `role` on a profile row (a role-management UI is on the roadmap).
- **super_admin** - for managing multiple companies; not yet exposed in UI (schema supports it).
