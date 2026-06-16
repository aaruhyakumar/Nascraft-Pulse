import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PulseLogo from '../components/PulseLogo'
import { Button, Input } from '../components/ui'
import type { Role } from '../lib/types'

interface InviteData {
  id: string
  code: string
  company_id: string
  email: string
  role: Role
  used: boolean
  expires_at: string
  companies: { name: string }
}

export default function InviteSignupPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const [invite, setInvite] = useState<InviteData | null>(null)
  const [validating, setValidating] = useState(true)
  const [invalid, setInvalid] = useState(false)

  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!code) { setInvalid(true); setValidating(false); return }
    validateInvite()
  }, [code])

  async function validateInvite() {
    const { data } = await supabase
      .from('invites')
      .select('*, companies(name)')
      .eq('code', code!)
      .maybeSingle()

    if (!data || data.used || new Date(data.expires_at) < new Date()) {
      setInvalid(true)
    } else {
      setInvite(data as InviteData)
    }
    setValidating(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!invite) return
    setError(null)
    setLoading(true)

    // Sign up with Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: invite.email,
      password,
    })

    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    if (!data.user) { setError('Could not create account.'); setLoading(false); return }

    // Create profile and mark invite as used via RPC
    const { error: rpcError } = await supabase.rpc('accept_invite', {
      p_user_id: data.user.id,
      p_company_id: invite.company_id,
      p_full_name: fullName,
      p_email: invite.email,
      p_role: invite.role,
      p_invite_id: invite.id,
    })

    if (rpcError) { setError(rpcError.message); setLoading(false); return }

    navigate('/app')
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <p className="text-slate text-sm font-mono animate-pulse">Validating invite…</p>
      </div>
    )
  }

  if (invalid) {
    return (
      <div className="min-h-screen bg-ink text-paper flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <PulseLogo />
          <h2 className="font-display text-xl font-semibold mt-6">Invalid or expired invite</h2>
          <p className="text-slate text-sm">This invite link has already been used or has expired.</p>
          <p className="text-slate text-sm">Contact your admin for a new invite.</p>
          <Link to="/login" className="text-ember text-sm hover:text-emberSoft">Back to login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink text-paper flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8"><PulseLogo /></div>

        {/* Company badge */}
        <div className="mb-6 px-4 py-3 rounded-xl border border-ember/20 bg-ember/5">
          <p className="text-xs text-slate font-mono">You've been invited to join</p>
          <p className="font-display text-lg font-semibold text-paper mt-0.5">
            {invite!.companies?.name || 'your team\'s workspace'}
          </p>
          <p className="text-xs text-slate mt-1 capitalize">
            as <span className="text-ember">{invite!.role.replace('_', ' ')}</span>
          </p>
        </div>

        <h2 className="font-display text-2xl font-semibold mb-1">Create your account</h2>
        <p className="text-slate text-sm mb-8">Your work email is pre-set by your admin.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate font-medium mb-1.5 block">Work email</label>
            <Input value={invite!.email} disabled className="opacity-60" />
          </div>
          <div>
            <label className="text-xs text-slate font-medium mb-1.5 block">Your name</label>
            <Input
              required
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate font-medium mb-1.5 block">Set your password</label>
            <Input
              type="password"
              required
              minLength={6}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-ember">{error}</p>}
          <Button type="submit" disabled={loading || !fullName.trim()} className="w-full mt-2">
            {loading ? 'Creating account…' : 'Join workspace'}
          </Button>
        </form>

        <p className="text-sm text-slate mt-6 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-ember hover:text-emberSoft">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
