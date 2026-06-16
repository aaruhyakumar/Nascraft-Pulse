import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, Button, Input, Select, Textarea, Badge, EmptyState } from '../components/ui'
import type { LeaveRequest, LeaveType, Profile } from '../lib/types'

const LEAVE_DAYS: Record<LeaveType, number> = {
  casual: 12,
  sick: 10,
  emergency: 5,
  paid: 15,
}

function daysBetween(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1
}

interface LeaveRow extends LeaveRequest {
  requester?: Pick<Profile, 'full_name' | 'email'>
}

export default function LeavePage() {
  const { profile } = useAuth()
  const [requests, setRequests] = useState<LeaveRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [leaveType, setLeaveType] = useState<LeaveType>('casual')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isAdmin = profile?.role === 'company_admin' || profile?.role === 'super_admin'

  useEffect(() => {
    if (!profile) return
    load()
  }, [profile?.id])

  async function load() {
    setLoading(true)
    let query = supabase
      .from('leave_requests')
      .select('*, requester:profiles!leave_requests_user_id_fkey(full_name, email)')
      .order('created_at', { ascending: false })

    if (!isAdmin) query = query.eq('user_id', profile!.id)

    const { data } = await query
    setRequests((data ?? []) as LeaveRow[])
    setLoading(false)
  }

  async function handleApply() {
    if (!startDate || !endDate || new Date(endDate) < new Date(startDate)) return
    setSubmitting(true)
    await supabase.from('leave_requests').insert({
      company_id: profile!.company_id,
      user_id: profile!.id,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason,
      status: 'pending',
    })
    setShowForm(false)
    setStartDate('')
    setEndDate('')
    setReason('')
    setSubmitting(false)
    await load()
  }

  async function handleReview(id: string, status: 'approved' | 'rejected') {
    await supabase
      .from('leave_requests')
      .update({ status, reviewed_by: profile!.id })
      .eq('id', id)
    await load()
  }

  async function handleCancel(id: string) {
    await supabase.from('leave_requests').update({ status: 'cancelled' }).eq('id', id)
    await load()
  }

  // Compute used days per type for the current user
  const usedDays = Object.fromEntries(
    (Object.keys(LEAVE_DAYS) as LeaveType[]).map((type) => [
      type,
      requests
        .filter((r) => r.user_id === profile?.id && r.leave_type === type && r.status === 'approved')
        .reduce((sum, r) => sum + daysBetween(r.start_date, r.end_date), 0),
    ])
  ) as Record<LeaveType, number>

  const adminPending = isAdmin ? requests.filter((r) => r.status === 'pending') : []

  return (
    <div className="space-y-6 animate-riseIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Leave</h1>
          <p className="text-slate text-sm mt-1">Apply for time off and track your balance.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Close' : '+ Apply for leave'}</Button>
      </div>

      {/* Balance strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.entries(LEAVE_DAYS) as [LeaveType, number][]).map(([type, total]) => {
          const used = usedDays[type]
          const remaining = total - used
          return (
            <Card key={type}>
              <p className="text-xs text-slate mb-1 capitalize">{type} leave</p>
              <p className="font-display text-xl font-semibold font-mono text-paper">
                {remaining}
                <span className="text-xs text-slateDeep font-normal">/{total}</span>
              </p>
              <p className="text-[11px] text-slate mt-1">{used} used</p>
            </Card>
          )
        })}
      </div>

      {/* Apply form */}
      {showForm && (
        <Card className="space-y-4 animate-riseIn">
          <h3 className="font-display text-sm font-medium">New leave request</h3>
          <Select value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveType)}>
            <option value="casual">Casual leave</option>
            <option value="sick">Sick leave</option>
            <option value="emergency">Emergency leave</option>
            <option value="paid">Paid leave</option>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate font-medium mb-1.5 block">From</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-slate font-medium mb-1.5 block">To</label>
              <Input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          {startDate && endDate && new Date(endDate) >= new Date(startDate) && (
            <p className="text-xs text-slate">
              Duration: <span className="text-paper font-mono">{daysBetween(startDate, endDate)} day(s)</span>
            </p>
          )}
          <Textarea rows={2} placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleApply} disabled={!startDate || !endDate || submitting}>
              {submitting ? 'Submitting…' : 'Submit request'}
            </Button>
          </div>
        </Card>
      )}

      {/* Admin: pending approvals */}
      {isAdmin && adminPending.length > 0 && (
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-slateDeep mb-3">
            Pending approvals ({adminPending.length})
          </p>
          <div className="space-y-3">
            {adminPending.map((r) => (
              <Card key={r.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-paper">{(r as any).requester?.full_name ?? 'Unknown'}</p>
                    <p className="text-xs text-slate mt-0.5">
                      {r.leave_type} · {r.start_date} → {r.end_date} · {daysBetween(r.start_date, r.end_date)}d
                    </p>
                    {r.reason && <p className="text-xs text-slate mt-1 italic">"{r.reason}"</p>}
                  </div>
                  <Badge tone="not_started">pending</Badge>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => handleReview(r.id, 'rejected')}>Reject</Button>
                  <Button onClick={() => handleReview(r.id, 'approved')}>Approve</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* My requests */}
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-slateDeep mb-3">My requests</p>
        {loading ? (
          <p className="text-slate text-sm">Loading…</p>
        ) : requests.filter((r) => r.user_id === profile?.id).length === 0 ? (
          <EmptyState title="No leave requests yet" hint="Apply for leave using the button above." />
        ) : (
          <div className="space-y-2">
            {requests
              .filter((r) => r.user_id === profile?.id)
              .map((r) => (
                <Card key={r.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-paper capitalize">
                      {r.leave_type} ·{' '}
                      <span className="font-mono text-xs">
                        {r.start_date} → {r.end_date}
                      </span>
                    </p>
                    {r.reason && <p className="text-xs text-slate truncate mt-0.5">{r.reason}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge tone={r.status}>{r.status}</Badge>
                    {r.status === 'pending' && (
                      <Button variant="ghost" className="!py-1 !px-2 !text-xs" onClick={() => handleCancel(r.id)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
