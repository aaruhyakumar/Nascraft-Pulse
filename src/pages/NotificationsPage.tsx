import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, Button, EmptyState } from '../components/ui'
import type { Notification } from '../lib/types'

export default function NotificationsPage() {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return

    load()

    const channel = supabase
      .channel('notifications-user')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile?.id])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile!.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications((data ?? []) as Notification[])
    setLoading(false)
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (!unreadIds.length) return
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-6 animate-riseIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Notifications</h1>
          <p className="text-slate text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up.'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-slate text-sm">Loading…</p>
      ) : notifications.length === 0 ? (
        <EmptyState title="No notifications yet" hint="You'll see updates about leave, tasks, and goals here." />
      ) : (
        <Card className="divide-y divide-white/5 !p-0">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className={[
                'flex items-start gap-4 px-5 py-4 transition-colors',
                !n.is_read ? 'cursor-pointer hover:bg-white/[0.02]' : 'opacity-50',
              ].join(' ')}
            >
              <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${!n.is_read ? 'bg-ember animate-pulseBeat' : 'bg-white/10'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-paper leading-snug">{n.title}</p>
                {n.body && <p className="text-xs text-slate mt-0.5 leading-relaxed">{n.body}</p>}
                <p className="text-[11px] font-mono text-slateDeep mt-1.5">
                  {new Date(n.created_at).toLocaleString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
