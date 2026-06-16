import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface PulseSeg {
  id: string
  name: string
  status: 'active' | 'idle' | 'off'
}

export default function PulseBar() {
  const { profile } = useAuth()
  const [segs, setSegs] = useState<PulseSeg[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.company_id) return
    let cancelled = false

    async function load() {
      const today = new Date().toISOString().slice(0, 10)
      const { data: people } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('company_id', profile!.company_id)
        .limit(24)

      const { data: att } = await supabase
        .from('attendance')
        .select('user_id, check_in_at, check_out_at')
        .eq('work_date', today)

      if (cancelled) return

      const attMap = new Map((att ?? []).map((a) => [a.user_id, a]))
      const built: PulseSeg[] = (people ?? []).map((p) => {
        const a = attMap.get(p.id)
        let status: PulseSeg['status'] = 'off'
        if (a?.check_in_at && !a?.check_out_at) status = 'active'
        else if (a?.check_in_at && a?.check_out_at) status = 'idle'
        return { id: p.id, name: p.full_name, status }
      })
      setSegs(built)
      setLoading(false)
    }

    load()
    const channel = supabase
      .channel('pulse-attendance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, load)
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [profile?.company_id])

  const activeCount = segs.filter((s) => s.status === 'active').length

  return (
    <div className="rounded-2xl border border-white/5 bg-panel px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-sm font-medium text-paper">Live pulse</span>
          <span className="text-xs text-slate font-mono">{activeCount} working now</span>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] text-signal font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulseBeat" />
          REAL-TIME
        </span>
      </div>
      <div className="flex items-end gap-[3px] h-10">
        {loading && (
          <span className="text-xs text-slate self-center">Reading today's signal…</span>
        )}
        {!loading && segs.length === 0 && (
          <span className="text-xs text-slate self-center">No team members yet — invite your first hire.</span>
        )}
        {!loading &&
          segs.map((s) => (
            <div
              key={s.id}
              title={`${s.name} — ${s.status === 'active' ? 'checked in' : s.status === 'idle' ? 'checked out' : 'not checked in'}`}
              className={[
                'w-[5px] rounded-full transition-all',
                s.status === 'active' ? 'h-8 bg-ember animate-pulseBeat' : '',
                s.status === 'idle' ? 'h-5 bg-signal/60' : '',
                s.status === 'off' ? 'h-2 bg-white/10' : '',
              ].join(' ')}
              style={s.status === 'active' ? { animationDelay: `${Math.random() * 1.6}s` } : undefined}
            />
          ))}
      </div>
    </div>
  )
}
