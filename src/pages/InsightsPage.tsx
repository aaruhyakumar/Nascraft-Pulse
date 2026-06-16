import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { groqChat } from '../lib/groq'
import { Card, Button, EmptyState } from '../components/ui'

interface InsightBlock {
  title: string
  prompt: string
  result: string | null
  loading: boolean
}

export default function InsightsPage() {
  const { profile } = useAuth()
  const [blocks, setBlocks] = useState<InsightBlock[]>([
    { title: 'Productivity summary', prompt: '', result: null, loading: false },
    { title: 'Attendance trends', prompt: '', result: null, loading: false },
    { title: 'Goal performance', prompt: '', result: null, loading: false },
    { title: 'Recommendations', prompt: '', result: null, loading: false },
  ])
  const [dataReady, setDataReady] = useState(false)
  const [loadingAll, setLoadingAll] = useState(false)

  useEffect(() => {
    if (!profile?.company_id) return
    buildPrompts()
  }, [profile?.company_id])

  async function buildPrompts() {
    const cid = profile!.company_id!
    const today = new Date()
    const monthAgo = new Date(today); monthAgo.setDate(monthAgo.getDate() - 30)
    const start = monthAgo.toISOString().slice(0, 10)
    const end = today.toISOString().slice(0, 10)

    const [{ data: att }, { data: tasks }, { data: goals }, { data: people }] = await Promise.all([
      supabase.from('attendance').select('user_id, work_date, total_hours, status').eq('company_id', cid).gte('work_date', start),
      supabase.from('tasks').select('assigned_to, status, priority, created_at').eq('company_id', cid),
      supabase.from('weekly_goals').select('user_id, review_status, priority').eq('company_id', cid).gte('week_start', start),
      supabase.from('profiles').select('id, full_name, role').eq('company_id', cid),
    ])

    const totalEmployees = people?.length ?? 0
    const presentDays = (att ?? []).filter((a) => ['present', 'late'].includes(a.status)).length
    void presentDays
    const avgHours = att?.length ? ((att.reduce((s, a) => s + (a.total_hours ?? 0), 0)) / att.length).toFixed(1) : 0
    const weekendWork = (att ?? []).filter((a) => { const d = new Date(a.work_date).getDay(); return d === 0 || d === 6 }).length
    const overtimeDays = (att ?? []).filter((a) => (a.total_hours ?? 0) > 9).length

    const completedTasks = (tasks ?? []).filter((t) => t.status === 'completed').length
    const totalTasks = tasks?.length ?? 0
    const highPriorityPending = (tasks ?? []).filter((t) => t.priority === 'high' && t.status !== 'completed').length

    const achievedGoals = (goals ?? []).filter((g) => g.review_status === 'achieved').length
    const totalGoals = goals?.length ?? 0
    const unreviewedGoals = (goals ?? []).filter((g) => !g.review_status).length

    const context = `
Company data (last 30 days):
- Team size: ${totalEmployees} employees
- Attendance records: ${att?.length ?? 0} check-ins, avg ${avgHours}h/day
- Weekend check-ins: ${weekendWork}, Overtime days (>9h): ${overtimeDays}
- Tasks: ${completedTasks}/${totalTasks} completed, ${highPriorityPending} high-priority still pending
- Goals: ${achievedGoals}/${totalGoals} achieved, ${unreviewedGoals} unreviewed
- Period: ${start} to ${end}
    `.trim()

    const prompts = [
      `${context}\n\nWrite a concise 3-sentence productivity summary for this team's last 30 days. Focus on key numbers and what they indicate.`,
      `${context}\n\nAnalyse the attendance patterns. Comment on consistency, average hours, and whether the ${weekendWork} weekend check-ins and ${overtimeDays} overtime days are concerning.`,
      `${context}\n\nAnalyse the goal performance. ${achievedGoals} out of ${totalGoals} goals achieved, ${unreviewedGoals} unreviewed. What does this indicate about team planning and follow-through?`,
      `${context}\n\nGive 3 specific, actionable recommendations for this team based on the data. Be direct and practical.`,
    ]

    setBlocks((prev) => prev.map((b, i) => ({ ...b, prompt: prompts[i] })))
    setDataReady(true)
  }

  async function generateAll() {
    setLoadingAll(true)
    setBlocks((prev) => prev.map((b) => ({ ...b, loading: true, result: null })))

    await Promise.all(
      blocks.map(async (b, i) => {
        try {
          const result = await groqChat(b.prompt)
          setBlocks((prev) => prev.map((bl, idx) => idx === i ? { ...bl, result, loading: false } : bl))
        } catch {
          setBlocks((prev) => prev.map((bl, idx) => idx === i ? { ...bl, result: 'Failed to generate insight. Try again.', loading: false } : bl))
        }
      })
    )
    setLoadingAll(false)
  }

  async function regenerate(index: number) {
    setBlocks((prev) => prev.map((b, i) => i === index ? { ...b, loading: true, result: null } : b))
    try {
      const result = await groqChat(blocks[index].prompt)
      setBlocks((prev) => prev.map((b, i) => i === index ? { ...b, result, loading: false } : b))
    } catch {
      setBlocks((prev) => prev.map((b, i) => i === index ? { ...b, result: 'Failed to generate insight.', loading: false } : b))
    }
  }

  const hasAnyResult = blocks.some((b) => b.result)

  return (
    <div className="space-y-6 animate-riseIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">AI Insights</h1>
          <p className="text-slate text-sm mt-1">Groq-powered analysis of your team's last 30 days.</p>
        </div>
        {dataReady && (
          <Button onClick={generateAll} disabled={loadingAll}>
            {loadingAll ? 'Analysing…' : hasAnyResult ? 'Refresh all' : 'Generate insights'}
          </Button>
        )}
      </div>

      {!dataReady ? (
        <p className="text-slate text-sm">Loading your team data…</p>
      ) : !hasAnyResult && !loadingAll ? (
        <EmptyState
          title="Ready to analyse"
          hint="Click 'Generate insights' to get an AI-powered read on your team's productivity, attendance, and goals."
        />
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {blocks.map((b, i) => (
            <Card key={b.title} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-medium">{b.title}</h3>
                {b.result && (
                  <button
                    onClick={() => regenerate(i)}
                    className="text-[11px] text-slate hover:text-paper transition-colors font-mono"
                    disabled={b.loading}
                  >
                    {b.loading ? 'thinking…' : 'regenerate'}
                  </button>
                )}
              </div>
              {b.loading ? (
                <div className="space-y-2">
                  <div className="h-3 bg-white/5 rounded animate-pulse w-full" />
                  <div className="h-3 bg-white/5 rounded animate-pulse w-4/5" />
                  <div className="h-3 bg-white/5 rounded animate-pulse w-3/5" />
                </div>
              ) : b.result ? (
                <p className="text-sm text-slate leading-relaxed">{b.result}</p>
              ) : (
                <p className="text-xs text-slateDeep">Waiting to generate…</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
