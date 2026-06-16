import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, Button, Badge, EmptyState } from '../components/ui'
import type { Attendance, Task, WeeklyGoal } from '../lib/types'

type ReportType = 'daily' | 'weekly' | 'monthly'

export default function ReportsPage() {
  const { profile } = useAuth()
  const [type, setType] = useState<ReportType>('weekly')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))

  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [goals, setGoals] = useState<WeeklyGoal[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!profile) return
    load()
  }, [profile?.id, type, date, month])

  async function load() {
    setLoading(true)
    const uid = profile!.id
    const cid = profile!.company_id!
    const isAdmin = ['company_admin', 'super_admin', 'team_leader'].includes(profile!.role)

    let attQuery = supabase.from('attendance').select('*').order('work_date', { ascending: false })
    let taskQuery = supabase.from('tasks').select('*').eq('company_id', cid).order('created_at', { ascending: false })
    let goalQuery = supabase.from('weekly_goals').select('*').order('created_at', { ascending: false })

    if (!isAdmin) {
      attQuery = attQuery.eq('user_id', uid)
      taskQuery = taskQuery.eq('assigned_to', uid)
      goalQuery = goalQuery.eq('user_id', uid)
    } else {
      attQuery = attQuery.eq('company_id', cid)
    }

    if (type === 'daily') {
      attQuery = attQuery.eq('work_date', date)
    } else if (type === 'weekly') {
      const weekStart = getWeekStart(new Date(date))
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6)
      attQuery = attQuery.gte('work_date', weekStart).lte('work_date', weekEnd.toISOString().slice(0, 10))
      goalQuery = goalQuery.eq('week_start', weekStart)
    } else {
      const [year, mon] = month.split('-').map(Number)
      const start = `${month}-01`
      const end = new Date(year, mon, 0).toISOString().slice(0, 10)
      attQuery = attQuery.gte('work_date', start).lte('work_date', end)
      goalQuery = goalQuery.gte('week_start', start).lte('week_start', end)
    }

    const [{ data: a }, { data: t }, { data: g }] = await Promise.all([attQuery, taskQuery, goalQuery])
    setAttendance((a ?? []) as Attendance[])
    setTasks((t ?? []) as Task[])
    setGoals((g ?? []) as WeeklyGoal[])
    setLoading(false)
  }

  function exportCSV() {
    const rows = [
      ['Date', 'Check In', 'Check Out', 'Hours', 'Status', 'Summary'],
      ...attendance.map((a) => [
        a.work_date,
        a.check_in_at ? new Date(a.check_in_at).toLocaleTimeString() : '',
        a.check_out_at ? new Date(a.check_out_at).toLocaleTimeString() : '',
        a.total_hours ?? '',
        a.status,
        (a.work_summary ?? '').replace(/,/g, ' '),
      ]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pulse-report-${type}-${date || month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalHours = attendance.reduce((s, a) => s + (a.total_hours ?? 0), 0)
  const presentDays = attendance.filter((a) => ['present', 'late'].includes(a.status)).length
  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const achievedGoals = goals.filter((g) => g.review_status === 'achieved').length

  return (
    <div className="space-y-6 animate-riseIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Reports</h1>
          <p className="text-slate text-sm mt-1">Your work data, summarised and exportable.</p>
        </div>
        <Button variant="secondary" onClick={exportCSV}>Export CSV</Button>
      </div>

      {/* Controls */}
      <Card className="flex flex-wrap items-center gap-3">
        {(['daily', 'weekly', 'monthly'] as ReportType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={[
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize',
              type === t ? 'bg-ember text-ink' : 'text-slate hover:text-paper',
            ].join(' ')}
          >
            {t}
          </button>
        ))}
        <div className="ml-auto">
          {type === 'monthly' ? (
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="focus-ring rounded-lg border border-white/10 bg-ink/40 px-3 py-2 text-sm text-paper"
            />
          ) : (
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="focus-ring rounded-lg border border-white/10 bg-ink/40 px-3 py-2 text-sm text-paper"
            />
          )}
        </div>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-slate mb-1">Days present</p>
          <p className="font-display text-2xl font-semibold font-mono text-signal">{presentDays}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate mb-1">Hours logged</p>
          <p className="font-display text-2xl font-semibold font-mono text-violet">{totalHours.toFixed(1)}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate mb-1">Tasks completed</p>
          <p className="font-display text-2xl font-semibold font-mono text-ember">{completedTasks}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate mb-1">Goals achieved</p>
          <p className="font-display text-2xl font-semibold font-mono text-amber">{achievedGoals}</p>
        </Card>
      </div>

      {loading ? (
        <p className="text-slate text-sm">Loading report…</p>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Attendance */}
          <Card>
            <h3 className="font-display text-sm font-medium mb-4">Attendance log</h3>
            {attendance.length === 0 ? (
              <EmptyState title="No attendance records" />
            ) : (
              <div className="divide-y divide-white/5">
                {attendance.map((a) => (
                  <div key={a.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-paper font-mono">{a.work_date}</p>
                      {a.work_summary && <p className="text-xs text-slate truncate mt-0.5">{a.work_summary}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.total_hours != null && <span className="text-xs font-mono text-slate">{a.total_hours}h</span>}
                      <Badge tone={a.status}>{a.status.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Goals */}
          <Card>
            <h3 className="font-display text-sm font-medium mb-4">Goals</h3>
            {goals.length === 0 ? (
              <EmptyState title="No goals for this period" />
            ) : (
              <div className="divide-y divide-white/5">
                {goals.map((g) => (
                  <div key={g.id} className="py-3 flex items-center justify-between gap-3">
                    <p className="text-sm text-paper truncate min-w-0">{g.goal_name}</p>
                    <div className="flex gap-1.5 shrink-0">
                      <Badge tone={g.priority}>{g.priority}</Badge>
                      {g.review_status
                        ? <Badge tone={g.review_status}>{g.review_status.replace('_', ' ')}</Badge>
                        : <Badge tone="not_started">no review</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

function getWeekStart(d: Date) {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}
