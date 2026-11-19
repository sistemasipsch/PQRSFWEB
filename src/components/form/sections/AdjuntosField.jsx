import React from 'react';
import { ADJUNTOS } from '../../../constants/pqrsf';
import { formatearBytes } from '../../../utils/format';

const ICONO_PDF = 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5h-2v1h2c.55 0 1-.45 1-1s-.45-1-1-1zm5.5 0h-2v3h2c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1zm-7-5.5h10v2H8V6zm10 12H6V4h12v14z';
const ICONO_WORD = 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z';

/** Zona de carga de adjuntos con validación (máx. 3 archivos, 20 MB en total) y vistas previas. */
export default function AdjuntosField({ adjuntos, onVerPreliminar }) {
  const { items, totalBytes, error, setError, agregar, quitar } = adjuntos;

  return (
    <div className="attachments-wrapper">
      {error && (
        <div className="attachments-error-alert" role="alert">
          <div className="attachments-error-content">
            <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <strong>Aviso sobre documentos adjuntos:</strong>
              <span>{error}</span>
            </div>
          </div>
          <button type="button" className="attachments-error-close" onClick={() => setError('')} title="Cerrar aviso">
            &times;
          </button>
        </div>
      )}

      <div className="attachments-limit-notice">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span>
          Puede adjuntar hasta {ADJUNTOS.maxArchivos} archivos (Word, PDF, JPG/PNG) con un máximo de 20 MB en total.
          {items.length > 0 && <> Usado: <b>{formatearBytes(totalBytes)}</b> de 20 MB.</>}
        </span>
      </div>

      <div className="attachments-dropzone">
        <label htmlFor="file-input" className="dropzone-label">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
          <span>Haga clic aquí para adjuntar documentos de soporte</span>
          <span className="dropzone-subtext">Formatos permitidos: Word (.doc, .docx), PDF (.pdf), Imágenes (.jpg, .jpeg, .png)</span>
        </label>
        <input
          type="file"
          id="file-input"
          multiple
          accept={ADJUNTOS.extensiones.join(',')}
          onChange={(e) => { agregar(e.target.files); e.target.value = ''; }}
          hidden
        />
      </div>

      {items.length > 0 && (
        <div className="attachment-previews-grid">
          {items.map((item, idx) => (
            <div key={`${item.name}-${idx}`} className="preview-card">
              <button type="button" className="preview-btn-delete" onClick={() => quitar(idx)} title="Eliminar archivo">
                &times;
              </button>

              <button
                type="button"
                className="preview-thumbnail-box"
                onClick={() => item.type !== 'word' && onVerPreliminar(item)}
                disabled={item.type === 'word'}
              >
                {item.type === 'image' ? (
                  <img src={item.url} alt={item.name} className="preview-thumb-img" title="Clic para ampliar imagen preliminar" />
                ) : (
                  <span className={`preview-doc-icon ${item.type}`}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d={item.type === 'pdf' ? ICONO_PDF : ICONO_WORD} />
                    </svg>
                    <span>{item.type === 'pdf' ? 'VER PDF' : 'WORD DOC'}</span>
                  </span>
                )}
              </button>

              <div className="preview-meta">
                <span className="preview-file-name" title={item.name}>{item.name}</span>
                <span className="preview-file-size">{item.size}</span>
              </div>

              {item.type !== 'word' && (
                <button type="button" className="preview-overlay-btn" onClick={() => onVerPreliminar(item)} title="Ver preliminar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>Ver preliminar</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
