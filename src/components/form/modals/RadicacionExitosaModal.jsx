import React, { useEffect } from 'react';
import { imprimirComprobante } from '../../../utils/imprimir';

/** Confirmación de radicación con el número oficial y el comprobante imprimible (PDF). */
export default function RadicacionExitosaModal({ radicacion: r, onNueva }) {
  // Bloquea el scroll de la página de fondo y permite cerrar con Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onNueva();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onNueva]);

  return (
    <div className="modal-overlay">
      <div className="modal-content-card success-card" role="dialog" aria-modal="true" aria-labelledby="exito-titulo">
        <button type="button" className="modal-close-x" onClick={onNueva} aria-label="Cerrar" title="Cerrar">
          &times;
        </button>

        <div className="success-badge-icon">&#10003;</div>

        <h2 id="exito-titulo" className="success-title">¡Solicitud Radicada Exitosamente!</h2>
        <p className="success-text">
          Su requerimiento ha sido ingresado en el Sistema Oficial de Información y Atención al Usuario (SIAU) de IPS Clinical House.
        </p>

        <div className="consecutive-banner">
          <div className="consecutive-label">Número Oficial de Radicado:</div>
          <div className="consecutive-number">{r.consecutivo}</div>
          <div className="consecutive-hint">Conserve este código para seguimiento institucional</div>
        </div>

        <div className="success-actions">
          <button type="button" className="btn-admin-header" onClick={() => imprimirComprobante(r)} title="Abre el comprobante para imprimir o guardar como PDF">
            Imprimir / Guardar PDF
          </button>
          <button type="button" className="btn-submit btn-inline" onClick={onNueva}>
            Radicar Nueva Solicitud
          </button>
        </div>
      </div>
    </div>
  );
}
