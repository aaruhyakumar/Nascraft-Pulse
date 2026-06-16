import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, Button, Input, Select, Badge, EmptyState } from '../components/ui'
import type { Role } from '../lib/types'

interface Invite {
  id: string
  code: string
  email: string | null
  role: Role
  used: boolean
  created_at: string
  expires_at: string
}

const ROLE_OPTIONS: { value: Role; label: string; desc: string }[] = [
  { value: 'company_admin', label: 'Admin', desc: 'Full access' },
  { value: 'team_leader', label: 'Team Leader', desc: 'Team management' },
  { value: 'employee', label: 'Employee', desc: 'Standard access' },
]

export default function InvitePage() {
  const { profile } = useAuth()
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('employee')
  const [submitting, setSubmitting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newInvite, setNewInvite] = useState<Invite | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (!profile?.company_id) return; load() }, [profile?.company_id])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('invites')
      .select('*')
      .eq('company_id', profile!.company_id)
      .order('created_at', { ascending: false })
    setInvites((data ?? []) as Invite[])
    setLoading(false)
  }

  async function handleCreate() {
    if (!email.trim()) return
    setSubmitting(true)
    setError(null)
    setNewInvite(null)

    const code = generateCode()
    const expires = new Date(); expires.setDate(expires.getDate() + 7)

    const { data, error: insertError } = await supabase
      .from('invites')
      .insert({
        company_id: profile!.company_id,
        code,
        email: email.trim().toLowerCase(),
        role,
        used: false,
        expires_at: expires.toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    setNewInvite(data as Invite)
    setEmail('')
    setRole('employee')
    setSubmitting(false)
    await load()
  }

  async function revokeInvite(id: string) {
    await supabase.from('invites').delete().eq('id', id)
    setInvites((prev) => prev.filter((i) => i.id !== id))
    if (newInvite?.id === id) setNewInvite(null)
  }

  function getLink(code: string) {
    return `${window.location.origin}/invite/${code}`
  }

  function copyLink(code: string, id: string) {
    navigator.clipboard.writeText(getLink(code))
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const activeInvites = invites.filter((i) => !i.used && new Date(i.expires_at) > new Date())
  const usedInvites = invites.filter((i) => i.used)

  return (
    <div className="space-y-6 animate-riseIn">
      <div>
        <h1 className="font-display text-2xl font-semibold">Invite Members</h1>
        <p className="text-slate text-sm mt-1">Generate secure invite links — each link is single-use and expires in 7 days.</p>
      </div>

      {/* Create form */}
      <Card className="space-y-5">
        <div>
          <h3 className="font-display text-sm font-semibold text-paper mb-1">Generate new invite</h3>
          <p className="text-xs text-slate">The person will sign up with this email and automatically join your workspace.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-paper/80 block">Email address</label>
            <Input
              type="email"
              placeholder="e.g. john@nascraft.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-paper/80 block">Role</label>
            <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
              ))}
            </Select>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-ember/10 border border-ember/20">
            <p className="text-sm text-ember">{error}</p>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleCreate} disabled={!email.trim() || submitting}>
            {submitting ? 'Generating…' : '+ Generate invite link'}
          </Button>
        </div>
      </Card>

      {/* Newly generated link — shown immediately */}
      {newInvite && (
        <Card className="space-y-3 border-ember/20 bg-ember/5 animate-riseIn">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-signal animate-pulseBeat" />
            <h3 className="font-display text-sm font-semibold text-paper">Invite link ready!</h3>
          </div>
          <p className="text-xs text-slate">Share this link with <span className="text-paper font-medium">{newInvite.email}</span></p>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-ink border border-white/10">
              <p className="text-xs font-mono text-signal truncate">{getLink(newInvite.code)}</p>
            </div>
            <Button
              onClick={() => copyLink(newInvite.code, newInvite.id)}
              className="shrink-0"
            >
              {copiedId === newInvite.id ? '✓ Copied!' : 'Copy link'}
            </Button>
          </div>
          <p className="text-xs text-slateDeep">
            Expires {new Date(newInvite.expires_at).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })} · Single use
          </p>
        </Card>
      )}

      {/* All invites */}
      {loading ? (
        <p className="text-slate text-sm">Loading invites…</p>
      ) : activeInvites.length === 0 && usedInvites.length === 0 ? (
        <EmptyState title="No invites generated yet" hint="Use the form above to invite your first team member." />
      ) : (
        <div className="space-y-6">
          {activeInvites.length > 0 && (
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-slateDeep mb-3">Active invites ({activeInvites.length})</p>
              <div className="space-y-2">
                {activeInvites.map((inv) => (
                  <Card key={inv.id} className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-paper">{inv.email}</p>
                        <Badge tone={inv.role === 'company_admin' ? 'high' : inv.role === 'team_leader' ? 'medium' : 'low'}>
                          {ROLE_OPTIONS.find((r) => r.value === inv.role)?.label}
                        </Badge>
                      </div>
                      <p className="text-xs font-mono text-slateDeep mt-1">
                        Expires {new Date(inv.expires_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="secondary" className="!py-1.5 !px-3 !text-xs" onClick={() => copyLink(inv.code, inv.id)}>
                        {copiedId === inv.id ? '✓ Copied!' : 'Copy link'}
                      </Button>
                      <Button variant="ghost" className="!py-1.5 !px-3 !text-xs text-ember hover:text-ember" onClick={() => revokeInvite(inv.id)}>
                        Revoke
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {usedInvites.length > 0 && (
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-slateDeep mb-3">Used ({usedInvites.length})</p>
              <div className="space-y-2">
                {usedInvites.map((inv) => (
                  <Card key={inv.id} className="flex items-center justify-between gap-3 opacity-40">
                    <p className="text-sm text-paper truncate">{inv.email}</p>
                    <Badge tone="completed">joined</Badge>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function generateCode() {
  return Array.from(crypto.getRandomValues(new Uint8Array(18)))
    .map((b) => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 24)
}
