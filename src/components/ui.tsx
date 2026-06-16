import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/5 bg-panel p-5 ${className}`}>{children}</div>
  )
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  const styles = {
    primary: 'bg-ember text-ink hover:bg-emberSoft shadow-glow',
    secondary: 'bg-white/[0.06] text-paper hover:bg-white/[0.1]',
    ghost: 'text-slate hover:text-paper hover:bg-white/[0.04]',
  }[variant]

  return (
    <button
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="focus-ring w-full rounded-xl border border-white/15 px-4 py-3 text-sm text-paper placeholder:text-slate transition-colors hover:border-white/25 focus:border-ember/50"
      style={{ backgroundColor: '#1A1D24', color: '#F5F3EE' }}
      {...props}
    />
  )
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="focus-ring w-full rounded-xl border border-white/15 px-4 py-3 text-sm text-paper placeholder:text-slate resize-none transition-colors hover:border-white/25 focus:border-ember/50"
      style={{ backgroundColor: '#1A1D24', color: '#F5F3EE' }}
      {...props}
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="focus-ring w-full rounded-xl border border-white/15 px-4 py-3 text-sm transition-colors hover:border-white/25"
      style={{ backgroundColor: '#1A1D24', color: '#F5F3EE' }}
      {...props}
    />
  )
}

const badgeColors: Record<string, string> = {
  high: 'bg-ember/15 text-ember',
  medium: 'bg-amber/15 text-amber',
  low: 'bg-slate/15 text-slate',
  completed: 'bg-signal/15 text-signal',
  in_progress: 'bg-violet/15 text-violet',
  not_started: 'bg-white/10 text-slate',
  blocked: 'bg-ember/15 text-ember',
  under_review: 'bg-amber/15 text-amber',
  achieved: 'bg-signal/15 text-signal',
  partially_achieved: 'bg-amber/15 text-amber',
  not_achieved: 'bg-ember/15 text-ember',
  present: 'bg-signal/15 text-signal',
  absent: 'bg-ember/15 text-ember',
  late: 'bg-amber/15 text-amber',
  on_leave: 'bg-violet/15 text-violet',
  pending: 'bg-amber/15 text-amber',
  approved: 'bg-signal/15 text-signal',
  rejected: 'bg-ember/15 text-ember',
  cancelled: 'bg-white/10 text-slate',
  planning: 'bg-violet/15 text-violet',
  active: 'bg-signal/15 text-signal',
  on_hold: 'bg-amber/15 text-amber',
}

export function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  const cls = badgeColors[tone] ?? 'bg-white/10 text-slate'
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${cls}`}>
      {children}
    </span>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 px-6 py-10 text-center">
      <p className="text-sm font-medium text-paper">{title}</p>
      {hint && <p className="text-xs text-slate mt-1">{hint}</p>}
    </div>
  )
}
