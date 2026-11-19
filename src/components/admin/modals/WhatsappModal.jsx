import React, { useMemo, useState } from 'react';
import Modal from '../common/Modal';
import Field, { Alert } from '../common/Field';
import Icon from '../common/Icon';
import { api } from '../../../services/api';
import { normalizarEstado } from '../../../constants/pqrsf';

/**
 * Número en formato internacional para wa.me (solo dígitos).
 * "+57 3001234567" → "573001234567"; "3001234567" (celular CO de 10 dígitos) → "573001234567".
 */
export const numeroWhatsapp = (telefono) => {
  const d = String(telefono || '').replace(/\D/g, '');
  if (d.length === 10 && d.startsWith('3')) return `57${d}`;
  return d;
};

/** Teléfonos de contacto de la solicitud, el elegido para respuesta primero. */
export const telefonosDe = (p) => {
  const lista = [
    p.medioRespuesta === 'B' && p.respCelular ? { etiqueta: 'Celular de respuesta', valor: p.respCelular } : null,
    p.famTelefono ? { etiqueta: 'Remitente / familiar', valor: p.famTelefono } : null,
    p.pacTelefono ? { etiqueta: 'Paciente', valor: p.pacTelefono } : null,
    p.respCelular && p.medioRespuesta !== 'B' ? { etiqueta: 'Celular de respuesta', valor: p.respCelular } : null
  ].filter(Boolean);
  const vistos = new Set();
  return lista.filter((t) => {
    const n = numeroWhatsapp(t.valor);
    if (n.length < 7 || vistos.has(n)) return false;
    vistos.add(n);
    return true;
  });
};

const plantilla = (p, user) =>
  `Hola ${p.famPrimerNombre || ''}, le saludamos del SIAU de IPS Clinical House.\n\n` +
  `En atención a su ${(p.tipoSolicitud || 'solicitud').replace(/^\([A-Z]\)\s*/, '').toLowerCase()} con radicado ${p.consecutivo}, le informamos que:\n\n` +
  `[Escriba aquí la respuesta]\n\n` +
  `Cordialmente,\n${user?.nombre || 'Equipo SIAU'}\nIPS Clinical House`;

/** Responder por WhatsApp: abre WhatsApp con el mensaje y deja la traza en la solicitud. */
export default function WhatsappModal({ pqrsf: p, user, onClose, onRegistrado }) {
  const telefonos = useMemo(() => telefonosDe(p), [p]);
  const [telefono, setTelefono] = useState(telefonos[0]?.valor || '');
  const [mensaje, setMensaje] = useState(plantilla(p, user));
  const yaSolucionada = normalizarEstado(p.estado) === 'solucionado';
  const [marcarSolucionado, setMarcarSolucionado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(null); // { pqrsf, numero, solucionada }

  const numero = numeroWhatsapp(telefono);

  const abrir = async (e) => {
    e.preventDefault();
    if (numero.length < 10) return setError('Ingrese un número de WhatsApp válido con indicativo de país (ej. +57 3001234567).');
    if (mensaje.includes('[Escriba aquí la respuesta]')) return setError('Reemplace «[Escriba aquí la respuesta]» con la respuesta al ciudadano.');
    if (mensaje.trim().length < 10) return setError('El mensaje es demasiado corto.');

    // Se abre en el mismo clic (si no, el navegador bloquea la ventana emergente)
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje.trim())}`, '_blank', 'noopener');

    setEnviando(true);
    setError('');
    try {
      const actualizada = await api.registrarWhatsapp(p.id, { telefono: numero, mensaje: mensaje.trim(), marcarSolucionado });
      setExito({
        pqrsf: actualizada,
        numero: `+${numero}`,
        solucionada: normalizarEstado(actualizada?.estado) === 'solucionado'
      });
      onRegistrado(actualizada, `+${numero}`); // refresca la bandeja y los indicadores
    } catch (err) {
      setError(err.message || 'No se pudo guardar la respuesta en la trazabilidad. Intente de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  if (exito) {
    return (
      <Modal title="WhatsApp enviado" onClose={onClose} width={460}>
        <div className="tail-modal-body tail-wa-exito">
          <div className="tail-wa-exito-icon"><Icon name="check" size={34} /></div>
          <h3>¡La respuesta se envió correctamente!</h3>
          <p>
            Se abrió WhatsApp con el mensaje para <strong>{exito.numero}</strong> y quedó registrada
            en la trazabilidad de <strong>{exito.pqrsf?.consecutivo || p.consecutivo}</strong>.
          </p>
          {exito.solucionada && (
            <div className="tail-wa-exito-estado">
              <Icon name="lock" size={14} /> La solicitud quedó marcada como <strong>Solucionada</strong>.
            </div>
          )}
        </div>
        <div className="tail-modal-footer" style={{ justifyContent: 'center' }}>
          <button type="button" className="tail-btn-primary" onClick={onClose} autoFocus>Aceptar</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={<h3 className="tail-wa-title"><Icon name="whatsapp" size={20} /> Responder por WhatsApp</h3>}
      subtitle={`${p.consecutivo} · ${p.pacPrimerNombre || ''} ${p.pacPrimerApellido || ''}`}
      onClose={onClose}
      width={620}
      className="tail-modal-fit"
    >
      <form onSubmit={abrir} noValidate className="tail-modal-fit-form">
        <div className="tail-modal-body tail-form-grid tail-modal-fit-body">
          {error && <Alert tipo="error" onClose={() => setError('')}>{error}</Alert>}

          <Field label="Número de WhatsApp" required hint={numero ? `Se abrirá wa.me/${numero}` : 'Incluya el indicativo del país.'}>
            {telefonos.length > 1 ? (
              <div className="tail-wa-numbers">
                {telefonos.map((t) => (
                  <button
                    key={t.valor}
                    type="button"
                    className={`tail-chip ${t.valor === telefono ? 'active' : ''}`}
                    onClick={() => setTelefono(t.valor)}
                  >
                    {t.valor} <small>· {t.etiqueta}</small>
                  </button>
                ))}
              </div>
            ) : null}
            <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+57 3001234567" />
          </Field>

          <Field label="Mensaje" required>
            <textarea className="tail-textarea-fill" value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
          </Field>

          <label className="tail-checkbox">
            <input type="checkbox" checked={yaSolucionada || marcarSolucionado} disabled={yaSolucionada} onChange={(e) => setMarcarSolucionado(e.target.checked)} />
            <span>
              {yaSolucionada
                ? <>La solicitud ya está <strong>Solucionada</strong></>
                : <>Marcar la solicitud como <strong>Solucionada</strong> (no se podrá revertir)</>}
            </span>
          </label>
        </div>

        <div className="tail-modal-footer">
          <button type="button" className="tail-btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="tail-btn-whatsapp" disabled={enviando}>
            <Icon name="whatsapp" size={16} /> {enviando ? 'Registrando…' : 'Abrir WhatsApp'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
