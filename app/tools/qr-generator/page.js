'use client';
import { useState } from 'react';

export default function QRGenerator() {
  const [text, setText] = useState('');
  const [qrUrl, setQrUrl] = useState('');

  const generateQR = () => {
    if (!text) return;
    const encoded = encodeURIComponent(text);
    setQrUrl('https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encoded);
  };

  return (
    <main style={{background: 'var(--bg-base)', minHeight: '100vh', fontFamily: 'sans-serif'}}>
      <header style={{background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '12px'}}>
        <a href="/" style={{color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px'}}>Back</a>
        <span style={{color: '#fff', fontSize: '16px', fontWeight: '500'}}>The<span style={{color: 'var(--accent)'}}>Rojak</span></span>
      </header>
      <section style={{maxWidth: '600px', margin: '0 auto', padding: '60px 24px'}}>
        <h1 style={{color: '#fff', fontSize: '32px', fontWeight: '500', margin: '0 0 8px', textAlign: 'center'}}>QR <span style={{color: 'var(--accent)'}}>Generator</span></h1>
        <p style={{color: 'var(--text-muted)', textAlign: 'center', marginBottom: '40px'}}>Generate QR codes instantly. Free, no signup.</p>
        <input type="text" placeholder="Enter URL or text..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && generateQR()} style={{width: '100%', padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '15px', boxSizing: 'border-box', outline: 'none', marginBottom: '16px', display: 'block'}} />
        <button onClick={generateQR} style={{width: '100%', padding: '14px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#000', fontSize: '15px', fontWeight: '600', cursor: 'pointer'}}>Generate QR Code</button>
        {qrUrl && (
          <div style={{marginTop: '40px', textAlign: 'center'}}>
            <div style={{background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', display: 'inline-block'}}>
              <img src={qrUrl} alt="QR Code" style={{display: 'block', borderRadius: '8px'}} />
            </div>
            <p style={{color: 'var(--text-muted)', fontSize: '13px', marginTop: '16px'}}>Right-click image to save</p>
            <a href={qrUrl} download="qrcode.png" style={{display: 'inline-block', marginTop: '12px', padding: '10px 24px', border: '1px solid var(--accent)', borderRadius: '8px', color: 'var(--accent)', textDecoration: 'none', fontSize: '14px'}}>Download QR Code</a>
          </div>
        )}
      </section>
    </main>
  );
}
