'use client'
import Link from 'next/link'
import { AuthHeader } from './AuthHeader'

export default function Home() {
  const tools = [
    { emoji: '🖼️', name: 'Image Compressor', desc: 'Compress images instantly', href: '/tools/image-compressor', ready: true },
    { emoji: '📱', name: 'QR Generator', desc: 'Generate QR codes free', href: '/tools/qr-generator', ready: true },
    { emoji: '🔐', name: 'Password Generator', desc: 'Strong passwords instantly', href: '/tools/password-generator', ready: true },
    { emoji: '📄', name: 'Image to PDF', desc: 'Combine images into PDF', href: '/tools/image-to-pdf', ready: true },
    { emoji: '🧾', name: 'Invoice Generator', desc: 'Create professional invoices', href: '/tools/invoice-generator', ready: true },
    { emoji: '✅', name: 'Task Tracker', desc: 'Manage your tasks with login - Sign-in needed',  href: '/tools/task-tracker', ready: true },
    { emoji: '📅', name: 'Calendar', desc: 'Track events & important dates - Sign-in needed', href: '/tools/calendar', ready: true },
    { emoji: '💱', name: 'Currency & Gold', desc: 'Live MYR, USD & gold rates', href: '/tools/currency', ready: true },
  ];

  return (
    <main style={{background: 'var(--bg-base)', minHeight: '100vh', fontFamily: 'sans-serif'}}>
      <header style={{background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <span style={{width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)', display: 'inline-block'}}></span>
          <span style={{color: 'var(--text-primary)', fontSize: '20px', fontWeight: '500'}}>The<span style={{color: 'var(--accent)'}}>Rojak</span></span>
        </div>
        <AuthHeader />
      </header>

      <section style={{textAlign: 'center', padding: '60px 24px 40px', background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-base), 100%)'}}>
        <h1 style={{color: 'var(--text-primary)', fontSize: '36px', fontWeight: '500', margin: '0 0 12px'}}>
          Your Everyday <span style={{color: 'var(--accent)'}}>Free Tools</span>
        </h1>
        <p style={{color: 'var(--text-muted)', fontSize: '16px', margin: '0'}}>Simple, fast, and free. No signup required.</p>
      </section>

      <section style={{maxWidth: '1100px', margin: '0 auto', padding: '0 24px 60px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px'}}>
        {tools.map((tool) => (
          tool.ready ? (
            <Link key={tool.name} href={tool.href} style={{textDecoration: 'none'}}>
              <div style={{background: 'var(--bg-card)', border: '1px solid rgba(0,180,255,0.27)', borderRadius: '10px', padding: '24px 20px', cursor: 'pointer', height: '100%'}}>
                <div style={{fontSize: '28px', marginBottom: '12px'}}>{tool.emoji}</div>
                <h3 style={{color: 'var(--accent)', fontSize: '15px', fontWeight: '500', margin: '0 0 6px'}}>{tool.name}</h3>
                <p style={{color: 'var(--text-muted)', fontSize: '13px', margin: '0'}}>{tool.desc}</p>
              </div>
            </Link>
          ) : (
            <div key={tool.name} style={{background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '24px 20px', opacity: '0.6'}}>
              <div style={{fontSize: '28px', marginBottom: '12px'}}>{tool.emoji}</div>
              <h3 style={{color: 'var(--text-primary)', fontSize: '15px', fontWeight: '500', margin: '0 0 6px'}}>{tool.name}</h3>
              <p style={{color: 'var(--text-muted)', fontSize: '13px', margin: '0'}}>{tool.desc}</p>
            </div>
          )
        ))}

        <div style={{background: '#0a0f1a', border: '1px dashed rgba(0,180,255,0.27)', borderRadius: '10px', padding: '24px 20px'}}>
          <div style={{fontSize: '28px', marginBottom: '12px'}}>➕</div>
          <h3 style={{color: 'var(--accent)', fontSize: '15px', fontWeight: '500', margin: '0 0 6px'}}>More Coming Soon</h3>
          <p style={{color: '#1a3a5e', fontSize: '13px', margin: '0'}}>New tools added regularly</p>
        </div>
      </section>

      <footer style={{textAlign: 'center', padding: '20px', color: '#2a2a4a', fontSize: '12px', borderTop: '1px solid var(--border)'}}>
        © 2026 TheRojak.com — Free tools for everyone
      </footer>
    </main>
  );
}