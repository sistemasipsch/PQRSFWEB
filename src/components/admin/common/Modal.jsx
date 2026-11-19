import React, { useEffect } from 'react';
import Icon from './Icon';

/** Modal base del panel. Se cierra con Escape o clic fuera. */
/** `className="tail-modal-fit"`: la ventana se ajusta a la pantalla sin barra de desplazamiento. */
export default function Modal({ title, subtitle, onClose, children, footer, width = 640, className = '' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="tail-modal-overlay" onMouseDown={onClose}>
      <div
        className={`tail-modal-card ${className}`}
        style={{ maxWidth: width }}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="tail-modal-header">
          <div style={{ minWidth: 0 }}>
            {typeof title === 'string' ? <h3>{title}</h3> : title}
            {subtitle && <p className="tail-modal-subtitle">{subtitle}</p>}
          </div>
          <button type="button" className="tail-modal-close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={18} />
          </button>
        </div>
        {children}
        {footer && <div className="tail-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
