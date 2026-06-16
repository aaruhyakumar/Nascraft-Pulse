import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, Button, Textarea, Badge, EmptyState } from '../components/ui'
import type { Attendance } from '../lib/types'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function AttendancePage() {
  const { profile } = useAuth()
  const [today, setToday] = useState<Attendance | null>(null)
  const [history, setHistory] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [showCheckout, setShowCheckout] = useState(false)
  const [summary, setSummary] = useState('')
  const [challenges, setChallenges] = useState('')
  const [plan, setPlan] = useState('')

  useEffect(() => {
    if (!profile) return
    load()
  }, [profile?.id])

  const isAdmin = ['company_admin', 'super_admin', 'team_leader'].includes(profile?.role ?? '')

  async function load() {
    setLoading(true)
    const { data: todayRow } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', profile!.id)
      .eq('work_date', todayStr())
      .maybeSingle()

    let histQuery = supabase
      .from('attendance')
      .select('*, profiles(full_name)')
      .order('work_date', { ascending: false })
      .limit(isAdmin ? 50 : 10)

    if (!isAdmin) histQuery = histQuery.eq('user_id', profile!.id)
    else histQuery = histQuery.eq('company_id', profile!.company_id)

    const { data: hist } = await histQuery
    setToday(todayRow as Attendance | null)
    setHistory((hist ?? []) as Attendance[])
    setLoading(false)
  }

  async function handleCheckIn() {
    const now = new Date().toISOString()
    const hour = new Date().getHours()
    const status = hour > 9 ? 'late' : 'present'

    await supabase.from('attendance').insert({
      company_id: profile!.company_id,
      user_id: profile!.id,
      work_date: todayStr(),
      check_in_at: now,
      device_info: navigator.userAgent.slice(0, 80),
      status,
    })
    await load()
  }

  async function handleCheckOut() {
    if (!today) return
    const now = new Date()
    const checkIn = new Date(today.check_in_at!)
    const hours = (now.getTime() - checkIn.getTime()) / 1000 / 60 / 60

    await supabase
      .from('attendance')
      .update({
        check_out_at: now.toISOString(),
        total_hours: Math.round(hours * 100) / 100,
        work_summary: summary,
        challenges_faced: challenges,
        tomorrow_plan: plan,
      })
      .eq('id', today.id)

    setShowCheckout(false)
    await load()
  }

  if (loading) return <p className="text-slate text-sm">Loading attendance…</p>

  const isCheckedIn = today?.check_in_at && !today?.check_out_at
  const isDone = today?.check_in_at && today?.check_out_at

  return (
    <div className="space-y-6 animate-riseIn">
      <div>
        <h1 className="font-display text-2xl font-semibold">Attendance</h1>
        <p className="text-slate text-sm mt-1">Check in, check out, and close the day with a summary.</p>
      </div>

      <Card className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate mb-1">Today · {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          {!today && <p className="font-display text-lg">Not checked in yet</p>}
          {isCheckedIn && (
            <p className="font-display text-lg">
              Checked in at{' '}
              <span className="font-mono text-signal">
                {new Date(today!.check_in_at!).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </p>
          )}
          {isDone && (
            <p className="font-display text-lg">
              Day closed · <span className="font-mono text-ember">{today!.total_hours}h</span> logged
            </p>
          )}
        </div>

        {!today && <Button onClick={handleCheckIn}>Check in</Button>}
        {isCheckedIn && !showCheckout && (
          <Button variant="secondary" onClick={() => setShowCheckout(true)}>
            Check out
          </Button>
        )}
        {isDone && <Badge tone={today!.status}>{today!.status.replace('_', ' ')}</Badge>}
      </Card>

      {showCheckout && (
        <Card className="space-y-4 animate-riseIn">
          <h3 className="font-display text-sm font-medium">Before you go — close out the day</h3>
          <div>
            <label className="text-xs text-slate font-medium mb-1.5 block">Today's work summary</label>
            <Textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="What did you get done today?" />
          </div>
          <div>
            <label className="text-xs text-slate font-medium mb-1.5 block">Challenges faced</label>
            <Textarea rows={2} value={challenges} onChange={(e) => setChallenges(e.target.value)} placeholder="Client delay, technical issue, blocked on approval…" />
          </div>
          <div>
            <label className="text-xs text-slate font-medium mb-1.5 block">Tomorrow's plan</label>
            <Textarea rows={2} value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="What's the plan for tomorrow?" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowCheckout(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckOut} disabled={!summary.trim()}>
              Confirm check out
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="font-display text-sm font-medium mb-4">
          {isAdmin ? 'Team attendance log' : 'Recent history'}
        </h3>
        {history.length === 0 ? (
          <EmptyState title="No attendance history yet" />
        ) : (
          <div className="divide-y divide-white/5">
            {history.map((h) => (
              <div key={h.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {isAdmin && (h as any).profiles?.full_name && (
                      <span className="text-xs font-medium text-violet shrink-0">{(h as any).profiles.full_name.split(' ')[0]}</span>
                    )}
                    <p className="text-sm text-paper">
                      {new Date(h.work_date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  {h.work_summary && <p className="text-xs text-slate truncate mt-0.5">{h.work_summary}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {h.total_hours != null && <span className="font-mono text-xs text-slate">{h.total_hours}h</span>}
                  <Badge tone={h.status}>{h.status.replace('_', ' ')}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
