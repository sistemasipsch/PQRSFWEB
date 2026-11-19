import { COLORES } from '../../../constants/pqrsf';

const FUENTE = "'Outfit', system-ui, sans-serif";
const EJE = { colors: COLORES.gris, fontSize: '12px', fontFamily: FUENTE };

/** Opciones base compartidas por todos los gráficos ApexCharts del panel. */
export const baseChart = (type, extra = {}) => ({
  chart: { type, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: FUENTE, ...extra },
  dataLabels: { enabled: false },
  grid: { borderColor: '#F1F2F4', xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
  legend: { position: 'top', horizontalAlign: 'left', fontSize: '13px', labels: { colors: COLORES.gris }, markers: { radius: 12 } },
  tooltip: { theme: 'light' },
  noData: { text: 'Sin datos para el periodo', style: { color: COLORES.gris, fontFamily: FUENTE } }
});

export const ejeX = (categorias, extra = {}) => ({
  categories: categorias,
  axisBorder: { show: false },
  axisTicks: { show: false },
  labels: { style: EJE, ...extra }
});

export const ejeY = { labels: { style: EJE, formatter: (v) => (Number.isInteger(v) ? v : v?.toFixed?.(0)) }, min: 0, forceNiceScale: true };
