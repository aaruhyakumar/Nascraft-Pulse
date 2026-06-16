# Roadmap — remaining modules

This build prioritized the core day-to-day loop (auth, attendance, daily/weekly reporting, tasks, dashboard) end-to-end, as scoped. The original brief specified 17 modules; here's what's built vs. what's next, and how each remaining module plugs into the existing schema.

## Built (this delivery)
- Module 1 — Authentication (email/password via Supabase Auth; RBAC via `profiles.role`)
- Module 2 — Attendance (check in/out, device info, work hours, end-of-day report)
- Module 3 — Daily Work Reporting (summary, challenges, tomorrow's plan; `daily_work_items` table ready for per-task breakdown UI)
- Module 4 & 5 — Weekly Planning + Review (`weekly_goals` table, Monday creation, review flow)
- Module 6 — Task Management (kanban board, priorities, due dates; subtasks supported via `parent_task_id`)
- Module 16 — Executive Dashboard (live Pulse Bar, stat cards, recent activity) — simplified version
- Module 17 — Multi-tenant foundation (`companies` table, RLS isolation per company, plan field for billing tiers)

## Next priority (straightforward extensions of current schema)
- **Module 8 — Leave Management**: `leave_requests` table already exists with RLS; needs an Apply/Approve UI.
- **Module 7 — Client & Project Tracking**: add `clients` and `projects` tables (FK to `company_id`); extend `tasks` with `project_id`.
- **Module 14 — Notifications**: add a `notifications` table + Supabase Realtime subscription; start with in-app toast, layer email via Supabase Edge Functions later.
- **Module 10 — Performance Engine**: a scheduled Supabase Edge Function (cron) that reads attendance/tasks/goals weekly and writes computed scores to a `performance_scores` table — formula is already defined in the brief.

## Larger builds (need dedicated design/scoping pass)
- **Module 9 — Activity/Screenshot/App/Website Monitoring**: requires a desktop agent (Electron) or browser extension; not achievable in a web-only app. Needs its own architecture doc.
- **Module 11 — AI Insights Engine**: once enough attendance/task/goal data exists, wrap an LLM call (e.g. via Edge Function) summarizing trends — straightforward once data volume is real.
- **Module 12 — Burnout Detection**: derived from attendance (overtime, weekend check-ins) — a rules-based pass can ship before any ML.
- **Module 13 — Internal Communication**: chat/announcements — best built on Supabase Realtime + a `messages` table, or integrate Slack instead of building from scratch.
- **Module 15 — Reports & Exports**: PDF/Excel export of existing data — add `papaparse`/`exceljs` and a print-friendly report view.
- **Module 17 (full)** — Stripe billing integration, usage limits enforcement, Super Admin console for managing companies/plans.

## Suggested order
1. Leave Management + Notifications (small, high daily-use value)
2. Client/Project tracking (unlocks real project-level reporting)
3. Performance Engine (scores feed the dashboard meaningfully)
4. Reports & Exports
5. AI Insights + Burnout Detection (need real data first)
6. Billing + Super Admin console (needed once selling externally)
7. Activity Monitoring (separate agent/extension project)
