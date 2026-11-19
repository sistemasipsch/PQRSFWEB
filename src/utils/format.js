// Utilidades de formato (fechas, tamaños, nombres)

export const formatearFecha = (valor, opciones = { day: '2-digit', month: 'short', year: 'numeric' }) => {
  if (!valor) return '—';
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-CO', opciones);
};

export const formatearFechaHora = (valor) => {
  if (!valor) return '—';
  const d = new Date(valor);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatearBytes = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const primerNombre = (nombre = '') => {
  const limpio = nombre.replace(/^(dra?\.|lic\.|ing\.|sr\.|sra\.)\s*/i, '').trim();
  return limpio.split(/\s+/)[0] || nombre;
};

export const iniciales = (nombre = '') =>
  nombre
    .replace(/^(dra?\.|lic\.|ing\.)\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || 'U';

export const nombrePaciente = (p) =>
  [p?.pacPrimerNombre, p?.pacPrimerApellido].filter(Boolean).join(' ') || '—';

export const saludoSegunHora = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
};
