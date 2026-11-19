import React, { useState } from 'react';
import { api } from '../../services/api';

/** Paso 1 de recuperación: solicitar código al correo. */
export default function RecuperarSolicitarForm({ correoInicial = '', onEnviado, onVolver, onError }) {
  const [correo, setCorreo] = useState(correoInicial);
  const [cargando, setCargando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    onError('');
    setCargando(true);
    try {
      const data = await api.solicitarRecuperacion(correo.trim());
      onEnviado(correo.trim(), data?.message || 'Código enviado a su correo electrónico.');
    } catch (err) {
      onError(err.message || 'Error al solicitar código de recuperación');
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={enviar}>
      <p className="login-help">Escribe el correo de tu usuario y te enviaremos un código de seguridad.</p>

      <div className="login-field">
        <label htmlFor="rec-correo">Correo de tu usuario</label>
        <input
          id="rec-correo"
          type="email"
          className="login-input"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          placeholder="Escribe el correo de tu usuario"
          autoComplete="username"
          required
        />
      </div>

      <button type="submit" className="login-btn" disabled={cargando}>
        {cargando ? 'Enviando correo…' : 'Enviar código al correo'}
      </button>

      <div className="login-links">
        <button type="button" className="login-link accent" onClick={onVolver}>&larr; Volver al inicio de sesión</button>
      </div>
    </form>
  );
}
