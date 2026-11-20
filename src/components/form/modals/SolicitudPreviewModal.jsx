import React, { useEffect } from 'react';
import { MEDIOS_RESPUESTA } from '../../../constants/pqrsf';
import '../../../styles/form-preview.css';

const Dato = ({ label, children }) => (
  <div className="sp-dato">
    <dt>{label}</dt>
    <dd>{children || '—'}</dd>
  </div>
);

const nombre = (...partes) => partes.filter(Boolean).join(' ');

/** Vista preliminar de la solicitud que el ciudadano revisa antes de radicar. */
export default function SolicitudPreviewModal({ datos: d, archivos, enviando, onEditar, onConfirmar }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !enviando && onEditar();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [enviando, onEditar]);


  const destino =
    d.medioRespuesta === 'A' ? nombre(d.respDireccion, d.respBarrio && `· ${d.respBarrio}`, d.respMunicipio && `· ${d.respMunicipio}`)
      : d.medioRespuesta === 'B' ? nombre(d.respPaisCel, d.respCelular, d.respTelefono && `/ ${d.respTelefono}`)
        : d.respCorreo || d.famEmail;

  return (
    <div className="sp-overlay" role="dialog" aria-modal="true" aria-labelledby="sp-titulo">
      <div className="sp-card">
        <button type="button" className="modal-close-x" onClick={onEditar} disabled={enviando} aria-label="Cerrar" title="Cerrar">
          &times;
        </button>
        <header className="sp-header">
          <img src="/assets/logo-clinical-house.png" alt="IPS Clinical House" className="sp-logo" />
          <div>
            <h2 id="sp-titulo">Vista preliminar de su solicitud</h2>
            <p>Revise la información. Si todo está correcto, confirme para radicarla.</p>
          </div>
        </header>

        <div className="sp-body">
          <section className="sp-tipo">
            <div>
              <span className="sp-eyebrow">Tipo de solicitud</span>
              <strong>{d.tipoPeticion}</strong>
            </div>
          </section>

          <section>
            <h3>Detalle de la solicitud</h3>
            <div className="sp-texto">{d.descripcionPeticion || <em>Sin descripción</em>}</div>
          </section>

          <div className="sp-grid">
            <section>
              <h3>Remitente / familiar</h3>
              <dl>
                <Dato label="Nombre">{nombre(d.famPrimerNombre, d.famSegundoNombre, d.famPrimerApellido, d.famSegundoApellido)}</Dato>
                <Dato label="Documento">{nombre(d.famTipoDocumento, d.famNumeroDocumento)}</Dato>
                <Dato label="Correo">{d.famEmail}</Dato>
                <Dato label="Teléfono">{nombre(d.famPaisTel, d.famTelefono)}</Dato>
                <Dato label="Dirección">{d.famDireccion}</Dato>
              </dl>
            </section>

            <section>
              <h3>Paciente</h3>
              <dl>
                <Dato label="Nombre">{nombre(d.pacPrimerNombre, d.pacSegundoNombre, d.pacPrimerApellido, d.pacSegundoApellido)}</Dato>
                <Dato label="Documento">{nombre(d.pacTipoDocumento, d.pacNumeroDocumento)}</Dato>
                <Dato label="Correo">{d.pacEmail}</Dato>
                <Dato label="EPS · régimen">{nombre(d.pacEntidad, d.pacRegimen && `· ${d.pacRegimen}`)}</Dato>
                <Dato label="Población">{d.pacPoblacion}</Dato>
              </dl>
            </section>
          </div>

          <div className="sp-grid">
            <section>
              <h3>Respuesta</h3>
              <dl>
                <Dato label="Medio">{`Opción ${d.medioRespuesta}: ${MEDIOS_RESPUESTA[d.medioRespuesta]}`}</Dato>
                <Dato label="Destino">{destino}</Dato>
              </dl>
            </section>

            <section>
              <h3>Adjuntos ({archivos.length})</h3>
              {archivos.length ? (
                <ul className="sp-adjuntos">
                  {archivos.map((a) => (
                    <li key={a.name}><span>{a.name}</span><small>{a.size}</small></li>
                  ))}
                </ul>
              ) : (
                <p className="sp-muted">Sin documentos adjuntos.</p>
              )}
            </section>
          </div>

          <p className="sp-aviso">
            Al confirmar, recibirá un <b>correo de verificación</b> con su número de radicado en {d.famEmail}
            {d.pacEmail && d.pacEmail !== d.famEmail ? <> y en {d.pacEmail}</> : null}.
          </p>
        </div>

        <footer className="sp-footer">
          <button type="button" className="sp-btn-secundario" onClick={onEditar} disabled={enviando}>
            Corregir información
          </button>
          <button type="button" className="sp-btn-primario" onClick={onConfirmar} disabled={enviando}>
            {enviando ? 'Radicando solicitud…' : 'Confirmar y radicar'}
          </button>
        </footer>
      </div>
    </div>
  );
}
