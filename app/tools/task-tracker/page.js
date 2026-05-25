'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const STATUS_CONFIG = {
  todo:        { label: 'To Do',       color: 'var(--text-muted)', bg: 'rgba(74,74,122,0.15)' },
  in_progress: { label: 'In Progress', color: 'var(--warning)', bg: 'rgba(245,158,11,0.15)' },
  done:        { label: 'Done',        color: 'var(--success)', bg: 'rgba(16,185,129,0.15)' },
}

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: 'var(--text-muted)' },
  medium: { label: 'Medium', color: 'var(--accent)' },
  high:   { label: 'High',   color: 'var(--danger)' },
}

const NEXT_STATUS = { todo: 'in_progress', in_progress: 'done', done: 'todo' }

const inputCss = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
  borderRadius: '8px', padding: '0.65rem 0.9rem',
  color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
  fontFamily: 'sans-serif', transition: 'border-color 0.2s',
}

const labelCss = {
  display: 'block', color: 'var(--text-muted)', fontSize: '0.72rem',
  fontWeight: 600, marginBottom: '0.4rem',
  textTransform: 'uppercase', letterSpacing: '0.06em',
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0)
  const target = new Date(dateStr); target.setHours(0,0,0,0)
  return Math.ceil((target - today) / 86400000)
}

// ─── TaskModal ────────────────────────────────────────────────────────────────

function TaskModal({ task, onClose, onSave }) {
  const [title, setTitle]       = useState(task?.title ?? '')
  const [desc, setDesc]         = useState(task?.description ?? '')
  const [status, setStatus]     = useState(task?.status ?? 'todo')
  const [priority, setPriority] = useState(task?.priority ?? 'medium')
  const [dueDate, setDueDate]   = useState(task?.due_date ? task.due_date.slice(0, 10) : '')

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSave() {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      description: desc.trim() || null,
      status, priority,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    })
  }

  const ToggleGroup = ({ options, value, onChange, config }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {options.map(opt => {
        const c = config[opt]
        const active = value === opt
        return (
          <button key={opt} onClick={() => onChange(opt)} style={{
            background: active ? c.bg ?? `${c.color}18` : 'transparent',
            border: `1px solid ${active ? c.color + '60' : 'var(--border)'}`,
            borderRadius: '6px', padding: '0.42rem 0.75rem',
            color: active ? c.color : 'var(--text-muted)',
            fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer',
            textAlign: 'left', fontFamily: 'sans-serif', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: '7px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, background: active ? c.color : '#2a2a4a' }}/>
            {c.label}
          </button>
        )
      })}
    </div>
  )

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px',
        padding: '1.75rem', width: '100%', maxWidth: '480px',
        boxShadow: '0 8px 60px rgba(0,0,0,0.8)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>
            {task ? 'Edit task' : 'New task'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', lineHeight: 1 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelCss}>Title *</label>
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              style={inputCss}
              onFocus={e => e.target.style.borderColor = 'rgba(0,180,255,0.5)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <div>
            <label style={labelCss}>Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Add details... (optional)" rows={3}
              style={{ ...inputCss, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = 'rgba(0,180,255,0.5)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelCss}>Status</label>
              <ToggleGroup options={['todo','in_progress','done']} value={status} onChange={setStatus} config={STATUS_CONFIG}/>
            </div>
            <div>
              <label style={labelCss}>Priority</label>
              <ToggleGroup options={['low','medium','high']} value={priority} onChange={setPriority} config={PRIORITY_CONFIG}/>
            </div>
          </div>
          <div>
            <label style={labelCss}>Due date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              style={{ ...inputCss, colorScheme: 'dark' }}
              onFocus={e => e.target.style.borderColor = 'rgba(0,180,255,0.5)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button onClick={onClose} style={{
              flex: 1, background: 'transparent', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '0.7rem', color: 'var(--text-muted)',
              fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'sans-serif',
            }}>Cancel</button>
            <button onClick={handleSave} disabled={!title.trim()} style={{
              flex: 2,
              background: title.trim() ? 'rgba(0,180,255,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${title.trim() ? 'rgba(0,180,255,0.4)' : 'var(--border)'}`,
              borderRadius: '8px', padding: '0.7rem',
              color: title.trim() ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '0.9rem', fontWeight: 600,
              cursor: title.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'sans-serif', transition: 'all 0.2s',
            }}>
              {task ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────

function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const sc = STATUS_CONFIG[task.status]
  const pc = PRIORITY_CONFIG[task.priority]
  const isOverdue = task.due_date && new Date(task.due_date) < new Date()

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${isOverdue ? 'rgba(248,113,113,0.25)' : 'var(--border)'}`,
      borderRadius: '10px', padding: '0.9rem 1rem',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = isOverdue ? 'rgba(248,113,113,0.45)' : 'rgba(0,180,255,0.2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = isOverdue ? 'rgba(248,113,113,0.25)' : 'var(--border)'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        {/* Status toggle */}
        <button onClick={() => onStatusChange(task.id, NEXT_STATUS[task.status])}
          title={`Mark as ${NEXT_STATUS[task.status].replace('_', ' ')}`}
          style={{
            flexShrink: 0, marginTop: '2px', width: '18px', height: '18px', borderRadius: '5px',
            border: `1.5px solid ${sc.color}`,
            background: task.status === 'in_progress' ? 'transparent' : 'transparent',
            cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
          }}
        >
          {task.status === 'in_progress' && (
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--warning)' }}/>
          )}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: 500, margin: 0, lineHeight: 1.4 }}>
              {task.title}
            </h3>
            <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
              <button onClick={() => onEdit(task)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px', lineHeight: 1 }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button onClick={() => onDelete(task.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px', lineHeight: 1 }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                </svg>
              </button>
            </div>
          </div>

          {task.description && (
            <p style={{
              color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0.3rem 0 0', lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>{task.description}</p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: '99px',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              background: `${pc.color}18`, border: `1px solid ${pc.color}40`, color: pc.color,
            }}>{pc.label}</span>

            <span style={{
              fontSize: '0.68rem', fontWeight: 500, padding: '2px 7px', borderRadius: '99px',
              background: sc.bg, border: `1px solid ${sc.color}40`, color: sc.color,
            }}>{sc.label}</span>

            {task.due_date && (
              <span style={{ fontSize: '0.72rem', color: isOverdue ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {isOverdue ? '⚠ Overdue · ' : ''}{fmtDate(task.due_date)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar Widget ───────────────────────────────────────────────────────────

function SidebarWidget({ tasks, onNewTask }) {
  const active = tasks.filter(t => t.status !== 'done')
  const counts = {
    todo:        tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done:        tasks.filter(t => t.status === 'done').length,
  }
  const total = tasks.length
  const donePercent = total ? Math.round((counts.done / total) * 100) : 0

  // Upcoming — active tasks with due date, sorted nearest first
  const upcoming = active
    .filter(t => t.due_date)
    .map(t => ({ ...t, _diff: daysUntil(t.due_date) }))
    .sort((a, b) => a._diff - b._diff)
    .slice(0, 6)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

      {/* New task button */}
      <button onClick={onNewTask} style={{
        width: '100%', background: 'rgba(0,180,255,0.14)',
        border: '1px solid rgba(0,180,255,0.38)', borderRadius: '10px',
        padding: '0.7rem', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600,
        cursor: 'pointer', fontFamily: 'sans-serif',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        transition: 'all 0.2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,180,255,0.22)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(0,180,255,0.12)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,180,255,0.14)'; e.currentTarget.style.boxShadow = 'none' }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
        New task
      </button>

      {/* Stats */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.75rem' }}>Overview</p>

        {[
          { key: 'todo',        label: 'To Do',      value: counts.todo,        color: 'var(--text-muted)' },
          { key: 'in_progress', label: 'In Progress', value: counts.in_progress, color: 'var(--warning)' },
          { key: 'done',        label: 'Done',        value: counts.done,        color: 'var(--success)' },
        ].map(s => (
          <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color, flexShrink: 0 }}/>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{s.label}</span>
            </div>
            <span style={{ color: s.color, fontSize: '0.88rem', fontWeight: 700 }}>{s.value}</span>
          </div>
        ))}

        {/* Progress bar */}
        {total > 0 && (
          <div style={{ marginTop: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Progress</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--success)', fontWeight: 600 }}>{donePercent}%</span>
            </div>
            <div style={{ height: '4px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '99px',
                background: 'linear-gradient(90deg, var(--accent), var(--success))',
                width: `${donePercent}%`, transition: 'width 0.5s ease',
              }}/>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming due dates */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Due soon</p>
        </div>

        {upcoming.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', padding: '1.25rem', margin: 0 }}>
            No upcoming due dates
          </p>
        ) : (
          <div style={{ padding: '0.5rem' }}>
            {upcoming.map(t => {
              const diff = t._diff
              const isOverdue = diff < 0
              const isUrgent = diff >= 0 && diff <= 2
              const diffLabel = isOverdue
                ? `${Math.abs(diff)}d overdue`
                : diff === 0 ? 'Today'
                : diff === 1 ? 'Tomorrow'
                : `${diff}d left`

              const pc = PRIORITY_CONFIG[t.priority]

              return (
                <div key={t.id} style={{
                  padding: '0.6rem 0.65rem', borderRadius: '8px', marginBottom: '0.3rem',
                  background: isOverdue ? 'rgba(248,113,113,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isOverdue ? 'rgba(248,113,113,0.2)' : 'var(--border)'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.4rem' }}>
                    <span style={{
                      color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 500,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                    }}>{t.title}</span>
                    <span style={{
                      fontSize: '0.62rem', fontWeight: 700, flexShrink: 0,
                      color: isOverdue ? 'var(--danger)' : isUrgent ? 'var(--warning)' : 'var(--text-muted)',
                      background: isOverdue ? 'rgba(248,113,113,0.12)' : isUrgent ? 'rgba(245,158,11,0.12)' : 'rgba(74,74,122,0.15)',
                      padding: '2px 6px', borderRadius: '99px',
                    }}>{diffLabel}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '0.25rem' }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: pc.color, flexShrink: 0 }}/>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>{fmtDate(t.due_date)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Done count pill */}
      {counts.done > 0 && (
        <div style={{
          background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: '10px', padding: '0.75rem 1rem',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
          </svg>
          <span style={{ color: 'var(--success)', fontSize: '0.78rem', fontWeight: 500 }}>
            {counts.done} task{counts.done !== 1 ? 's' : ''} completed
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function sortTasks(tasks) {
  // Filter out done, split todo and in_progress
  const todo = tasks
    .filter(t => t.status === 'todo')
    .sort((a, b) => {
      // No due date goes to bottom
      if (!a.due_date && !b.due_date) return 0
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return new Date(a.due_date) - new Date(b.due_date)
    })

  const inProgress = tasks
    .filter(t => t.status === 'in_progress')
    .sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return new Date(a.due_date) - new Date(b.due_date)
    })

  return { todo, inProgress }
}

export default function TaskTrackerPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser]                 = useState(null)
  const [tasks, setTasks]               = useState([])
  const [tasksLoading, setTasksLoading] = useState(true)
  const [modalOpen, setModalOpen]       = useState(false)
  const [editTask, setEditTask]         = useState(null)
  const [search, setSearch]             = useState('')
  const [filterPriority, setFilterPriority] = useState('all')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchTasks = useCallback(async () => {
    setTasksLoading(true)
    const res = await fetch('/api/tasks')
    if (res.ok) setTasks(await res.json())
    setTasksLoading(false)
  }, [])

  useEffect(() => { if (user) fetchTasks() }, [user, fetchTasks])

  async function handleCreate(data) {
    const res = await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) { setModalOpen(false); fetchTasks() }
  }

  async function handleUpdate(data) {
    await fetch('/api/tasks', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editTask.id, ...data }),
    })
    setEditTask(null); fetchTasks()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this task?')) return
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function handleStatusChange(id, status) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    await fetch('/api/tasks', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Filter by search + priority (only on active tasks)
  const filteredTasks = tasks.filter(t => {
    if (t.status === 'done') return false
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const { todo, inProgress } = sortTasks(filteredTasks)

  const SectionHeader = ({ label, color, count }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.6rem', marginTop: '0.25rem' }}>
      <div style={{ width: '3px', height: '16px', borderRadius: '99px', background: color }}/>
      <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600 }}>{label}</span>
      <span style={{
        fontSize: '0.68rem', fontWeight: 700, padding: '1px 7px', borderRadius: '99px',
        background: `${color}18`, border: `1px solid ${color}40`, color,
      }}>{count}</span>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'sans-serif' }}>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(0,180,255,0.02) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(0,180,255,0.02) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }}/>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.25rem', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.78rem' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Tools
            </a>
            <span style={{ color: 'var(--border)' }}>·</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '5px',
                background: 'rgba(0,180,255,0.12)', border: '1px solid rgba(0,180,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
              </div>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.88rem' }}>Task Tracker</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{user.email}</span>}
            <button onClick={handleSignOut} style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
              padding: '0.3rem 0.7rem', color: 'var(--text-muted)', fontSize: '0.75rem',
              cursor: 'pointer', fontFamily: 'sans-serif', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-muted)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >Sign out</button>
          </div>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '1.25rem', alignItems: 'start' }}>

          {/* ── Left: Task List ── */}
          <div>
            {/* Search + filter bar */}
            <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '160px', position: 'relative' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ ...inputCss, paddingLeft: '2rem', fontSize: '0.82rem' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,180,255,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px',
                padding: '0.62rem 0.85rem', color: filterPriority !== 'all' ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: '0.82rem', outline: 'none', cursor: 'pointer', fontFamily: 'sans-serif',
              }}>
                <option value="all">All priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {tasksLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading tasks...</div>
            ) : (todo.length === 0 && inProgress.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 2rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>
                  {tasks.filter(t => t.status !== 'done').length === 0 ? '🎉' : '🔍'}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 0.5rem' }}>
                  {tasks.filter(t => t.status !== 'done').length === 0
                    ? 'All tasks done! Add a new one.'
                    : 'No tasks match your search.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* To Do section */}
                {todo.length > 0 && (
                  <div>
                    <SectionHeader label="To Do" color="var(--text-muted)" count={todo.length}/>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      {todo.map(task => (
                        <TaskCard key={task.id} task={task} onEdit={setEditTask} onDelete={handleDelete} onStatusChange={handleStatusChange}/>
                      ))}
                    </div>
                  </div>
                )}

                {/* In Progress section */}
                {inProgress.length > 0 && (
                  <div>
                    <SectionHeader label="In Progress" color="var(--warning)" count={inProgress.length}/>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      {inProgress.map(task => (
                        <TaskCard key={task.id} task={task} onEdit={setEditTask} onDelete={handleDelete} onStatusChange={handleStatusChange}/>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Sidebar Widget ── */}
          <div style={{ position: 'sticky', top: '68px' }}>
            <SidebarWidget tasks={tasks} onNewTask={() => { setEditTask(null); setModalOpen(true) }}/>
          </div>
        </div>
      </main>

      {(modalOpen || editTask) && (
        <TaskModal
          task={editTask}
          onClose={() => { setModalOpen(false); setEditTask(null) }}
          onSave={editTask ? handleUpdate : handleCreate}
        />
      )}
    </div>
  )
}
