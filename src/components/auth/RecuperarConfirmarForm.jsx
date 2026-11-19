import React, { useState } from 'react';
import PasswordInput from './PasswordInput';
import { api } from '../../services/api';

const MIN_PASSWORD = 8;

/** Paso 2 de recuperación: código recibido + nueva contraseña. */
export default function RecuperarConfirmarForm({ correo, onRestablecido, onVolver, onError }) {
  const [codigo, setCodigo] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [cargando, setCargando] = useState(false);

  const restablecer = async (e) => {
    e.preventDefault();
    onError('');
    if (nueva.length < MIN_PASSWORD) return onError(`La nueva contraseña debe tener mínimo ${MIN_PASSWORD} caracteres.`);
    if (nueva !== confirmar) return onError('Las contraseñas no coinciden. Por favor verifique.');

    setCargando(true);
    try {
      const data = await api.confirmarRecuperacion(correo, codigo.trim(), nueva);
      onRestablecido(data?.message || '¡Contraseña restablecida exitosamente!');
    } catch (err) {
      onError(err.message || 'Error al restablecer contraseña');
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={restablecer}>
      <div className="login-notice">
        Enviamos un código de 6 dígitos a <b>{correo}</b>. Revisa tu correo e ingrésalo a continuación.
      </div>

      <div className="login-field">
        <label htmlFor="rec-codigo">Código de 6 dígitos</label>
        <input
          id="rec-codigo"
          type="text"
          inputMode="numeric"
          className="login-input"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
          maxLength={6}
          placeholder="Ingresa el código"
          autoComplete="one-time-code"
          required
        />
      </div>

      <div className="login-field">
        <label htmlFor="rec-nueva">Nueva contraseña</label>
        <PasswordInput id="rec-nueva" value={nueva} onChange={setNueva} placeholder={`Mínimo ${MIN_PASSWORD} caracteres`} autoComplete="new-password" />
      </div>

      <div className="login-field">
        <label htmlFor="rec-confirmar">Confirmar contraseña</label>
        <PasswordInput id="rec-confirmar" value={confirmar} onChange={setConfirmar} placeholder="Repite la contraseña" autoComplete="new-password" />
      </div>

      <button type="submit" className="login-btn" disabled={cargando}>
        {cargando ? 'Actualizando…' : 'Restablecer contraseña'}
      </button>

      <div className="login-links">
        <button type="button" className="login-link accent" onClick={onVolver}>&larr; Cancelar y volver</button>
      </div>
    </form>
  );
}
