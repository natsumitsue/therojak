'use client';
import { useState } from 'react';

export default function PasswordGenerator() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    let chars = '';
    if (useUpper) chars += upper;
    if (useLower) chars += lower;
    if (useNumbers) chars += numbers;
    if (useSymbols) chars += symbols;
    if (!chars) return;
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    setPassword(result);
    setCopied(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const strength = () => {
    const score = [useUpper, useLower, useNumbers, useSymbols].filter(Boolean).length;
    if (length < 8 || score < 2) return { label: 'Weak', color: '#ff4444' };
    if (length < 12 || score < 3) return { label: 'Medium', color: '#ffaa00' };
    return { label: 'Strong', color: '#00b4ff' };
  };

  const s = strength();

  const toggle = (val, set) => set(!val);

  return (
    <main style={{background: '#0a0a0f', minHeight: '100vh', fontFamily: 'sans-serif'}}>
      <header style={{background: '#0d0d1a', borderBottom: '1px solid #1a1a3e', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '12px'}}>
        <a href="/" style={{color: '#4a4a7a', textDecoration: 'none', fontSize: '13px'}}>Back</a>
        <span style={{color: '#fff', fontSize: '16px', fontWeight: '500'}}>The<span style={{color: '#00b4ff'}}>Rojak</span></span>
      </header>
      <section style={{maxWidth: '600px', margin: '0 auto', padding: '60px 24px'}}>
        <h1 style={{color: '#fff', fontSize: '32px', fontWeight: '500', margin: '0 0 8px', textAlign: 'center'}}>Password <span style={{color: '#00b4ff'}}>Generator</span></h1>
        <p style={{color: '#4a4a7a', textAlign: 'center', marginBottom: '40px'}}>Generate strong passwords instantly. Free, no signup.</p>

        <div style={{background: '#0d0d1a', border: '1px solid #1a1a3e', borderRadius: '12px', padding: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'}}>
          <span style={{color: '#fff', fontSize: '18px', fontFamily: 'monospace', wordBreak: 'break-all', flex: 1}}>{password || 'Click generate...'}</span>
          {password && (
            <button onClick={copy} style={{background: copied ? '#00b4ff22' : 'transparent', border: '1px solid #1a1a3e', borderRadius: '8px', padding: '8px 16px', color: copied ? '#00b4ff' : '#4a4a7a', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap'}}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>

        {password && (
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px'}}>
            <span style={{color: '#4a4a7a', fontSize: '13px'}}>Strength:</span>
            <span style={{color: s.color, fontSize: '13px', fontWeight: '500'}}>{s.label}</span>
            <div style={{flex: 1, height: '4px', background: '#1a1a3e', borderRadius: '2px'}}>
              <div style={{height: '100%', borderRadius: '2px', background: s.color, width: s.label === 'Weak' ? '33%' : s.label === 'Medium' ? '66%' : '100%'}}></div>
            </div>
          </div>
        )}

        <div style={{background: '#0d0d1a', border: '1px solid #1a1a3e', borderRadius: '12px', padding: '24px', marginBottom: '16px'}}>
          <div style={{marginBottom: '20px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
              <span style={{color: '#e0e0ff', fontSize: '14px'}}>Length</span>
              <span style={{color: '#00b4ff', fontSize: '14px', fontWeight: '500'}}>{length}</span>
            </div>
            <input type="range" min="4" max="64" value={length} onChange={(e) => setLength(Number(e.target.value))} style={{width: '100%', accentColor: '#00b4ff'}} />
          </div>

          {[
            { label: 'Uppercase (A-Z)', val: useUpper, set: setUseUpper },
            { label: 'Lowercase (a-z)', val: useLower, set: setUseLower },
            { label: 'Numbers (0-9)', val: useNumbers, set: setUseNumbers },
            { label: 'Symbols (!@#$)', val: useSymbols, set: setUseSymbols },
          ].map((opt) => (
            <div key={opt.label} onClick={() => toggle(opt.val, opt.set)} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid #1a1a3e', cursor: 'pointer'}}>
              <span style={{color: '#e0e0ff', fontSize: '14px'}}>{opt.label}</span>
              <div style={{width: '40px', height: '22px', borderRadius: '11px', background: opt.val ? '#00b4ff' : '#1a1a3e', position: 'relative', transition: 'background 0.2s'}}>
                <div style={{position: 'absolute', top: '3px', left: opt.val ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s'}}></div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={generate} style={{width: '100%', padding: '14px', background: '#00b4ff', border: 'none', borderRadius: '8px', color: '#000', fontSize: '15px', fontWeight: '600', cursor: 'pointer'}}>
          Generate Password
        </button>
      </section>
    </main>
  );
}
