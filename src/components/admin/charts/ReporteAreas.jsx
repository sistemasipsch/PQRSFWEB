import React, { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { baseChart, ejeY } from './chartTheme';
import { COLORES, ESTADOS, TIPOS_SOLICITUD } from '../../../constants/pqrsf';

const TODAS = '__todas__';

const SEMAFORO = [
  { clave: 'enTermino', label: 'En término', color: COLORES.verde },
  { clave: 'porVencer', label: 'Por vencer', color: COLORES.ambar },
  { clave: 'vencidas', label: 'Vencidas', color: COLORES.rojo },
  { clave: 'solucionadas', label: 'Solucionadas', color: COLORES.azul }
];

/**
 * Reportes por área: con "Todas" muestra el semáforo de cada área (clic en una barra para filtrarla);
 * con un área elegida muestra sus indicadores, tipos de solicitud y estados.
 */
export default function ReporteAreas({ areas = [] }) {
  const [filtro, setFiltro] = useState(TODAS);
  const [soloConSolicitudes, setSoloConSolicitudes] = useState(true);

  const visibles = useMemo(
    () => (soloConSolicitudes ? areas.filter((a) => a.total > 0) : areas),
    [areas, soloConSolicitudes]
  );
  const seleccionada = areas.find((a) => a.area === filtro) || null;

  // ---------- Vista general: barras apiladas por área ----------
  const alto = Math.max(220, visibles.length * 38 + 70);
  const opcionesGeneral = {
    ...baseChart('bar', {
      stacked: true,
      events: {
        dataPointSelection: (_e, _ctx, cfg) => {
          const a = visibles[cfg.dataPointIndex];
          if (a) setFiltro(a.area);
        }
      }
    }),
    colors: SEMAFORO.map((s) => s.color),
    plotOptions: { bar: { horizontal: true, barHeight: '58%', borderRadius: 3, borderRadiusApplication: 'end', borderRadiusWhenStacked: 'last' } },
    xaxis: {
      categories: visibles.map((a) => a.area),
      labels: { style: { colors: COLORES.gris, fontSize: '12px' }, formatter: (v) => (Number.isInteger(v) ? v : '') }
    },
    yaxis: { labels: { style: { colors: COLORES.negro, fontSize: '12.5px' }, maxWidth: 190 } },
    grid: { borderColor: '#F1F2F4', xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
    tooltip: { theme: 'light', shared: true, intersect: false },
    states: { active: { filter: { type: 'none' } } }
  };
  const seriesGeneral = SEMAFORO.map((s) => ({ name: s.label, data: visibles.map((a) => a[s.clave]) }));

  // ---------- Vista de un área: tipos de solicitud ----------
  const tiposArea = TIPOS_SOLICITUD.map((t) => ({ label: t.label, total: seleccionada?.tipos?.[t.value] || 0 }));
  const opcionesTipos = {
    ...baseChart('bar'),
    colors: [COLORES.azul],
    plotOptions: { bar: { columnWidth: '46%', borderRadius: 4, borderRadiusApplication: 'end', distributed: false } },
    dataLabels: { enabled: true, style: { fontSize: '12px', colors: [COLORES.negro] }, offsetY: -18, formatter: (v) => (v ? v : '') },
    xaxis: { categories: tiposArea.map((t) => t.label), axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: COLORES.gris, fontSize: '12px' } } },
    yaxis: ejeY,
    legend: { show: false }
  };

  const conSolicitudes = areas.filter((a) => a.total > 0).length;

  return (
    <section className="tail-chart-card">
      <div className="tail-chart-header">
        <div className="tail-chart-header-left">
          <h3>Solicitudes por área</h3>
          <p>
            {seleccionada
              ? `Detalle del área ${seleccionada.area}`
              : 'Semáforo de cumplimiento por área · haga clic en una barra para ver su detalle'}
          </p>
        </div>
        <div className="tail-area-filtros">
          {!seleccionada && (
            <label className="tail-area-check">
              <input type="checkbox" checked={soloConSolicitudes} onChange={(e) => setSoloConSolicitudes(e.target.checked)} />
              Solo áreas con solicitudes
            </label>
          )}
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar por área">
            <option value={TODAS}>Todas las áreas</option>
            {areas.map((a) => (
              <option key={a.area} value={a.area}>{a.area} ({a.total})</option>
            ))}
          </select>
          {seleccionada && (
            <button type="button" className="tail-btn-ghost sm" onClick={() => setFiltro(TODAS)}>Ver todas</button>
          )}
        </div>
      </div>

      {!areas.length || (!seleccionada && !visibles.length) ? (
        <div className="tail-chart-empty">
          {areas.length ? 'Ninguna área tiene solicitudes en el periodo.' : 'No hay áreas configuradas ni solicitudes en el periodo.'}
        </div>
      ) : !seleccionada ? (
        <>
          <ReactApexChart key={`g-${visibles.length}`} options={opcionesGeneral} series={seriesGeneral} type="bar" height={alto} />
          <div className="tail-area-pie">
            {conSolicitudes} de {areas.length} áreas con solicitudes en el periodo
            {areas.some((a) => a.area === 'Sin área' && a.total > 0) &&
              ` · ${areas.find((a) => a.area === 'Sin área').total} solicitudes aún sin área asignada`}
          </div>
        </>
      ) : (
        <div className="tail-area-detalle">
          <div className="tail-area-kpis">
            <div className="tail-area-kpi">
              <span>Solicitudes</span>
              <strong>{seleccionada.total}</strong>
            </div>
            <div className="tail-area-kpi">
              <span>Cumplimiento</span>
              <strong>{seleccionada.cumplimientoPorcentaje}%</strong>
            </div>
            {SEMAFORO.map((s) => (
              <div key={s.clave} className="tail-area-kpi">
                <span><i style={{ background: s.color }} />{s.label}</span>
                <strong>{seleccionada[s.clave]}</strong>
              </div>
            ))}
          </div>

          {seleccionada.total ? (
            <div className="tail-area-grid">
              <div>
                <div className="tail-list-head"><span>Por tipo de solicitud</span></div>
                <ReactApexChart key={`t-${seleccionada.area}`} options={opcionesTipos} series={[{ name: 'Solicitudes', data: tiposArea.map((t) => t.total) }]} type="bar" height={250} />
              </div>
              <div>
                <div className="tail-list-head"><span>Por estado</span><span>Solicitudes</span></div>
                {ESTADOS.map((e) => {
                  const n = seleccionada.estados?.[e.value] || 0;
                  return (
                    <div key={e.value} className="tail-list-row">
                      <span>{e.label}</span>
                      <strong>{n} <small className="tail-cell-muted">· {Math.round((n / seleccionada.total) * 100)}%</small></strong>
                    </div>
                  );
                })}
                <div className="tail-meter-track" style={{ marginTop: 16 }}>
                  <div className="tail-meter-fill" style={{ width: `${seleccionada.cumplimientoPorcentaje}%` }} />
                </div>
                <div className="tail-meter-caption">{seleccionada.cumplimientoPorcentaje}% dentro del plazo o solucionadas</div>
              </div>
            </div>
          ) : (
            <div className="tail-chart-empty">El área {seleccionada.area} no tiene solicitudes en el periodo.</div>
          )}
        </div>
      )}
    </section>
  );
}
