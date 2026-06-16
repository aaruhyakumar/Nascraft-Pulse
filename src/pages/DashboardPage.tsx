import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import PulseBar from '../components/PulseBar'
import { Card, Badge, EmptyState } from '../components/ui'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Task, WeeklyGoal, Attendance } from '../lib/types'

interface AdminStats { presentToday: number; totalEmployees: number; tasksOpen: number; tasksCompleted: number; goalsThisWeek: number }
interface AttTrend { date: string; present: number }
interface TaskDist { label: string; count: number; color: string }

const TASK_COLORS: Record<string, string> = {
  'Not started': '#5B6472', 'In progress': '#9D8CFF', 'Under review': '#F2B544', 'Completed': '#3DD9C4',
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const isAdmin = ['company_admin', 'super_admin', 'team_leader'].includes(profile?.role ?? '')

  return isAdmin ? <AdminDashboard /> : <EmployeeDashboard />
}

/* ─── ADMIN DASHBOARD ─── */
function AdminDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [goals, setGoals] = useState<WeeklyGoal[]>([])
  const [attTrend, setAttTrend] = useState<AttTrend[]>([])
  const [taskDist, setTaskDist] = useState<TaskDist[]>([])

  useEffect(() => { if (!profile?.company_id) return; load() }, [profile?.company_id])

  async function load() {
    const today = new Date()
    const cid = profile!.company_id as string
    const todayStr = today.toISOString().slice(0, 10)
    const from = new Date(today); from.setDate(from.getDate() - 29)
    const fromStr = from.toISOString().slice(0, 10)

    const [{ count: totalEmployees }, { data: att }, { data: tasks }, { data: weekly }, { data: attHistory }] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', cid),
      supabase.from('attendance').select('user_id').eq('work_date', todayStr).eq('company_id', cid).not('check_in_at', 'is', null),
      supabase.from('tasks').select('*').eq('company_id', cid).order('created_at', { ascending: false }).limit(5),
      supabase.from('weekly_goals').select('*').eq('company_id', cid).order('created_at', { ascending: false }).limit(5),
      supabase.from('attendance').select('work_date').eq('company_id', cid).gte('work_date', fromStr).lte('work_date', todayStr).not('check_in_at', 'is', null),
    ])

    setStats({
      presentToday: att?.length ?? 0, totalEmployees: totalEmployees ?? 0,
      tasksOpen: (tasks ?? []).filter((t) => t.status !== 'completed').length,
      tasksCompleted: (tasks ?? []).filter((t) => t.status === 'completed').length,
      goalsThisWeek: weekly?.length ?? 0,
    })
    setRecentTasks((tasks ?? []) as Task[])
    setGoals((weekly ?? []) as WeeklyGoal[])

    const dateMap = new Map<string, number>()
    ;(attHistory ?? []).forEach((a) => dateMap.set(a.work_date, (dateMap.get(a.work_date) ?? 0) + 1))
    const trend: AttTrend[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      trend.push({ date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), present: dateMap.get(key) ?? 0 })
    }
    setAttTrend(trend)

    const allTasks = tasks ?? []
    setTaskDist([
      { label: 'Not started', count: allTasks.filter((t) => t.status === 'not_started').length, color: TASK_COLORS['Not started'] },
      { label: 'In progress', count: allTasks.filter((t) => t.status === 'in_progress').length, color: TASK_COLORS['In progress'] },
      { label: 'Under review', count: allTasks.filter((t) => t.status === 'under_review').length, color: TASK_COLORS['Under review'] },
      { label: 'Completed', count: allTasks.filter((t) => t.status === 'completed').length, color: TASK_COLORS['Completed'] },
    ])
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? ''
  return (
    <div className="space-y-6 animate-riseIn">
      <div>
        <h1 className="font-display text-2xl font-semibold">{greeting()}, {firstName}.</h1>
        <p className="text-slate text-sm mt-1">Company overview — here's the pulse right now.</p>
      </div>
      <PulseBar />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Present today" value={stats ? `${stats.presentToday}/${stats.totalEmployees}` : '—'} accent="signal" />
        <StatCard label="Open tasks" value={stats?.tasksOpen ?? '—'} accent="violet" />
        <StatCard label="Completed tasks" value={stats?.tasksCompleted ?? '—'} accent="ember" />
        <StatCard label="Goals this week" value={stats?.goalsThisWeek ?? '—'} accent="amber" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-display text-sm font-medium mb-4">Attendance — last 14 days</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={attTrend} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3DD9C4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3DD9C4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#5B6472', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fill: '#5B6472', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#13151B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#F5F3EE' }} itemStyle={{ color: '#3DD9C4' }} />
              <Area type="monotone" dataKey="present" name="Check-ins" stroke="#3DD9C4" strokeWidth={2} fill="url(#attGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 className="font-display text-sm font-medium mb-4">Task distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={taskDist} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: '#5B6472', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5B6472', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#13151B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#F5F3EE' }} itemStyle={{ color: '#8A93A3' }} />
              <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
                {taskDist.map((d) => <Cell key={d.label} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-display text-sm font-medium mb-4">Recent tasks</h3>
          {recentTasks.length === 0 ? <EmptyState title="No tasks yet" /> : (
            <div className="space-y-3">
              {recentTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3">
                  <p className="text-sm text-paper truncate min-w-0">{t.title}</p>
                  <div className="flex gap-1.5 shrink-0">
                    <Badge tone={t.priority}>{t.priority}</Badge>
                    <Badge tone={t.status}>{t.status.replace('_', ' ')}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h3 className="font-display text-sm font-medium mb-4">This week's goals</h3>
          {goals.length === 0 ? <EmptyState title="No goals set" hint="Mondays are for planning." /> : (
            <div className="space-y-3">
              {goals.map((g) => (
                <div key={g.id} className="flex items-center justify-between gap-3">
                  <p className="text-sm text-paper truncate min-w-0">{g.goal_name}</p>
                  <Badge tone={g.priority}>{g.priority}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

/* ─── EMPLOYEE DASHBOARD ─── */
function EmployeeDashboard() {
  const { profile } = useAuth()
  const [todayAtt, setTodayAtt] = useState<Attendance | null>(null)
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [myGoals, setMyGoals] = useState<WeeklyGoal[]>([])
  const [attTrend, setAttTrend] = useState<AttTrend[]>([])
  const [hoursThisWeek, setHoursThisWeek] = useState(0)

  useEffect(() => { if (!profile?.id) return; load() }, [profile?.id])

  async function load() {
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    const weekStart = getWeekStart(today)
    const from = new Date(today); from.setDate(from.getDate() - 13)
    const fromStr = from.toISOString().slice(0, 10)

    const [{ data: att }, { data: tasks }, { data: goals }, { data: weekAtt }, { data: attHistory }] = await Promise.all([
      supabase.from('attendance').select('*').eq('user_id', profile!.id).eq('work_date', todayStr).maybeSingle(),
      supabase.from('tasks').select('*').eq('assigned_to', profile!.id).order('created_at', { ascending: false }).limit(6),
      supabase.from('weekly_goals').select('*').eq('user_id', profile!.id).eq('week_start', weekStart),
      supabase.from('attendance').select('total_hours').eq('user_id', profile!.id).gte('work_date', weekStart).lte('work_date', todayStr),
      supabase.from('attendance').select('work_date, total_hours').eq('user_id', profile!.id).gte('work_date', fromStr).lte('work_date', todayStr),
    ])

    setTodayAtt(att as Attendance | null)
    setMyTasks((tasks ?? []) as Task[])
    setMyGoals((goals ?? []) as WeeklyGoal[])
    setHoursThisWeek((weekAtt ?? []).reduce((s, a) => s + (a.total_hours ?? 0), 0))

    const dateMap = new Map<string, number>()
    ;(attHistory ?? []).forEach((a) => dateMap.set(a.work_date, a.total_hours ?? 0))
    const trend: AttTrend[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      trend.push({ date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), present: dateMap.get(key) ?? 0 })
    }
    setAttTrend(trend)
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? ''
  const isCheckedIn = todayAtt?.check_in_at && !todayAtt?.check_out_at
  const isDone = todayAtt?.check_in_at && todayAtt?.check_out_at
  const completedTasks = myTasks.filter((t) => t.status === 'completed').length
  const achievedGoals = myGoals.filter((g) => g.review_status === 'achieved').length

  return (
    <div className="space-y-6 animate-riseIn">
      <div>
        <h1 className="font-display text-2xl font-semibold">{greeting()}, {firstName}.</h1>
        <p className="text-slate text-sm mt-1">Your day at a glance.</p>
      </div>

      {/* Today's status card */}
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate mb-1">Today · {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          {!todayAtt && <p className="font-display text-lg text-slate">Not checked in yet</p>}
          {isCheckedIn && <p className="font-display text-lg">Checked in · <span className="text-signal font-mono text-base">{new Date(todayAtt!.check_in_at!).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></p>}
          {isDone && <p className="font-display text-lg">Day closed · <span className="text-ember font-mono">{todayAtt!.total_hours}h</span> logged</p>}
        </div>
        {todayAtt && <Badge tone={todayAtt.status}>{todayAtt.status.replace('_', ' ')}</Badge>}
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Hours this week" value={`${hoursThisWeek.toFixed(1)}h`} accent="signal" />
        <StatCard label="My tasks" value={myTasks.length} accent="violet" />
        <StatCard label="Tasks done" value={completedTasks} accent="ember" />
        <StatCard label="Goals achieved" value={achievedGoals} accent="amber" />
      </div>

      {/* My hours trend */}
      <Card>
        <h3 className="font-display text-sm font-medium mb-4">My hours — last 14 days</h3>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={attTrend} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF5A3C" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#FF5A3C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: '#5B6472', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
            <YAxis tick={{ fill: '#5B6472', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#13151B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#F5F3EE' }} itemStyle={{ color: '#FF5A3C' }} />
            <Area type="monotone" dataKey="present" name="Hours" stroke="#FF5A3C" strokeWidth={2} fill="url(#hoursGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-display text-sm font-medium mb-4">My tasks</h3>
          {myTasks.length === 0 ? <EmptyState title="No tasks assigned" hint="Tasks assigned to you will appear here." /> : (
            <div className="space-y-3">
              {myTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3">
                  <p className="text-sm text-paper truncate min-w-0">{t.title}</p>
                  <div className="flex gap-1.5 shrink-0">
                    <Badge tone={t.priority}>{t.priority}</Badge>
                    <Badge tone={t.status}>{t.status.replace('_', ' ')}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h3 className="font-display text-sm font-medium mb-4">This week's goals</h3>
          {myGoals.length === 0 ? <EmptyState title="No goals set" hint="Set your weekly goals on Monday." /> : (
            <div className="space-y-3">
              {myGoals.map((g) => (
                <div key={g.id} className="flex items-center justify-between gap-3">
                  <p className="text-sm text-paper truncate min-w-0">{g.goal_name}</p>
                  <div className="flex gap-1.5 shrink-0">
                    <Badge tone={g.priority}>{g.priority}</Badge>
                    {g.review_status && <Badge tone={g.review_status}>{g.review_status.replace('_', ' ')}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getWeekStart(d: Date) {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const copy = new Date(d); copy.setDate(copy.getDate() + diff)
  return copy.toISOString().slice(0, 10)
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  const colorMap: Record<string, string> = { signal: 'text-signal', violet: 'text-violet', ember: 'text-ember', amber: 'text-amber' }
  return (
    <Card>
      <p className="text-xs text-slate mb-2">{label}</p>
      <p className={`font-display text-2xl font-semibold font-mono ${colorMap[accent]}`}>{value}</p>
    </Card>
  )
}
