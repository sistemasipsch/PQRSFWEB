import React, { useState } from 'react';
import Modal from '../common/Modal';
import Field, { Alert } from '../common/Field';
import Icon from '../common/Icon';
import { api } from '../../../services/api';
import { normalizarEstado } from '../../../constants/pqrsf';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const plantilla = (p) =>
  `Reciba un cordial saludo.\n\n` +
  `En atención a su ${(p.tipoSolicitud || 'solicitud').replace(/^\([A-Z]\)\s*/, '').toLowerCase()} radicada con el número ${p.consecutivo}, ` +
  `le informamos que:\n\n[Escriba aquí la respuesta]\n\n` +
  `Agradecemos su confianza en IPS Clinical House.`;

/**
 * Redacta y envía la respuesta oficial al ciudadano desde el panel.
 * La ventana se ajusta al alto de la pantalla (sin barra de desplazamiento): el mensaje ocupa el espacio libre.
 */
export default function RespuestaCorreoModal({ pqrsf: p, user, onClose, onEnviado }) {
  const destinoInicial = (p.medioRespuesta === 'C' && p.respCorreo) || p.famEmail || p.pacEmail || '';
  const yaSolucionada = normalizarEstado(p.estado) === 'solucionado';
  const [destino, setDestino] = useState(destinoInicial);
  const [asunto, setAsunto] = useState(`Respuesta a su solicitud ${p.consecutivo} - IPS Clinical House`);
  const [mensaje, setMensaje] = useState(plantilla(p));
  const [marcarSolucionado, setMarcarSolucionado] = useState(true);
  const [vista, setVista] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const pendientePlaceholder = mensaje.includes('[Escriba aquí la respuesta]');

  const enviar = async (e) => {
    e.preventDefault();
    if (!EMAIL.test(destino.trim())) return setError('El correo de destino no es válido.');
    if (pendientePlaceholder) return setError('Reemplace el texto «[Escriba aquí la respuesta]» con la respuesta al ciudadano.');
    if (mensaje.trim().length < 10) return setError('El mensaje es demasiado corto.');

    setEnviando(true);
    setError('');
    try {
      const actualizada = await api.responderPorCorreo(p.id, {
        correoDestino: destino.trim(),
        asunto: asunto.trim(),
        mensaje: mensaje.trim(),
        marcarSolucionado: yaSolucionada || marcarSolucionado
      });
      onEnviado(actualizada, destino.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      title="Responder por correo"
      subtitle={`${p.consecutivo} · ${p.pacPrimerNombre || ''} ${p.pacPrimerApellido || ''}`}
      onClose={onClose}
      width={760}
      className="tail-modal-fit"
    >
      <form onSubmit={enviar} noValidate className="tail-modal-fit-form">
        <div className="tail-tabs">
          <button type="button" className={!vista ? 'active' : ''} onClick={() => setVista(false)}>Redactar</button>
          <button type="button" className={vista ? 'active' : ''} onClick={() => setVista(true)}>Vista previa</button>
        </div>

        <div className="tail-modal-body tail-form-grid tail-modal-fit-body">
          {error && <Alert tipo="error" onClose={() => setError('')}>{error}</Alert>}

          {!vista ? (
            <>
              <div className="tail-form-row tail-form-row-compact">
                <Field label="Para" required>
                  <input type="email" value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="Correo del ciudadano"
                    title={p.medioRespuesta !== 'C' ? 'El ciudadano eligió otro medio de respuesta; se usa su correo de contacto.' : 'Correo elegido por el ciudadano.'} />
                </Field>
                <Field label="Asunto" required>
                  <input type="text" value={asunto} onChange={(e) => setAsunto(e.target.value)} maxLength={200} placeholder="Asunto del correo" />
                </Field>
              </div>
              <Field label="Mensaje" required>
                <textarea className="tail-textarea-fill" value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Escribe la respuesta para el ciudadano" />
              </Field>
              <label className="tail-checkbox">
                <input type="checkbox" checked={yaSolucionada || marcarSolucionado} disabled={yaSolucionada} onChange={(e) => setMarcarSolucionado(e.target.checked)} />
                <span>
                  {yaSolucionada
                    ? <>La solicitud ya está <strong>Solucionada</strong></>
                    : <>Marcar la solicitud como <strong>Solucionada</strong> al enviar (no se podrá revertir)</>}
                </span>
              </label>
            </>
          ) : (
            <div className="tail-email-preview">
              <div className="tail-email-meta">
                <div><span>Para:</span> {destino}</div>
                <div><span>Asunto:</span> {asunto}</div>
              </div>
              <div className="tail-email-body">
                <img src="/assets/logo-clinical-house.png" alt="IPS Clinical House" className="tail-email-logo" />
                <div className="tail-email-bar" />
                <h2>Respuesta a su solicitud</h2>
                <p>Apreciado(a) <strong>{p.famPrimerNombre} {p.famPrimerApellido}</strong>,</p>
                <p>En atención a su solicitud con radicado <strong>{p.consecutivo}</strong> ({p.tipoSolicitud}), le damos respuesta en los siguientes términos:</p>
                <blockquote>{mensaje}</blockquote>
                <p>Cordialmente,</p>
                <p><strong>{user?.nombre}</strong><br /><span className="tail-cell-sub">{user?.cargo || 'Jefe SIAU'} · SIAU IPS Clinical House</span></p>
              </div>
            </div>
          )}
        </div>

        <div className="tail-modal-footer">
          <button type="button" className="tail-btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="tail-btn-primary" disabled={enviando}>
            <Icon name="send" size={16} /> {enviando ? 'Enviando…' : 'Enviar respuesta'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
