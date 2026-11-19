// Exportación CSV pensada para Excel en español (Colombia):
// separador ";", decimales con coma, BOM UTF-8 (tildes y ñ correctas) y saltos de línea CRLF.

const celda = (v) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(v).replace('.', ',');
  const s = String(v);
  // Evita que Excel interprete el texto como fórmula (=, +, -, @)
  const seguro = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[";\r\n]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
};

export function descargarCSV(nombreArchivo, filas) {
  const csv = '﻿' + filas.map((f) => (f || []).map(celda).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nombreArchivo });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "19/11/2026 14:05" (texto estable para Excel, sin depender de la zona horaria del archivo). */
export const fechaCSV = (valor, conHora = true) => {
  if (!valor) return '';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  const fecha = `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
  return conHora ? `${fecha} ${p(d.getHours())}:${p(d.getMinutes())}` : fecha;
};

export const porcentaje = (parte, total) => (total ? Math.round((parte / total) * 1000) / 10 : 0);
