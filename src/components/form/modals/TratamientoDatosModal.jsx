import React, { useEffect, useRef, useState } from 'react';
import { SECCIONES_POLITICA, TEXTO_ACEPTACION } from '../../../constants/politicaDatos';

/**
 * Autorización de tratamiento de datos personales. Sin aceptarla no se puede diligenciar el formulario.
 * `soloLectura`: para volver a consultar la política después de haberla aceptado.
 */
export default function TratamientoDatosModal({ aceptado, onAceptar, onRechazar, onCerrar, soloLectura = false }) {
  const [marcado, setMarcado] = useState(aceptado);
  const tarjeta = useRef(null);

  useEffect(() => {
    tarjeta.current?.focus();
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previo; };
  }, []);

  return (
    <div className="modal-overlay">
      <div
        ref={tarjeta}
        tabIndex={-1}
        className="modal-content-card datos-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="datos-titulo"
      >
        <header className="datos-header">
          <div>
            <h2 id="datos-titulo">Autorización de tratamiento de datos personales</h2>
            <p>Lea la política antes de diligenciar el formulario.</p>
          </div>
        </header>

        <div className="datos-cuerpo">
          {SECCIONES_POLITICA.map((s) => (
            <section key={s.titulo} className="datos-seccion">
              <h3>{s.titulo}</h3>
              <p>{s.texto}</p>
            </section>
          ))}
        </div>

        <footer className="datos-footer">
          {soloLectura ? (
            <div className="datos-acciones">
              <button type="button" className="btn-submit btn-inline" onClick={onCerrar}>Cerrar</button>
            </div>
          ) : (
            <>
              <label className={`datos-check ${marcado ? 'on' : ''}`}>
                <input type="checkbox" checked={marcado} onChange={(e) => setMarcado(e.target.checked)} />
                <span>{TEXTO_ACEPTACION}</span>
              </label>
              <div className="datos-acciones">
                <button type="button" className="btn-admin-header" onClick={onRechazar}>No acepto</button>
                <button
                  type="button"
                  className="btn-submit btn-inline"
                  disabled={!marcado}
                  onClick={onAceptar}
                  title={marcado ? undefined : 'Marque la casilla para continuar'}
                >
                  Acepto y continuar
                </button>
              </div>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
