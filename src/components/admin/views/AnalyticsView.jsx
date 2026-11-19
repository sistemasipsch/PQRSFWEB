import React, { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import Icon from '../common/Icon';
import { baseChart, ejeX, ejeY } from '../charts/chartTheme';
import ReporteAreas from '../charts/ReporteAreas';
import { COLORES, ESTADOS, MEDIOS_RESPUESTA, NIVELES_RIESGO, SEMAFOROS, SLA_UMBRAL, TIPOS_SOLICITUD, estadoLabel } from '../../../constants/pqrsf';
import { api } from '../../../services/api';
import { descargarCSV, fechaCSV, porcentaje } from '../../../utils/csv';
import { puede } from '../../../utils/permisos';

const RANGOS = [
  { id: '12m', label: '12 meses' },
  { id: '30d', label: '30 días' },
  { id: '7d', label: '7 días' }
];

/** Reportes ejecutivos: KPI, flujo temporal, tipología, riesgo, responsables y medios de respuesta. */
export default function AnalyticsView({ user, reporte, cargando, fechas, onFechasChange, onAplicarFechas, onVerSemaforo, onError }) {
  const [rango, setRango] = useState('12m');
  const r = reporte || {};
  const total = r.totalRequerimientos || 0;

  // -------- Serie temporal (datos reales del backend)
  const serie = useMemo(() => {
    const base = rango === '12m' ? r.serieMensual : r.serieDiaria;
    if (!base?.etiquetas?.length) return { etiquetas: [], radicadas: [], solucionadas: [] };
    const corte = rango === '7d' ? -7 : 0;
    return {
      etiquetas: base.etiquetas.slice(corte),
      radicadas: base.radicadas.slice(corte),
      solucionadas: base.solucionadas.slice(corte)
    };
  }, [r.serieMensual, r.serieDiaria, rango]);

  const areaOptions = {
    ...baseChart('area'),
    colors: [COLORES.azul, COLORES.negro],
    stroke: { curve: 'smooth', width: [2.5, 2] },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0, stops: [0, 100] } },
    markers: { size: 0, hover: { size: 5 } },
    xaxis: ejeX(serie.etiquetas, { rotate: 0, hideOverlappingLabels: true }),
    yaxis: ejeY
  };

  // -------- Tipología
  const dist = r.distribucionTipos || {};
  const tipos = TIPOS_SOLICITUD.map((t) => ({ ...t, total: dist[t.value] || 0 }));
  const coloresTipo = [COLORES.azul, COLORES.negro, COLORES.gris, COLORES.azulClaro, COLORES.azulSuave, COLORES.rojo];
  const donutOptions = {
    ...baseChart('donut'),
    colors: coloresTipo,
    labels: tipos.map((t) => t.label),
    legend: { show: false },
    stroke: { width: 2, colors: ['#fff'] },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            value: { fontSize: '26px', fontWeight: 600, color: COLORES.negro },
            total: { show: true, label: 'Solicitudes', fontSize: '13px', color: COLORES.gris, formatter: () => total }
          }
        }
      }
    }
  };

  // -------- Responsables
  const responsables = r.reportePorResponsable || [];
  const barOptions = {
    ...baseChart('bar'),
    colors: [COLORES.azul, COLORES.negro, COLORES.grisClaro],
    plotOptions: { bar: { columnWidth: '42%', borderRadius: 4, borderRadiusApplication: 'end' } },
    stroke: { show: true, width: 3, colors: ['transparent'] },
    xaxis: ejeX(responsables.map((x) => x.responsable.replace(/\s*\(.*\)$/, ''))),
    yaxis: ejeY
  };

  // -------- Medio de respuesta
  const canales = r.distribucionCanales || {};
  const riesgo = r.distribucionRiesgo || {};

  const periodoTexto = `${fechas.desde ? fechaCSV(`${fechas.desde}T12:00`, false) : 'Desde el inicio'} – ${fechas.hasta ? fechaCSV(`${fechas.hasta}T12:00`, false) : 'hoy'}`;
  const sufijoArchivo = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
  };

  /** Resumen ejecutivo: indicadores, política SLA vigente, distribuciones y desempeño por responsable. */
  const exportarResumen = () => {
    const estados = r.distribucionEstados || {};
    const seccion = (titulo) => [[], [titulo.toUpperCase()]];
    const filas = [
      ['REPORTE EJECUTIVO SIAU · IPS CLINICAL HOUSE'],
      ['Generado el', fechaCSV(new Date())],
      ['Generado por', user?.nombre || ''],
      ['Periodo (fecha de radicación)', periodoTexto],

      ...seccion('1. Indicadores generales'),
      ['Indicador', 'Valor', '% del total'],
      ['Total de solicitudes', total, 100],
      ['En término (verde)', r.enTerminoVerde || 0, porcentaje(r.enTerminoVerde || 0, total)],
      ['Por vencer (amarillo)', r.alertaAmarillo || 0, porcentaje(r.alertaAmarillo || 0, total)],
      ['Vencidas (rojo)', r.vencidasRojo || 0, porcentaje(r.vencidasRojo || 0, total)],
      ['Solucionadas', r.solucionados || 0, porcentaje(r.solucionados || 0, total)],
      ['Cumplimiento SLA (%)', r.cumplimientoPorcentaje ?? 100, ''],
      ['Antigüedad promedio (días)', r.tiempoPromedioDias ?? 0, ''],

      ...seccion('2. Política de tiempos de respuesta vigente'),
      ['Nivel de riesgo', 'Tipos de solicitud', 'Plazo (horas)', 'Solicitudes', '% del total'],
      ...Object.entries(NIVELES_RIESGO).map(([k, v]) => [v.label, v.tipos, v.plazoHoras, riesgo[k] || 0, porcentaje(riesgo[k] || 0, total)]),
      ['Alerta (amarillo) desde', `${SLA_UMBRAL.porcentaje}% del plazo consumido`],

      ...seccion('3. Distribución por estado'),
      ['Estado', 'Solicitudes', '% del total'],
      ...ESTADOS.map((e) => [e.label, estados[e.value] || 0, porcentaje(estados[e.value] || 0, total)]),

      ...seccion('4. Distribución por tipo de solicitud'),
      ['Tipo', 'Nivel de riesgo', 'Solicitudes', '% del total'],
      ...tipos.map((t) => [t.label, NIVELES_RIESGO[t.riesgo]?.label || '', t.total, porcentaje(t.total, total)]),

      ...seccion('5. Medio de respuesta preferido'),
      ['Medio', 'Solicitudes', '% del total'],
      ...Object.entries(MEDIOS_RESPUESTA).map(([k, v]) => [v, canales[k] || 0, porcentaje(canales[k] || 0, total)]),

      ...seccion('6. Desempeño por responsable'),
      ['Responsable', 'Asignadas', 'Solucionadas', 'En proceso', 'Pendientes', 'Vencidas', 'Efectividad (%)'],
      ...responsables.map((x) => [x.responsable, x.totalAsignadas, x.solucionadas, x.enProceso, x.pendientes, x.vencidas, x.efectividadPorcentaje]),

      ...seccion('7. Solicitudes por área'),
      ['Área', 'Solicitudes', '% del total', 'En término', 'Por vencer', 'Vencidas', 'Solucionadas', 'Cumplimiento (%)'],
      ...(r.reportePorArea || []).map((a) => [a.area, a.total, porcentaje(a.total, total), a.enTermino, a.porVencer, a.vencidas, a.solucionadas, a.cumplimientoPorcentaje])
    ];
    descargarCSV(`Reporte_SIAU_resumen_${sufijoArchivo()}.csv`, filas);
  };

  /** Detalle: una fila por solicitud con su semáforo SLA. */
  const [exportandoDetalle, setExportandoDetalle] = useState(false);
  const exportarDetalle = async () => {
    setExportandoDetalle(true);
    try {
      const lista = await api.exportarPqrsf(fechas.desde, fechas.hasta);
      const tel = (t) => (t || '').replace(/^\+(\d+)\s*/, '(+$1) ');
      const filas = [
        ['DETALLE DE SOLICITUDES Y SLA · IPS CLINICAL HOUSE'],
        ['Generado el', fechaCSV(new Date()), 'Por', user?.nombre || '', 'Periodo', periodoTexto, 'Total', (lista || []).length],
        [],
        ['Radicado', 'Fecha radicación', 'Tipo', 'Nivel de riesgo', 'Plazo (horas)', 'Fecha límite', 'Estado', 'Semáforo',
          'Tiempo SLA', 'Días transcurridos', 'Responsable', 'Área', 'Paciente', 'Documento paciente', 'EPS', 'Régimen',
          'Población', 'Medio de respuesta', 'Remitente', 'Teléfono remitente', 'Correo remitente', 'Adjuntos', 'Última actualización'],
        ...(lista || []).map((p) => [
          p.consecutivo,
          fechaCSV(p.fechaRadicacion),
          (p.tipoSolicitud || '').replace(/^\([A-Z]\)\s*/, ''),
          NIVELES_RIESGO[p.nivelRiesgo]?.label || p.nivelRiesgoEtiqueta || '',
          p.plazoHoras,
          fechaCSV(p.fechaLimite),
          estadoLabel(p.estado),
          SEMAFOROS.find((s) => s.value === p.nivelSemaforo)?.label || p.nivelSemaforo || '',
          p.tiempoRespuestaTexto,
          p.diasTranscurridos,
          p.responsableAsignado,
          p.area || '',
          p.pacNombreCompleto,
          `${p.pacTipoDocumento || ''} ${p.pacNumeroDocumento || ''}`.trim(),
          p.pacEntidad,
          p.pacRegimen,
          p.pacPoblacion,
          MEDIOS_RESPUESTA[p.medioRespuesta] || p.medioRespuesta,
          p.famNombreCompleto,
          tel(p.famTelefono),
          p.famEmail,
          p.adjuntos?.length || 0,
          fechaCSV(p.fechaActualizacion)
        ])
      ];
      descargarCSV(`Reporte_SIAU_detalle_SLA_${sufijoArchivo()}.csv`, filas);
    } catch (e) {
      onError?.(e.message);
    } finally {
      setExportandoDetalle(false);
    }
  };

  const puedeExportar = puede(user, 'EXPORTAR_REPORTES');

  const kpis = [
    { label: 'Total solicitudes', valor: total, pill: `${r.solucionados || 0} solucionadas`, clase: 'neutral' },
    { label: 'En término', valor: r.enTerminoVerde || 0, pill: 'Verde', clase: 'up', semaforo: 'verde' },
    { label: 'Por vencer', valor: r.alertaAmarillo || 0, pill: '≥ 50% del plazo', clase: 'warning', semaforo: 'amarillo' },
    { label: 'Vencidas', valor: r.vencidasRojo || 0, pill: r.vencidasRojo ? 'Requiere acción' : 'Sin casos', clase: r.vencidasRojo ? 'danger' : 'up', semaforo: 'rojo' }
  ];

  return (
    <div className={cargando ? 'tail-loading-fade' : ''}>
      {/* Filtros de periodo */}
      <div className="tail-filter-bar">
        <div className="tail-filter-dates">
          <label>
            <span>Desde</span>
            <input type="date" value={fechas.desde} max={fechas.hasta || undefined} onChange={(e) => onFechasChange({ ...fechas, desde: e.target.value })} />
          </label>
          <label>
            <span>Hasta</span>
            <input type="date" value={fechas.hasta} min={fechas.desde || undefined} onChange={(e) => onFechasChange({ ...fechas, hasta: e.target.value })} />
          </label>
          <button type="button" className="tail-btn-primary" onClick={() => onAplicarFechas(fechas)}>
            <Icon name="refresh" size={16} /> Aplicar
          </button>
          {(fechas.desde || fechas.hasta) && (
            <button type="button" className="tail-btn-ghost" onClick={() => { onFechasChange({ desde: '', hasta: '' }); onAplicarFechas({ desde: '', hasta: '' }); }}>
              Limpiar
            </button>
          )}
        </div>
        {puedeExportar && (
          <div className="tail-export-group">
            <button type="button" className="tail-btn-secondary" onClick={exportarResumen} disabled={!reporte} title="Indicadores, política SLA, distribuciones y responsables">
              <Icon name="download" size={16} /> Resumen CSV
            </button>
            <button type="button" className="tail-btn-secondary" onClick={exportarDetalle} disabled={exportandoDetalle} title="Una fila por solicitud con su semáforo SLA">
              <Icon name="download" size={16} /> {exportandoDetalle ? 'Generando…' : 'Detalle SLA CSV'}
            </button>
          </div>
        )}
      </div>

      {/* KPI */}
      <div className="tail-kpi-grid">
        {kpis.map((k) => (
          <button
            key={k.label}
            type="button"
            className={`tail-kpi-card ${k.semaforo ? 'clickable' : ''}`}
            onClick={k.semaforo ? () => onVerSemaforo(k.semaforo) : undefined}
            disabled={!k.semaforo}
          >
            <span className="tail-kpi-label">
              {k.semaforo && <span className={`tail-sla-dot ${k.semaforo}`} />} {k.label}
            </span>
            <span className="tail-kpi-row">
              <span className="tail-kpi-value">{k.valor}</span>
              <span className={`tail-trend-pill ${k.clase}`}>{k.pill}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Flujo + tipología */}
      <div className="tail-charts-row">
        <section className="tail-chart-card">
          <div className="tail-chart-header">
            <div className="tail-chart-header-left">
              <h3>Radicadas vs. solucionadas</h3>
              <p>Flujo de solicitudes en el tiempo</p>
            </div>
            <div className="tail-chart-time-pills" role="tablist">
              {RANGOS.map((x) => (
                <button key={x.id} type="button" role="tab" aria-selected={rango === x.id} className={`tail-time-pill-btn ${rango === x.id ? 'active' : ''}`} onClick={() => setRango(x.id)}>
                  {x.label}
                </button>
              ))}
            </div>
          </div>
          <ReactApexChart
            options={areaOptions}
            series={[{ name: 'Radicadas', data: serie.radicadas }, { name: 'Solucionadas', data: serie.solucionadas }]}
            type="area"
            height={300}
          />
        </section>

        <section className="tail-chart-card">
          <div className="tail-chart-header">
            <div className="tail-chart-header-left">
              <h3>Tipología</h3>
              <p>Naturaleza de las solicitudes</p>
            </div>
          </div>
          <ReactApexChart options={donutOptions} series={tipos.map((t) => t.total)} type="donut" height={230} />
          <div className="tail-donut-legend-grid">
            {tipos.map((t, i) => (
              <div key={t.value} className="tail-donut-legend-item">
                <span className="tail-legend-label-wrap">
                  <span className="tail-legend-color-dot" style={{ backgroundColor: coloresTipo[i] }} />
                  {t.label}
                </span>
                <span className="tail-legend-value">{t.total}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Responsables + riesgo/medios */}
      <div className="tail-charts-row" style={{ gridTemplateColumns: '7fr 5fr' }}>
        <section className="tail-chart-card">
          <div className="tail-chart-header">
            <div className="tail-chart-header-left">
              <h3>Carga por responsable</h3>
              <p>Asignadas, solucionadas y pendientes</p>
            </div>
          </div>
          {responsables.length ? (
            <ReactApexChart
              options={barOptions}
              series={[
                { name: 'Asignadas', data: responsables.map((x) => x.totalAsignadas) },
                { name: 'Solucionadas', data: responsables.map((x) => x.solucionadas) },
                { name: 'Pendientes', data: responsables.map((x) => x.pendientes) }
              ]}
              type="bar"
              height={290}
            />
          ) : (
            <div className="tail-chart-empty">Aún no hay solicitudes asignadas en el periodo.</div>
          )}
        </section>

        <section className="tail-chart-card">
          <div className="tail-chart-header">
            <div className="tail-chart-header-left">
              <h3>Cumplimiento por nivel de riesgo</h3>
              <p>Semaforización automática según el tipo</p>
            </div>
          </div>

          <div className="tail-meter-value">{r.cumplimientoPorcentaje ?? 100}%</div>
          <div className="tail-meter-caption">de las solicitudes están dentro del plazo o solucionadas</div>
          <div className="tail-meter-track">
            <div className="tail-meter-fill" style={{ width: `${r.cumplimientoPorcentaje ?? 100}%` }} />
          </div>

          <div className="tail-list-head"><span>Nivel · plazo</span><span>Solicitudes</span></div>
          {Object.entries(NIVELES_RIESGO).map(([k, v]) => (
            <div key={k} className="tail-list-row">
              <span>
                <span className={`tail-riesgo-dot ${k.toLowerCase()}`} />
                {v.label} <small>· {v.plazo} · {v.tipos}</small>
              </span>
              <strong>{riesgo[k] || 0}</strong>
            </div>
          ))}

          <div className="tail-list-head" style={{ marginTop: 18 }}><span>Medio de respuesta preferido</span><span>%</span></div>
          {Object.entries(MEDIOS_RESPUESTA).map(([k, v]) => (
            <div key={k} className="tail-list-row">
              <span>{v}</span>
              <strong>{total ? Math.round(((canales[k] || 0) / total) * 100) : 0}%</strong>
            </div>
          ))}
        </section>
      </div>

      {/* Solicitudes por área (con filtro) */}
      <ReporteAreas areas={r.reportePorArea || []} />
    </div>
  );
}
