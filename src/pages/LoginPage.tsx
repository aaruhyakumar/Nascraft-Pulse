import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PulseLogo from '../components/PulseLogo'
import { Button, Input } from '../components/ui'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) setError(error)
    else navigate('/app')
  }

  return (
    <div className="min-h-screen bg-ink text-paper flex">

      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-14 border-r border-white/5 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-ember/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-ember/5 rounded-full blur-3xl pointer-events-none" />

        <PulseLogo size="lg" />

        <div className="relative z-10 space-y-6">
          <h1 className="font-display text-5xl font-semibold leading-tight max-w-md text-paper">
            Know what your team is actually working on.
          </h1>
          <p className="text-slate text-base leading-relaxed max-w-sm">
            Attendance, reporting, goals and tasks — one continuous signal, not five disconnected tools.
          </p>
          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {['Live attendance', 'Weekly goals', 'Task kanban', 'AI insights', 'Performance scores'].map((f) => (
              <span key={f} className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-xs text-slate font-mono">
                {f}
              </span>
            ))}
          </div>
        </div>

        <PulseStrip />
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          <div className="lg:hidden mb-10"><PulseLogo /></div>

          {/* Header */}
          <div className="mb-10">
            <h2 className="font-display text-3xl font-semibold mb-2">Welcome back</h2>
            <p className="text-slate text-sm">Sign in to your Nascraft Pulse workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-paper/80 block">Work email</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-paper/80 block">Password</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-ember/10 border border-ember/20">
                <p className="text-sm text-ember">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full !py-3 !text-base mt-2">
              {loading ? 'Signing in…' : 'Sign in →'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-slate">
              Need help? Contact your workspace administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PulseStrip() {
  const bars = Array.from({ length: 32 }, () => Math.random())
  return (
    <div className="relative z-10 flex items-end gap-[3px] h-14">
      {bars.map((r, i) => (
        <div
          key={i}
          className={`w-[4px] rounded-full transition-all ${r > 0.6 ? 'bg-ember animate-pulseBeat' : r > 0.3 ? 'bg-signal/40' : 'bg-white/10'}`}
          style={{ height: `${10 + r * 42}px`, animationDelay: `${r * 1.5}s` }}
        />
      ))}
    </div>
  )
}
