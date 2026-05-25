'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG = {
  event:    { label: 'Event',    color: '#00b4ff', icon: '📅' },
  birthday: { label: 'Birthday', color: '#f472b6', icon: '🎂' },
  holiday:  { label: 'Holiday',  color: '#10b981', icon: '🌴' },
  reminder: { label: 'Reminder', color: '#f59e0b', icon: '🔔' },
  meeting:  { label: 'Meeting',  color: '#a78bfa', icon: '👥' },
  deadline: { label: 'Deadline', color: '#f87171', icon: '🚨' },
}

const REPEAT_OPTIONS = [
  { value: 'none',    label: 'No repeat' },
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly' },
]

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const inputCss = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.03)', border: '1px solid #1a1a3e',
  borderRadius: '8px', padding: '0.65rem 0.9rem',
  color: '#e0e0ff', fontSize: '0.88rem', outline: 'none',
  fontFamily: 'sans-serif', transition: 'border-color 0.2s',
}

const labelCss = {
  display: 'block', color: '#4a4a7a', fontSize: '0.7rem', fontWeight: 600,
  marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

function toDateStr(date) {
  return date.toISOString().slice(0, 10)
}

function todayStr() {
  return toDateStr(new Date())
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0)
  const target = new Date(dateStr); target.setHours(0,0,0,0)
  return Math.ceil((target - today) / 86400000)
}

function fmtDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Get all dates an event appears on (including repeats) within a month
function getEventDatesInMonth(event, year, month) {
  const dates = []
  const base = new Date(event.date + 'T00:00:00')
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)

  if (event.repeat === 'none') {
    if (base >= monthStart && base <= monthEnd) dates.push(event.date)
    return dates
  }

  let cursor = new Date(base)
  // Move cursor to start of month if base is before
  while (cursor < monthStart) {
    if (event.repeat === 'daily')   cursor.setDate(cursor.getDate() + 1)
    else if (event.repeat === 'weekly')  cursor.setDate(cursor.getDate() + 7)
    else if (event.repeat === 'monthly') cursor.setMonth(cursor.getMonth() + 1)
    else if (event.repeat === 'yearly')  cursor.setFullYear(cursor.getFullYear() + 1)
    else break
  }

  const limit = 400
  let i = 0
  while (cursor <= monthEnd && i < limit) {
    dates.push(toDateStr(cursor))
    if (event.repeat === 'daily')   cursor.setDate(cursor.getDate() + 1)
    else if (event.repeat === 'weekly')  cursor.setDate(cursor.getDate() + 7)
    else if (event.repeat === 'monthly') cursor.setMonth(cursor.getMonth() + 1)
    else if (event.repeat === 'yearly')  cursor.setFullYear(cursor.getFullYear() + 1)
    else break
    i++
  }
  return dates
}

// Build a map: dateStr → [events]
function buildDateMap(events, year, month) {
  const map = {}
  events.forEach(ev => {
    const dates = getEventDatesInMonth(ev, year, month)
    dates.forEach(d => {
      if (!map[d]) map[d] = []
      map[d].push(ev)
    })
  })
  return map
}

// Get upcoming events sorted by nearest date (next 60 days)
function getUpcomingEvents(events) {
  const today = todayStr()
  const result = []

  events.forEach(ev => {
    if (ev.repeat === 'none') {
      const diff = daysUntil(ev.date)
      if (diff >= 0 && diff <= 365) result.push({ ...ev, _displayDate: ev.date, _daysUntil: diff })
    } else {
      // Find next occurrence
      let cursor = new Date(ev.date + 'T00:00:00')
      const todayDate = new Date(today + 'T00:00:00')
      const limit = new Date(todayDate); limit.setFullYear(limit.getFullYear() + 1)
      let i = 0
      while (cursor < todayDate && cursor < limit && i < 500) {
        if (ev.repeat === 'daily')   cursor.setDate(cursor.getDate() + 1)
        else if (ev.repeat === 'weekly')  cursor.setDate(cursor.getDate() + 7)
        else if (ev.repeat === 'monthly') cursor.setMonth(cursor.getMonth() + 1)
        else if (ev.repeat === 'yearly')  cursor.setFullYear(cursor.getFullYear() + 1)
        else break
        i++
      }
      const diff = daysUntil(toDateStr(cursor))
      if (diff >= 0 && diff <= 365) result.push({ ...ev, _displayDate: toDateStr(cursor), _daysUntil: diff })
    }
  })

  return result.sort((a, b) => a._daysUntil - b._daysUntil)
}

// ─── EventModal ───────────────────────────────────────────────────────────────

function EventModal({ event, defaultDate, onClose, onSave, onDelete }) {
  const [title, setTitle]       = useState(event?.title ?? '')
  const [desc, setDesc]         = useState(event?.description ?? '')
  const [date, setDate]         = useState(event?.date ?? defaultDate ?? todayStr())
  const [endDate, setEndDate]   = useState(event?.end_date ?? '')
  const [time, setTime]         = useState(event?.time?.slice(0,5) ?? '')
  const [category, setCategory] = useState(event?.category ?? 'event')
  const [repeat, setRepeat]     = useState(event?.repeat ?? 'none')
  const [allDay, setAllDay]     = useState(event?.all_day ?? true)

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSave() {
    if (!title.trim() || !date) return
    onSave({
      title: title.trim(),
      description: desc.trim() || null,
      date,
      end_date: endDate || null,
      time: allDay ? null : (time || null),
      category,
      repeat,
      color: CATEGORY_CONFIG[category].color,
      all_day: allDay,
    })
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0d0d1a', border: '1px solid #1a1a3e', borderRadius: '16px',
        padding: '1.75rem', width: '100%', maxWidth: '460px',
        boxShadow: '0 8px 60px rgba(0,0,0,0.8)', maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem' }}>
          <h2 style={{ color: '#e0e0ff', fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
            {event ? 'Edit event' : 'New event'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4a4a7a', cursor: 'pointer', padding: '4px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {/* Title */}
          <div>
            <label style={labelCss}>Title *</label>
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Event name..." style={inputCss}
              onFocus={e => e.target.style.borderColor = 'rgba(0,180,255,0.5)'}
              onBlur={e => e.target.style.borderColor = '#1a1a3e'}
            />
          </div>

          {/* Category */}
          <div>
            <label style={labelCss}>Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                <button key={key} onClick={() => setCategory(key)} style={{
                  padding: '0.35rem 0.75rem', borderRadius: '99px', fontSize: '0.78rem',
                  fontWeight: 500, cursor: 'pointer', fontFamily: 'sans-serif',
                  background: category === key ? `${cfg.color}20` : 'transparent',
                  border: `1px solid ${category === key ? cfg.color + '60' : '#1a1a3e'}`,
                  color: category === key ? cfg.color : '#4a4a7a',
                  transition: 'all 0.15s',
                }}>
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelCss}>Start date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                style={{ ...inputCss, colorScheme: 'dark' }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,180,255,0.5)'}
                onBlur={e => e.target.style.borderColor = '#1a1a3e'}
              />
            </div>
            <div>
              <label style={labelCss}>End date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                style={{ ...inputCss, colorScheme: 'dark' }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,180,255,0.5)'}
                onBlur={e => e.target.style.borderColor = '#1a1a3e'}
              />
            </div>
          </div>

          {/* All day toggle + time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
              <div onClick={() => setAllDay(!allDay)} style={{
                width: '36px', height: '20px', borderRadius: '10px', position: 'relative',
                background: allDay ? 'rgba(0,180,255,0.3)' : '#1a1a3e',
                border: `1px solid ${allDay ? 'rgba(0,180,255,0.5)' : '#2a2a4e'}`,
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                <div style={{
                  position: 'absolute', top: '2px',
                  left: allDay ? '18px' : '2px',
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: allDay ? '#00b4ff' : '#4a4a7a',
                  transition: 'all 0.2s',
                }}/>
              </div>
              <span style={{ color: '#4a4a7a', fontSize: '0.82rem' }}>All day</span>
            </label>
            {!allDay && (
              <div style={{ flex: 1 }}>
                <input type="time" value={time} onChange={e => setTime(e.target.value)}
                  style={{ ...inputCss, colorScheme: 'dark' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,180,255,0.5)'}
                  onBlur={e => e.target.style.borderColor = '#1a1a3e'}
                />
              </div>
            )}
          </div>

          {/* Repeat */}
          <div>
            <label style={labelCss}>Repeat</label>
            <select value={repeat} onChange={e => setRepeat(e.target.value)} style={{
              ...inputCss, cursor: 'pointer', colorScheme: 'dark',
            }}>
              {REPEAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label style={labelCss}>Notes</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Add notes... (optional)" rows={2}
              style={{ ...inputCss, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = 'rgba(0,180,255,0.5)'}
              onBlur={e => e.target.style.borderColor = '#1a1a3e'}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.25rem' }}>
            {event && (
              <button onClick={() => onDelete(event.id)} style={{
                background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
                borderRadius: '8px', padding: '0.7rem 0.9rem',
                color: '#f87171', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'sans-serif',
              }}>Delete</button>
            )}
            <button onClick={onClose} style={{
              flex: 1, background: 'transparent', border: '1px solid #1a1a3e',
              borderRadius: '8px', padding: '0.7rem', color: '#4a4a7a',
              fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'sans-serif',
            }}>Cancel</button>
            <button onClick={handleSave} disabled={!title.trim() || !date} style={{
              flex: 2,
              background: (title.trim() && date) ? 'rgba(0,180,255,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${(title.trim() && date) ? 'rgba(0,180,255,0.4)' : '#1a1a3e'}`,
              borderRadius: '8px', padding: '0.7rem',
              color: (title.trim() && date) ? '#00b4ff' : '#4a4a7a',
              fontSize: '0.88rem', fontWeight: 600,
              cursor: (title.trim() && date) ? 'pointer' : 'not-allowed',
              fontFamily: 'sans-serif', transition: 'all 0.2s',
            }}>
              {event ? 'Save changes' : 'Add event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const router = useRouter()
  const supabase = createClient()

  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [tab, setTab]     = useState('calendar') // 'calendar' | 'events'
  const [events, setEvents]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [user, setUser]               = useState(null)
  const [modalOpen, setModalOpen]     = useState(false)
  const [editEvent, setEditEvent]     = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedDayEvents, setSelectedDayEvents] = useState([])

  // Form state for Tab 2
  const [formTitle, setFormTitle]       = useState('')
  const [formDesc, setFormDesc]         = useState('')
  const [formDate, setFormDate]         = useState(todayStr())
  const [formEndDate, setFormEndDate]   = useState('')
  const [formTime, setFormTime]         = useState('')
  const [formCategory, setFormCategory] = useState('event')
  const [formRepeat, setFormRepeat]     = useState('none')
  const [formAllDay, setFormAllDay]     = useState(true)
  const [formLoading, setFormLoading]   = useState(false)
  const [formSuccess, setFormSuccess]   = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
  }, [])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    // Fetch wider range to support repeating events
    const res = await fetch('/api/calendar')
    if (res.ok) setEvents(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  // Calendar grid data
  const daysInMonth  = getDaysInMonth(year, month)
  const firstDay     = getFirstDayOfMonth(year, month)
  const dateMap      = buildDateMap(events, year, month)
  const upcomingEvs  = getUpcomingEvents(events)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  function handleDayClick(dayNum) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`
    setSelectedDate(dateStr)
    setSelectedDayEvents(dateMap[dateStr] || [])
  }

  async function handleSaveEvent(data) {
    if (editEvent) {
      await fetch('/api/calendar', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editEvent.id, ...data }),
      })
    } else {
      await fetch('/api/calendar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    }
    setModalOpen(false); setEditEvent(null)
    fetchEvents()
  }

  async function handleDeleteEvent(id) {
    await fetch(`/api/calendar?id=${id}`, { method: 'DELETE' })
    setModalOpen(false); setEditEvent(null)
    setSelectedDate(null)
    fetchEvents()
  }

  async function handleFormSubmit(e) {
    e.preventDefault()
    if (!formTitle.trim() || !formDate) return
    setFormLoading(true)
    await fetch('/api/calendar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: formTitle.trim(),
        description: formDesc.trim() || null,
        date: formDate,
        end_date: formEndDate || null,
        time: formAllDay ? null : (formTime || null),
        category: formCategory,
        repeat: formRepeat,
        color: CATEGORY_CONFIG[formCategory].color,
        all_day: formAllDay,
      }),
    })
    setFormLoading(false); setFormSuccess(true)
    setFormTitle(''); setFormDesc(''); setFormDate(todayStr())
    setFormEndDate(''); setFormTime(''); setFormRepeat('none'); setFormAllDay(true)
    fetchEvents()
    setTimeout(() => setFormSuccess(false), 2500)
  }

  const today = todayStr()

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: 'sans-serif' }}>
      {/* Grid bg */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(0,180,255,0.02) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(0,180,255,0.02) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }}/>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(13,13,26,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1a1a3e',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.25rem', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: '#4a4a7a', fontSize: '0.78rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Tools
            </a>
            <span style={{ color: '#1a1a3e' }}>·</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '5px',
                background: 'rgba(0,180,255,0.12)', border: '1px solid rgba(0,180,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00b4ff" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <span style={{ color: '#e0e0ff', fontWeight: 600, fontSize: '0.88rem' }}>Calendar</span>
            </div>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '3px' }}>
            {[['calendar','📅 Calendar'],['events','➕ Add Event']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                padding: '0.35rem 0.9rem', borderRadius: '6px', fontSize: '0.78rem',
                fontWeight: 500, cursor: 'pointer', fontFamily: 'sans-serif',
                background: tab === key ? 'rgba(0,180,255,0.15)' : 'transparent',
                border: `1px solid ${tab === key ? 'rgba(0,180,255,0.35)' : 'transparent'}`,
                color: tab === key ? '#00b4ff' : '#4a4a7a', transition: 'all 0.15s',
              }}>{label}</button>
            ))}
          </div>
          {user && (
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} style={{
              background: 'none', border: '1px solid #1a1a3e', borderRadius: '6px',
              padding: '0.3rem 0.7rem', color: '#4a4a7a', fontSize: '0.75rem',
              cursor: 'pointer', fontFamily: 'sans-serif',
            }}>Sign out</button>
          )}
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>

        {/* ── TAB 1: CALENDAR VIEW ── */}
        {tab === 'calendar' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.25rem', alignItems: 'start' }}>

            {/* Calendar */}
            <div style={{ background: '#0d0d1a', border: '1px solid #1a1a3e', borderRadius: '14px', overflow: 'hidden' }}>
              {/* Month nav */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #1a1a3e' }}>
                <button onClick={prevMonth} style={{ background: 'none', border: '1px solid #1a1a3e', borderRadius: '6px', padding: '0.35rem 0.65rem', color: '#4a4a7a', cursor: 'pointer', fontSize: '0.9rem' }}>‹</button>
                <h2 style={{ color: '#e0e0ff', fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  {MONTHS[month]} {year}
                </h2>
                <button onClick={nextMonth} style={{ background: 'none', border: '1px solid #1a1a3e', borderRadius: '6px', padding: '0.35rem 0.65rem', color: '#4a4a7a', cursor: 'pointer', fontSize: '0.9rem' }}>›</button>
              </div>

              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #1a1a3e' }}>
                {DAYS.map(d => (
                  <div key={d} style={{ textAlign: 'center', padding: '0.6rem 0', color: '#4a4a7a', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {/* Empty cells */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} style={{ minHeight: '80px', borderRight: '1px solid #1a1a3e', borderBottom: '1px solid #1a1a3e', opacity: 0.3 }}/>
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1
                  const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`
                  const dayEvents = dateMap[dateStr] || []
                  const isToday = dateStr === today
                  const isSelected = dateStr === selectedDate
                  const col = (firstDay + i) % 7

                  return (
                    <div key={dayNum}
                      onClick={() => handleDayClick(dayNum)}
                      style={{
                        minHeight: '80px', padding: '0.4rem',
                        borderRight: col === 6 ? 'none' : '1px solid #1a1a3e',
                        borderBottom: '1px solid #1a1a3e',
                        background: isSelected ? 'rgba(0,180,255,0.06)' : 'transparent',
                        cursor: 'pointer', transition: 'background 0.15s',
                        position: 'relative',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '24px', height: '24px', borderRadius: '50%', marginBottom: '4px',
                        background: isToday ? '#00b4ff' : 'transparent',
                        color: isToday ? '#0a0a0f' : isSelected ? '#00b4ff' : col === 0 ? '#f87171' : '#e0e0ff',
                        fontSize: '0.78rem', fontWeight: isToday ? 700 : 400,
                      }}>{dayNum}</div>

                      {/* Event dots */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {dayEvents.slice(0, 3).map((ev, idx) => (
                          <div key={idx} style={{
                            fontSize: '0.65rem', padding: '1px 4px', borderRadius: '3px',
                            background: `${ev.color}20`, color: ev.color,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            lineHeight: 1.4,
                          }}>
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div style={{ fontSize: '0.6rem', color: '#4a4a7a' }}>+{dayEvents.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Selected day events */}
              {selectedDate && (
                <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #1a1a3e' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ color: '#e0e0ff', fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>
                      {fmtDate(selectedDate)}
                    </h3>
                    <button onClick={() => { setEditEvent(null); setModalOpen(true) }} style={{
                      background: 'rgba(0,180,255,0.12)', border: '1px solid rgba(0,180,255,0.3)',
                      borderRadius: '6px', padding: '0.3rem 0.7rem',
                      color: '#00b4ff', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'sans-serif',
                    }}>+ Add</button>
                  </div>
                  {selectedDayEvents.length === 0 ? (
                    <p style={{ color: '#4a4a7a', fontSize: '0.8rem', margin: 0 }}>No events. Click + Add to create one.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {selectedDayEvents.map(ev => {
                        const cfg = CATEGORY_CONFIG[ev.category]
                        return (
                          <div key={ev.id} onClick={() => { setEditEvent(ev); setModalOpen(true) }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.6rem',
                              padding: '0.55rem 0.75rem', borderRadius: '8px',
                              background: `${ev.color}10`, border: `1px solid ${ev.color}30`,
                              cursor: 'pointer', transition: 'all 0.15s',
                            }}
                          >
                            <span style={{ fontSize: '0.85rem' }}>{cfg.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: '#e0e0ff', fontSize: '0.82rem', fontWeight: 500 }}>{ev.title}</div>
                              {ev.time && <div style={{ color: '#4a4a7a', fontSize: '0.72rem' }}>{ev.time.slice(0,5)}</div>}
                            </div>
                            {ev.repeat !== 'none' && (
                              <span style={{ fontSize: '0.65rem', color: ev.color, background: `${ev.color}15`, padding: '1px 5px', borderRadius: '99px' }}>
                                ↻ {ev.repeat}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar — upcoming events */}
            <div style={{ background: '#0d0d1a', border: '1px solid #1a1a3e', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.1rem', borderBottom: '1px solid #1a1a3e' }}>
                <h3 style={{ color: '#e0e0ff', fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>Upcoming</h3>
                <p style={{ color: '#4a4a7a', fontSize: '0.72rem', margin: '0.2rem 0 0' }}>Next occurrences</p>
              </div>

              <div style={{ maxHeight: '600px', overflowY: 'auto', padding: '0.75rem' }}>
                {loading ? (
                  <p style={{ color: '#4a4a7a', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>Loading...</p>
                ) : upcomingEvs.length === 0 ? (
                  <p style={{ color: '#4a4a7a', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>No upcoming events</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {upcomingEvs.map((ev, idx) => {
                      const cfg = CATEGORY_CONFIG[ev.category]
                      const diff = ev._daysUntil
                      const diffLabel = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `In ${diff} days`
                      const isUrgent = diff <= 3

                      return (
                        <div key={`${ev.id}-${idx}`}
                          onClick={() => { setEditEvent(ev); setModalOpen(true) }}
                          style={{
                            padding: '0.65rem 0.75rem', borderRadius: '8px',
                            background: `${ev.color}08`, border: `1px solid ${ev.color}25`,
                            cursor: 'pointer', transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = ev.color + '50'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = ev.color + '25'}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>{cfg.icon}</span>
                              <span style={{ color: '#e0e0ff', fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {ev.title}
                              </span>
                            </div>
                            <span style={{
                              fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                              color: isUrgent ? '#f87171' : '#4a4a7a',
                              background: isUrgent ? 'rgba(248,113,113,0.1)' : 'rgba(74,74,122,0.15)',
                              padding: '2px 6px', borderRadius: '99px',
                            }}>{diffLabel}</span>
                          </div>
                          <div style={{ color: '#4a4a7a', fontSize: '0.7rem', marginTop: '0.25rem', paddingLeft: '1.4rem' }}>
                            {fmtDate(ev._displayDate)}
                            {ev.repeat !== 'none' && <span style={{ marginLeft: '4px', color: ev.color }}>↻</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: ADD EVENT ── */}
        {tab === 'events' && (
          <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <div style={{ background: '#0d0d1a', border: '1px solid #1a1a3e', borderRadius: '14px', padding: '1.75rem' }}>
              <h2 style={{ color: '#e0e0ff', fontSize: '1.05rem', fontWeight: 600, margin: '0 0 1.5rem', letterSpacing: '-0.01em' }}>
                Add new event
              </h2>

              <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={labelCss}>Title *</label>
                  <input value={formTitle} onChange={e => setFormTitle(e.target.value)} required
                    placeholder="Event name..." style={inputCss}
                    onFocus={e => e.target.style.borderColor = 'rgba(0,180,255,0.5)'}
                    onBlur={e => e.target.style.borderColor = '#1a1a3e'}
                  />
                </div>

                {/* Category */}
                <div>
                  <label style={labelCss}>Category</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <button type="button" key={key} onClick={() => setFormCategory(key)} style={{
                        padding: '0.35rem 0.75rem', borderRadius: '99px', fontSize: '0.78rem',
                        fontWeight: 500, cursor: 'pointer', fontFamily: 'sans-serif',
                        background: formCategory === key ? `${cfg.color}20` : 'transparent',
                        border: `1px solid ${formCategory === key ? cfg.color + '60' : '#1a1a3e'}`,
                        color: formCategory === key ? cfg.color : '#4a4a7a', transition: 'all 0.15s',
                      }}>
                        {cfg.icon} {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={labelCss}>Start date *</label>
                    <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} required
                      style={{ ...inputCss, colorScheme: 'dark' }}
                      onFocus={e => e.target.style.borderColor = 'rgba(0,180,255,0.5)'}
                      onBlur={e => e.target.style.borderColor = '#1a1a3e'}
                    />
                  </div>
                  <div>
                    <label style={labelCss}>End date</label>
                    <input type="date" value={formEndDate} onChange={e => setFormEndDate(e.target.value)}
                      style={{ ...inputCss, colorScheme: 'dark' }}
                      onFocus={e => e.target.style.borderColor = 'rgba(0,180,255,0.5)'}
                      onBlur={e => e.target.style.borderColor = '#1a1a3e'}
                    />
                  </div>
                </div>

                {/* All day + time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                    <div onClick={() => setFormAllDay(!formAllDay)} style={{
                      width: '36px', height: '20px', borderRadius: '10px', position: 'relative',
                      background: formAllDay ? 'rgba(0,180,255,0.3)' : '#1a1a3e',
                      border: `1px solid ${formAllDay ? 'rgba(0,180,255,0.5)' : '#2a2a4e'}`,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      <div style={{
                        position: 'absolute', top: '2px', left: formAllDay ? '18px' : '2px',
                        width: '14px', height: '14px', borderRadius: '50%',
                        background: formAllDay ? '#00b4ff' : '#4a4a7a', transition: 'all 0.2s',
                      }}/>
                    </div>
                    <span style={{ color: '#4a4a7a', fontSize: '0.82rem' }}>All day</span>
                  </label>
                  {!formAllDay && (
                    <div style={{ flex: 1 }}>
                      <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)}
                        style={{ ...inputCss, colorScheme: 'dark' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(0,180,255,0.5)'}
                        onBlur={e => e.target.style.borderColor = '#1a1a3e'}
                      />
                    </div>
                  )}
                </div>

                {/* Repeat */}
                <div>
                  <label style={labelCss}>Repeat</label>
                  <select value={formRepeat} onChange={e => setFormRepeat(e.target.value)}
                    style={{ ...inputCss, cursor: 'pointer', colorScheme: 'dark' }}>
                    {REPEAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label style={labelCss}>Notes</label>
                  <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)}
                    placeholder="Add notes... (optional)" rows={3}
                    style={{ ...inputCss, resize: 'vertical', lineHeight: 1.6 }}
                    onFocus={e => e.target.style.borderColor = 'rgba(0,180,255,0.5)'}
                    onBlur={e => e.target.style.borderColor = '#1a1a3e'}
                  />
                </div>

                {formSuccess && (
                  <div style={{
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: '8px', padding: '0.65rem 0.9rem',
                    color: '#10b981', fontSize: '0.85rem', textAlign: 'center',
                  }}>✓ Event added successfully!</div>
                )}

                <button type="submit" disabled={formLoading || !formTitle.trim()} style={{
                  background: 'rgba(0,180,255,0.15)', border: '1px solid rgba(0,180,255,0.4)',
                  borderRadius: '8px', padding: '0.75rem',
                  color: '#00b4ff', fontSize: '0.9rem', fontWeight: 600,
                  cursor: formLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'sans-serif', opacity: formLoading ? 0.7 : 1, transition: 'all 0.2s',
                }}>
                  {formLoading ? 'Adding...' : '+ Add Event'}
                </button>
              </form>
            </div>

            {/* Recent events list */}
            {events.length > 0 && (
              <div style={{ marginTop: '1.25rem', background: '#0d0d1a', border: '1px solid #1a1a3e', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #1a1a3e' }}>
                  <h3 style={{ color: '#e0e0ff', fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>All events ({events.length})</h3>
                </div>
                <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  {events.map(ev => {
                    const cfg = CATEGORY_CONFIG[ev.category]
                    return (
                      <div key={ev.id}
                        onClick={() => { setEditEvent(ev); setModalOpen(true) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.75rem 1.25rem', borderBottom: '1px solid #1a1a3e',
                          cursor: 'pointer', transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontSize: '1rem' }}>{cfg.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#e0e0ff', fontSize: '0.82rem', fontWeight: 500 }}>{ev.title}</div>
                          <div style={{ color: '#4a4a7a', fontSize: '0.72rem', marginTop: '1px' }}>
                            {fmtDate(ev.date)}
                            {ev.repeat !== 'none' && <span style={{ marginLeft: '6px', color: ev.color }}>↻ {ev.repeat}</span>}
                          </div>
                        </div>
                        <span style={{
                          fontSize: '0.65rem', padding: '2px 7px', borderRadius: '99px',
                          background: `${ev.color}15`, color: ev.color,
                        }}>{cfg.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Event modal */}
      {(modalOpen || editEvent) && (
        <EventModal
          event={editEvent}
          defaultDate={selectedDate}
          onClose={() => { setModalOpen(false); setEditEvent(null) }}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  )
}
