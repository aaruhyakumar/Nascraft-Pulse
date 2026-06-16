import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PulseLogo from '../components/PulseLogo'
import { Button, Input } from '../components/ui'

export default function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [secretCode, setSecretCode] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (secretCode !== 'NASCRAFT2026') {
      setError('Invalid workspace creation code.')
      return
    }

    setLoading(true)
    const { error } = await signUp(email, password, fullName, companyName)
    setLoading(false)
    if (error) {
      setError(error)
    } else {
      navigate('/app')
    }
  }

  return (
    <div className="min-h-screen bg-ink text-paper flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <PulseLogo />
        </div>
        <h2 className="font-display text-2xl font-semibold mb-1">Create your workspace</h2>
        <p className="text-slate text-sm mb-8">
          You'll be set up as the company admin. Invite your team after.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate font-medium mb-1.5 block">Your name</label>
            <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Priya Nair" />
          </div>
          <div>
            <label className="text-xs text-slate font-medium mb-1.5 block">Company name</label>
            <Input
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Nascraft Digitals"
            />
          </div>
          <div>
            <label className="text-xs text-slate font-medium mb-1.5 block">Work email</label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
          <div>
            <label className="text-xs text-slate font-medium mb-1.5 block">Password</label>
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
          <div className="pt-2 border-t border-white/5">
            <label className="text-xs text-slate font-medium mb-1.5 block">Secret Workspace Code</label>
            <Input
              type="password"
              required
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
              placeholder="Enter creation code"
            />
          </div>
          {error && <p className="text-sm text-ember">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? 'Creating workspace…' : 'Create workspace'}
          </Button>
        </form>

        <p className="text-sm text-slate mt-6 text-center">
          Already have a workspace?{' '}
          <Link to="/login" className="text-ember hover:text-emberSoft">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
