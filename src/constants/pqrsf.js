// Catálogos compartidos del sistema PQRSF SIAU

/** Estados oficiales (el valor coincide con lo que guarda el backend). */
export const ESTADOS = [
  { value: 'radicado', label: 'Radicado' },
  { value: 'revisado', label: 'Revisado' },
  { value: 'en proceso', label: 'En proceso' },
  { value: 'solucionado', label: 'Solucionado' }
];

export const estadoLabel = (valor) =>
  ESTADOS.find((e) => e.value === normalizarEstado(valor))?.label || valor || '—';

export const normalizarEstado = (valor) => (valor || '').toLowerCase().replace(/_/g, ' ').trim();

/** Tipos de solicitud del formulario público. */
export const TIPOS_SOLICITUD = [
  { value: '(P) Petición', label: 'Petición', riesgo: 'SIMPLE' },
  { value: '(Q) Queja', label: 'Queja', riesgo: 'PRIORIZADO' },
  { value: '(R) Reclamo', label: 'Reclamo', riesgo: 'PRIORIZADO' },
  { value: '(S) Sugerencia', label: 'Sugerencia', riesgo: 'SIMPLE' },
  { value: '(F) Felicitación', label: 'Felicitación', riesgo: 'SIMPLE' },
  { value: '(T) Tutela', label: 'Tutela', riesgo: 'VITAL' }
];

/** "48" → "2 días", "24" → "24 horas", "36" → "36 horas", "72" → "3 días". */
export const textoPlazo = (horas) => {
  const h = Number(horas) || 0;
  if (h >= 48 && h % 24 === 0) return `${h / 24} días`;
  return `${h} hora${h === 1 ? '' : 's'}`;
};

/**
 * Política de semaforización. Los plazos son los predeterminados de SlaPolicy.java y se
 * reemplazan con los configurados en el panel (Configuración → Tiempos de respuesta) al cargar.
 */
export const NIVELES_RIESGO = {
  SIMPLE: { label: 'Riesgo simple', plazo: '2 días', plazoHoras: 48, tipos: 'Petición, Sugerencia, Felicitación' },
  PRIORIZADO: { label: 'Riesgo priorizado', plazo: '24 horas', plazoHoras: 24, tipos: 'Queja, Reclamo' },
  VITAL: { label: 'Riesgo vital', plazo: '24 horas', plazoHoras: 24, tipos: 'Tutela' }
};

/** Umbral (%) del plazo a partir del cual el semáforo pasa a amarillo. */
export const SLA_UMBRAL = { porcentaje: 50 };

/** Aplica la respuesta de GET /config/sla sobre los catálogos (mutación intencional: es configuración global). */
export const aplicarConfigSla = (config) => {
  (config?.niveles || []).forEach((n) => {
    const nivel = NIVELES_RIESGO[n.nivel];
    if (nivel && n.plazoHoras > 0) {
      nivel.plazoHoras = n.plazoHoras;
      nivel.plazo = textoPlazo(n.plazoHoras);
    }
  });
  if (config?.umbralAlertaPorcentaje) SLA_UMBRAL.porcentaje = config.umbralAlertaPorcentaje;
};

export const SEMAFOROS = [
  { value: 'VERDE', label: 'En término' },
  { value: 'AMARILLO', label: 'Por vencer' },
  { value: 'ROJO', label: 'Vencida' },
  { value: 'FINALIZADO', label: 'Solucionada' }
];

/** Valor usado cuando una solicitud aún no tiene funcionario responsable. */
export const SIN_ASIGNAR = 'Sin asignar';

export const MEDIOS_RESPUESTA = {
  A: 'Domicilio',
  B: 'Teléfono',
  C: 'Correo electrónico'
};

/** Adjuntos del formulario público. */
export const ADJUNTOS = {
  maxArchivos: 3,
  maxTotalBytes: 20 * 1024 * 1024,
  extensiones: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
};

/** Paleta corporativa para gráficos (blanco, gris, negro y azul). */
export const COLORES = {
  azul: '#1062EA',
  azulOscuro: '#0B52C7',
  azulClaro: '#27A3DD',
  azulSuave: '#9DC0F8',
  negro: '#111827',
  gris: '#6B7280',
  grisClaro: '#D1D5DB',
  verde: '#16A34A',
  ambar: '#D97706',
  rojo: '#DC2626'
};
