import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '../common/Icon';
import { EmptyRow } from '../common/Field';
import { api } from '../../../services/api';
import { formatearFecha, formatearFechaHora } from '../../../utils/format';

const TAMANO = 100;

const claseAccion = (accion = '') => {
  if (accion.includes('FALLIDO') || accion.includes('RECHAZADA') || accion.includes('ELIMINACION')) return 'danger';
  if (accion.includes('LOGIN') || accion.includes('RESTABLECIMIENTO')) return 'success';
  if (accion.includes('ESTADO') || accion.includes('RESPUESTA')) return 'warning';
  return 'info';
};

/** Fecha local AAAA-MM-DD (no UTC: a las 7 p. m. en Colombia toISOString ya sería "mañana"). */
const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const msHastaMedianoche = () => {
  const ahora = new Date();
  const manana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1, 0, 0, 2);
  return manana - ahora;
};

/**
 * Bitácora de auditoría limitada a un día.
 * - Por defecto muestra solo HOY. A las 12:00 a. m. se pasa sola al nuevo día y lo del día anterior
 *   deja de verse aquí (no se borra: queda en la base de datos).
 * - "Consultar por día" permite revisar cualquier fecha anterior.
 */
export default function AuditoriaView() {
  const [fechaConsulta, setFechaConsulta] = useState(''); // '' = hoy
  const [hoy, setHoy] = useState(hoyISO);
  const [selector, setSelector] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [datos, setDatos] = useState({ content: [], totalPages: 1, totalElements: 0 });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [accion, setAccion] = useState('TODAS');
  const [texto, setTexto] = useState('');

  const viendoHoy = !fechaConsulta || fechaConsulta === hoy;
  const dia = viendoHoy ? hoy : fechaConsulta;

  // Cambio de día a medianoche: el panel pasa al día nuevo
  useEffect(() => {
    const t = setTimeout(() => setHoy(hoyISO()), msHastaMedianoche());
    return () => clearTimeout(t);
  }, [hoy]);

  useEffect(() => setPagina(0), [dia]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const data = await api.obtenerAuditoria(dia, pagina, TAMANO);
      const content = Array.isArray(data) ? data : data?.content || [];
      setDatos({
        content,
        totalPages: Array.isArray(data) ? 1 : data?.totalPages || 1,
        totalElements: Array.isArray(data) ? data.length : data?.totalElements ?? content.length
      });
    } catch (e) {
      setError(e.message);
      setDatos({ content: [], totalPages: 1, totalElements: 0 });
    } finally {
      setCargando(false);
    }
  }, [dia, pagina]);

  useEffect(() => { cargar(); }, [cargar]);

  const acciones = useMemo(() => [...new Set(datos.content.map((a) => a.accion).filter(Boolean))].sort(), [datos.content]);

  const filas = useMemo(() => {
    const q = texto.trim().toLowerCase();
    return datos.content.filter((a) => {
      if (accion !== 'TODAS' && a.accion !== accion) return false;
      if (!q) return true;
      return [a.accion, a.entidad, a.entidadId, a.usuario].some((v) => (v || '').toLowerCase().includes(q));
    });
  }, [datos.content, accion, texto]);

  const etiquetaDia = formatearFecha(`${dia}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="tail-table-card">
      <div className="tail-audit-daybar">
        <div className="tail-audit-day">
          <Icon name="calendar" size={18} />
          <div>
            <strong>{viendoHoy ? 'Hoy' : 'Consulta histórica'}</strong>
            <span>{etiquetaDia}</span>
          </div>
        </div>
        <div className="tail-audit-day-actions">
          {selector && (
            <input
              type="date"
              className="tail-date-input"
              value={fechaConsulta || hoy}
              max={hoy}
              onChange={(e) => setFechaConsulta(e.target.value)}
              aria-label="Día a consultar"
              autoFocus
            />
          )}
          {!viendoHoy && (
            <button type="button" className="tail-btn-ghost" onClick={() => { setFechaConsulta(''); setSelector(false); }}>
              Volver a hoy
            </button>
          )}
          <button type="button" className="tail-btn-secondary" onClick={() => setSelector((v) => !v)}>
            <Icon name="calendar" size={16} /> {selector ? 'Ocultar calendario' : 'Consultar por día'}
          </button>
        </div>
      </div>

      <div className="tail-table-toolbar">
        <div className="tail-table-filter-group">
          <select className="tail-select-control" value={accion} onChange={(e) => setAccion(e.target.value)} aria-label="Filtrar por acción">
            <option value="TODAS">Todas las acciones</option>
            {acciones.map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ').toLowerCase()}</option>)}
          </select>
          <div className="tail-inline-search">
            <Icon name="search" size={16} />
            <input type="text" placeholder="Filtrar por usuario, radicado o acción…" value={texto} onChange={(e) => setTexto(e.target.value)} />
          </div>
        </div>
        <div className="tail-toolbar-meta">
          {datos.totalElements} evento{datos.totalElements === 1 ? '' : 's'} {viendoHoy ? 'hoy' : 'ese día'}
          <button type="button" className="tail-icon-action-btn" onClick={cargar} title="Recargar">
            <Icon name="refresh" size={16} />
          </button>
        </div>
      </div>

      <div className="tail-table-wrapper">
        <table className="tail-modern-table">
          <thead>
            <tr>
              <th>Acción</th>
              <th>Entidad</th>
              <th>Usuario</th>
              <th>Hora</th>
            </tr>
          </thead>
          <tbody className={cargando ? 'tail-loading-fade' : ''}>
            {error ? (
              <EmptyRow colSpan={4}><span className="tail-text-danger">{error}</span></EmptyRow>
            ) : cargando && !datos.content.length ? (
              <EmptyRow colSpan={4}>Cargando bitácora…</EmptyRow>
            ) : !filas.length ? (
              <EmptyRow colSpan={4}>
                {datos.content.length ? 'No hay eventos con los criterios seleccionados.' : viendoHoy ? 'Aún no hay eventos registrados hoy.' : 'No hubo eventos ese día.'}
              </EmptyRow>
            ) : (
              filas.map((a) => (
                <tr key={a.id}>
                  <td><span className={`tail-audit-pill ${claseAccion(a.accion)}`}>{(a.accion || '').replace(/_/g, ' ').toLowerCase()}</span></td>
                  <td className="tail-cell-strong">{a.entidad}{a.entidadId ? <span className="tail-cell-sub"> · {a.entidadId}</span> : null}</td>
                  <td>{a.usuario}</td>
                  <td className="tail-cell-muted" title={formatearFechaHora(a.fechaEvento)}>
                    {new Date(a.fechaEvento).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                </tr>
              ))
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
    </div>
  );
}
