'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG = {
  it_hardware:  { label: 'IT Hardware',  icon: '💻', color: '#00b4ff' },
  non_it:       { label: 'Non-IT',       icon: '🪑', color: '#a78bfa' },
  components:   { label: 'Components',   icon: '🔌', color: '#f59e0b' },
  consumables:  { label: 'Consumables',  icon: '🖨️', color: '#10b981' },
  software:     { label: 'Software',     icon: '💿', color: '#f472b6' },
  asset_loan:   { label: 'Asset Loan',   icon: '🔑', color: '#fb923c' },
  general:      { label: 'General',      icon: '📦', color: '#6b7280' },
}

const CONDITION_CONFIG = {
  excellent: { label: 'Excellent', color: '#10b981' },
  good:      { label: 'Good',      color: '#00b4ff' },
  fair:      { label: 'Fair',      color: '#f59e0b' },
  poor:      { label: 'Poor',      color: '#f87171' },
}

const STATUS_CONFIG = {
  pending:   { label: 'Pending',     color: '#6b7280' },
  approved:  { label: 'Approved',    color: '#00b4ff' },
  active:    { label: 'Checked Out', color: '#f59e0b' },
  returned:  { label: 'Returned',    color: '#10b981' },
  cancelled: { label: 'Cancelled',   color: '#f87171' },
}

const SIDEBAR_ITEMS = [
  { key: 'all',        label: 'All Assets',  icon: '⊞' },
  { key: 'it_hardware', label: 'IT Hardware', icon: '💻' },
  { key: 'non_it',     label: 'Non-IT',      icon: '🪑' },
  { key: 'components', label: 'Components',  icon: '🔌' },
  { key: 'consumables',label: 'Consumables', icon: '🖨️' },
  { key: 'software',   label: 'Software',    icon: '💿' },
  { key: 'asset_loan', label: 'Asset Loan',  icon: '🔑' },
  { key: 'general',    label: 'General',     icon: '📦' },
  { key: 'mybookings', label: 'My Bookings', icon: '📋', divider: true },
]

const inputCss = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(128,128,128,0.06)', border: '1px solid var(--border)',
  borderRadius: '8px', padding: '0.65rem 0.9rem',
  color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none',
  fontFamily: 'sans-serif', transition: 'border-color 0.2s',
}

const labelCss = {
  display: 'block', color: 'var(--text-muted)', fontSize: '0.7rem',
  fontWeight: 600, marginBottom: '0.35rem',
  textTransform: 'uppercase', letterSpacing: '0.06em',
}

function fmtDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function todayStr() { return new Date().toISOString().slice(0, 10) }

// ─── AssetModal ───────────────────────────────────────────────────────────────

function AssetModal({ asset, onClose, onSave, onDelete }) {
  const [name, setName]         = useState(asset?.name ?? '')
  const [desc, setDesc]         = useState(asset?.description ?? '')
  const [category, setCategory] = useState(asset?.category ?? 'it_hardware')
  const [quantity, setQuantity] = useState(asset?.quantity ?? 1)
  const [inUse, setInUse]       = useState(asset?.in_use ?? 0)
  const [inRepair, setInRepair] = useState(asset?.in_repair ?? 0)
  const [others, setOthers]     = useState(asset?.others ?? 0)
  const [condition, setCondition] = useState(asset?.condition ?? 'good')
  const [location, setLocation] = useState(asset?.location ?? '')

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const qty = parseInt(quantity) || 0
  const inStore = Math.max(0, qty - parseInt(inUse || 0) - parseInt(inRepair || 0) - parseInt(others || 0))

  function handleSave() {
    if (!name.trim()) return
    onSave({
      name: name.trim(), description: desc.trim() || null,
      category, quantity: qty, condition,
      location: location.trim() || null,
      in_use: parseInt(inUse) || 0,
      in_store: inStore,
      in_repair: parseInt(inRepair) || 0,
      others: parseInt(others) || 0,
      available: inStore,
    })
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>{asset ? 'Edit asset' : 'Add new asset'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label style={labelCss}>Asset name *</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. MacBook Pro 14&quot;" style={inputCss}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}/>
          </div>

          <div>
            <label style={labelCss}>Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                <button key={key} type="button" onClick={() => setCategory(key)} style={{
                  padding: '0.3rem 0.7rem', borderRadius: '99px', fontSize: '0.75rem',
                  fontWeight: 500, cursor: 'pointer', fontFamily: 'sans-serif',
                  background: category === key ? `${cfg.color}20` : 'transparent',
                  border: `1px solid ${category === key ? cfg.color + '60' : 'var(--border)'}`,
                  color: category === key ? cfg.color : 'var(--text-muted)',
                }}>{cfg.icon} {cfg.label}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelCss}>Total quantity *</label>
              <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} style={inputCss}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}/>
            </div>
            <div>
              <label style={labelCss}>Condition</label>
              <select value={condition} onChange={e => setCondition(e.target.value)} style={{ ...inputCss, cursor: 'pointer', colorScheme: 'light dark' }}>
                {Object.entries(CONDITION_CONFIG).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
              </select>
            </div>
          </div>

          {/* Status breakdown */}
          <div>
            <label style={labelCss}>Status breakdown</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {[
                { label: 'In Use', value: inUse, set: setInUse, color: '#f59e0b' },
                { label: 'In Repair', value: inRepair, set: setInRepair, color: '#f87171' },
                { label: 'Others', value: others, set: setOthers, color: '#6b7280' },
              ].map(s => (
                <div key={s.label}>
                  <label style={{ ...labelCss, color: s.color }}>{s.label}</label>
                  <input type="number" min="0" max={qty} value={s.value} onChange={e => s.set(e.target.value)} style={{ ...inputCss, borderColor: s.color + '40' }}
                    onFocus={e => e.target.style.borderColor = s.color} onBlur={e => e.target.style.borderColor = s.color + '40'}/>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--success)' }}>
              In Store (auto): {inStore} units
            </div>
          </div>

          <div>
            <label style={labelCss}>Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. IT Room, Level 3" style={inputCss}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}/>
          </div>

          <div>
            <label style={labelCss}>Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Additional details..." rows={2}
              style={{ ...inputCss, resize: 'vertical', lineHeight: 1.5 }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}/>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.25rem' }}>
            {asset && (
              <button onClick={() => onDelete(asset.id)} style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '8px', padding: '0.7rem 0.9rem', color: 'var(--danger)', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'sans-serif' }}>Delete</button>
            )}
            <button onClick={onClose} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.7rem', color: 'var(--text-muted)', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'sans-serif' }}>Cancel</button>
            <button onClick={handleSave} disabled={!name.trim()} style={{
              flex: 2,
              background: name.trim() ? 'rgba(0,180,255,0.15)' : 'rgba(128,128,128,0.06)',
              border: `1px solid ${name.trim() ? 'rgba(0,180,255,0.4)' : 'var(--border)'}`,
              borderRadius: '8px', padding: '0.7rem',
              color: name.trim() ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '0.88rem', fontWeight: 600,
              cursor: name.trim() ? 'pointer' : 'not-allowed', fontFamily: 'sans-serif',
            }}>{asset ? 'Save changes' : 'Add asset'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── BookingModal ─────────────────────────────────────────────────────────────

function BookingModal({ asset, onClose, onBook }) {
  const [startDate, setStartDate] = useState(todayStr())
  const [endDate, setEndDate]     = useState(todayStr())
  const [quantity, setQuantity]   = useState(1)
  const [purpose, setPurpose]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const cfg = CATEGORY_CONFIG[asset.category]

  async function handleBook() {
    if (endDate < startDate) { setError('End date must be after start date'); return }
    setLoading(true); setError('')
    const err = await onBook({ asset_id: asset.id, start_date: startDate, end_date: endDate, quantity: parseInt(quantity), purpose: purpose.trim() || null })
    if (err) setError(err)
    setLoading(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: '420px', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 600, margin: '0 0 2px' }}>Book asset</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>{cfg.icon} {asset.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{ background: asset.in_store > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(248,113,113,0.08)', border: `1px solid ${asset.in_store > 0 ? 'rgba(16,185,129,0.25)' : 'rgba(248,113,113,0.25)'}`, borderRadius: '8px', padding: '0.6rem 0.9rem', marginBottom: '1rem', fontSize: '0.82rem', color: asset.in_store > 0 ? 'var(--success)' : 'var(--danger)' }}>
          {asset.in_store > 0 ? `✓ ${asset.in_store} unit(s) in store` : '✗ No units available in store'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelCss}>Start date *</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} min={todayStr()} style={{ ...inputCss, colorScheme: 'light dark' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}/>
            </div>
            <div>
              <label style={labelCss}>End date *</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} style={{ ...inputCss, colorScheme: 'light dark' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}/>
            </div>
          </div>
          <div>
            <label style={labelCss}>Quantity</label>
            <input type="number" min="1" max={asset.in_store} value={quantity} onChange={e => setQuantity(e.target.value)} style={inputCss}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}/>
          </div>
          <div>
            <label style={labelCss}>Purpose</label>
            <input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Reason for booking..." style={inputCss}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}/>
          </div>
          {error && <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '8px', padding: '0.6rem 0.9rem', color: 'var(--danger)', fontSize: '0.82rem' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button onClick={onClose} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.7rem', color: 'var(--text-muted)', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'sans-serif' }}>Cancel</button>
            <button onClick={handleBook} disabled={loading || asset.in_store === 0} style={{
              flex: 2, background: 'rgba(0,180,255,0.15)', border: '1px solid rgba(0,180,255,0.4)',
              borderRadius: '8px', padding: '0.7rem', color: 'var(--accent)',
              fontSize: '0.88rem', fontWeight: 600, fontFamily: 'sans-serif',
              cursor: loading || asset.in_store === 0 ? 'not-allowed' : 'pointer',
              opacity: loading || asset.in_store === 0 ? 0.6 : 1,
            }}>{loading ? 'Booking...' : 'Confirm booking'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── AssetCard ────────────────────────────────────────────────────────────────

function AssetCard({ asset, onEdit, onBook }) {
  const cfg = CATEGORY_CONFIG[asset.category]
  const cond = CONDITION_CONFIG[asset.condition]
  const isEmpty = asset.in_store === 0

  const stats = [
    { label: 'In Use',    value: asset.in_use    ?? 0, color: '#f59e0b' },
    { label: 'In Store',  value: asset.in_store  ?? 0, color: '#10b981' },
    { label: 'In Repair', value: asset.in_repair ?? 0, color: '#f87171' },
    { label: 'Others',    value: asset.others    ?? 0, color: '#6b7280' },
  ]

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '12px', overflow: 'hidden', transition: 'all 0.2s',
      display: 'flex', flexDirection: 'column',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color + '60'; e.currentTarget.style.boxShadow = `0 4px 20px ${cfg.color}15` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Card header */}
      <div style={{ padding: '1rem 1rem 0.75rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          {/* Icon */}
          <div style={{
            width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0,
            background: `${cfg.color}15`, border: `1px solid ${cfg.color}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
          }}>{cfg.icon}</div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: 600, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {asset.name}
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '5px' }}>({asset.quantity})</span>
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', color: cfg.color, background: `${cfg.color}12`, border: `1px solid ${cfg.color}25`, padding: '1px 6px', borderRadius: '99px', fontWeight: 500 }}>{cfg.label}</span>
              <span style={{ fontSize: '0.7rem', color: cond.color }}>{cond.label}</span>
              {asset.location && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📍 {asset.location}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Status grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        {stats.map((s, i) => (
          <div key={s.label} style={{
            padding: '0.6rem 0.85rem',
            borderRight: i % 2 === 0 ? '1px solid var(--border)' : 'none',
            borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 500, marginBottom: '2px' }}>{s.label}</div>
            <div style={{ color: s.value > 0 ? s.color : 'var(--text-muted)', fontSize: '1rem', fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ padding: '0.65rem 0.85rem', display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => onBook(asset)} disabled={isEmpty} style={{
          flex: 1, background: isEmpty ? 'rgba(128,128,128,0.06)' : 'rgba(0,180,255,0.1)',
          border: `1px solid ${isEmpty ? 'var(--border)' : 'rgba(0,180,255,0.3)'}`,
          borderRadius: '7px', padding: '0.45rem',
          color: isEmpty ? 'var(--text-muted)' : 'var(--accent)',
          fontSize: '0.75rem', fontWeight: 600, cursor: isEmpty ? 'not-allowed' : 'pointer', fontFamily: 'sans-serif',
        }}>
          {isEmpty ? 'Unavailable' : '+ Book'}
        </button>
        <button onClick={() => onEdit(asset)} style={{
          background: 'rgba(128,128,128,0.06)', border: '1px solid var(--border)',
          borderRadius: '7px', padding: '0.45rem 0.75rem',
          color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'sans-serif',
        }}>Edit</button>
      </div>
    </div>
  )
}

// ─── BookingRow ───────────────────────────────────────────────────────────────

function BookingRow({ booking, onCheckout, onReturn, onCancel }) {
  const sc = STATUS_CONFIG[booking.status]
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '160px' }}>
        <div style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 500 }}>{booking.assets?.name ?? 'Unknown asset'}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2px' }}>
          {fmtDate(booking.start_date)} — {fmtDate(booking.end_date)} · {booking.quantity} unit(s)
        </div>
        {booking.purpose && <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{booking.purpose}</div>}
      </div>
      <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '3px 9px', borderRadius: '99px', background: `${sc.color}15`, border: `1px solid ${sc.color}35`, color: sc.color, whiteSpace: 'nowrap' }}>{sc.label}</span>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        {booking.status === 'approved' && (
          <button onClick={() => onCheckout(booking.id)} style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', padding: '0.35rem 0.7rem', color: 'var(--warning)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'sans-serif' }}>Check out</button>
        )}
        {booking.status === 'active' && (
          <button onClick={() => onReturn(booking.id)} style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', padding: '0.35rem 0.7rem', color: 'var(--success)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'sans-serif' }}>Return</button>
        )}
        {['pending', 'approved'].includes(booking.status) && (
          <button onClick={() => onCancel(booking.id)} style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '6px', padding: '0.35rem 0.7rem', color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'sans-serif' }}>Cancel</button>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AssetsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser]             = useState(null)
  const [activeNav, setActiveNav]   = useState('all')
  const [assets, setAssets]         = useState([])
  const [bookings, setBookings]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [assetModal, setAssetModal] = useState(null)
  const [bookingAsset, setBookingAsset] = useState(null)
  const [search, setSearch]         = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
  }, [])

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/assets')
    if (res.ok) setAssets(await res.json())
    setLoading(false)
  }, [])

  const fetchBookings = useCallback(async () => {
    const res = await fetch('/api/bookings?mine=true')
    if (res.ok) setBookings(await res.json())
  }, [])

  useEffect(() => { if (user) { fetchAssets(); fetchBookings() } }, [user, fetchAssets, fetchBookings])

  async function handleSaveAsset(data) {
    if (assetModal && assetModal !== 'new') {
      await fetch('/api/assets', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: assetModal.id, ...data }) })
    } else {
      await fetch('/api/assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    }
    setAssetModal(null); fetchAssets()
  }

  async function handleDeleteAsset(id) {
    if (!confirm('Delete this asset?')) return
    await fetch(`/api/assets?id=${id}`, { method: 'DELETE' })
    setAssetModal(null); fetchAssets()
  }

  async function handleBook(data) {
    const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const json = await res.json()
    if (!res.ok) return json.error
    setBookingAsset(null); fetchAssets(); fetchBookings()
    return null
  }

  async function handleCheckout(id) {
    await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'active' }) })
    fetchBookings(); fetchAssets()
  }

  async function handleReturn(id) {
    await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'returned' }) })
    fetchBookings(); fetchAssets()
  }

  async function handleCancel(id) {
    if (!confirm('Cancel this booking?')) return
    await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'cancelled' }) })
    fetchBookings(); fetchAssets()
  }

  // Filter assets
  const filtered = assets.filter(a => {
    if (activeNav !== 'all' && activeNav !== 'mybookings' && a.category !== activeNav) return false
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Stats
  const totalAssets = assets.length
  const totalQty    = assets.reduce((s, a) => s + (a.quantity || 0), 0)
  const totalInUse  = assets.reduce((s, a) => s + (a.in_use || 0), 0)
  const totalLow    = assets.filter(a => (a.in_store ?? 0) <= 10 && (a.in_store ?? 0) > 0).length
  const totalOut    = assets.filter(a => (a.in_store ?? 0) === 0).length

  // Category counts for sidebar
  const catCounts = assets.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1
    return acc
  }, {})

  const myActiveBookings = bookings.filter(b => ['approved', 'active'].includes(b.status))
  const myPastBookings   = bookings.filter(b => ['returned', 'cancelled'].includes(b.status))

  const isMyBookingsTab = activeNav === 'mybookings'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ padding: '0 1.25rem', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>Tools
            </a>
            <span style={{ color: 'var(--border)' }}>·</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '5px', background: 'rgba(0,180,255,0.12)', border: '1px solid rgba(0,180,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>📦</div>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.88rem' }}>Asset Management</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ ...inputCss, width: '220px', paddingLeft: '2rem', fontSize: '0.82rem', borderRadius: '99px' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}/>
            </div>
            <button onClick={() => setAssetModal('new')} style={{ background: 'rgba(0,180,255,0.14)', border: '1px solid rgba(0,180,255,0.38)', borderRadius: '8px', padding: '0.4rem 0.9rem', color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>Add asset
            </button>
            {user && (
              <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.3rem 0.7rem', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'sans-serif' }}>Sign out</button>
            )}
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: sidebarOpen ? '220px' : '0',
          flexShrink: 0, overflow: 'hidden',
          background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
          transition: 'width 0.2s ease',
        }}>
          <div style={{ width: '220px', padding: '1rem 0', overflowY: 'auto', height: '100%' }}>
            {/* Stats summary */}
            <div style={{ padding: '0 0.85rem', marginBottom: '0.75rem' }}>
              <div style={{ background: 'rgba(0,180,255,0.06)', border: '1px solid rgba(0,180,255,0.15)', borderRadius: '8px', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Overview</div>
                {[
                  { label: 'Total Items', value: totalAssets, color: 'var(--accent)' },
                  { label: 'In Use', value: totalInUse, color: 'var(--warning)' },
                  { label: 'Low Stock', value: totalLow, color: '#f59e0b' },
                  { label: 'Out of Stock', value: totalOut, color: 'var(--danger)' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.label}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nav items */}
            {SIDEBAR_ITEMS.map(item => (
              <div key={item.key}>
                {item.divider && <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }}/>}
                <button onClick={() => setActiveNav(item.key)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.55rem 0.85rem', border: 'none', textAlign: 'left',
                  background: activeNav === item.key ? 'rgba(0,180,255,0.1)' : 'transparent',
                  borderLeft: `3px solid ${activeNav === item.key ? 'var(--accent)' : 'transparent'}`,
                  cursor: 'pointer', fontFamily: 'sans-serif', transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem' }}>{item.icon}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: activeNav === item.key ? 600 : 400, color: activeNav === item.key ? 'var(--accent)' : 'var(--text-primary)' }}>{item.label}</span>
                  </div>
                  {item.key !== 'all' && item.key !== 'mybookings' && catCounts[item.key] > 0 && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, background: activeNav === item.key ? 'rgba(0,180,255,0.2)' : 'rgba(128,128,128,0.1)', color: activeNav === item.key ? 'var(--accent)' : 'var(--text-muted)', padding: '1px 6px', borderRadius: '99px' }}>
                      {catCounts[item.key]}
                    </span>
                  )}
                  {item.key === 'mybookings' && myActiveBookings.length > 0 && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, background: 'rgba(0,180,255,0.2)', color: 'var(--accent)', padding: '1px 6px', borderRadius: '99px' }}>
                      {myActiveBookings.length}
                    </span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex: 1, overflow: 'auto', padding: '1.25rem' }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1.1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <button onClick={() => setSidebarOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px 4px', borderRadius: '4px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <span>All Assets</span>
            <span>›</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              {activeNav === 'all' ? 'All Assets' : activeNav === 'mybookings' ? 'My Bookings' : CATEGORY_CONFIG[activeNav]?.label}
            </span>
            {!isMyBookingsTab && (
              <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                {filtered.length} asset{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* ── Assets Grid ── */}
          {!isMyBookingsTab && (
            <>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading assets...</div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📦</div>
                  <p style={{ color: 'var(--text-muted)', margin: '0 0 1rem', fontSize: '0.88rem' }}>
                    {assets.length === 0 ? 'No assets yet.' : 'No assets in this category.'}
                  </p>
                  <button onClick={() => setAssetModal('new')} style={{ background: 'rgba(0,180,255,0.14)', border: '1px solid rgba(0,180,255,0.38)', borderRadius: '8px', padding: '0.6rem 1.2rem', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif' }}>
                    + Add first asset
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.85rem' }}>
                  {filtered.map(asset => (
                    <AssetCard key={asset.id} asset={asset} onEdit={a => setAssetModal(a)} onBook={a => setBookingAsset(a)}/>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── My Bookings ── */}
          {isMyBookingsTab && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px' }}>
              <div>
                <h3 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.65rem' }}>
                  Active & Upcoming ({myActiveBookings.length})
                </h3>
                {myActiveBookings.length === 0 ? (
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No active bookings</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {myActiveBookings.map(b => <BookingRow key={b.id} booking={b} onCheckout={handleCheckout} onReturn={handleReturn} onCancel={handleCancel}/>)}
                  </div>
                )}
              </div>
              {myPastBookings.length > 0 && (
                <div>
                  <h3 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.65rem' }}>
                    History ({myPastBookings.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.7 }}>
                    {myPastBookings.map(b => <BookingRow key={b.id} booking={b} onCheckout={() => {}} onReturn={() => {}} onCancel={() => {}}/>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {assetModal && (
        <AssetModal asset={assetModal !== 'new' ? assetModal : null} onClose={() => setAssetModal(null)} onSave={handleSaveAsset} onDelete={handleDeleteAsset}/>
      )}
      {bookingAsset && (
        <BookingModal asset={bookingAsset} onClose={() => setBookingAsset(null)} onBook={handleBook}/>
      )}
    </div>
  )
}
