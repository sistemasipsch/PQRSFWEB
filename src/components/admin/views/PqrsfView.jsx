import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '../common/Icon';
import { EmptyRow } from '../common/Field';
import { RiesgoBadge, SlaBadge, TipoBadge } from '../common/Badges';
import { api } from '../../../services/api';
import { ESTADOS, SEMAFOROS, SIN_ASIGNAR, normalizarEstado } from '../../../constants/pqrsf';
import useResponsables from '../../../hooks/useResponsables';
import useCatalogos from '../../../hooks/useCatalogos';
import { formatearFecha, nombrePaciente } from '../../../utils/format';
import useDebounce from '../../../hooks/useDebounce';
import { puede } from '../../../utils/permisos';
import ConfirmarModal from '../modals/ConfirmarModal';

const TAMANO_PAGINA = 15;

/**
 * Bandeja de gestión de PQRSF.
 * - Búsqueda en tiempo real (servidor) con el término del buscador superior.
 * - Estado editable desde la tabla (lista desplegable).
 * - Semáforo automático calculado por el backend según el nivel de riesgo.
 */
export default function PqrsfView({ user, termino, filtroSla, onFiltroSlaChange, onBuscando, onResultados, onVerDetalle, onResponder, onWhatsapp, onNotificar, recargarToken, onDatosCambiados }) {
  const [confirmarSolucion, setConfirmarSolucion] = useState(null); // item a marcar como solucionado
  const puedeEstado = puede(user, 'CAMBIAR_ESTADO');
  const puedeAsignar = puede(user, 'ASIGNAR_RESPONSABLE');
  const puedeCorreo = puede(user, 'RESPONDER_CORREO');
  const puedeWhatsapp = puede(user, 'RESPONDER_WHATSAPP');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroResponsable, setFiltroResponsable] = useState('todos');
  const [filtroArea, setFiltroArea] = useState('todos');
  const [pagina, setPagina] = useState(0);
  const [datos, setDatos] = useState({ content: [], totalPages: 1, totalElements: 0 });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [guardandoId, setGuardandoId] = useState(null);

  const terminoDebounced = useDebounce(termino, 300);
  const { responsables } = useResponsables();
  const { areas } = useCatalogos();
  const areasActivas = areas.filter((a) => a.activo);

  // Volver a la primera página cuando cambian los filtros
  useEffect(() => setPagina(0), [terminoDebounced, filtroEstado, filtroResponsable, filtroArea]);

  const cargar = useCallback(async () => {
    setCargando(true);
    onBuscando?.(true);
    setError('');
    try {
      const data = await api.listarPqrsf({
        estado: filtroEstado,
        responsable: filtroResponsable,
        area: filtroArea,
        termino: terminoDebounced.trim(),
        page: pagina,
        size: TAMANO_PAGINA
      });
      setDatos({ content: data?.content || [], totalPages: data?.totalPages || 1, totalElements: data?.totalElements || 0 });
      onResultados?.(data?.totalElements ?? 0);
    } catch (e) {
      setError(e.message);
      setDatos({ content: [], totalPages: 1, totalElements: 0 });
    } finally {
      setCargando(false);
      onBuscando?.(false);
    }
  }, [filtroEstado, filtroResponsable, filtroArea, terminoDebounced, pagina, onBuscando, onResultados]);

  useEffect(() => {
    cargar();
  }, [cargar, recargarToken]);

  // El semáforo se filtra sobre la página actual (el backend lo calcula al vuelo)
  const filas = useMemo(
    () => (filtroSla === 'todos' ? datos.content : datos.content.filter((p) => (p.nivelSemaforo || '').toLowerCase() === filtroSla)),
    [datos.content, filtroSla]
  );

  const reemplazarFila = (actualizada) =>
    setDatos((d) => ({ ...d, content: d.content.map((p) => (p.id === actualizada.id ? actualizada : p)) }));

  /** Solucionado es definitivo: se pide confirmación antes de aplicarlo. */
  const solicitarCambioEstado = (item, nuevoEstado) => {
    if (normalizarEstado(item.estado) === nuevoEstado) return;
    if (nuevoEstado === 'solucionado') setConfirmarSolucion(item);
    else cambiarEstado(item, nuevoEstado);
  };

  const cambiarEstado = async (item, nuevoEstado) => {
    if (normalizarEstado(item.estado) === nuevoEstado) return;
    setGuardandoId(item.id);
    try {
      const act = await api.cambiarEstado(item.id, nuevoEstado, 'Cambio de estado desde la bandeja de gestión.');
      reemplazarFila(act);
      onNotificar('exito', `${item.consecutivo}: estado actualizado a "${ESTADOS.find((e) => e.value === nuevoEstado)?.label}".`);
      onDatosCambiados?.();
    } catch (e) {
      onNotificar('error', e.message);
    } finally {
      setGuardandoId(null);
    }
  };

  const asignar = async (item, responsable) => {
    setGuardandoId(item.id);
    try {
      const act = await api.asignarResponsable(item.id, responsable, 'Asignado desde la bandeja de gestión.');
      reemplazarFila(act);
      onNotificar('exito', `${item.consecutivo}: asignada a ${responsable}.`);
      onDatosCambiados?.();
    } catch (e) {
      onNotificar('error', e.message);
    } finally {
      setGuardandoId(null);
    }
  };

  const asignarAreaFila = async (item, area) => {
    setGuardandoId(item.id);
    try {
      const act = await api.asignarArea(item.id, area);
      reemplazarFila(act);
      onNotificar('exito', area ? `${item.consecutivo}: asignada al área ${area}.` : `${item.consecutivo}: se quitó el área.`);
      onDatosCambiados?.();
    } catch (e) {
      onNotificar('error', e.message);
    } finally {
      setGuardandoId(null);
    }
  };

  const hayFiltros = filtroEstado !== 'todos' || filtroResponsable !== 'todos' || filtroArea !== 'todos' || filtroSla !== 'todos';

  return (
    <div className="tail-table-card">
      <div className="tail-table-toolbar">
        <div className="tail-table-filter-group">
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="tail-select-control" aria-label="Filtrar por estado">
            <option value="todos">Todos los estados</option>
            {ESTADOS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>

          <select value={filtroSla} onChange={(e) => onFiltroSlaChange(e.target.value)} className="tail-select-control" aria-label="Filtrar por semáforo">
            <option value="todos">Semáforo: todos</option>
            {SEMAFOROS.map((s) => <option key={s.value} value={s.value.toLowerCase()}>{s.label}</option>)}
          </select>

          <select value={filtroResponsable} onChange={(e) => setFiltroResponsable(e.target.value)} className="tail-select-control" style={{ maxWidth: 260 }} aria-label="Filtrar por responsable">
            <option value="todos">Todos los responsables</option>
            <option value={SIN_ASIGNAR}>{SIN_ASIGNAR}</option>
            {responsables.map((r) => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
          </select>

          <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} className="tail-select-control" style={{ maxWidth: 240 }} aria-label="Filtrar por área">
            <option value="todos">Todas las áreas</option>
            <option value="sin-area">Sin área</option>
            {areasActivas.map((a) => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
          </select>

          {hayFiltros && (
            <button type="button" className="tail-btn-ghost" onClick={() => { setFiltroEstado('todos'); setFiltroResponsable('todos'); setFiltroArea('todos'); onFiltroSlaChange('todos'); }}>
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="tail-toolbar-meta">
          {termino ? <>Resultados para «<strong>{termino}</strong>»: </> : null}
          {filtroSla !== 'todos' ? `${filas.length} de ${datos.totalElements}` : datos.totalElements} solicitud{datos.totalElements === 1 ? '' : 'es'}
          <button type="button" className="tail-icon-action-btn" onClick={cargar} title="Recargar">
            <Icon name="refresh" size={16} />
          </button>
        </div>
      </div>

      <div className="tail-table-wrapper">
        <table className="tail-modern-table">
          <thead>
            <tr>
              <th>Radicado</th>
              <th>Fecha</th>
              <th>Paciente</th>
              <th>Tipo y riesgo</th>
              <th>Área</th>
              <th>Responsable</th>
              <th>Estado</th>
              <th>Semáforo</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody className={cargando ? 'tail-loading-fade' : ''}>
            {error ? (
              <EmptyRow colSpan={9}><span className="tail-text-danger">{error}</span></EmptyRow>
            ) : cargando && datos.content.length === 0 ? (
              <EmptyRow colSpan={9}>Cargando solicitudes…</EmptyRow>
            ) : filas.length === 0 ? (
              <EmptyRow colSpan={9}>No se encontraron solicitudes con los criterios seleccionados.</EmptyRow>
            ) : (
              filas.map((item) => {
                const estado = normalizarEstado(item.estado);
                return (
                  <tr key={item.id} className={item.nivelSemaforo === 'ROJO' ? 'row-danger' : ''}>
                    <td>
                      <button type="button" className="tail-radicado-pill" onClick={() => onVerDetalle(item)} title="Ver vista preliminar">
                        {item.consecutivo}
                      </button>
                    </td>
                    <td className="tail-cell-muted">{formatearFecha(item.fechaRadicacion)}</td>
                    <td>
                      <div className="tail-cell-strong">{nombrePaciente(item)}</div>
                      <div className="tail-cell-sub">{item.pacTipoDocumento} {item.pacNumeroDocumento}</div>
                    </td>
                    <td>
                      <div className="tail-cell-stack">
                        <TipoBadge tipo={item.tipoSolicitud} />
                        <RiesgoBadge nivel={item.nivelRiesgo} />
                      </div>
                    </td>
                    <td>
                      <select
                        value={item.area || ''}
                        onChange={(e) => asignarAreaFila(item, e.target.value)}
                        className="tail-select-control tail-select-sm"
                        disabled={guardandoId === item.id || !puedeAsignar}
                        title={!puedeAsignar ? 'Su rol no tiene permiso para asignar áreas' : undefined}
                        aria-label={`Área de ${item.consecutivo}`}
                      >
                        <option value="">Sin área</option>
                        {areasActivas.map((a) => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
                        {item.area && !areasActivas.some((a) => a.nombre === item.area) && (
                          <option value={item.area} disabled>{item.area} (inactiva)</option>
                        )}
                      </select>
                    </td>
                    <td>
                      <select
                        value={item.responsableAsignado || SIN_ASIGNAR}
                        onChange={(e) => asignar(item, e.target.value)}
                        className="tail-select-control tail-select-sm"
                        disabled={guardandoId === item.id || !puedeAsignar}
                        title={!puedeAsignar ? 'Su rol no tiene permiso para asignar responsables' : undefined}
                        aria-label={`Responsable de ${item.consecutivo}`}
                      >
                        <option value={SIN_ASIGNAR}>{SIN_ASIGNAR}</option>
                        {responsables.map((r) => (
                          <option key={r.id} value={r.nombre}>{r.nombre}</option>
                        ))}
                        {/* Asignaciones antiguas a nombres que ya no son usuarios: se muestran pero no se pueden elegir */}
                        {item.responsableAsignado && item.responsableAsignado !== SIN_ASIGNAR &&
                          !responsables.some((r) => r.nombre === item.responsableAsignado) && (
                          <option value={item.responsableAsignado} disabled>{item.responsableAsignado} (no registrado)</option>
                        )}
                      </select>
                    </td>
                    <td>
                      {estado === 'solucionado' ? (
                        <span className="tail-estado-locked" title="Solucionada: el estado ya no se puede modificar">
                          <Icon name="lock" size={13} /> Solucionado
                        </span>
                      ) : (
                        <select
                          value={estado}
                          onChange={(e) => solicitarCambioEstado(item, e.target.value)}
                          className={`tail-estado-select ${estado.replace(' ', '-')}`}
                          disabled={guardandoId === item.id || !puedeEstado}
                          title={!puedeEstado ? 'Su rol no tiene permiso para cambiar estados' : undefined}
                          aria-label={`Estado de ${item.consecutivo}`}
                        >
                          {ESTADOS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                        </select>
                      )}
                    </td>
                    <td><SlaBadge pqrsf={item} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="tail-action-btn-group" style={{ justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => onVerDetalle(item)} className="tail-icon-action-btn" title="Vista preliminar de la solicitud">
                          <Icon name="eye" size={16} />
                        </button>
                        {puedeCorreo && (
                          <button type="button" onClick={() => onResponder(item)} className="tail-icon-action-btn primary" title="Responder por correo">
                            <Icon name="mail" size={16} />
                          </button>
                        )}
                        {puedeWhatsapp && (
                          <button type="button" onClick={() => onWhatsapp(item)} className="tail-icon-action-btn whatsapp" title="Responder por WhatsApp">
                            <Icon name="whatsapp" size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {datos.totalPages > 1 && (
        <div className="tail-pagination">
          <span>Página {pagina + 1} de {datos.totalPages}</span>
          <div>
            <button type="button" className="tail-icon-action-btn" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)} aria-label="Página anterior">
              <Icon name="chevronLeft" size={16} />
            </button>
            <button type="button" className="tail-icon-action-btn" disabled={pagina + 1 >= datos.totalPages} onClick={() => setPagina((p) => p + 1)} aria-label="Página siguiente">
              <Icon name="chevronRight" size={16} />
            </button>
          </div>
        </div>
      )}

      {confirmarSolucion && (
        <ConfirmarModal
          titulo="Marcar como solucionada"
          confirmar="Sí, marcar como solucionada"
          onCancelar={() => setConfirmarSolucion(null)}
          onConfirmar={() => { const item = confirmarSolucion; setConfirmarSolucion(null); cambiarEstado(item, 'solucionado'); }}
        >
          La solicitud <strong>{confirmarSolucion.consecutivo}</strong> quedará cerrada como <strong>Solucionada</strong>.
          Esta acción queda en la trazabilidad y <strong>no se puede revertir</strong>: el estado ya no podrá cambiarse.
        </ConfirmarModal>
      )}
    </div>
  );
}
