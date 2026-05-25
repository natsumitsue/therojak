'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── APIs ─────────────────────────────────────────────────────────────────────
// Currency: Frankfurter (no key needed)
// Gold: gold-api.com (no key needed)

const REFRESH_INTERVAL = 60000 // 1 minute

function formatMYR(val) {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR', minimumFractionDigits: 2 }).format(val)
}

function formatUSD(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val)
}

function formatNum(val, dp = 4) {
  return Number(val).toFixed(dp)
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, change, color, loading, icon }) {
  const isPositive = change > 0
  const isNeutral = change === 0 || change === null

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '1.25rem 1.4rem',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color + '50'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      </div>

      {loading ? (
        <div style={{ height: '36px', background: 'rgba(128,128,128,0.1)', borderRadius: '6px', animation: 'pulse 1.5s infinite' }}/>
      ) : (
        <>
          <div style={{ color, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '0.3rem' }}>
            {value}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{sub}</span>
            {change !== null && (
              <span style={{
                fontSize: '0.7rem', fontWeight: 600, padding: '2px 7px', borderRadius: '99px',
                background: isNeutral ? 'rgba(128,128,128,0.1)' : isPositive ? 'rgba(16,185,129,0.12)' : 'rgba(248,113,113,0.12)',
                color: isNeutral ? 'var(--text-muted)' : isPositive ? 'var(--success)' : 'var(--danger)',
              }}>
                {isNeutral ? '—' : isPositive ? `▲ ${formatNum(Math.abs(change), 2)}%` : `▼ ${formatNum(Math.abs(change), 2)}%`}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Calculator ───────────────────────────────────────────────────────────────

function Calculator({ usdToMyr }) {
  const [amount, setAmount]     = useState('100')
  const [direction, setDirection] = useState('myr_to_usd') // 'myr_to_usd' | 'usd_to_myr'

  const numAmount = parseFloat(amount) || 0
  const result = direction === 'myr_to_usd'
    ? numAmount / usdToMyr
    : numAmount * usdToMyr

  const fromCurrency = direction === 'myr_to_usd' ? 'MYR' : 'USD'
  const toCurrency   = direction === 'myr_to_usd' ? 'USD' : 'MYR'
  const resultFormatted = direction === 'myr_to_usd' ? formatUSD(result) : formatMYR(result)

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem 1.4rem' }}>
      <h3 style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
        🔄 Currency Calculator
      </h3>

      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        <input
          type="number" value={amount} onChange={e => setAmount(e.target.value)}
          style={{
            flex: 1, background: 'rgba(128,128,128,0.06)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '0.6rem 0.8rem',
            color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600,
            outline: 'none', fontFamily: 'sans-serif',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, minWidth: '36px' }}>{fromCurrency}</span>
      </div>

      {/* Swap button */}
      <button onClick={() => setDirection(d => d === 'myr_to_usd' ? 'usd_to_myr' : 'myr_to_usd')}
        style={{
          width: '100%', background: 'rgba(128,128,128,0.06)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '0.5rem', color: 'var(--text-muted)',
          cursor: 'pointer', fontFamily: 'sans-serif', fontSize: '0.82rem',
          marginBottom: '0.75rem', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
      >
        ⇅ Swap to {toCurrency}
      </button>

      {/* Result */}
      <div style={{
        background: 'rgba(0,180,255,0.06)', border: '1px solid rgba(0,180,255,0.2)',
        borderRadius: '8px', padding: '0.75rem 1rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{fromCurrency} {numAmount.toFixed(2)} =</span>
        <span style={{ color: 'var(--accent)', fontSize: '1.1rem', fontWeight: 700 }}>{resultFormatted}</span>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.68rem', margin: '0.6rem 0 0', textAlign: 'center' }}>
        Rate: 1 USD = {usdToMyr ? formatNum(usdToMyr, 4) : '—'} MYR
      </p>
    </div>
  )
}

// ─── Gold Calculator ──────────────────────────────────────────────────────────

function GoldCalculator({ goldPerGramMyr }) {
  const [grams, setGrams] = useState('10')
  const numGrams = parseFloat(grams) || 0
  const totalMyr = numGrams * goldPerGramMyr

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem 1.4rem' }}>
      <h3 style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
        🏅 Gold Calculator
      </h3>

      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        <input
          type="number" value={grams} onChange={e => setGrams(e.target.value)}
          style={{
            flex: 1, background: 'rgba(128,128,128,0.06)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '0.6rem 0.8rem',
            color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600,
            outline: 'none', fontFamily: 'sans-serif',
          }}
          onFocus={e => e.target.style.borderColor = '#f59e0b'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>gram</span>
      </div>

      <div style={{
        background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: '8px', padding: '0.75rem 1rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{numGrams}g gold =</span>
        <span style={{ color: '#f59e0b', fontSize: '1.1rem', fontWeight: 700 }}>
          {goldPerGramMyr ? formatMYR(totalMyr) : '—'}
        </span>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.68rem', margin: '0.6rem 0 0', textAlign: 'center' }}>
        Per gram: {goldPerGramMyr ? formatMYR(goldPerGramMyr) : '—'} (24K)
      </p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CurrencyPage() {
  const [usdToMyr, setUsdToMyr]       = useState(null)
  const [myrToUsd, setMyrToUsd]       = useState(null)
  const [goldUsd, setGoldUsd]         = useState(null)   // per troy oz
  const [goldMyr, setGoldMyr]         = useState(null)   // per gram
  const [goldChange, setGoldChange]   = useState(null)
  const [fxChange, setFxChange]       = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')

  const fetchData = useCallback(async () => {
    setError('')
    try {
      // 1. Fetch USD/MYR from Frankfurter
      const fxRes = await fetch('https://api.frankfurter.dev/v2/rates?base=USD&quotes=MYR')
      const fxData = await fxRes.json()
      const rate = fxData.rates?.MYR
      if (rate) {
        setUsdToMyr(rate)
        setMyrToUsd(1 / rate)
      }

      // 2. Fetch gold price from gold-api.com (no key needed for basic)
      // Fallback: use frankfurter XAU if gold-api fails
      let goldPriceUsd = null
      let goldDayChange = null

      try {
        const goldRes = await fetch('https://gold-api.com/price/XAU')
        const goldData = await goldRes.json()
        if (goldData?.price) {
          goldPriceUsd = goldData.price        // per troy oz in USD
          goldDayChange = goldData.chp ?? null  // % change
        }
      } catch {
        // Fallback: frankfurter XAU/USD
        try {
          const xauRes = await fetch('https://api.frankfurter.dev/v2/rates?base=XAU&quotes=USD')
          const xauData = await xauRes.json()
          goldPriceUsd = xauData.rates?.USD ?? null
        } catch {}
      }

      if (goldPriceUsd && rate) {
        const TROY_OZ_TO_GRAM = 31.1035
        const goldPerGramUsd = goldPriceUsd / TROY_OZ_TO_GRAM
        const goldPerGramMyr = goldPerGramUsd * rate
        setGoldUsd(goldPriceUsd)
        setGoldMyr(goldPerGramMyr)
        setGoldChange(goldDayChange)
      }

      // FX change: compare with yesterday
      try {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        // Skip weekends
        if (yesterday.getDay() === 0) yesterday.setDate(yesterday.getDate() - 2)
        if (yesterday.getDay() === 6) yesterday.setDate(yesterday.getDate() - 1)
        const yStr = yesterday.toISOString().slice(0, 10)
        const prevRes = await fetch(`https://api.frankfurter.dev/v2/rates?base=USD&quotes=MYR&date=${yStr}`)
        const prevData = await prevRes.json()
        const prevRate = prevData.rates?.MYR
        if (prevRate && rate) {
          const change = ((rate - prevRate) / prevRate) * 100
          setFxChange(change)
        }
      } catch {}

      setLastUpdated(new Date())
    } catch (e) {
      setError('Failed to fetch data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchData])

  const goldPerOzMyr = goldUsd && usdToMyr ? goldUsd * usdToMyr : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'sans-serif' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

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
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.25rem', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Tools
            </a>
            <span style={{ color: 'var(--border)' }}>·</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '5px',
                background: 'rgba(0,180,255,0.12)', border: '1px solid rgba(0,180,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px',
              }}>💱</div>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.88rem' }}>Currency & Gold</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {lastUpdated && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                Updated {lastUpdated.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button onClick={fetchData} disabled={loading} style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
              padding: '0.3rem 0.7rem', color: 'var(--text-muted)', fontSize: '0.75rem',
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'sans-serif',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}>
                <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>

        {error && (
          <div style={{
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: '10px', padding: '0.75rem 1rem',
            color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem',
          }}>{error}</div>
        )}

        {/* Live rates */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.75rem', color: 'var(--text-muted)' }}>
            Live Rates
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <StatCard
              label="USD → MYR" icon="🇺🇸→🇲🇾"
              value={usdToMyr ? `RM ${formatNum(usdToMyr, 4)}` : '—'}
              sub="Per 1 US Dollar"
              change={fxChange}
              color="var(--accent)"
              loading={loading}
            />
            <StatCard
              label="MYR → USD" icon="🇲🇾→🇺🇸"
              value={myrToUsd ? `$${formatNum(myrToUsd, 4)}` : '—'}
              sub="Per 1 Ringgit"
              change={fxChange ? -fxChange : null}
              color="var(--success)"
              loading={loading}
            />
            <StatCard
              label="Gold (per gram)" icon="🥇"
              value={goldMyr ? formatMYR(goldMyr) : '—'}
              sub={goldUsd ? `$${formatNum(goldUsd / 31.1035, 2)} USD/gram` : 'Per gram (24K)'}
              change={goldChange}
              color="#f59e0b"
              loading={loading}
            />
            <StatCard
              label="Gold (per oz)" icon="🏅"
              value={goldUsd ? formatUSD(goldUsd) : '—'}
              sub={goldPerOzMyr ? formatMYR(goldPerOzMyr) : 'Per troy oz'}
              change={goldChange}
              color="#d97706"
              loading={loading}
            />
          </div>
        </div>

        {/* Calculators */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.75rem' }}>
            Calculators
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
            <Calculator usdToMyr={usdToMyr}/>
            <GoldCalculator goldPerGramMyr={goldMyr}/>
          </div>
        </div>

        {/* Quick reference */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>Quick Reference — MYR ↔ USD</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['MYR', 'USD', 'USD', 'MYR'].map((h, i) => (
                    <th key={i} style={{ padding: '0.6rem 1.25rem', textAlign: i < 2 ? 'left' : 'right', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 5, 10, 50, 100, 500, 1000].map((myr, idx) => {
                  const usd = myrToUsd ? myr * myrToUsd : null
                  const usdAmt = [1, 5, 10, 50, 100, 500, 1000][idx]
                  const myrAmt = usdToMyr ? usdAmt * usdToMyr : null
                  return (
                    <tr key={myr} style={{ borderBottom: '1px solid var(--border)', opacity: loading ? 0.5 : 1 }}>
                      <td style={{ padding: '0.55rem 1.25rem', color: 'var(--text-muted)' }}>RM {myr}</td>
                      <td style={{ padding: '0.55rem 1.25rem', color: 'var(--text-primary)', fontWeight: 500 }}>{usd ? `$${formatNum(usd, 2)}` : '—'}</td>
                      <td style={{ padding: '0.55rem 1.25rem', color: 'var(--text-muted)', textAlign: 'right' }}>${usdAmt}</td>
                      <td style={{ padding: '0.55rem 1.25rem', color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right' }}>{myrAmt ? `RM ${formatNum(myrAmt, 2)}` : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.68rem', textAlign: 'center', marginTop: '1.25rem' }}>
          Currency rates from Frankfurter (ECB) · Gold prices from gold-api.com · For reference only, not financial advice
        </p>
      </main>
    </div>
  )
}
