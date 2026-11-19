import React from 'react';
import '../../styles/public-header.css';

/** Encabezado institucional del portal público (logo + enlace al sitio web). */
export default function PublicHeader() {
  return (
    <header className="site-header">
      <div className="header-container">
        <div className="brand-group">
          <a href="/" className="brand-logo" title="IPS Clinical House - PQRSF">
            <img
              src="/assets/images.png"
              alt="IPS Clinical House - Calidad en Salud"
              className="official-logo-img"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </a>
        </div>

        <div className="header-action-group">
          <div className="header-action">
            <a href="https://clinicalhouse.co/" target="_blank" rel="noopener noreferrer" className="btn-visit-site">
              <span>Ir al sitio web</span>
              <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h4a.75.75 0 010 1.5h-4z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M6.19 13.22a.75.75 0 001.06 1.06l7.5-7.5V10a.75.75 0 001.5 0V4.75a.75.75 0 00-.75-.75H10.5a.75.75 0 000 1.5h3.19l-7.5 7.47z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="header-color-bar" aria-hidden="true">
        <span className="bar-seg-1" />
        <span className="bar-seg-2" />
        <span className="bar-seg-3" />
        <span className="bar-seg-4" />
        <span className="bar-seg-5" />
      </div>
    </header>
  );
}
