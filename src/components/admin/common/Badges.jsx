import React from 'react';
import { NIVELES_RIESGO, estadoLabel, normalizarEstado } from '../../../constants/pqrsf';

/** Semáforo automático calculado por el backend (nivelSemaforo + tiempoRespuestaTexto). */
export function SlaBadge({ pqrsf }) {
  const nivel = (pqrsf?.nivelSemaforo || 'VERDE').toLowerCase();
  const texto = pqrsf?.tiempoRespuestaTexto || '—';
  return (
    <span className={`tail-sla-pill ${nivel}`} title={pqrsf?.fechaLimite ? `Fecha límite: ${new Date(pqrsf.fechaLimite).toLocaleString('es-CO')}` : undefined}>
      <span className={`tail-sla-dot ${nivel}`} />
      {texto}
    </span>
  );
}

export function RiesgoBadge({ nivel }) {
  const info = NIVELES_RIESGO[nivel] || NIVELES_RIESGO.SIMPLE;
  return (
    <span className={`tail-riesgo-pill ${(nivel || 'SIMPLE').toLowerCase()}`} title={`${info.label}: respuesta en ${info.plazo}`}>
      {info.label.replace('Riesgo ', '')} · {info.plazo}
    </span>
  );
}

export function EstadoBadge({ estado }) {
  const clase = normalizarEstado(estado).replace(' ', '-');
  return <span className={`tail-status-pill ${clase}`}>{estadoLabel(estado)}</span>;
}

export function TipoBadge({ tipo }) {
  const limpio = (tipo || '').replace(/^\([A-Z]\)\s*/, '');
  return <span className="tail-tipo-pill">{limpio || '—'}</span>;
}
