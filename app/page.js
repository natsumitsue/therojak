import Link from 'next/link';

export default function Home() {
  const tools = [
    { emoji: '🖼️', name: 'Image Compressor', desc: 'Compress images instantly', href: '/tools/image-compressor', ready: true },
    { emoji: '📱', name: 'QR Generator', desc: 'Generate QR codes free', href: '/tools/qr-generator', ready: true },
    { emoji: '🔐', name: 'Password Generator', desc: 'Strong passwords instantly', href: '/tools/password-generator', ready: true },
    { emoji: '📄', name: 'Image to PDF', desc: 'Combine images into PDF', href: '/tools/image-to-pdf', ready: true },
    { emoji: '🧾', name: 'Invoice Generator', desc: 'Create professional invoices', href: '/tools/invoice-generator', ready: true },
  ];

  return (
    <main style={{background: '#0a0a0f', minHeight: '100vh', fontFamily: 'sans-serif'}}>
      <header style={{background: '#0d0d1a', borderBottom: '1px solid #1a1a3e', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <span style={{width: '8px', height: '8px', borderRadius: '50%', background: '#00b4ff', boxShadow: '0 0 8px #00b4ff', display: 'inline-block'}}></span>
          <span style={{color: '#fff', fontSize: '20px', fontWeight: '500'}}>The<span style={{color: '#00b4ff'}}>Rojak</span></span>
        </div>
        <span style={{color: '#4a4a7a', fontSize: '13px'}}>Free Online Tools</span>
      </header>

      <section style={{textAlign: 'center', padding: '60px 24px 40px', background: 'linear-gradient(180deg, #0d0d1a 0%, #0a0a0f 100%)'}}>
        <h1 style={{color: '#fff', fontSize: '36px', fontWeight: '500', margin: '0 0 12px'}}>
          Your Everyday <span style={{color: '#00b4ff'}}>Free Tools</span>
        </h1>
        <p style={{color: '#4a4a7a', fontSize: '16px', margin: '0'}}>Simple, fast, and free. No signup required.</p>
      </section>

      <section style={{maxWidth: '1100px', margin: '0 auto', padding: '0 24px 60px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px'}}>
        {tools.map((tool) => (
          tool.ready ? (
            <Link key={tool.name} href={tool.href} style={{textDecoration: 'none'}}>
              <div style={{background: '#0d0d1a', border: '1px solid #00b4ff44', borderRadius: '10px', padding: '24px 20px', cursor: 'pointer', height: '100%'}}>
                <div style={{fontSize: '28px', marginBottom: '12px'}}>{tool.emoji}</div>
                <h3 style={{color: '#00b4ff', fontSize: '15px', fontWeight: '500', margin: '0 0 6px'}}>{tool.name}</h3>
                <p style={{color: '#4a4a7a', fontSize: '13px', margin: '0'}}>{tool.desc}</p>
              </div>
            </Link>
          ) : (
            <div key={tool.name} style={{background: '#0d0d1a', border: '1px solid #1a1a3e', borderRadius: '10px', padding: '24px 20px', opacity: '0.6'}}>
              <div style={{fontSize: '28px', marginBottom: '12px'}}>{tool.emoji}</div>
              <h3 style={{color: '#e0e0ff', fontSize: '15px', fontWeight: '500', margin: '0 0 6px'}}>{tool.name}</h3>
              <p style={{color: '#4a4a7a', fontSize: '13px', margin: '0'}}>{tool.desc}</p>
            </div>
          )
        ))}

        <div style={{background: '#0a0f1a', border: '1px dashed #00b4ff44', borderRadius: '10px', padding: '24px 20px'}}>
          <div style={{fontSize: '28px', marginBottom: '12px'}}>➕</div>
          <h3 style={{color: '#00b4ff', fontSize: '15px', fontWeight: '500', margin: '0 0 6px'}}>More Coming Soon</h3>
          <p style={{color: '#1a3a5e', fontSize: '13px', margin: '0'}}>New tools added regularly</p>
        </div>
      </section>

      <footer style={{textAlign: 'center', padding: '20px', color: '#2a2a4a', fontSize: '12px', borderTop: '1px solid #1a1a3e'}}>
        © 2026 TheRojak.com — Free tools for everyone
      </footer>
    </main>
  );
}