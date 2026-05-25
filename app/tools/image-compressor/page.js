'use client';
import { useState } from 'react';
import imageCompression from 'browser-image-compression';

export default function ImageCompressor() {
  const [original, setOriginal] = useState(null);
  const [compressed, setCompressed] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setOriginal({ file, url: URL.createObjectURL(file), size: file.size });
    setCompressed(null);
    setLoading(true);
    try {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
      const result = await imageCompression(file, options);
      setCompressed({ file: result, url: URL.createObjectURL(result), size: result.size });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const savings = original && compressed
    ? Math.round((1 - compressed.size / original.size) * 100)
    : 0;

  return (
    <main style={{background: 'var(--bg-base)', minHeight: '100vh', fontFamily: 'sans-serif'}}>
      <header style={{background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '12px'}}>
        <a href="/" style={{color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px'}}>Back</a>
        <span style={{color: '#fff', fontSize: '16px', fontWeight: '500'}}>The<span style={{color: 'var(--accent)'}}>Rojak</span></span>
      </header>
      <section style={{maxWidth: '700px', margin: '0 auto', padding: '60px 24px'}}>
        <h1 style={{color: '#fff', fontSize: '32px', fontWeight: '500', margin: '0 0 8px', textAlign: 'center'}}>Image <span style={{color: 'var(--accent)'}}>Compressor</span></h1>
        <p style={{color: 'var(--text-muted)', textAlign: 'center', marginBottom: '40px'}}>Compress images instantly. Free, no signup.</p>
        <label style={{display: 'block', border: '2px dashed var(--border)', borderRadius: '12px', padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-card)'}}>
          <div style={{fontSize: '40px', marginBottom: '12px'}}>🖼️</div>
          <p style={{color: 'var(--text-muted)', margin: '0 0 8px'}}>Click to upload image</p>
          <p style={{color: '#2a2a4a', fontSize: '13px', margin: '0'}}>JPG, PNG, WebP supported</p>
          <input type="file" accept="image/*" onChange={handleUpload} style={{display: 'none'}} />
        </label>
        {loading && (
          <div style={{textAlign: 'center', marginTop: '32px', color: 'var(--accent)'}}>Compressing...</div>
        )}
        {original && compressed && (
          <div style={{marginTop: '40px'}}>
            <div style={{background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <p style={{color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 4px'}}>Original</p>
                <p style={{color: '#fff', fontSize: '20px', fontWeight: '500', margin: '0'}}>{formatSize(original.size)}</p>
              </div>
              <div style={{color: 'var(--accent)', fontSize: '24px'}}>→</div>
              <div>
                <p style={{color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 4px'}}>Compressed</p>
                <p style={{color: 'var(--accent)', fontSize: '20px', fontWeight: '500', margin: '0'}}>{formatSize(compressed.size)}</p>
              </div>
              <div style={{background: 'var(--accent)22', border: '1px solid rgba(0,180,255,0.27)', borderRadius: '8px', padding: '8px 16px'}}>
                <p style={{color: 'var(--accent)', fontSize: '20px', fontWeight: '600', margin: '0'}}>{savings}% saved</p>
              </div>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px'}}>
              <div>
                <p style={{color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px'}}>Original</p>
                <img src={original.url} alt="Original" style={{width: '100%', borderRadius: '8px', border: '1px solid var(--border)'}} />
              </div>
              <div>
                <p style={{color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px'}}>Compressed</p>
                <img src={compressed.url} alt="Compressed" style={{width: '100%', borderRadius: '8px', border: '1px solid rgba(0,180,255,0.27)'}} />
              </div>
            </div>
            <a href={compressed.url} download="compressed-image.jpg" style={{display: 'block', textAlign: 'center', padding: '14px', background: 'var(--accent)', borderRadius: '8px', color: '#000', textDecoration: 'none', fontSize: '15px', fontWeight: '600'}}>Download Compressed Image</a>
          </div>
        )}
      </section>
    </main>
  );
}
