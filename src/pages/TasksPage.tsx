import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, Button, Input, Select, Badge, Textarea } from '../components/ui'
import type { Task, TaskStatus, Priority, Profile } from '../lib/types'

const COLUMNS: { key: TaskStatus; label: string; color: string; dot: string }[] = [
  { key: 'not_started', label: 'Not started', color: 'border-t-white/10', dot: 'bg-slateDeep' },
  { key: 'in_progress', label: 'In progress', color: 'border-t-violet', dot: 'bg-violet' },
  { key: 'under_review', label: 'Under review', color: 'border-t-amber', dot: 'bg-amber' },
  { key: 'completed', label: 'Completed', color: 'border-t-signal', dot: 'bg-signal' },
]

export default function TasksPage() {
  const { profile } = useAuth()
  const isAdmin = ['company_admin', 'super_admin', 'team_leader'].includes(profile?.role ?? '')
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<Pick<Profile, 'id' | 'full_name'>[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')

  useEffect(() => { if (!profile?.company_id) return; load() }, [profile?.company_id])

  async function load() {
    setLoading(true)
    const [{ data: taskData }, { data: peopleData }] = await Promise.all([
      isAdmin
        ? supabase.from('tasks').select('*').eq('company_id', profile!.company_id).order('created_at', { ascending: false })
        : supabase.from('tasks').select('*').eq('assigned_to', profile!.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name').eq('company_id', profile!.company_id),
    ])
    setTasks((taskData ?? []) as Task[])
    setMembers((peopleData ?? []) as Pick<Profile, 'id' | 'full_name'>[])
    setAssignedTo(profile!.id)
    setLoading(false)
  }

  async function handleCreate() {
    if (!title.trim()) return
    await supabase.from('tasks').insert({
      company_id: profile!.company_id,
      title,
      description: description || null,
      priority,
      due_date: dueDate || null,
      assigned_to: assignedTo || profile!.id,
      created_by: profile!.id,
      status: 'not_started',
    })
    setTitle(''); setDescription(''); setPriority('medium'); setDueDate('')
    setAssignedTo(profile!.id)
    setShowForm(false)
    await load()
  }

  async function moveTask(taskId: string, status: TaskStatus) {
    await supabase.from('tasks').update({ status }).eq('id', taskId)
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status } : t))
  }

  function memberName(id: string | null) {
    if (!id) return null
    const m = members.find((m) => m.id === id)
    return m ? m.full_name.split(' ')[0] : null
  }

  const totalTasks = tasks.length
  const completedCount = tasks.filter((t) => t.status === 'completed').length

  return (
    <div className="space-y-6 animate-riseIn">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Tasks</h1>
          <p className="text-slate text-sm mt-1">
            {isAdmin ? 'All company tasks — assign, track, close.' : 'Tasks assigned to you.'}
            {totalTasks > 0 && (
              <span className="ml-2 font-mono text-slateDeep">
                {completedCount}/{totalTasks} done
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ New task'}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="space-y-4 animate-riseIn">
          <h3 className="font-display text-sm font-semibold text-paper">New task</h3>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-paper/80 block">Title</label>
            <Input
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-paper/80 block">Description <span className="text-slateDeep font-normal">(optional)</span></label>
            <Textarea
              placeholder="Add more context…"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-slate font-medium block">Priority</label>
              <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate font-medium block">Due date</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-xs text-slate font-medium block">Assign to</label>
              <Select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}{m.id === profile?.id ? ' (you)' : ''}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!title.trim()}>Create task</Button>
          </div>
        </Card>
      )}

      {/* Kanban board */}
      {loading ? (
        <p className="text-slate text-sm">Loading tasks…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key)
            return (
              <div key={col.key} className="flex flex-col gap-3">

                {/* Column header */}
                <div className={`rounded-xl border border-white/5 bg-panel px-4 py-3 border-t-2 ${col.color}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                      <p className="text-xs font-semibold text-paper uppercase tracking-wider">{col.label}</p>
                    </div>
                    <span className="text-xs font-mono font-semibold text-slateDeep bg-white/5 px-2 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-2 min-h-[120px]">
                  {colTasks.length === 0 && (
                    <div className="rounded-xl border border-dashed border-white/5 px-4 py-6 text-center">
                      <p className="text-xs text-slateDeep">No tasks</p>
                    </div>
                  )}
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-xl border border-white/8 bg-panel p-4 space-y-3 hover:border-white/15 transition-colors"
                    >
                      {/* Title */}
                      <p className="text-sm font-medium text-paper leading-snug">{t.title}</p>

                      {/* Description */}
                      {t.description && (
                        <p className="text-xs text-slate line-clamp-2 leading-relaxed">{t.description}</p>
                      )}

                      {/* Meta row */}
                      <div className="flex items-center justify-between gap-2">
                        <Badge tone={t.priority}>{t.priority}</Badge>
                        <div className="flex items-center gap-2">
                          {memberName(t.assigned_to) && (
                            <span className="text-[11px] font-mono text-violet bg-violet/10 px-2 py-0.5 rounded-full">
                              {memberName(t.assigned_to)}
                            </span>
                          )}
                          {t.due_date && (
                            <span className="text-[11px] font-mono text-slate">
                              {new Date(t.due_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Move dropdown */}
                      <Select
                        value={t.status}
                        onChange={(e) => moveTask(t.id, e.target.value as TaskStatus)}
                        className="!py-1.5 !text-xs !rounded-lg"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.key === t.status ? `📍 ${c.label}` : `→ ${c.label}`}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
