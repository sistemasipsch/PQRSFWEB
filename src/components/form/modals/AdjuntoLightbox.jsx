import React, { useEffect } from 'react';

/** Visor ampliado de un adjunto (imagen o PDF) antes de radicar. */
export default function AdjuntoLightbox({ item, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={item.name}>
        <div className="lightbox-modern-header">
          <div className="lightbox-header-left">
            <span className={`lightbox-tag-badge ${item.type === 'pdf' ? 'pdf' : ''}`}>
              {item.type === 'image' ? 'Imagen' : 'Documento PDF'}
            </span>
            <span className="lightbox-title-text" title={item.name}>{item.name}</span>
          </div>
          <div className="lightbox-header-actions">
            <button type="button" onClick={onClose} className="lightbox-close-circle" title="Cerrar vista previa">
              &times;
            </button>
          </div>
        </div>
        <div className="lightbox-body">
          {item.type === 'image' ? (
            <img src={item.url} alt={item.name} className="lightbox-img" />
          ) : (
            <iframe src={item.url} title={item.name} className="lightbox-pdf-frame" />
          )}
        </div>
      </div>
    </div>
  );
}
