import { NextResponse } from 'next/server'

async function safeFetch(url, opts = {}) {
  try {
    const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(15000) })
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

async function ipLookup(ip) {
  const data = await safeFetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query,proxy,hosting`)
  if (!data || data.status === 'fail') return { error: data?.message || 'IP lookup failed' }
  return {
    ip: data.query, country: data.country, countryCode: data.countryCode,
    region: data.regionName, city: data.city, zip: data.zip,
    lat: data.lat, lon: data.lon, timezone: data.timezone,
    isp: data.isp, org: data.org, as: data.as,
    isProxy: data.proxy, isHosting: data.hosting,
  }
}

async function dnsLookup(domain, type = 'A') {
  const data = await safeFetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`, {
    headers: { 'Accept': 'application/dns-json' }
  })
  if (!data) return { error: 'DNS lookup failed' }
  const RCODE_NAMES = { 0: 'NOERROR', 1: 'FORMERR', 2: 'SERVFAIL', 3: 'NXDOMAIN', 5: 'REFUSED' }
  if (data.Status !== 0) return { error: `DNS error: ${RCODE_NAMES[data.Status] || 'Unknown'}`, status: data.Status }
  const TYPE_NAMES = { 1: 'A', 2: 'NS', 5: 'CNAME', 6: 'SOA', 15: 'MX', 16: 'TXT', 28: 'AAAA', 33: 'SRV', 257: 'CAA' }
  return {
    domain, type,
    answers: (data.Answer || []).map(r => ({ name: r.name, type: TYPE_NAMES[r.type] || r.type, ttl: r.TTL, data: r.data })),
    authority: (data.Authority || []).map(r => ({ name: r.name, type: TYPE_NAMES[r.type] || r.type, ttl: r.TTL, data: r.data })),
  }
}

async function whoisLookup(domain) {
  try {
    const rdap = await safeFetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`)
    if (rdap) {
      const registrar = rdap.entities?.find(e => e.roles?.includes('registrar'))
      const events = rdap.events || []
      const created = events.find(e => e.eventAction === 'registration')?.eventDate
      const expires = events.find(e => e.eventAction === 'expiration')?.eventDate
      const updated = events.find(e => e.eventAction === 'last changed')?.eventDate
      return {
        domain: rdap.ldhName || domain,
        registrar: registrar?.vcardArray?.[1]?.find(v => v[0] === 'fn')?.[3] || 'Unknown',
        created: created ? new Date(created).toLocaleDateString('en-MY') : null,
        expires: expires ? new Date(expires).toLocaleDateString('en-MY') : null,
        updated: updated ? new Date(updated).toLocaleDateString('en-MY') : null,
        status: rdap.status || [],
        nameservers: (rdap.nameservers || []).map(ns => ns.ldhName),
        source: 'RDAP',
      }
    }
  } catch {}
  return { error: 'Whois lookup failed — try root domain without www (e.g. google.com)' }
}

async function sslCheck(domain) {
  try {
    const startRes = await fetch(`https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(domain)}&startNew=on&all=done`, { signal: AbortSignal.timeout(8000) })
    const startData = await startRes.json()
    if (startData.status === 'IN_PROGRESS' || startData.status === 'DNS') {
      return { domain, status: 'analyzing', message: 'SSL analysis in progress — this can take 60-90 seconds. Try again in a moment.' }
    }
    if (startData.status === 'READY') {
      const ep = startData.endpoints?.[0]
      return { domain, status: 'ready', grade: ep?.grade || 'N/A', gradeIgnoreTrust: ep?.gradeTrustIgnored || null, hasWarnings: ep?.hasWarnings || false, isExceptional: ep?.isExceptional || false, ipAddress: ep?.ipAddress, serverName: ep?.serverName }
    }
    const crt = await safeFetch(`https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`)
    if (crt && crt.length > 0) {
      const latest = crt.sort((a, b) => new Date(b.not_after) - new Date(a.not_after))[0]
      return { domain, status: 'partial', issuer: latest.issuer_name, notBefore: latest.not_before, notAfter: latest.not_after, commonName: latest.common_name, message: 'Basic certificate info from crt.sh' }
    }
    return { error: 'SSL check failed' }
  } catch (e) { return { error: e.message } }
}

async function portCheck(host) {
  const COMMON_PORTS = [
    { port: 21, service: 'FTP' }, { port: 22, service: 'SSH' }, { port: 23, service: 'Telnet' },
    { port: 25, service: 'SMTP' }, { port: 53, service: 'DNS' }, { port: 80, service: 'HTTP' },
    { port: 110, service: 'POP3' }, { port: 143, service: 'IMAP' }, { port: 443, service: 'HTTPS' },
    { port: 465, service: 'SMTPS' }, { port: 587, service: 'SMTP Alt' }, { port: 993, service: 'IMAPS' },
    { port: 3306, service: 'MySQL' }, { port: 3389, service: 'RDP' }, { port: 5432, service: 'PostgreSQL' },
    { port: 6379, service: 'Redis' }, { port: 8080, service: 'HTTP Alt' }, { port: 8443, service: 'HTTPS Alt' },
  ]
  const results = await Promise.allSettled(
    COMMON_PORTS.map(async ({ port, service }) => {
      try {
        const res = await fetch(`https://portchecker.io/api/v1/query`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ host, ports: [port] }), signal: AbortSignal.timeout(6000),
        })
        const data = await res.json()
        const portResult = data?.checks?.[0]
        return { port, service, open: portResult?.status === true }
      } catch { return { port, service, open: null } }
    })
  )
  return { host, ports: results.map((r, i) => r.status === 'fulfilled' ? r.value : { ...COMMON_PORTS[i], open: null }) }
}

async function pingCheck(host) {
  const results = {}
  try {
    const start = Date.now()
    const res = await fetch(`https://${host}`, { method: 'HEAD', signal: AbortSignal.timeout(5000), redirect: 'follow' })
    results.https = { reachable: true, ms: Date.now() - start, status: res.status }
  } catch {
    try {
      const start = Date.now()
      const res = await fetch(`http://${host}`, { method: 'HEAD', signal: AbortSignal.timeout(5000), redirect: 'follow' })
      results.http = { reachable: true, ms: Date.now() - start, status: res.status }
    } catch { results.http = { reachable: false } }
  }
  try {
    const dns = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=A`, { headers: { 'Accept': 'application/dns-json' }, signal: AbortSignal.timeout(4000) })
    const dnsData = await dns.json()
    results.dns = { resolved: dnsData.Status === 0, ips: (dnsData.Answer || []).filter(r => r.type === 1).map(r => r.data) }
  } catch { results.dns = { resolved: false } }
  return {
    host, reachable: results.https?.reachable || results.http?.reachable || results.dns?.resolved,
    latency: results.https?.ms || results.http?.ms || null,
    https: results.https, http: results.http, dns: results.dns,
    note: 'Browser-based ping — actual ICMP ping not available via web',
  }
}

async function pageSpeedCheck(url) {
  // Ensure URL has protocol
  const fullUrl = url.startsWith('http') ? url : `https://${url}`

  // Fetch both mobile and desktop
  const [mobileRes, desktopRes] = await Promise.allSettled([
    safeFetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(fullUrl)}&strategy=mobile`),
    safeFetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(fullUrl)}&strategy=desktop`),
  ])

  const mobile  = mobileRes.status === 'fulfilled'  ? mobileRes.value  : null
  const desktop = desktopRes.status === 'fulfilled' ? desktopRes.value : null

  if (!mobile && !desktop) return { error: 'PageSpeed check failed — check the URL and try again' }

  function parseResult(data, strategy) {
    if (!data) return null
    const cats = data.lighthouseResult?.categories
    const audits = data.lighthouseResult?.audits
    const metrics = data.lighthouseResult?.audits

    return {
      strategy,
      scores: {
        performance:   Math.round((cats?.performance?.score   ?? 0) * 100),
        accessibility: Math.round((cats?.accessibility?.score ?? 0) * 100),
        bestPractices: Math.round((cats?.['best-practices']?.score ?? 0) * 100),
        seo:           Math.round((cats?.seo?.score ?? 0) * 100),
      },
      metrics: {
        fcp:  audits?.['first-contentful-paint']?.displayValue,
        lcp:  audits?.['largest-contentful-paint']?.displayValue,
        tbt:  audits?.['total-blocking-time']?.displayValue,
        cls:  audits?.['cumulative-layout-shift']?.displayValue,
        si:   audits?.['speed-index']?.displayValue,
        tti:  audits?.['interactive']?.displayValue,
      },
      opportunities: Object.values(audits || {})
        .filter(a => a.details?.type === 'opportunity' && a.score !== null && a.score < 0.9)
        .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
        .slice(0, 5)
        .map(a => ({ title: a.title, description: a.description, score: Math.round((a.score ?? 0) * 100) })),
    }
  }

  return {
    url: fullUrl,
    mobile:  parseResult(mobile, 'mobile'),
    desktop: parseResult(desktop, 'desktop'),
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const tool  = searchParams.get('tool')
  const query = searchParams.get('q')
  const type  = searchParams.get('type') || 'A'

  if (!tool || !query) return NextResponse.json({ error: 'Missing tool or query' }, { status: 400 })

  try {
    let result
    switch (tool) {
      case 'ip':        result = await ipLookup(query); break
      case 'dns':       result = await dnsLookup(query, type); break
      case 'whois':     result = await whoisLookup(query); break
      case 'ssl':       result = await sslCheck(query); break
      case 'port':      result = await portCheck(query); break
      case 'ping':      result = await pingCheck(query); break
      case 'pagespeed': result = await pageSpeedCheck(query); break
      default: return NextResponse.json({ error: 'Unknown tool' }, { status: 400 })
    }
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
