'use client'

import { useState, useCallback } from 'react'

const TABS = [
  { key: 'ip',        label: 'IP Lookup',    icon: '🌐', placeholder: 'e.g. 8.8.8.8 or leave blank for your IP' },
  { key: 'dns',       label: 'DNS Lookup',   icon: '🔍', placeholder: 'e.g. google.com' },
  { key: 'whois',     label: 'Whois',        icon: '📋', placeholder: 'e.g. google.com (no www)' },
  { key: 'ssl',       label: 'SSL Checker',  icon: '🔒', placeholder: 'e.g. google.com (no https://)' },
  { key: 'port',      label: 'Port Checker', icon: '🔌', placeholder: 'e.g. google.com or 8.8.8.8' },
  { key: 'ping',      label: 'Ping',         icon: '📡', placeholder: 'e.g. google.com' },
  { key: 'pagespeed', label: 'Page Speed',   icon: '⚡', placeholder: 'e.g. therojak.com or https://therojak.com' },
]

const DNS_TYPES = ['A', 'AAAA', 'MX', 'CNAME', 'TXT', 'NS', 'SOA', 'CAA']

const SSL_GRADES = {
  'A+': { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  'A':  { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  'A-': { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  'B':  { color: '#00b4ff', bg: 'rgba(0,180,255,0.12)' },
  'C':  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  'D':  { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  'F':  { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}

function scoreColor(score) {
  if (score >= 90) return '#10b981'
  if (score >= 50) return '#f59e0b'
  return '#f87171'
}

function scoreBg(score) {
  if (score >= 90) return 'rgba(16,185,129,0.12)'
  if (score >= 50) return 'rgba(245,158,11,0.12)'
  return 'rgba(248,113,113,0.12)'
}

function scoreLabel(score) {
  if (score >= 90) return 'Good'
  if (score >= 50) return 'Needs Improvement'
  return 'Poor'
}

function ResultCard({ children }) {
  return <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginTop: '1rem' }}>{children}</div>
}

function ResultRow({ label, value, valueColor, mono }) {
  if (!value && value !== 0 && value !== false) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)', gap: '1rem' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', flexShrink: 0, minWidth: '120px' }}>{label}</span>
      <span style={{ color: valueColor || 'var(--text-primary)', fontSize: '0.82rem', fontFamily: mono ? 'monospace' : 'inherit', textAlign: 'right', wordBreak: 'break-all' }}>
        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
      </span>
    </div>
  )
}

function SectionHeader({ title }) {
  return <div style={{ padding: '0.6rem 1rem', background: 'rgba(128,128,128,0.04)', borderBottom: '1px solid var(--border)' }}>
    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
  </div>
}

function ErrorBox({ message }) {
  return <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '10px', padding: '0.85rem 1rem', color: 'var(--danger)', fontSize: '0.85rem', marginTop: '1rem' }}>⚠ {message}</div>
}

function InfoBox({ message, color = 'var(--accent)' }) {
  return <div style={{ background: `${color}10`, border: `1px solid ${color}25`, borderRadius: '10px', padding: '0.85rem 1rem', color, fontSize: '0.82rem', marginTop: '1rem' }}>ℹ {message}</div>
}

// ─── Result renderers ─────────────────────────────────────────────────────────

function IPResult({ data }) {
  if (data.error) return <ErrorBox message={data.error}/>
  return <ResultCard>
    <SectionHeader title="IP Information"/>
    <ResultRow label="IP Address" value={data.ip} mono/>
    <ResultRow label="Country" value={data.country ? `${data.country} ${data.countryCode}` : null}/>
    <ResultRow label="Region" value={data.region}/>
    <ResultRow label="City" value={data.city}/>
    <ResultRow label="Timezone" value={data.timezone}/>
    <SectionHeader title="Network"/>
    <ResultRow label="ISP" value={data.isp}/>
    <ResultRow label="Organisation" value={data.org}/>
    <ResultRow label="AS Number" value={data.as} mono/>
    <SectionHeader title="Flags"/>
    <ResultRow label="Proxy/VPN" value={data.isProxy} valueColor={data.isProxy ? 'var(--warning)' : 'var(--success)'}/>
    <ResultRow label="Hosting/DC" value={data.isHosting} valueColor={data.isHosting ? 'var(--warning)' : 'var(--success)'}/>
    {data.lat && data.lon && <><SectionHeader title="Geolocation"/><ResultRow label="Coordinates" value={`${data.lat}, ${data.lon}`} mono/></>}
  </ResultCard>
}

function DNSResult({ data }) {
  if (data.error) return <ErrorBox message={data.error}/>
  const hasAnswers = data.answers?.length > 0
  const hasAuthority = data.authority?.length > 0
  return <ResultCard>
    {hasAnswers ? (
      <>{<SectionHeader title={`${data.type} Records for ${data.domain}`}/>}
      {data.answers.map((r, i) => (
        <div key={i} style={{ padding: '0.65rem 1rem', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--accent)', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'monospace' }}>{r.type}</span>
          <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>{r.data}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', textAlign: 'right' }}>TTL {r.ttl}s</span>
        </div>
      ))}</>
    ) : (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No {data.type} records found for {data.domain}</div>
    )}
    {hasAuthority && !hasAnswers && (<>
      <SectionHeader title="Authority Records"/>
      {data.authority.map((r, i) => (
        <div key={i} style={{ padding: '0.65rem 1rem', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'monospace' }}>{r.type}</span>
          <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>{r.data}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', textAlign: 'right' }}>TTL {r.ttl}s</span>
        </div>
      ))}
    </>)}
  </ResultCard>
}

function WhoisResult({ data }) {
  if (data.error) return <ErrorBox message={data.error}/>
  const isExpired = data.expires && new Date(data.expires) < new Date()
  const daysLeft = data.expires ? Math.ceil((new Date(data.expires) - new Date()) / 86400000) : null
  return <ResultCard>
    <SectionHeader title="Domain Information"/>
    <ResultRow label="Domain" value={data.domain} mono/>
    <ResultRow label="Registrar" value={data.registrar}/>
    <ResultRow label="Registered" value={data.created}/>
    <ResultRow label="Expires" value={data.expires ? `${data.expires}${daysLeft !== null ? ` (${isExpired ? 'Expired' : `${daysLeft} days left`})` : ''}` : null} valueColor={isExpired ? 'var(--danger)' : daysLeft && daysLeft < 30 ? 'var(--warning)' : 'var(--success)'}/>
    <ResultRow label="Last Updated" value={data.updated}/>
    {data.status?.length > 0 && (<><SectionHeader title="Status"/>
      {data.status.map((s, i) => <div key={i} style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border)' }}><span style={{ color: 'var(--text-primary)', fontSize: '0.78rem', fontFamily: 'monospace' }}>{s}</span></div>)}
    </>)}
    {data.nameservers?.length > 0 && (<><SectionHeader title="Name Servers"/>
      {data.nameservers.map((ns, i) => <div key={i} style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border)' }}><span style={{ color: 'var(--text-primary)', fontSize: '0.78rem', fontFamily: 'monospace' }}>{ns}</span></div>)}
    </>)}
  </ResultCard>
}

function SSLResult({ data }) {
  if (data.error) return <ErrorBox message={data.error}/>
  if (data.status === 'analyzing') return <InfoBox message={data.message} color="var(--warning)"/>
  const gradeStyle = SSL_GRADES[data.grade] || { color: 'var(--text-muted)', bg: 'rgba(128,128,128,0.1)' }
  return <ResultCard>
    {data.grade && (
      <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: gradeStyle.bg, border: `2px solid ${gradeStyle.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 800, color: gradeStyle.color, flexShrink: 0 }}>{data.grade}</div>
        <div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>{data.domain}</div>
          <div style={{ color: gradeStyle.color, fontSize: '0.8rem', marginTop: '2px' }}>SSL Grade: {data.grade}{data.hasWarnings ? ' · Has warnings' : ''}</div>
          {data.ipAddress && <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>{data.ipAddress}</div>}
        </div>
      </div>
    )}
    <SectionHeader title="Certificate Details"/>
    <ResultRow label="Domain" value={data.domain} mono/>
    <ResultRow label="Grade" value={data.grade} valueColor={gradeStyle.color}/>
    <ResultRow label="IP Address" value={data.ipAddress} mono/>
    {data.notBefore && <ResultRow label="Valid From" value={new Date(data.notBefore).toLocaleDateString('en-MY')}/>}
    {data.notAfter && <ResultRow label="Valid Until" value={`${new Date(data.notAfter).toLocaleDateString('en-MY')} (${Math.ceil((new Date(data.notAfter) - new Date()) / 86400000)} days)`} valueColor={Math.ceil((new Date(data.notAfter) - new Date()) / 86400000) < 30 ? 'var(--warning)' : 'var(--success)'}/>}
    {data.issuer && <ResultRow label="Issuer" value={data.issuer}/>}
    {data.status === 'partial' && <InfoBox message={data.message}/>}
  </ResultCard>
}

function PortResult({ data }) {
  if (data.error) return <ErrorBox message={data.error}/>
  const open = data.ports?.filter(p => p.open === true) || []
  const closed = data.ports?.filter(p => p.open === false) || []
  const unknown = data.ports?.filter(p => p.open === null) || []
  return <ResultCard>
    <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem' }}>
      <span style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600 }}>✓ {open.length} open</span>
      <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>✗ {closed.length} closed</span>
      {unknown.length > 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>? {unknown.length} unknown</span>}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
      {data.ports?.map((p, i) => (
        <div key={i} style={{ padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div>
            <span style={{ color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 500 }}>{p.service}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginLeft: '5px' }}>:{p.port}</span>
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '99px', background: p.open === true ? 'rgba(16,185,129,0.12)' : p.open === false ? 'rgba(248,113,113,0.1)' : 'rgba(128,128,128,0.08)', color: p.open === true ? 'var(--success)' : p.open === false ? 'var(--danger)' : 'var(--text-muted)' }}>
            {p.open === true ? 'Open' : p.open === false ? 'Closed' : '?'}
          </span>
        </div>
      ))}
    </div>
  </ResultCard>
}

function PingResult({ data }) {
  if (data.error) return <ErrorBox message={data.error}/>
  const isReachable = data.reachable
  return <ResultCard>
    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0, background: isReachable ? 'rgba(16,185,129,0.12)' : 'rgba(248,113,113,0.12)', border: `2px solid ${isReachable ? 'rgba(16,185,129,0.4)' : 'rgba(248,113,113,0.4)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
        {isReachable ? '✓' : '✗'}
      </div>
      <div>
        <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>{data.host}</div>
        <div style={{ color: isReachable ? 'var(--success)' : 'var(--danger)', fontSize: '0.8rem' }}>{isReachable ? `Reachable${data.latency ? ` · ${data.latency}ms` : ''}` : 'Not reachable'}</div>
      </div>
    </div>
    <SectionHeader title="Connection Results"/>
    {data.https?.reachable !== undefined && <ResultRow label="HTTPS" value={data.https.reachable ? `Reachable (${data.https.ms}ms, HTTP ${data.https.status})` : 'Not reachable'} valueColor={data.https.reachable ? 'var(--success)' : 'var(--danger)'}/>}
    {data.http?.reachable !== undefined && <ResultRow label="HTTP" value={data.http.reachable ? `Reachable (${data.http.ms}ms, HTTP ${data.http.status})` : 'Not reachable'} valueColor={data.http.reachable ? 'var(--success)' : 'var(--danger)'}/>}
    {data.dns && <ResultRow label="DNS Resolved" value={data.dns.resolved ? `Yes — ${data.dns.ips?.join(', ')}` : 'No'} valueColor={data.dns.resolved ? 'var(--success)' : 'var(--danger)'}/>}
    <div style={{ padding: '0.6rem 1rem' }}><span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>ℹ {data.note}</span></div>
  </ResultCard>
}

function PageSpeedResult({ data }) {
  if (data.error) return <ErrorBox message={data.error}/>

  function StrategyPanel({ result }) {
    if (!result) return null
    const { scores, metrics, opportunities } = result
    const isMobile = result.strategy === 'mobile'

    return (
      <div style={{ flex: 1, minWidth: '240px' }}>
        <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.9rem' }}>{isMobile ? '📱' : '🖥️'}</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize' }}>{result.strategy}</span>
        </div>

        {/* Score circles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0', borderBottom: '1px solid var(--border)' }}>
          {[
            { label: 'Performance', score: scores.performance },
            { label: 'Accessibility', score: scores.accessibility },
            { label: 'Best Practices', score: scores.bestPractices },
            { label: 'SEO', score: scores.seo },
          ].map((s, i) => (
            <div key={i} style={{ padding: '0.85rem', borderBottom: i < 2 ? '1px solid var(--border)' : 'none', borderRight: i % 2 === 0 ? '1px solid var(--border)' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: s.score > 0 ? scoreBg(s.score) : 'rgba(128,128,128,0.08)', border: `2px solid ${s.score > 0 ? scoreColor(s.score) : 'rgba(128,128,128,0.2)'}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, color: s.score > 0 ? scoreColor(s.score) : 'var(--text-muted)' }}>{s.score > 0 ? s.score : '—'}</div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textAlign: 'center', fontWeight: 500 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Core Web Vitals */}
        <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Core Web Vitals</span>
        </div>
        {[
          { label: 'FCP', value: metrics.fcp, desc: 'First Contentful Paint' },
          { label: 'LCP', value: metrics.lcp, desc: 'Largest Contentful Paint' },
          { label: 'TBT', value: metrics.tbt, desc: 'Total Blocking Time' },
          { label: 'CLS', value: metrics.cls, desc: 'Cumulative Layout Shift' },
          { label: 'SI',  value: metrics.si,  desc: 'Speed Index' },
          { label: 'TTI', value: metrics.tti, desc: 'Time to Interactive' },
        ].filter(m => m.value).map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 1rem', borderBottom: '1px solid var(--border)' }}>
            <div>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 600 }}>{m.label}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginLeft: '5px' }}>{m.desc}</span>
            </div>
            <span style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontFamily: 'monospace' }}>{m.value}</span>
          </div>
        ))}

        {/* Opportunities */}
        {opportunities?.length > 0 && (
          <>
            <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Opportunities</span>
            </div>
            {opportunities.map((o, i) => (
              <div key={i} style={{ padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 5px', borderRadius: '4px', background: scoreBg(o.score), color: scoreColor(o.score), flexShrink: 0, marginTop: '1px' }}>{o.score}</span>
                <span style={{ color: 'var(--text-primary)', fontSize: '0.75rem', lineHeight: 1.4 }}>{o.title}</span>
              </div>
            ))}
          </>
        )}
      </div>
    )
  }

  return (
    <ResultCard>
      <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Results for </span>
        <span style={{ color: 'var(--accent)', fontSize: '0.78rem', fontFamily: 'monospace' }}>{data.url}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', divide: '1px solid var(--border)' }}>
        {data.mobile  && <div style={{ flex: 1, minWidth: '240px', borderRight: '1px solid var(--border)' }}><StrategyPanel result={data.mobile}/></div>}
        {data.desktop && <div style={{ flex: 1, minWidth: '240px' }}><StrategyPanel result={data.desktop}/></div>}
      </div>
      <div style={{ padding: '0.6rem 1rem', background: 'rgba(128,128,128,0.03)' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>ℹ Powered by Google PageSpeed Insights · Scores: 0-49 Poor · 50-89 Needs Improvement · 90-100 Good</span>
      </div>
    </ResultCard>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NetworkPage() {
  const [activeTab, setActiveTab] = useState('ip')
  const [query, setQuery]         = useState('')
  const [dnsType, setDnsType]     = useState('A')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState('')
  const [history, setHistory]     = useState([])

  const tab = TABS.find(t => t.key === activeTab)

  const handleSearch = useCallback(async (q = query) => {
    const trimmed = q.trim()
    setLoading(true); setResult(null); setError('')
    try {
      let url = `/api/network?tool=${activeTab}&q=${encodeURIComponent(trimmed || 'me')}`
      if (activeTab === 'dns') url += `&type=${dnsType}`
      const res = await fetch(url)
      const data = await res.json()
      setResult(data)
      if (trimmed) setHistory(prev => [{ tool: activeTab, query: trimmed }, ...prev.filter(h => !(h.tool === activeTab && h.query === trimmed))].slice(0, 10))
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [query, activeTab, dnsType])

  function handleTabChange(key) { setActiveTab(key); setResult(null); setError(''); setQuery('') }

  function renderResult() {
    if (!result) return null
    switch (activeTab) {
      case 'ip':        return <IPResult data={result}/>
      case 'dns':       return <DNSResult data={result}/>
      case 'whois':     return <WhoisResult data={result}/>
      case 'ssl':       return <SSLResult data={result}/>
      case 'port':      return <PortResult data={result}/>
      case 'ping':      return <PingResult data={result}/>
      case 'pagespeed': return <PageSpeedResult data={result}/>
      default: return null
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'sans-serif' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: `linear-gradient(rgba(0,180,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,180,255,0.02) 1px,transparent 1px)`, backgroundSize: '40px 40px' }}/>

      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.25rem', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>Tools
            </a>
            <span style={{ color: 'var(--border)' }}>·</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '5px', background: 'rgba(0,180,255,0.12)', border: '1px solid rgba(0,180,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>🌐</div>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.88rem' }}>Network Tools</span>
            </div>
          </div>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => handleTabChange(t.key)} style={{
              flex: 1, minWidth: '90px', padding: '0.45rem 0.6rem', borderRadius: '7px', fontSize: '0.75rem',
              fontWeight: activeTab === t.key ? 600 : 400, cursor: 'pointer', fontFamily: 'sans-serif',
              background: activeTab === t.key ? 'rgba(0,180,255,0.15)' : 'transparent',
              border: `1px solid ${activeTab === t.key ? 'rgba(0,180,255,0.35)' : 'transparent'}`,
              color: activeTab === t.key ? 'var(--accent)' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
            }}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.5rem' }}>
          <div style={{ flex: 1 }}>
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              placeholder={tab?.placeholder}
              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.75rem 1rem', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', fontFamily: 'sans-serif', transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}/>
          </div>
          {activeTab === 'dns' && (
            <select value={dnsType} onChange={e => setDnsType(e.target.value)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.75rem 0.9rem', color: 'var(--accent)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer', fontFamily: 'sans-serif', fontWeight: 600, colorScheme: 'light dark' }}>
              {DNS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          <button onClick={() => handleSearch()} disabled={loading} style={{
            background: 'rgba(0,180,255,0.15)', border: '1px solid rgba(0,180,255,0.4)', borderRadius: '10px', padding: '0.75rem 1.5rem',
            color: 'var(--accent)', fontSize: '0.88rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', gap: '6px', opacity: loading ? 0.7 : 1, flexShrink: 0,
          }}>
            {loading
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            }
            {loading ? 'Checking...' : 'Check'}
          </button>
        </div>

        {activeTab === 'ip' && !query && <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0 0 0.5rem' }}>Leave blank to check your own IP address</p>}
        {activeTab === 'pagespeed' && !result && !loading && <InfoBox message="Checks both mobile & desktop scores. Results include Performance, Accessibility, Best Practices, SEO scores + Core Web Vitals."/>}
        {activeTab === 'ssl' && !result && !loading && <InfoBox message="SSL check powered by SSL Labs. First check may take 60-90 seconds."/>}
        {activeTab === 'port' && !result && !loading && <InfoBox message="Shows if ports are accessible from the public internet."/>}

        {history.filter(h => h.tool === activeTab).length > 0 && !result && !loading && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem', marginTop: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', alignSelf: 'center' }}>Recent:</span>
            {history.filter(h => h.tool === activeTab).slice(0, 5).map((h, i) => (
              <button key={i} onClick={() => { setQuery(h.query); handleSearch(h.query) }} style={{ background: 'rgba(128,128,128,0.06)', border: '1px solid var(--border)', borderRadius: '99px', padding: '2px 10px', fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'sans-serif' }}>{h.query}</button>
            ))}
          </div>
        )}

        {error && <ErrorBox message={error}/>}
        {renderResult()}
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
