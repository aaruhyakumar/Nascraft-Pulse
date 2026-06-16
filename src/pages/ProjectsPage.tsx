import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, Button, Input, Select, Textarea, Badge, EmptyState } from '../components/ui'
import type { Project, ProjectStatus, Priority } from '../lib/types'

const STATUS_COLS: { key: ProjectStatus; label: string }[] = [
  { key: 'planning', label: 'Planning' },
  { key: 'active', label: 'Active' },
  { key: 'on_hold', label: 'On hold' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default function ProjectsPage() {
  const { profile } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [clientName, setClientName] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [status, setStatus] = useState<ProjectStatus>('planning')
  const [budget, setBudget] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (!profile?.company_id) return
    load()
  }, [profile?.company_id])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', profile!.company_id)
      .order('created_at', { ascending: false })
    setProjects((data ?? []) as Project[])
    setLoading(false)
  }

  async function handleCreate() {
    if (!name.trim()) return
    await supabase.from('projects').insert({
      company_id: profile!.company_id,
      name,
      description: description || null,
      client_name: clientName || null,
      priority,
      status,
      budget: budget ? Number(budget) : null,
      start_date: startDate || null,
      end_date: endDate || null,
      created_by: profile!.id,
    })
    setName(''); setDescription(''); setClientName('')
    setPriority('medium'); setStatus('planning')
    setBudget(''); setStartDate(''); setEndDate('')
    setShowForm(false)
    await load()
  }

  async function updateStatus(id: string, newStatus: ProjectStatus) {
    await supabase.from('projects').update({ status: newStatus }).eq('id', id)
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, status: newStatus } : p))
  }

  const activeProjects = projects.filter((p) => p.status === 'active')
  const otherProjects = projects.filter((p) => p.status !== 'active')

  return (
    <div className="space-y-6 animate-riseIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Projects</h1>
          <p className="text-slate text-sm mt-1">Track client work and internal projects.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Close' : '+ New project'}</Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUS_COLS.slice(0, 4).map(({ key, label }) => (
          <Card key={key}>
            <p className="text-xs text-slate mb-1">{label}</p>
            <p className="font-display text-2xl font-semibold font-mono text-paper">
              {projects.filter((p) => p.status === key).length}
            </p>
          </Card>
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="space-y-4 animate-riseIn">
          <h3 className="font-display text-sm font-medium">New project</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Client name (optional)" value={clientName} onChange={(e) => setClientName(e.target.value)} />
          </div>
          <Textarea placeholder="Description (optional)" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
              {STATUS_COLS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </Select>
            <Input placeholder="Budget (₹)" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!name.trim()}>Create project</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <p className="text-slate text-sm">Loading projects…</p>
      ) : projects.length === 0 ? (
        <EmptyState title="No projects yet" hint="Create your first project to start tracking work." />
      ) : (
        <>
          {activeProjects.length > 0 && (
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-slateDeep mb-3">Active ({activeProjects.length})</p>
              <div className="grid lg:grid-cols-2 gap-4">
                {activeProjects.map((p) => <ProjectCard key={p.id} project={p} onStatusChange={updateStatus} />)}
              </div>
            </div>
          )}
          {otherProjects.length > 0 && (
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-slateDeep mb-3">All projects</p>
              <div className="grid lg:grid-cols-2 gap-4">
                {otherProjects.map((p) => <ProjectCard key={p.id} project={p} onStatusChange={updateStatus} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ProjectCard({ project: p, onStatusChange }: { project: Project; onStatusChange: (id: string, s: ProjectStatus) => void }) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-paper">{p.name}</p>
          {p.client_name && <p className="text-xs text-slate mt-0.5">Client: {p.client_name}</p>}
          {p.description && <p className="text-xs text-slate mt-1 line-clamp-2">{p.description}</p>}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Badge tone={p.priority}>{p.priority}</Badge>
          <Badge tone={p.status}>{p.status.replace('_', ' ')}</Badge>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-4">
          {p.budget != null && (
            <span className="text-xs font-mono text-slate">₹{p.budget.toLocaleString('en-IN')}</span>
          )}
          {p.start_date && (
            <span className="text-xs font-mono text-slate">{p.start_date}{p.end_date ? ` → ${p.end_date}` : ''}</span>
          )}
        </div>
        <Select
          value={p.status}
          onChange={(e) => onStatusChange(p.id, e.target.value as ProjectStatus)}
          className="!py-1 !text-xs !w-auto"
        >
          {STATUS_COLS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </Select>
      </div>
    </Card>
  )
}
