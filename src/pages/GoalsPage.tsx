import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, Button, Input, Select, Textarea, Badge, EmptyState } from '../components/ui'
import type { WeeklyGoal, Priority, ReviewStatus } from '../lib/types'

function getWeekStart(d = new Date()) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date.toISOString().slice(0, 10)
}

export default function GoalsPage() {
  const { profile } = useAuth()
  const [goals, setGoals] = useState<WeeklyGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  const [goalName, setGoalName] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [estimatedHours, setEstimatedHours] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [expectedOutcome, setExpectedOutcome] = useState('')

  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('achieved')
  const [reviewExplanation, setReviewExplanation] = useState('')
  const [lessonsLearned, setLessonsLearned] = useState('')
  const [improvementPlan, setImprovementPlan] = useState('')

  const weekStart = getWeekStart()

  useEffect(() => {
    if (!profile?.id) return
    load()
  }, [profile?.id])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('weekly_goals')
      .select('*')
      .eq('user_id', profile!.id)
      .order('created_at', { ascending: false })
    setGoals((data ?? []) as WeeklyGoal[])
    setLoading(false)
  }

  async function handleCreate() {
    if (!goalName.trim()) return
    await supabase.from('weekly_goals').insert({
      company_id: profile!.company_id,
      user_id: profile!.id,
      week_start: weekStart,
      goal_name: goalName,
      description,
      priority,
      estimated_hours: estimatedHours ? Number(estimatedHours) : null,
      target_date: targetDate || null,
      expected_outcome: expectedOutcome,
    })
    setGoalName('')
    setDescription('')
    setPriority('medium')
    setEstimatedHours('')
    setTargetDate('')
    setExpectedOutcome('')
    setShowForm(false)
    await load()
  }

  async function handleReview(goalId: string) {
    await supabase
      .from('weekly_goals')
      .update({
        review_status: reviewStatus,
        review_explanation: reviewExplanation,
        lessons_learned: lessonsLearned,
        improvement_plan: improvementPlan,
      })
      .eq('id', goalId)
    setReviewingId(null)
    setReviewExplanation('')
    setLessonsLearned('')
    setImprovementPlan('')
    await load()
  }

  const thisWeekGoals = goals.filter((g) => g.week_start === weekStart)
  const pastGoals = goals.filter((g) => g.week_start !== weekStart)

  return (
    <div className="space-y-6 animate-riseIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Weekly goals</h1>
          <p className="text-slate text-sm mt-1">Plan on Monday. Review on Friday. Close the loop.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Close' : '+ New goal'}</Button>
      </div>

      {showForm && (
        <Card className="space-y-4 animate-riseIn">
          <Input placeholder="Goal name" value={goalName} onChange={(e) => setGoalName(e.target.value)} />
          <Textarea placeholder="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
            <Input
              type="number"
              placeholder="Est. hours"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
            />
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
          <Textarea
            placeholder="Expected outcome"
            rows={2}
            value={expectedOutcome}
            onChange={(e) => setExpectedOutcome(e.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={!goalName.trim()}>
              Add goal
            </Button>
          </div>
        </Card>
      )}

      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-slateDeep mb-3">This week</p>
        {loading ? (
          <p className="text-slate text-sm">Loading goals…</p>
        ) : thisWeekGoals.length === 0 ? (
          <EmptyState title="No goals set for this week" hint="Add your goals for the week to start tracking." />
        ) : (
          <div className="space-y-3">
            {thisWeekGoals.map((g) => (
              <Card key={g.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-paper">{g.goal_name}</p>
                    {g.description && <p className="text-xs text-slate mt-1">{g.description}</p>}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Badge tone={g.priority}>{g.priority}</Badge>
                    {g.review_status && <Badge tone={g.review_status}>{g.review_status.replace('_', ' ')}</Badge>}
                  </div>
                </div>

                {!g.review_status && reviewingId !== g.id && (
                  <Button variant="secondary" onClick={() => setReviewingId(g.id)}>
                    Review this goal
                  </Button>
                )}

                {reviewingId === g.id && (
                  <div className="space-y-3 pt-2 border-t border-white/5">
                    <Select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}>
                      <option value="achieved">Achieved</option>
                      <option value="partially_achieved">Partially achieved</option>
                      <option value="not_achieved">Not achieved</option>
                    </Select>
                    <Textarea
                      placeholder="Why did it succeed or fail?"
                      rows={2}
                      value={reviewExplanation}
                      onChange={(e) => setReviewExplanation(e.target.value)}
                    />
                    <Textarea
                      placeholder="Lessons learned"
                      rows={2}
                      value={lessonsLearned}
                      onChange={(e) => setLessonsLearned(e.target.value)}
                    />
                    <Textarea
                      placeholder="Improvement plan"
                      rows={2}
                      value={improvementPlan}
                      onChange={(e) => setImprovementPlan(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" onClick={() => setReviewingId(null)}>
                        Cancel
                      </Button>
                      <Button onClick={() => handleReview(g.id)}>Submit review</Button>
                    </div>
                  </div>
                )}

                {g.review_status && g.review_explanation && (
                  <p className="text-xs text-slate pt-2 border-t border-white/5">{g.review_explanation}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {pastGoals.length > 0 && (
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-slateDeep mb-3">Past weeks</p>
          <div className="space-y-2">
            {pastGoals.map((g) => (
              <Card key={g.id} className="flex items-center justify-between gap-3">
                <p className="text-sm text-paper truncate min-w-0">{g.goal_name}</p>
                <div className="flex gap-1.5 shrink-0">
                  <Badge tone={g.priority}>{g.priority}</Badge>
                  {g.review_status ? (
                    <Badge tone={g.review_status}>{g.review_status.replace('_', ' ')}</Badge>
                  ) : (
                    <Badge tone="not_started">no review</Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
