import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Icon from '../common/Icon';
import { EstadoBadge, RiesgoBadge, SlaBadge, TipoBadge } from '../common/Badges';
import FilePreviewModal from './FilePreviewModal';
import { api } from '../../../services/api';
import { MEDIOS_RESPUESTA, estadoLabel, normalizarEstado } from '../../../constants/pqrsf';
import { formatearBytes, formatearFechaHora } from '../../../utils/format';
import { imprimirReportePqrsf } from '../../../utils/imprimir';
import { puede } from '../../../utils/permisos';

const TABS = [
  { id: 'solicitud', label: 'Solicitud' },
  { id: 'adjuntos', label: 'Adjuntos' },
  { id: 'traza', label: 'Trazabilidad' }
];

/** Vista preliminar completa de una solicitud, con acceso a responder por correo. */
export default function DetallePqrsfModal({ pqrsf: inicial, user, onClose, onResponder, onWhatsapp, onActualizada }) {
  const [p, setP] = useState(inicial);
  const [tab, setTab] = useState('solicitud');
  const [adjunto, setAdjunto] = useState(null);
  const [areas, setAreas] = useState([]);
  const [guardandoArea, setGuardandoArea] = useState(false);
  const [errorArea, setErrorArea] = useState('');

  // Refrescar con el detalle completo (registra la consulta en auditoría)
  useEffect(() => {
    let vivo = true;
    api.obtenerDetallePqrsf(inicial.id).then((d) => vivo && d && setP(d)).catch(() => {});
    api.listarAreas().then((l) => vivo && setAreas(l || [])).catch(() => {});
    return () => { vivo = false; };
  }, [inicial.id]);

  const cambiarArea = async (area) => {
    setGuardandoArea(true);
    setErrorArea('');
    try {
      const act = await api.asignarArea(p.id, area);
      setP(act);
      onActualizada?.(act);
    } catch (e) {
      setErrorArea(e.message);
    } finally {
      setGuardandoArea(false);
    }
  };

  const areasActivas = areas.filter((a) => a.activo || a.nombre === p.area);

  // Movimiento de la traza con el que se cerró la solicitud
  const cierre = normalizarEstado(p.estado) === 'solucionado'
    ? [...(p.trazas || [])]
        .filter((t) => normalizarEstado(t.estadoNuevo) === 'solucionado' && normalizarEstado(t.estadoAnterior) !== 'solucionado')
        .sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro))[0]
    : null;

  const medio = p.medioRespuesta || 'C';
  const destinoRespuesta =
    medio === 'A' ? [p.respDireccion, p.respBarrio, p.respMunicipio].filter(Boolean).join(', ')
      : medio === 'B' ? [p.respCelular, p.respTelefonoFijo].filter(Boolean).join(' / ')
        : p.respCorreo || p.famEmail;

  return (
    <>
      <Modal
        width={880}
        onClose={onClose}
        title={
          <div className="tail-detail-title">
            <span className="tail-radicado-pill static">{p.consecutivo}</span>
            <TipoBadge tipo={p.tipoSolicitud} />
            <EstadoBadge estado={p.estado} />
          </div>
        }
        subtitle={`Radicada el ${formatearFechaHora(p.fechaRadicacion)} · Responsable: ${p.responsableAsignado || 'Sin asignar'}`}
        footer={
          <>
            {puede(user, 'IMPRIMIR_PQRSF') && (
              <button type="button" className="tail-btn-secondary" onClick={() => imprimirReportePqrsf(p, user)} title="Reporte completo para imprimir o guardar como PDF">
                <Icon name="printer" size={16} /> Imprimir / PDF
              </button>
            )}
            {puede(user, 'RESPONDER_WHATSAPP') && (
              <button type="button" className="tail-btn-whatsapp" onClick={() => onWhatsapp(p)}>
                <Icon name="whatsapp" size={16} /> WhatsApp
              </button>
            )}
            {puede(user, 'RESPONDER_CORREO') && (
              <button type="button" className="tail-btn-primary" onClick={() => onResponder(p)}>
                <Icon name="mail" size={16} /> Responder por correo
              </button>
            )}
          </>
        }
      >
        <div className="tail-detail-sla">
          <RiesgoBadge nivel={p.nivelRiesgo} />
          <SlaBadge pqrsf={p} />
          {p.fechaLimite && <span className="tail-cell-muted">Fecha límite: {formatearFechaHora(p.fechaLimite)}</span>}
          <label className="tail-detail-area">
            <span>Área</span>
            <select
              value={p.area || ''}
              onChange={(e) => cambiarArea(e.target.value)}
              disabled={guardandoArea || !puede(user, 'ASIGNAR_RESPONSABLE')}
              className="tail-select-control tail-select-sm"
              aria-label="Área involucrada"
            >
              <option value="">Sin área</option>
              {areasActivas.map((a) => <option key={a.id} value={a.nombre} disabled={!a.activo}>{a.nombre}</option>)}
            </select>
          </label>
        </div>
        {errorArea && <div className="tail-detail-inline-error">{errorArea}</div>}
        {normalizarEstado(p.estado) === 'solucionado' && (
          <div className="tail-closed-banner">
            <Icon name="lock" size={16} />
            <span>
              Solicitud cerrada como <strong>Solucionada</strong>
              {cierre ? <> el {formatearFechaHora(cierre.fechaRegistro)} por {cierre.usuarioResponsable}</> : null}.
              El estado ya no se puede modificar.
            </span>
          </div>
        )}

        <div className="tail-tabs">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
              {t.label}
              {t.id === 'adjuntos' && <span className="tail-tab-count">{p.adjuntos?.length || 0}</span>}
              {t.id === 'traza' && <span className="tail-tab-count">{p.trazas?.length || 0}</span>}
            </button>
          ))}
        </div>

        <div className="tail-modal-body tail-print-area">
          {tab === 'solicitud' && (
            <>
              <div className="tail-detail-section">
                <h4>Descripción</h4>
                <div className="tail-detail-text">{p.descripcion}</div>
              </div>

              <div className="tail-detail-grid">
                <div className="tail-detail-section">
                  <h4>Paciente</h4>
                  <dl>
                    <dt>Nombre</dt><dd>{p.pacNombreCompleto || `${p.pacPrimerNombre} ${p.pacPrimerApellido}`}</dd>
                    <dt>Documento</dt><dd>{p.pacTipoDocumento} {p.pacNumeroDocumento}</dd>
                    <dt>EPS · Régimen</dt><dd>{p.pacEntidad} · {p.pacRegimen}</dd>
                    <dt>Población</dt><dd>{p.pacPoblacion}</dd>
                    <dt>Contacto</dt><dd>{p.pacTelefono}<br />{p.pacEmail}</dd>
                    <dt>Dirección</dt><dd>{p.pacDireccion}</dd>
                  </dl>
                </div>
                <div className="tail-detail-section">
                  <h4>Remitente / familiar</h4>
                  <dl>
                    <dt>Nombre</dt><dd>{p.famNombreCompleto || `${p.famPrimerNombre} ${p.famPrimerApellido}`}</dd>
                    <dt>Documento</dt><dd>{p.famTipoDocumento} {p.famNumeroDocumento}</dd>
                    <dt>Contacto</dt><dd>{p.famTelefono}<br />{p.famEmail}</dd>
                    <dt>Dirección</dt><dd>{p.famDireccion}</dd>
                  </dl>
                  <h4 style={{ marginTop: 18 }}>Respuesta solicitada</h4>
                  <dl>
                    <dt>Medio</dt><dd>{MEDIOS_RESPUESTA[medio]}</dd>
                    <dt>Destino</dt><dd>{destinoRespuesta || '—'}</dd>
                  </dl>
                </div>
              </div>
            </>
          )}

          {tab === 'adjuntos' && (
            !p.adjuntos?.length ? (
              <div className="tail-chart-empty">Esta solicitud no tiene archivos adjuntos.</div>
            ) : (
              <div className="tail-attachments-grid">
                {p.adjuntos.map((a) => (
                  <button key={a.id} type="button" className="tail-attachment-card" onClick={() => setAdjunto(a)}>
                    <span className="tail-attachment-icon"><Icon name="paperclip" size={20} /></span>
                    <span className="tail-attachment-name" title={a.nombreOriginal}>{a.nombreOriginal}</span>
                    <span className="tail-cell-sub">{formatearBytes(a.tamanoBytes)} · Ver preliminar</span>
                  </button>
                ))}
              </div>
            )
          )}

          {tab === 'traza' && (
            !p.trazas?.length ? (
              <div className="tail-chart-empty">Sin movimientos registrados.</div>
            ) : (
              <ol className="tail-timeline">
                {[...p.trazas].sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro)).map((t) => (
                  <li key={t.id}>
                    <div className="tail-timeline-head">
                      <strong>{t.estadoAnterior && t.estadoAnterior !== t.estadoNuevo ? `${estadoLabel(t.estadoAnterior)} → ${estadoLabel(t.estadoNuevo)}` : estadoLabel(t.estadoNuevo)}</strong>
                      <span>{formatearFechaHora(t.fechaRegistro)}</span>
                    </div>
                    <div className="tail-cell-sub">Por {t.usuarioResponsable}</div>
                    {t.observacion && <div className="tail-timeline-note">{t.observacion}</div>}
                  </li>
                ))}
              </ol>
            )
          )}
        </div>
      </Modal>

      {adjunto && <FilePreviewModal adjunto={adjunto} onClose={() => setAdjunto(null)} />}
    </>
  );
}
