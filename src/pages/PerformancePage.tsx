import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, EmptyState } from '../components/ui'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { PerformanceScore } from '../lib/types'

function scoreColor(score: number) {
  if (score >= 80) return '#3DD9C4'
  if (score >= 60) return '#F2B544'
  return '#FF5A3C'
}

export default function PerformancePage() {
  const { profile } = useAuth()
  const [scores, setScores] = useState<PerformanceScore[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))

  useEffect(() => {
    if (!profile?.company_id) return
    load()
  }, [profile?.company_id, month])

  async function load() {
    setLoading(true)
    const companyId = profile!.company_id!
    const [year, mon] = month.split('-').map(Number)
    const start = `${month}-01`
    const end = new Date(year, mon, 0).toISOString().slice(0, 10)
    const workingDays = getWorkingDays(start, end)

    const [{ data: people }, { data: att }, { data: tasks }, { data: goals }] = await Promise.all([
      supabase.from('profiles').select('id, full_name').eq('company_id', companyId),
      supabase.from('attendance').select('user_id, status').eq('company_id', companyId).gte('work_date', start).lte('work_date', end),
      supabase.from('tasks').select('assigned_to, status').eq('company_id', companyId),
      supabase.from('weekly_goals').select('user_id, review_status').eq('company_id', companyId).gte('week_start', start).lte('week_start', end),
    ])

    const result: PerformanceScore[] = (people ?? []).map((p) => {
      const myAtt = (att ?? []).filter((a) => a.user_id === p.id)
      const presentDays = myAtt.filter((a) => ['present', 'late', 'half_day'].includes(a.status)).length
      const attendance_score = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0

      const myTasks = (tasks ?? []).filter((t) => t.assigned_to === p.id)
      const completedTasks = myTasks.filter((t) => t.status === 'completed').length
      const task_score = myTasks.length > 0 ? Math.round((completedTasks / myTasks.length) * 100) : 0

      const myGoals = (goals ?? []).filter((g) => g.user_id === p.id)
      const achievedGoals = myGoals.filter((g) => g.review_status === 'achieved').length
      const partialGoals = myGoals.filter((g) => g.review_status === 'partially_achieved').length
      const goals_score = myGoals.length > 0
        ? Math.round(((achievedGoals + partialGoals * 0.5) / myGoals.length) * 100)
        : 0

      // Weights: attendance 30%, tasks 40%, goals 30%
      const overall_score = Math.round(attendance_score * 0.3 + task_score * 0.4 + goals_score * 0.3)

      return { user_id: p.id, full_name: p.full_name, attendance_score, task_score, goals_score, overall_score }
    })

    result.sort((a, b) => b.overall_score - a.overall_score)
    setScores(result)
    setLoading(false)
  }

  const myScore = scores.find((s) => s.user_id === profile?.id)
  const isAdmin = ['company_admin', 'super_admin', 'team_leader'].includes(profile?.role ?? '')

  if (!isAdmin && myScore) {
    return (
      <div className="space-y-6 animate-riseIn">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">My Performance</h1>
            <p className="text-slate text-sm mt-1">Your personal scores for {month}.</p>
          </div>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="focus-ring rounded-lg border border-white/10 bg-ink/40 px-3 py-2 text-sm text-paper" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <p className="text-xs text-slate mb-1">Overall score</p>
            <p className="font-display text-4xl font-semibold font-mono" style={{ color: scoreColor(myScore.overall_score) }}>
              {myScore.overall_score}<span className="text-sm text-slateDeep">/100</span>
            </p>
          </Card>
          <Card>
            <p className="text-xs text-slate mb-1">Attendance</p>
            <p className="font-display text-4xl font-semibold font-mono" style={{ color: scoreColor(myScore.attendance_score) }}>
              {myScore.attendance_score}<span className="text-sm text-slateDeep">/100</span>
            </p>
          </Card>
          <Card>
            <p className="text-xs text-slate mb-1">Task completion</p>
            <p className="font-display text-4xl font-semibold font-mono" style={{ color: scoreColor(myScore.task_score) }}>
              {myScore.task_score}<span className="text-sm text-slateDeep">/100</span>
            </p>
          </Card>
          <Card>
            <p className="text-xs text-slate mb-1">Goals achieved</p>
            <p className="font-display text-4xl font-semibold font-mono" style={{ color: scoreColor(myScore.goals_score) }}>
              {myScore.goals_score}<span className="text-sm text-slateDeep">/100</span>
            </p>
          </Card>
        </div>
        <Card>
          <h3 className="font-display text-sm font-medium mb-3">Score breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'Attendance (30%)', score: myScore.attendance_score },
              { label: 'Tasks (40%)', score: myScore.task_score },
              { label: 'Goals (30%)', score: myScore.goals_score },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate">{item.label}</span>
                  <span className="font-mono" style={{ color: scoreColor(item.score) }}>{item.score}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${item.score}%`, background: scoreColor(item.score) }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-riseIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Performance</h1>
          <p className="text-slate text-sm mt-1">Scores based on attendance, tasks, and goals.</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="focus-ring rounded-lg border border-white/10 bg-ink/40 px-3 py-2 text-sm text-paper"
        />
      </div>

      {/* My score card */}
      {myScore && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <p className="text-xs text-slate mb-1">Overall score</p>
            <p className="font-display text-3xl font-semibold font-mono" style={{ color: scoreColor(myScore.overall_score) }}>
              {myScore.overall_score}
              <span className="text-sm text-slateDeep">/100</span>
            </p>
          </Card>
          <Card>
            <p className="text-xs text-slate mb-1">Attendance</p>
            <p className="font-display text-3xl font-semibold font-mono" style={{ color: scoreColor(myScore.attendance_score) }}>
              {myScore.attendance_score}<span className="text-sm text-slateDeep">/100</span>
            </p>
          </Card>
          <Card>
            <p className="text-xs text-slate mb-1">Task completion</p>
            <p className="font-display text-3xl font-semibold font-mono" style={{ color: scoreColor(myScore.task_score) }}>
              {myScore.task_score}<span className="text-sm text-slateDeep">/100</span>
            </p>
          </Card>
          <Card>
            <p className="text-xs text-slate mb-1">Goals achieved</p>
            <p className="font-display text-3xl font-semibold font-mono" style={{ color: scoreColor(myScore.goals_score) }}>
              {myScore.goals_score}<span className="text-sm text-slateDeep">/100</span>
            </p>
          </Card>
        </div>
      )}

      {/* Team chart — admin only */}
      {isAdmin && (
        <Card>
          <h3 className="font-display text-sm font-medium mb-5">Team overview</h3>
          {loading ? (
            <p className="text-slate text-sm">Calculating scores…</p>
          ) : scores.length === 0 ? (
            <EmptyState title="No data for this month" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scores} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="full_name"
                  tick={{ fill: '#8A93A3', fontSize: 11 }}
                  tickFormatter={(v) => v.split(' ')[0]}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis domain={[0, 100]} tick={{ fill: '#8A93A3', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ background: '#13151B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#F5F3EE' }}
                  itemStyle={{ color: '#8A93A3' }}
                />
                <Bar dataKey="overall_score" name="Overall" radius={[4, 4, 0, 0]}>
                  {scores.map((s) => (
                    <Cell key={s.user_id} fill={scoreColor(s.overall_score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      )}

      {/* Leaderboard — admin only */}
      {isAdmin && scores.length > 0 && (
        <Card>
          <h3 className="font-display text-sm font-medium mb-4">Leaderboard</h3>
          <div className="divide-y divide-white/5">
            {scores.map((s, i) => (
              <div key={s.user_id} className="py-3 flex items-center gap-4">
                <span className="font-mono text-xs text-slateDeep w-5 shrink-0">{i + 1}</span>
                <div className="h-8 w-8 rounded-full bg-violet/15 text-violet flex items-center justify-center font-display text-xs font-semibold shrink-0">
                  {s.full_name.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-sm text-paper flex-1 min-w-0 truncate">{s.full_name}</p>
                <div className="flex gap-4 text-xs font-mono text-slate shrink-0">
                  <span title="Attendance">A:{s.attendance_score}</span>
                  <span title="Tasks">T:{s.task_score}</span>
                  <span title="Goals">G:{s.goals_score}</span>
                </div>
                <span className="font-display text-sm font-semibold font-mono w-12 text-right shrink-0" style={{ color: scoreColor(s.overall_score) }}>
                  {s.overall_score}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function getWorkingDays(start: string, end: string) {
  let count = 0
  const cur = new Date(start)
  const last = new Date(end)
  while (cur <= last) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}
