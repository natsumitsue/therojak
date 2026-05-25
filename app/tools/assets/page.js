'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG = {
  electronics: { label: 'Electronics', icon: '💻', color: '#00b4ff' },
  furniture:   { label: 'Furniture',   icon: '🪑', color: '#a78bfa' },
  vehicle:     { label: 'Vehicle',     icon: '🚗', color: '#f59e0b' },
  tools:       { label: 'Tools',       icon: '🔧', color: '#f87171' },
  stationery:  { label: 'Stationery',  icon: '📝', color: '#10b981' },
  general:     { label: 'General',     icon: '📦', color: '#4a4a7a' },
}

const CONDITION_CONFIG = {
  excellent: { label: 'Excellent', color: '#10b981' },
  good:      { label: 'Good',      color: '#00b4ff' },
  fair:      { label: 'Fair',      color: '#f59e0b' },
  poor:      { label: 'Poor',      color: '#f87171' },
}

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#4a4a7a' },
  approved:  { label: 'Approved',  color: '#00b4ff' },
  active:    { label: 'Checked Out', color: '#f59e0b' },
  returned:  { label: 'Returned',  color: '#10b981' },
  cancelled: { label: 'Cancelled', color: '#f87171' },
}

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

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

// ─── AssetModal ───────────────────────────────────────────────────────────────

function AssetModal({ asset, onClose, onSave, onDelete }) {
  const [name, setName]         = useState(asset?.name ?? '')
  const [desc, setDesc]         = useState(asset?.description ?? '')
  const [category, setCategory] = useState(asset?.category ?? 'general')
  const [quantity, setQuantity] = useState(asset?.quantity ?? 1)
  const [condition, setCondition] = useState(asset?.condition ?? 'good')
  const [location, setLocation] = useState(asset?.location ?? '')

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSave() {
    if (!name.trim()) return
    onSave({ name: name.trim(), description: desc.trim() || null, category, quantity: parseInt(quantity), condition, location: location.trim() || null })
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: '460px', boxShadow: '0 8px 40px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>{asset ? 'Edit asset' : 'Add asset'}</h2>
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
                }}>
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelCss}>Quantity *</label>
              <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} style={inputCss}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}/>
            </div>
            <div>
              <label style={labelCss}>Condition</label>
              <select value={condition} onChange={e => setCondition(e.target.value)} style={{ ...inputCss, cursor: 'pointer', colorScheme: 'light dark' }}>
                {Object.entries(CONDITION_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
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
              fontSize: '0.88rem', fontWeight: 600, cursor: name.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'sans-serif',
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

  async function handleBook() {
    if (!startDate || !endDate) return
    if (endDate < startDate) { setError('End date must be after start date'); return }
    setLoading(true); setError('')
    const err = await onBook({ asset_id: asset.id, start_date: startDate, end_date: endDate, quantity: parseInt(quantity), purpose: purpose.trim() || null })
    if (err) setError(err)
    setLoading(false)
  }

  const cfg = CATEGORY_CONFIG[asset.category]

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: '420px', boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 600, margin: '0 0 2px' }}>Book asset</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>{cfg.icon} {asset.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Availability badge */}
        <div style={{ background: asset.available > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(248,113,113,0.08)', border: `1px solid ${asset.available > 0 ? 'rgba(16,185,129,0.25)' : 'rgba(248,113,113,0.25)'}`, borderRadius: '8px', padding: '0.6rem 0.9rem', marginBottom: '1rem', fontSize: '0.82rem', color: asset.available > 0 ? 'var(--success)' : 'var(--danger)' }}>
          {asset.available > 0 ? `✓ ${asset.available} unit(s) available` : '✗ No units available'}
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
            <input type="number" min="1" max={asset.available} value={quantity} onChange={e => setQuantity(e.target.value)} style={inputCss}
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
            <button onClick={handleBook} disabled={loading || asset.available === 0} style={{
              flex: 2, background: 'rgba(0,180,255,0.15)', border: '1px solid rgba(0,180,255,0.4)',
              borderRadius: '8px', padding: '0.7rem', color: 'var(--accent)',
              fontSize: '0.88rem', fontWeight: 600, cursor: loading || asset.available === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'sans-serif', opacity: loading || asset.available === 0 ? 0.6 : 1,
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
  const isLow = asset.available <= 10 && asset.available > 0
  const isEmpty = asset.available === 0

  return (
    <div style={{
      background: 'var(--bg-card)', border: `1px solid ${isEmpty ? 'rgba(248,113,113,0.25)' : isLow ? 'rgba(245,158,11,0.25)' : 'var(--border)'}`,
      borderRadius: '12px', padding: '1.1rem', transition: 'all 0.2s', position: 'relative',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = cfg.color + '50'}
      onMouseLeave={e => e.currentTarget.style.borderColor = isEmpty ? 'rgba(248,113,113,0.25)' : isLow ? 'rgba(245,158,11,0.25)' : 'var(--border)'}
    >
      {/* Low stock badge */}
      {(isLow || isEmpty) && (
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          background: isEmpty ? 'rgba(248,113,113,0.1)' : 'rgba(245,158,11,0.1)',
          border: `1px solid ${isEmpty ? 'rgba(248,113,113,0.3)' : 'rgba(245,158,11,0.3)'}`,
          borderRadius: '99px', padding: '2px 7px',
          fontSize: '0.65rem', fontWeight: 700,
          color: isEmpty ? 'var(--danger)' : 'var(--warning)',
        }}>
          {isEmpty ? '⚠ Out of stock' : '⚠ Low stock'}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '8px', flexShrink: 0,
          background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
        }}>{cfg.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: 600, margin: '0 0 2px', paddingRight: isLow || isEmpty ? '60px' : 0 }}>{asset.name}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>{cfg.label}{asset.location ? ` · ${asset.location}` : ''}</p>
        </div>
      </div>

      {asset.description && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0 0 0.75rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {asset.description}
        </p>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '99px', background: `${cfg.color}12`, color: cfg.color, border: `1px solid ${cfg.color}30`, fontWeight: 600 }}>
          {asset.available}/{asset.quantity} available
        </span>
        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '99px', background: `${cond.color}12`, color: cond.color, border: `1px solid ${cond.color}30` }}>
          {cond.label}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => onBook(asset)} disabled={isEmpty} style={{
          flex: 1, background: isEmpty ? 'rgba(128,128,128,0.06)' : 'rgba(0,180,255,0.12)',
          border: `1px solid ${isEmpty ? 'var(--border)' : 'rgba(0,180,255,0.3)'}`,
          borderRadius: '7px', padding: '0.5rem',
          color: isEmpty ? 'var(--text-muted)' : 'var(--accent)',
          fontSize: '0.78rem', fontWeight: 600, cursor: isEmpty ? 'not-allowed' : 'pointer',
          fontFamily: 'sans-serif',
        }}>
          {isEmpty ? 'Unavailable' : '+ Book'}
        </button>
        <button onClick={() => onEdit(asset)} style={{
          background: 'rgba(128,128,128,0.06)', border: '1px solid var(--border)',
          borderRadius: '7px', padding: '0.5rem 0.75rem',
          color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'sans-serif',
        }}>Edit</button>
      </div>
    </div>
  )
}

// ─── BookingRow ───────────────────────────────────────────────────────────────

function BookingRow({ booking, onCheckout, onReturn, onCancel }) {
  const sc = STATUS_CONFIG[booking.status]
  const isOwn = true // all bookings shown are own for now

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px',
      padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: '160px' }}>
        <div style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 500 }}>
          {booking.assets?.name ?? 'Unknown asset'}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2px' }}>
          {fmtDate(booking.start_date)} — {fmtDate(booking.end_date)} · {booking.quantity} unit(s)
        </div>
        {booking.purpose && <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2px' }}>{booking.purpose}</div>}
      </div>

      <span style={{
        fontSize: '0.7rem', fontWeight: 600, padding: '3px 9px', borderRadius: '99px',
        background: `${sc.color}15`, border: `1px solid ${sc.color}35`, color: sc.color,
        whiteSpace: 'nowrap',
      }}>{sc.label}</span>

      <div style={{ display: 'flex', gap: '0.4rem' }}>
        {booking.status === 'approved' && (
          <button onClick={() => onCheckout(booking.id)} style={{
            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '6px', padding: '0.35rem 0.7rem',
            color: 'var(--warning)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'sans-serif',
          }}>Check out</button>
        )}
        {booking.status === 'active' && (
          <button onClick={() => onReturn(booking.id)} style={{
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '6px', padding: '0.35rem 0.7rem',
            color: 'var(--success)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'sans-serif',
          }}>Return</button>
        )}
        {['pending', 'approved'].includes(booking.status) && (
          <button onClick={() => onCancel(booking.id)} style={{
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: '6px', padding: '0.35rem 0.7rem',
            color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'sans-serif',
          }}>Cancel</button>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AssetsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser]               = useState(null)
  const [tab, setTab]                 = useState('assets') // assets | mybookings
  const [assets, setAssets]           = useState([])
  const [bookings, setBookings]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [assetModal, setAssetModal]   = useState(null) // null | 'new' | asset object
  const [bookingAsset, setBookingAsset] = useState(null)
  const [search, setSearch]           = useState('')
  const [filterCat, setFilterCat]     = useState('all')

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

  useEffect(() => {
    if (user) { fetchAssets(); fetchBookings() }
  }, [user, fetchAssets, fetchBookings])

  async function handleSaveAsset(data) {
    if (assetModal && assetModal !== 'new') {
      await fetch('/api/assets', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: assetModal.id, ...data }) })
    } else {
      await fetch('/api/assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    }
    setAssetModal(null); fetchAssets()
  }

  async function handleDeleteAsset(id) {
    if (!confirm('Delete this asset? All bookings will also be deleted.')) return
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
    fetchBookings()
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

  // Stats
  const totalAssets    = assets.length
  const lowStock       = assets.filter(a => a.available <= 10 && a.available > 0).length
  const outOfStock     = assets.filter(a => a.available === 0).length
  const activeBookings = bookings.filter(b => b.status === 'active').length

  const filtered = assets.filter(a => {
    if (filterCat !== 'all' && a.category !== filterCat) return false
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const myActiveBookings  = bookings.filter(b => ['approved', 'active'].includes(b.status))
  const myPastBookings    = bookings.filter(b => ['returned', 'cancelled'].includes(b.status))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'sans-serif' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: `linear-gradient(rgba(0,180,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,180,255,0.02) 1px,transparent 1px)`, backgroundSize: '40px 40px' }}/>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.25rem', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.3rem', background: 'rgba(128,128,128,0.06)', borderRadius: '8px', padding: '3px' }}>
              {[['assets','📦 Assets'],['mybookings','📋 My Bookings']].map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)} style={{
                  padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem',
                  fontWeight: 500, cursor: 'pointer', fontFamily: 'sans-serif',
                  background: tab === key ? 'rgba(0,180,255,0.15)' : 'transparent',
                  border: `1px solid ${tab === key ? 'rgba(0,180,255,0.35)' : 'transparent'}`,
                  color: tab === key ? 'var(--accent)' : 'var(--text-muted)',
                }}>{label}</button>
              ))}
            </div>
            {user && (
              <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.3rem 0.7rem', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'sans-serif' }}>Sign out</button>
            )}
          </div>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>

        {/* ── Stats row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Assets', value: totalAssets, color: 'var(--accent)', icon: '📦' },
            { label: 'Low Stock', value: lowStock, color: 'var(--warning)', icon: '⚠️' },
            { label: 'Out of Stock', value: outOfStock, color: 'var(--danger)', icon: '🚫' },
            { label: 'Active Checkouts', value: activeBookings, color: 'var(--success)', icon: '✓' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.9rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
                <span style={{ fontSize: '0.9rem' }}>{s.icon}</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── TAB: ASSETS ── */}
        {tab === 'assets' && (
          <>
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '160px', position: 'relative' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputCss, paddingLeft: '2rem', fontSize: '0.82rem' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}/>
              </div>
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.62rem 0.85rem', color: filterCat !== 'all' ? 'var(--accent)' : 'var(--text-muted)', fontSize: '0.82rem', outline: 'none', cursor: 'pointer', fontFamily: 'sans-serif' }}>
                <option value="all">All categories</option>
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
                ))}
              </select>
              <button onClick={() => setAssetModal('new')} style={{ background: 'rgba(0,180,255,0.14)', border: '1px solid rgba(0,180,255,0.38)', borderRadius: '8px', padding: '0.62rem 1rem', color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Add asset
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading assets...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
                  {assets.length === 0 ? 'No assets yet. Add your first asset!' : 'No assets match your search.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {filtered.map(asset => (
                  <AssetCard key={asset.id} asset={asset} onEdit={a => setAssetModal(a)} onBook={a => setBookingAsset(a)}/>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── TAB: MY BOOKINGS ── */}
        {tab === 'mybookings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Active */}
            <div>
              <h3 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.65rem' }}>
                Active & Upcoming ({myActiveBookings.length})
              </h3>
              {myActiveBookings.length === 0 ? (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No active bookings
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {myActiveBookings.map(b => (
                    <BookingRow key={b.id} booking={b} onCheckout={handleCheckout} onReturn={handleReturn} onCancel={handleCancel}/>
                  ))}
                </div>
              )}
            </div>

            {/* History */}
            {myPastBookings.length > 0 && (
              <div>
                <h3 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.65rem' }}>
                  History ({myPastBookings.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.7 }}>
                  {myPastBookings.map(b => (
                    <BookingRow key={b.id} booking={b} onCheckout={() => {}} onReturn={() => {}} onCancel={() => {}}/>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {assetModal && (
        <AssetModal
          asset={assetModal !== 'new' ? assetModal : null}
          onClose={() => setAssetModal(null)}
          onSave={handleSaveAsset}
          onDelete={handleDeleteAsset}
        />
      )}
      {bookingAsset && (
        <BookingModal
          asset={bookingAsset}
          onClose={() => setBookingAsset(null)}
          onBook={handleBook}
        />
      )}
    </div>
  )
}
