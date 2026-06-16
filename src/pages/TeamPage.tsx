import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, Badge, EmptyState, Select } from '../components/ui'
import type { Profile, Role } from '../lib/types'

interface MemberRow extends Profile {
  todayStatus?: 'active' | 'done' | 'absent'
  weekendCheckins: number
  overtimeDays: number
  burnoutRisk: 'high' | 'medium' | 'low'
}

const ROLES: Role[] = ['employee', 'team_leader', 'company_admin']

export default function TeamPage() {
  const { profile } = useAuth()
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const isAdmin = profile?.role === 'company_admin' || profile?.role === 'super_admin'

  useEffect(() => {
    if (!profile?.company_id) return
    load()
  }, [profile?.company_id])

  async function load() {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30)
    const monthAgoStr = monthAgo.toISOString().slice(0, 10)

    const [{ data: people }, { data: att }, { data: recentAtt }] = await Promise.all([
      supabase.from('profiles').select('*').eq('company_id', profile!.company_id).order('created_at', { ascending: true }),
      supabase.from('attendance').select('user_id, check_in_at, check_out_at').eq('work_date', today),
      supabase.from('attendance').select('user_id, work_date, total_hours').eq('company_id', profile!.company_id).gte('work_date', monthAgoStr),
    ])

    const attMap = new Map((att ?? []).map((a) => [a.user_id, a]))

    const rows: MemberRow[] = (people ?? []).map((p) => {
      const a = attMap.get(p.id)
      let todayStatus: MemberRow['todayStatus'] = 'absent'
      if (a?.check_in_at && !a?.check_out_at) todayStatus = 'active'
      else if (a?.check_in_at && a?.check_out_at) todayStatus = 'done'

      const myAtt = (recentAtt ?? []).filter((r) => r.user_id === p.id)
      const weekendCheckins = myAtt.filter((r) => {
        const day = new Date(r.work_date).getDay()
        return day === 0 || day === 6
      }).length
      const overtimeDays = myAtt.filter((r) => (r.total_hours ?? 0) > 9).length

      let burnoutRisk: MemberRow['burnoutRisk'] = 'low'
      if (weekendCheckins >= 3 || overtimeDays >= 8) burnoutRisk = 'high'
      else if (weekendCheckins >= 1 || overtimeDays >= 4) burnoutRisk = 'medium'

      return { ...p, todayStatus, weekendCheckins, overtimeDays, burnoutRisk }
    })

    setMembers(rows)
    setLoading(false)
  }

  async function updateRole(userId: string, role: Role) {
    await supabase.from('profiles').update({ role }).eq('id', userId)
    setMembers((prev) => prev.map((m) => m.id === userId ? { ...m, role } : m))
  }

  const burnoutFlags = members.filter((m) => m.burnoutRisk !== 'low')

  return (
    <div className="space-y-6 animate-riseIn">
      <div>
        <h1 className="font-display text-2xl font-semibold">People</h1>
        <p className="text-slate text-sm mt-1">Everyone in your workspace, and where they stand today.</p>
      </div>

      {/* Burnout alerts */}
      {isAdmin && burnoutFlags.length > 0 && (
        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-ember animate-pulseBeat" />
            <h3 className="font-display text-sm font-medium text-ember">Burnout risk detected</h3>
          </div>
          <div className="space-y-2">
            {burnoutFlags.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3">
                <p className="text-sm text-paper">{m.full_name}</p>
                <div className="flex items-center gap-3 text-xs font-mono text-slate">
                  {m.weekendCheckins > 0 && <span>{m.weekendCheckins} weekend check-in{m.weekendCheckins > 1 ? 's' : ''}</span>}
                  {m.overtimeDays > 0 && <span>{m.overtimeDays} overtime day{m.overtimeDays > 1 ? 's' : ''}</span>}
                  <Badge tone={m.burnoutRisk === 'high' ? 'high' : 'medium'}>{m.burnoutRisk} risk</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        {loading ? (
          <p className="text-slate text-sm">Loading team…</p>
        ) : members.length === 0 ? (
          <EmptyState title="No team members yet" />
        ) : (
          <div className="divide-y divide-white/5">
            {members.map((m) => (
              <div key={m.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="h-9 w-9 rounded-full bg-violet/15 text-violet flex items-center justify-center font-display text-xs font-semibold">
                      {m.full_name.slice(0, 2).toUpperCase()}
                    </div>
                    {m.burnoutRisk === 'high' && (
                      <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-ember border-2 border-panel" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-paper truncate">{m.full_name}</p>
                    <p className="text-xs text-slate truncate">{m.job_title ?? m.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {m.todayStatus === 'active' && <Badge tone="present">working now</Badge>}
                  {m.todayStatus === 'done' && <Badge tone="completed">checked out</Badge>}
                  {m.todayStatus === 'absent' && <Badge tone="absent">not in</Badge>}
                  {isAdmin && m.id !== profile?.id ? (
                    <Select
                      value={m.role}
                      onChange={(e) => updateRole(m.id, e.target.value as Role)}
                      className="!py-1 !text-xs !w-auto"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                    </Select>
                  ) : (
                    <Badge tone="medium">{m.role.replace('_', ' ')}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
