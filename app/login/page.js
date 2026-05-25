'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const inputCss = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '0.68rem 0.9rem',
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  outline: 'none',
  fontFamily: 'sans-serif',
  transition: 'border-color 0.2s',
}

const labelCss = {
  display: 'block',
  color: 'var(--text-muted)',
  fontSize: '0.72rem',
  fontWeight: 600,
  marginBottom: '0.4rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [message, setMessage]   = useState('')

  const supabase = createClient()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError(''); setMessage('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push(next)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'sans-serif', padding: '1rem', position: 'relative', overflow: 'hidden',
    }}>
      {/* Grid bg */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(0,180,255,0.025) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(0,180,255,0.025) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }}/>
      {/* Glow */}
      <div style={{
        position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: '500px', height: '300px', pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(0,180,255,0.06) 0%, transparent 70%)',
      }}/>

      <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <a href="/" style={{ textDecoration: 'none', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '8px',
                background: 'rgba(0,180,255,0.12)', border: '1px solid rgba(0,180,255,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                  <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/>
                  <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                  <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/>
                  <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/>
                  <path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/>
                  <path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/>
                  <path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/>
                  <path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/>
                </svg>
              </div>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                TheRojak
              </span>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Free online tools</span>
          </a>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '1.75rem',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        }}>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: 600, margin: '0 0 0.2rem', letterSpacing: '-0.02em' }}>
            {isSignUp ? 'Create account' : 'Sign in'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0 0 1.5rem' }}>
            {isSignUp
              ? 'Get access to Task Tracker and more'
              : next !== '/' ? `Sign in to continue to ${next.replace('/tools/', '')}` : 'Access your tools'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div>
              <label style={labelCss}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="you@example.com" style={inputCss}
                onFocus={e => e.target.style.borderColor = 'rgba(0,180,255,0.5)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <div>
              <label style={labelCss}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="••••••••" style={inputCss}
                onFocus={e => e.target.style.borderColor = 'rgba(0,180,255,0.5)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
                borderRadius: '8px', padding: '0.6rem 0.9rem',
                color: 'var(--danger)', fontSize: '0.82rem',
              }}>{error}</div>
            )}
            {message && (
              <div style={{
                background: 'rgba(0,180,255,0.08)', border: '1px solid rgba(0,180,255,0.25)',
                borderRadius: '8px', padding: '0.6rem 0.9rem',
                color: 'var(--accent)', fontSize: '0.82rem',
              }}>{message}</div>
            )}

            <button type="submit" disabled={loading} style={{
              background: 'rgba(0,180,255,0.15)', border: '1px solid rgba(0,180,255,0.4)',
              borderRadius: '8px', padding: '0.72rem',
              color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'sans-serif', opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
            }}>
              {loading ? 'Loading...' : isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.82rem', padding: 0 }}
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <a href="/" style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textDecoration: 'none' }}>
            ← Back to all tools
          </a>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
