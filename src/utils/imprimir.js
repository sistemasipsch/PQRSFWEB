// ============================================================================
// Impresión / PDF de documentos institucionales.
// Se arma un documento A4 independiente (sin el resto de la página) en un iframe oculto
// y se abre el diálogo de impresión, donde se elige "Guardar como PDF".
// ============================================================================

import { MEDIOS_RESPUESTA, NIVELES_RIESGO, estadoLabel } from '../constants/pqrsf';

const AZUL = '#1062EA';

export const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const fechaHora = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const tipoLimpio = (t) => (t || 'Solicitud').replace(/^\([A-Z]\)\s*/, '');

const nombre = (...partes) => partes.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() || '—';

const destinoRespuesta = (p) => {
  const medio = p.medioRespuesta || 'C';
  if (medio === 'A') return [p.respDireccion, p.respBarrio, p.respMunicipio].filter(Boolean).join(', ');
  if (medio === 'B') return [p.respCelular, p.respTelefonoFijo].filter(Boolean).join(' / ');
  return p.respCorreo || p.famEmail;
};

const ESTILOS = `
  @page { size: A4; margin: 14mm 14mm 16mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; color: #111827; font-size: 10.5pt; line-height: 1.45;
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .doc { width: 100%; max-width: 182mm; margin: 0 auto; }
  .head { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 10px; border-bottom: 2.5px solid ${AZUL}; }
  .head img { height: 46px; }
  .head .meta { text-align: right; font-size: 8.5pt; color: #6B7280; line-height: 1.4; }
  .head .meta strong { display: block; font-size: 12pt; color: #111827; letter-spacing: .2px; }
  h1 { font-size: 15pt; margin: 16px 0 2px; text-align: center; letter-spacing: .3px; }
  .sub { text-align: center; color: #6B7280; font-size: 9pt; margin: 0 0 14px; }
  h2 { font-size: 9pt; text-transform: uppercase; letter-spacing: .6px; color: ${AZUL}; margin: 16px 0 6px; padding-bottom: 3px; border-bottom: 1px solid #E5E7EB; }
  table { width: 100%; border-collapse: collapse; }
  .kv td { padding: 4px 6px; vertical-align: top; border-bottom: 1px solid #F3F4F6; }
  .kv td.k { width: 30%; color: #6B7280; font-size: 9pt; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; }
  .box { border: 1px solid #E5E7EB; border-radius: 6px; padding: 9px 11px; white-space: pre-wrap; word-wrap: break-word; font-size: 10pt; background: #FAFAFA; }
  .pill { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 8.5pt; font-weight: 600; background: #EAF2FE; color: ${AZUL}; }
  .resumen { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; margin-top: 4px; }
  .resumen div { padding: 7px 9px; border-right: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB; }
  .resumen div:nth-child(4n) { border-right: none; }
  .resumen div:nth-last-child(-n+4) { border-bottom: none; }
  .resumen span { display: block; font-size: 7.5pt; color: #6B7280; text-transform: uppercase; letter-spacing: .4px; }
  .resumen b { font-size: 9.5pt; }
  .traza th { text-align: left; font-size: 8pt; color: #6B7280; text-transform: uppercase; letter-spacing: .4px; padding: 5px 6px; background: #F3F4F6; }
  .traza td { padding: 5px 6px; border-bottom: 1px solid #F3F4F6; vertical-align: top; font-size: 9pt; }
  .traza tr { page-break-inside: avoid; }
  .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 34px; page-break-inside: avoid; }
  .firmas div { border-top: 1px solid #111827; padding-top: 4px; font-size: 8.5pt; color: #4B5563; text-align: center; }
  .foot { margin-top: 18px; padding-top: 8px; border-top: 1px solid #E5E7EB; font-size: 7.8pt; color: #6B7280; text-align: center; line-height: 1.5; }
  .radicado { margin: 8px auto 14px; max-width: 120mm; text-align: center; border: 1.5px solid ${AZUL}; border-radius: 10px; padding: 12px; }
  .radicado span { display: block; font-size: 8.5pt; text-transform: uppercase; letter-spacing: .6px; color: #6B7280; }
  .radicado strong { display: block; font-size: 22pt; color: ${AZUL}; letter-spacing: 1px; margin: 3px 0; }
  .radicado small { color: #4B5563; font-size: 9pt; }
  .comprobante { max-width: 150mm; margin: 0 auto; }
  section { page-break-inside: avoid; }
`;

/** Abre el diálogo de impresión con el documento dado. */
export function imprimirDocumento({ titulo, cuerpo }) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0', visibility: 'hidden' });
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${esc(titulo)}</title>
    <base href="${window.location.origin}/"><style>${ESTILOS}</style></head><body>${cuerpo}</body></html>`);
  doc.close();

  const lanzar = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    // Se retira después de cerrar el diálogo (print() bloquea en la mayoría de navegadores)
    setTimeout(() => iframe.remove(), 1000);
  };

  // Esperar el logo antes de imprimir para que salga en el PDF
  const imgs = Array.from(doc.images);
  const pendientes = imgs.filter((i) => !i.complete);
  if (!pendientes.length) {
    setTimeout(lanzar, 50);
  } else {
    let faltan = pendientes.length;
    const listo = () => { faltan -= 1; if (faltan <= 0) lanzar(); };
    pendientes.forEach((i) => { i.onload = listo; i.onerror = listo; });
    setTimeout(() => { if (faltan > 0) { faltan = 0; lanzar(); } }, 2500);
  }
}

const encabezado = (derecha) => `
  <div class="head">
    <img src="/assets/logo-clinical-house.png" alt="IPS Clinical House" />
    <div class="meta">${derecha}</div>
  </div>`;

const kv = (filas) =>
  `<table class="kv">${filas
    .filter(Boolean)
    .map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td>${v}</td></tr>`)
    .join('')}</table>`;

// ---------------------------------------------------------------------------
// Comprobante de radicación (formulario público)
// ---------------------------------------------------------------------------
export function imprimirComprobante(r) {
  const paciente = r.pacNombreCompleto || nombre(r.pacPrimerNombre, r.pacSegundoNombre, r.pacPrimerApellido, r.pacSegundoApellido);
  const familiar = r.famNombreCompleto || nombre(r.famPrimerNombre, r.famSegundoNombre, r.famPrimerApellido, r.famSegundoApellido);
  const medio = r.medioRespuesta || 'C';
  const adjuntos = r.adjuntos?.length || 0;

  const cuerpo = `
  <div class="doc comprobante">
    ${encabezado(`<strong>SIAU</strong>Servicio de Información y<br/>Atención al Usuario`)}
    <h1>Comprobante de radicación</h1>
    <p class="sub">Peticiones, quejas, reclamos, sugerencias, felicitaciones y tutelas</p>

    <div class="radicado">
      <span>Número de radicado</span>
      <strong>${esc(r.consecutivo)}</strong>
      <small>Radicado el ${esc(fechaHora(r.fechaRadicacion))}</small>
    </div>

    <section>
      <h2>Datos de la solicitud</h2>
      ${kv([
        ['Tipo de solicitud', esc(tipoLimpio(r.tipoSolicitud))],
        ['Estado', `<span class="pill">${esc(estadoLabel(r.estado || 'radicado'))}</span>`],
        ['Paciente', `${esc(paciente)}<br/><small>${esc(r.pacTipoDocumento)} ${esc(r.pacNumeroDocumento)}</small>`],
        ['Entidad / EPS', esc(r.pacEntidad)],
        ['Radicado por', `${esc(familiar)}<br/><small>${esc(r.famTipoDocumento)} ${esc(r.famNumeroDocumento)}</small>`],
        ['Respuesta por', `${esc(MEDIOS_RESPUESTA[medio])}: ${esc(destinoRespuesta(r) || '—')}`],
        ['Documentos adjuntos', adjuntos ? `${adjuntos} archivo(s)` : 'Ninguno']
      ])}
    </section>

    <section>
      <h2>Descripción</h2>
      <div class="box">${esc(r.descripcion)}</div>
    </section>

    <div class="foot">
      Conserve este comprobante: el número de radicado le permite hacer seguimiento a su solicitud.<br/>
      IPS Clinical House · SIAU · siau@clinicalhouse.co<br/>
      Sus datos se tratan de forma confidencial conforme a la Ley 1581 de 2012.
    </div>
  </div>`;

  imprimirDocumento({ titulo: `Comprobante ${r.consecutivo}`, cuerpo });
}

// ---------------------------------------------------------------------------
// Reporte completo de una PQRSF (panel administrativo)
// ---------------------------------------------------------------------------
export function imprimirReportePqrsf(p, user) {
  const nivel = NIVELES_RIESGO[p.nivelRiesgo] || NIVELES_RIESGO.SIMPLE;
  const medio = p.medioRespuesta || 'C';
  const trazas = [...(p.trazas || [])].sort((a, b) => new Date(a.fechaRegistro) - new Date(b.fechaRegistro));

  const movimiento = (t) =>
    t.estadoAnterior && t.estadoAnterior !== t.estadoNuevo
      ? `${esc(estadoLabel(t.estadoAnterior))} → <b>${esc(estadoLabel(t.estadoNuevo))}</b>`
      : `<b>${esc(estadoLabel(t.estadoNuevo))}</b>`;

  const cuerpo = `
  <div class="doc">
    ${encabezado(`<strong>${esc(p.consecutivo)}</strong>Reporte de PQRSF · SIAU<br/>Generado el ${esc(fechaHora(new Date()))}`)}

    <h1>${esc(tipoLimpio(p.tipoSolicitud))} · ${esc(p.consecutivo)}</h1>
    <p class="sub">Radicada el ${esc(fechaHora(p.fechaRadicacion))}</p>

    <div class="resumen">
      <div><span>Estado</span><b>${esc(estadoLabel(p.estado))}</b></div>
      <div><span>Nivel de riesgo</span><b>${esc(nivel.label)}</b></div>
      <div><span>Plazo</span><b>${esc(p.plazoHoras ? `${p.plazoHoras} horas` : nivel.plazo)}</b></div>
      <div><span>Semáforo</span><b>${esc(p.tiempoRespuestaTexto || '—')}</b></div>
      <div><span>Fecha límite</span><b>${esc(fechaHora(p.fechaLimite))}</b></div>
      <div><span>Responsable</span><b>${esc(p.responsableAsignado || 'Sin asignar')}</b></div>
      <div><span>Área</span><b>${esc(p.area || 'Sin área')}</b></div>
      <div><span>Última actualización</span><b>${esc(fechaHora(p.fechaActualizacion))}</b></div>
    </div>

    <section>
      <h2>1. Descripción de la solicitud</h2>
      <div class="box">${esc(p.descripcion)}</div>
    </section>

    <div class="grid2">
      <section>
        <h2>2. Paciente</h2>
        ${kv([
          ['Nombre', esc(p.pacNombreCompleto || nombre(p.pacPrimerNombre, p.pacPrimerApellido))],
          ['Documento', `${esc(p.pacTipoDocumento)} ${esc(p.pacNumeroDocumento)}`],
          ['EPS · Régimen', `${esc(p.pacEntidad)} · ${esc(p.pacRegimen)}`],
          ['Población', esc(p.pacPoblacion)],
          ['Teléfono', esc(p.pacTelefono)],
          ['Correo', esc(p.pacEmail)],
          ['Dirección', esc(p.pacDireccion)]
        ])}
      </section>
      <section>
        <h2>3. Remitente / familiar</h2>
        ${kv([
          ['Nombre', esc(p.famNombreCompleto || nombre(p.famPrimerNombre, p.famPrimerApellido))],
          ['Documento', `${esc(p.famTipoDocumento)} ${esc(p.famNumeroDocumento)}`],
          ['Teléfono', esc(p.famTelefono)],
          ['Correo', esc(p.famEmail)],
          ['Dirección', esc(p.famDireccion)]
        ])}
        <h2>4. Respuesta solicitada</h2>
        ${kv([
          ['Medio', esc(MEDIOS_RESPUESTA[medio])],
          ['Destino', esc(destinoRespuesta(p) || '—')]
        ])}
      </section>
    </div>

    <section>
      <h2>5. Documentos adjuntos (${p.adjuntos?.length || 0})</h2>
      ${p.adjuntos?.length
        ? `<table class="kv">${p.adjuntos.map((a, i) => `<tr><td class="k">Adjunto ${i + 1}</td><td>${esc(a.nombreOriginal)}</td></tr>`).join('')}</table>`
        : '<div style="color:#6B7280;font-size:9.5pt;">Sin documentos adjuntos.</div>'}
    </section>

    <h2>6. Trazabilidad (${trazas.length} movimiento${trazas.length === 1 ? '' : 's'})</h2>
    <table class="traza">
      <thead><tr><th style="width:21%">Fecha</th><th style="width:20%">Movimiento</th><th style="width:21%">Usuario</th><th>Observación</th></tr></thead>
      <tbody>
        ${trazas.length
          ? trazas.map((t) => `<tr><td>${esc(fechaHora(t.fechaRegistro))}</td><td>${movimiento(t)}</td><td>${esc(t.usuarioResponsable)}</td><td>${esc(t.observacion || '')}</td></tr>`).join('')
          : '<tr><td colspan="4" style="color:#6B7280;">Sin movimientos registrados.</td></tr>'}
      </tbody>
    </table>

    <div class="firmas">
      <div>Elaboró: ${esc(user?.nombre || '')}<br/>${esc(user?.cargo || '')}</div>
      <div>Revisó / Aprobó</div>
    </div>

    <div class="foot">
      IPS Clinical House · Servicio de Información y Atención al Usuario (SIAU) · siau@clinicalhouse.co<br/>
      Documento confidencial: contiene datos personales y de salud protegidos por la Ley 1581 de 2012. Uso exclusivo institucional.
    </div>
  </div>`;

  imprimirDocumento({ titulo: `PQRSF ${p.consecutivo}`, cuerpo });
}
