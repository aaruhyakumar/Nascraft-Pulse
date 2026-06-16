import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import PulseLogo from './PulseLogo'
import ScrollToTop from './ScrollToTop'

function buildNavGroups(isAdmin: boolean) {
  return [
    {
      label: 'Today',
      items: [
        { to: '/app', label: 'Dashboard', icon: GridIcon },
        { to: '/app/attendance', label: 'Attendance', icon: ClockIcon },
      ],
    },
    {
      label: 'Work',
      items: [
        { to: '/app/tasks', label: 'Tasks', icon: CheckIcon },
        { to: '/app/goals', label: 'Weekly goals', icon: TargetIcon },
        ...(isAdmin ? [{ to: '/app/projects', label: 'Projects', icon: FolderIcon }] : []),
      ],
    },
    {
      label: 'Insights',
      items: [
        { to: '/app/performance', label: 'Performance', icon: ChartIcon },
        { to: '/app/reports', label: 'Reports', icon: ReportIcon },
        ...(isAdmin ? [{ to: '/app/insights', label: 'AI Insights', icon: SparkIcon }] : []),
      ],
    },
    {
      label: 'Team',
      items: [
        { to: '/app/team', label: 'People', icon: UsersIcon },
        { to: '/app/leave', label: 'Leave', icon: LeaveIcon },
        ...(isAdmin ? [{ to: '/app/invite', label: 'Invite members', icon: InviteIcon }] : []),
      ],
    },
  ]
}

export default function AppShell() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const isAdmin = ['company_admin', 'super_admin', 'team_leader'].includes(profile?.role ?? '')
  const NAV_GROUPS = buildNavGroups(isAdmin)
  const mainRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!profile?.id) return

    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_read', false)
      .then(({ count }) => setUnreadCount(count ?? 0))

    const channel = supabase
      .channel('shell-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        () => setUnreadCount((c) => c + 1)
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        () => {
          supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', profile.id)
            .eq('is_read', false)
            .then(({ count }) => setUnreadCount(count ?? 0))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile?.id])

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-ink text-paper flex relative">
      <aside className="w-64 shrink-0 border-r border-white/5 flex flex-col py-6 px-4 relative z-10">
        <div className="px-2 mb-4">
          <PulseLogo />
        </div>
        <div className={`mx-2 mb-6 px-3 py-2 rounded-lg border ${
          isAdmin ? 'border-ember/20 bg-ember/5' : 'border-white/5 bg-white/[0.02]'
        }`}>
          <p className={`text-[10px] font-mono uppercase tracking-widest ${
            isAdmin ? 'text-ember' : 'text-slateDeep'
          }`}>
            {isAdmin ? '⚡ Admin panel' : '👤 Employee view'}
          </p>
        </div>

        <nav className="flex-1 space-y-7">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-2 text-[11px] font-mono uppercase tracking-wider text-slateDeep mb-2">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/app'}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors focus-ring',
                        isActive
                          ? 'bg-white/[0.06] text-paper font-medium'
                          : 'text-slate hover:text-paper hover:bg-white/[0.03]',
                      ].join(' ')
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/5 pt-4 mt-4 space-y-1">
          <NavLink
            to="/app/notifications"
            className={({ isActive }) =>
              [
                'flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-colors focus-ring',
                isActive ? 'bg-white/[0.06] text-paper font-medium' : 'text-slate hover:text-paper hover:bg-white/[0.03]',
              ].join(' ')
            }
          >
            <span className="flex items-center gap-2.5">
              <BellIcon className="h-4 w-4 shrink-0" />
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="h-5 min-w-[20px] px-1 rounded-full bg-ember text-ink text-[10px] font-mono font-semibold flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>

          <div className="flex items-center gap-2.5 px-2 pt-2">
            <div className="h-8 w-8 rounded-full bg-ember/15 text-ember flex items-center justify-center font-display text-xs font-semibold shrink-0">
              {profile?.full_name?.slice(0, 2).toUpperCase() ?? '··'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name ?? 'Loading…'}</p>
              <p className="text-[11px] text-slate truncate capitalize">
                {profile?.role.replace('_', ' ') ?? ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full mt-1 text-left px-2.5 py-2 rounded-lg text-sm text-slate hover:text-ember hover:bg-white/[0.03] transition-colors focus-ring"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main ref={mainRef} className="flex-1 overflow-y-auto">
        <ScrollToTop containerRef={mainRef} />
        <div className="max-w-6xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function GridIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.2" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1.2" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1.2" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1.2" />
    </svg>
  )
}
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="10" r="7.2" />
      <path d="M10 6v4l3 2" strokeLinecap="round" />
    </svg>
  )
}
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="14" height="14" rx="3" />
      <path d="M6.5 10.2l2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function TargetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="10" r="7.2" />
      <circle cx="10" cy="10" r="3.4" />
      <circle cx="10" cy="10" r="0.6" fill="currentColor" />
    </svg>
  )
}
function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="7" cy="6.5" r="2.5" />
      <path d="M2.5 16c0-2.7 2-4.3 4.5-4.3s4.5 1.6 4.5 4.3" strokeLinecap="round" />
      <circle cx="14.5" cy="6.5" r="2" />
      <path d="M12.8 11.9c2.1.1 3.7 1.6 3.7 4.1" strokeLinecap="round" />
    </svg>
  )
}
function LeaveIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="4" width="14" height="13" rx="2" />
      <path d="M7 2v4M13 2v4M3 9h14" strokeLinecap="round" />
    </svg>
  )
}
function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 2.5a5.5 5.5 0 0 1 5.5 5.5c0 3 1 4 1.5 5H3c.5-1 1.5-2 1.5-5A5.5 5.5 0 0 1 10 2.5Z" strokeLinecap="round" />
      <path d="M8.5 15.5a1.5 1.5 0 0 0 3 0" strokeLinecap="round" />
    </svg>
  )
}
function FolderIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2 6.5A1.5 1.5 0 0 1 3.5 5h4l1.5 2H16.5A1.5 1.5 0 0 1 18 8.5v6A1.5 1.5 0 0 1 16.5 16h-13A1.5 1.5 0 0 1 2 14.5v-8Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ChartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 14l4-5 4 3 4-6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 17h14" strokeLinecap="round" />
    </svg>
  )
}
function ReportIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="4" y="2" width="12" height="16" rx="2" />
      <path d="M7 7h6M7 10h6M7 13h4" strokeLinecap="round" />
    </svg>
  )
}
function SparkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 2l1.8 5.5H17l-4.4 3.2 1.7 5.3L10 13l-4.3 3 1.7-5.3L3 7.5h5.2L10 2Z" strokeLinejoin="round" />
    </svg>
  )
}
function InviteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="8" cy="7" r="3" />
      <path d="M2 17c0-3 2.5-5 6-5" strokeLinecap="round" />
      <path d="M14 11v6M11 14h6" strokeLinecap="round" />
    </svg>
  )
}
