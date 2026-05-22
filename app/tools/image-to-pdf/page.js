'use client';
import { useState } from 'react';

export default function ImageToPDF() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    setImages(newImages);
  };

  const moveDown = (index) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    setImages(newImages);
  };

  const generatePDF = async () => {
    if (images.length === 0) return;
    setLoading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = 210;
      const pageHeight = 297;

      for (let i = 0; i < images.length; i++) {
        if (i > 0) pdf.addPage();
        const img = await new Promise((resolve) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.src = images[i].url;
        });
        const imgRatio = img.width / img.height;
        const pageRatio = pageWidth / pageHeight;
        let w, h, x, y;
        if (imgRatio > pageRatio) {
          w = pageWidth;
          h = pageWidth / imgRatio;
          x = 0;
          y = (pageHeight - h) / 2;
        } else {
          h = pageHeight;
          w = pageHeight * imgRatio;
          x = (pageWidth - w) / 2;
          y = 0;
        }
        pdf.addImage(images[i].url, 'JPEG', x, y, w, h);
      }
      pdf.save('therojak-images.pdf');
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <main style={{background: '#0a0a0f', minHeight: '100vh', fontFamily: 'sans-serif'}}>
      <header style={{background: '#0d0d1a', borderBottom: '1px solid #1a1a3e', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '12px'}}>
        <a href="/" style={{color: '#4a4a7a', textDecoration: 'none', fontSize: '13px'}}>Back</a>
        <span style={{color: '#fff', fontSize: '16px', fontWeight: '500'}}>The<span style={{color: '#00b4ff'}}>Rojak</span></span>
      </header>

      <section style={{maxWidth: '700px', margin: '0 auto', padding: '60px 24px'}}>
        <h1 style={{color: '#fff', fontSize: '32px', fontWeight: '500', margin: '0 0 8px', textAlign: 'center'}}>
          Image to <span style={{color: '#00b4ff'}}>PDF</span>
        </h1>
        <p style={{color: '#4a4a7a', textAlign: 'center', marginBottom: '40px'}}>Combine images into a PDF. Free, no signup.</p>

        <label style={{display: 'block', border: '2px dashed #1a1a3e', borderRadius: '12px', padding: '32px 24px', textAlign: 'center', cursor: 'pointer', background: '#0d0d1a', marginBottom: '24px'}}>
          <div style={{fontSize: '36px', marginBottom: '8px'}}>📁</div>
          <p style={{color: '#4a4a7a', margin: '0 0 4px'}}>Click to upload images</p>
          <p style={{color: '#2a2a4a', fontSize: '13px', margin: '0'}}>JPG, PNG, WebP — multiple files supported</p>
          <input type="file" accept="image/*" multiple onChange={handleUpload} style={{display: 'none'}} />
        </label>

        {images.length > 0 && (
          <div style={{marginBottom: '24px'}}>
            <p style={{color: '#4a4a7a', fontSize: '13px', marginBottom: '12px'}}>{images.length} image(s) — drag to reorder</p>
            {images.map((img, index) => (
              <div key={index} style={{background: '#0d0d1a', border: '1px solid #1a1a3e', borderRadius: '8px', padding: '12px 16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px'}}>
                <img src={img.url} alt={img.name} style={{width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px'}} />
                <span style={{color: '#e0e0ff', fontSize: '13px', flex: 1}}>{img.name}</span>
                <button onClick={() => moveUp(index)} style={{background: 'transparent', border: '1px solid #1a1a3e', borderRadius: '4px', color: '#4a4a7a', cursor: 'pointer', padding: '4px 8px'}}>↑</button>
                <button onClick={() => moveDown(index)} style={{background: 'transparent', border: '1px solid #1a1a3e', borderRadius: '4px', color: '#4a4a7a', cursor: 'pointer', padding: '4px 8px'}}>↓</button>
                <button onClick={() => removeImage(index)} style={{background: 'transparent', border: '1px solid #ff444422', borderRadius: '4px', color: '#ff4444', cursor: 'pointer', padding: '4px 8px'}}>✕</button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={generatePDF}
          disabled={images.length === 0 || loading}
          style={{width: '100%', padding: '14px', background: images.length === 0 ? '#1a1a3e' : '#00b4ff', border: 'none', borderRadius: '8px', color: images.length === 0 ? '#4a4a7a' : '#000', fontSize: '15px', fontWeight: '600', cursor: images.length === 0 ? 'not-allowed' : 'pointer'}}
        >
          {loading ? 'Generating PDF...' : 'Convert to PDF'}
        </button>
      </section>
    </main>
  );
}
