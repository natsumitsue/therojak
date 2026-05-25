import { NextResponse } from 'next/server'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function safeFetch(url, opts = {}) {
  try {
    const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

// ─── IP Lookup ────────────────────────────────────────────────────────────────

async function ipLookup(ip) {
  // ip-api.com — free, no key
  const data = await safeFetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query,proxy,hosting`)
  if (!data || data.status === 'fail') return { error: data?.message || 'IP lookup failed' }

  // Check blacklist via abuseipdb-style free API
  let abuseScore = null
  try {
    const abuse = await safeFetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${data.query}&maxAgeInDays=90`, {
      headers: { 'Key': process.env.ABUSEIPDB_KEY || '', 'Accept': 'application/json' }
    })
    abuseScore = abuse?.data?.abuseConfidenceScore ?? null
  } catch {}

  return {
    ip: data.query,
    country: data.country,
    countryCode: data.countryCode,
    region: data.regionName,
    city: data.city,
    zip: data.zip,
    lat: data.lat,
    lon: data.lon,
    timezone: data.timezone,
    isp: data.isp,
    org: data.org,
    as: data.as,
    isProxy: data.proxy,
    isHosting: data.hosting,
    abuseScore,
  }
}

// ─── DNS Lookup ───────────────────────────────────────────────────────────────

async function dnsLookup(domain, type = 'A') {
  // Cloudflare DNS over HTTPS — free, no key
  const data = await safeFetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`, {
    headers: { 'Accept': 'application/dns-json' }
  })
  if (!data) return { error: 'DNS lookup failed' }

  const RCODE_NAMES = { 0: 'NOERROR', 1: 'FORMERR', 2: 'SERVFAIL', 3: 'NXDOMAIN', 5: 'REFUSED' }
  if (data.Status !== 0) return { error: `DNS error: ${RCODE_NAMES[data.Status] || 'Unknown error'}`, status: data.Status }

  const TYPE_NAMES = { 1: 'A', 2: 'NS', 5: 'CNAME', 6: 'SOA', 15: 'MX', 16: 'TXT', 28: 'AAAA', 33: 'SRV', 257: 'CAA' }

  return {
    domain,
    type,
    answers: (data.Answer || []).map(r => ({
      name: r.name,
      type: TYPE_NAMES[r.type] || r.type,
      ttl: r.TTL,
      data: r.data,
    })),
    authority: (data.Authority || []).map(r => ({
      name: r.name,
      type: TYPE_NAMES[r.type] || r.type,
      ttl: r.TTL,
      data: r.data,
    })),
  }
}

// ─── Whois Lookup ─────────────────────────────────────────────────────────────

async function whoisLookup(domain) {
  // whois.freeaitools.com free endpoint
  const data = await safeFetch(`https://api.whoisfreaks.com/v1.0/whois?apiKey=free&whois=live&domainName=${encodeURIComponent(domain)}`)
  
  // Fallback: rdap (free, no key)
  if (!data || data.status === 'error') {
    try {
      const rdap = await safeFetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`)
      if (rdap) {
        const registrar = rdap.entities?.find(e => e.roles?.includes('registrar'))
        const registrant = rdap.entities?.find(e => e.roles?.includes('registrant'))
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
    return { error: 'Whois lookup failed — try a different domain' }
  }

  return {
    domain: data.domain_name || domain,
    registrar: data.registrar_name || 'Unknown',
    created: data.create_date || null,
    expires: data.expiry_date || null,
    updated: data.update_date || null,
    status: Array.isArray(data.domain_status) ? data.domain_status : [data.domain_status].filter(Boolean),
    nameservers: data.name_servers || [],
    registrantName: data.registrant_name || null,
    registrantCountry: data.registrant_country || null,
    source: 'WhoisFreaks',
  }
}

// ─── SSL Checker ──────────────────────────────────────────────────────────────

async function sslCheck(domain) {
  // SSL Labs API — free, no key
  try {
    // Start analysis
    const startRes = await fetch(`https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(domain)}&startNew=on&all=done`, {
      signal: AbortSignal.timeout(5000)
    })
    const startData = await startRes.json()

    // If still in progress, return status
    if (startData.status === 'IN_PROGRESS' || startData.status === 'DNS') {
      return {
        domain,
        status: 'analyzing',
        message: 'SSL analysis in progress — this can take 60-90 seconds. Try again in a moment.',
      }
    }

    if (startData.status === 'READY') {
      const ep = startData.endpoints?.[0]
      return {
        domain,
        status: 'ready',
        grade: ep?.grade || 'N/A',
        gradeIgnoreTrust: ep?.gradeTrustIgnored || null,
        hasWarnings: ep?.hasWarnings || false,
        isExceptional: ep?.isExceptional || false,
        ipAddress: ep?.ipAddress,
        serverName: ep?.serverName,
        statusMessage: ep?.statusMessage,
      }
    }

    // Fallback: check via crt.sh if SSL Labs fails
    const crt = await safeFetch(`https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`)
    if (crt && crt.length > 0) {
      const latest = crt.sort((a, b) => new Date(b.not_after) - new Date(a.not_after))[0]
      return {
        domain,
        status: 'partial',
        issuer: latest.issuer_name,
        notBefore: latest.not_before,
        notAfter: latest.not_after,
        commonName: latest.common_name,
        message: 'Basic certificate info from crt.sh',
      }
    }

    return { error: 'SSL check failed', raw: startData }
  } catch (e) {
    return { error: e.message }
  }
}

// ─── Port Checker ─────────────────────────────────────────────────────────────

async function portCheck(host) {
  // Use portchecker.io free API
  const COMMON_PORTS = [
    { port: 21,   service: 'FTP' },
    { port: 22,   service: 'SSH' },
    { port: 23,   service: 'Telnet' },
    { port: 25,   service: 'SMTP' },
    { port: 53,   service: 'DNS' },
    { port: 80,   service: 'HTTP' },
    { port: 110,  service: 'POP3' },
    { port: 143,  service: 'IMAP' },
    { port: 443,  service: 'HTTPS' },
    { port: 465,  service: 'SMTPS' },
    { port: 587,  service: 'SMTP Alt' },
    { port: 993,  service: 'IMAPS' },
    { port: 3306, service: 'MySQL' },
    { port: 3389, service: 'RDP' },
    { port: 5432, service: 'PostgreSQL' },
    { port: 6379, service: 'Redis' },
    { port: 8080, service: 'HTTP Alt' },
    { port: 8443, service: 'HTTPS Alt' },
  ]

  // portchecker.io — free API
  const results = await Promise.allSettled(
    COMMON_PORTS.map(async ({ port, service }) => {
      try {
        const res = await fetch(`https://portchecker.io/api/v1/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ host, ports: [port] }),
          signal: AbortSignal.timeout(6000),
        })
        const data = await res.json()
        const portResult = data?.checks?.[0]
        return { port, service, open: portResult?.status === true, status: portResult?.status }
      } catch {
        return { port, service, open: null, status: 'timeout' }
      }
    })
  )

  return {
    host,
    ports: results.map((r, i) => r.status === 'fulfilled'
      ? r.value
      : { ...COMMON_PORTS[i], open: null, status: 'error' }
    ),
  }
}

// ─── Ping / Traceroute ────────────────────────────────────────────────────────

async function pingCheck(host) {
  // Use multiple methods to check if host is reachable
  const results = {}

  // Method 1: HTTP HEAD request (shows if web server responding)
  try {
    const start = Date.now()
    const res = await fetch(`https://${host}`, {
      method: 'HEAD', signal: AbortSignal.timeout(5000),
      redirect: 'follow',
    })
    results.https = { reachable: true, ms: Date.now() - start, status: res.status }
  } catch {
    try {
      const start = Date.now()
      const res = await fetch(`http://${host}`, {
        method: 'HEAD', signal: AbortSignal.timeout(5000),
        redirect: 'follow',
      })
      results.http = { reachable: true, ms: Date.now() - start, status: res.status }
    } catch {
      results.http = { reachable: false }
    }
  }

  // Method 2: DNS resolution check via Cloudflare
  try {
    const dns = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=A`, {
      headers: { 'Accept': 'application/dns-json' },
      signal: AbortSignal.timeout(4000),
    })
    const dnsData = await dns.json()
    results.dns = {
      resolved: dnsData.Status === 0,
      ips: (dnsData.Answer || []).filter(r => r.type === 1).map(r => r.data),
    }
  } catch {
    results.dns = { resolved: false }
  }

  // Method 3: Check via external ping API (ping.canopy.tools — free)
  let pingData = null
  try {
    const pingRes = await fetch(`https://ping.canopy.tools/ping?host=${encodeURIComponent(host)}`, {
      signal: AbortSignal.timeout(8000)
    })
    pingData = await pingRes.json()
  } catch {}

  const isReachable = results.https?.reachable || results.http?.reachable || results.dns?.resolved
  const latency = results.https?.ms || results.http?.ms || null

  return {
    host,
    reachable: isReachable,
    latency,
    https: results.https,
    http: results.http,
    dns: results.dns,
    ping: pingData,
    note: 'Browser-based ping — actual ICMP ping not available via web',
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const tool   = searchParams.get('tool')
  const query  = searchParams.get('q')
  const type   = searchParams.get('type') || 'A'

  if (!tool || !query) return NextResponse.json({ error: 'Missing tool or query' }, { status: 400 })

  try {
    let result
    switch (tool) {
      case 'ip':    result = await ipLookup(query); break
      case 'dns':   result = await dnsLookup(query, type); break
      case 'whois': result = await whoisLookup(query); break
      case 'ssl':   result = await sslCheck(query); break
      case 'port':  result = await portCheck(query); break
      case 'ping':  result = await pingCheck(query); break
      default: return NextResponse.json({ error: 'Unknown tool' }, { status: 400 })
    }
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
