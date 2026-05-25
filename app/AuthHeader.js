'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Add this AuthHeader component to your app/page.js
// It shows Login button when logged out, email + Sign out when logged in
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export function AuthHeader() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div style={{ width: '80px' }} />

  if (user) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {user.email}
      </span>
      <button
        onClick={async () => { await supabase.auth.signOut(); setUser(null) }}
        style={{
          background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
          padding: '0.3rem 0.7rem', color: 'var(--text-muted)', fontSize: '0.75rem',
          cursor: 'pointer', fontFamily: 'sans-serif', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-muted)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
      >
        Sign out
      </button>
    </div>
  )

  return (
    <a href="/login" style={{
      background: 'rgba(0,180,255,0.12)', border: '1px solid rgba(0,180,255,0.35)',
      borderRadius: '7px', padding: '0.35rem 0.85rem',
      color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600,
      textDecoration: 'none', transition: 'all 0.2s', display: 'inline-block',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,180,255,0.22)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,180,255,0.12)' }}
    >
      Sign in
    </a>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// In your existing homepage, add AuthHeader inside the header section.
// Example — find your header in app/page.js and add AuthHeader at the right end:
//
// import { AuthHeader } from './AuthHeader'   ← or wherever you put this file
//
// <header style={{ ... }}>
//   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//     <span>TheRojak</span>
//     <AuthHeader />           ← ADD THIS
//   </div>
// </header>
// ─────────────────────────────────────────────────────────────────────────────
