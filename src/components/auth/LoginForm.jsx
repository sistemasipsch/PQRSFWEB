import React, { useState } from 'react';
import PasswordInput from './PasswordInput';
import { api } from '../../services/api';

/** Inicio de sesión de funcionarios SIAU. */
export default function LoginForm({ correoInicial = '', onLogin, onOlvido, onError, onInfo }) {
  const [correo, setCorreo] = useState(correoInicial);
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  const ingresar = async (e) => {
    e.preventDefault();
    onError('');
    setCargando(true);
    try {
      onLogin(await api.login(correo.trim(), password));
    } catch (err) {
      onError(err.message || 'Credenciales de acceso incorrectas');
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={ingresar}>
      <div className="login-field">
        <label htmlFor="login-correo">Usuario</label>
        <input
          id="login-correo"
          type="email"
          className="login-input"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          placeholder="Escribe el correo de tu usuario"
          autoComplete="username"
          required
        />
      </div>

      <div className="login-field">
        <label htmlFor="login-password">Contraseña</label>
        <PasswordInput id="login-password" value={password} onChange={setPassword} placeholder="Escribe tu contraseña" />
      </div>

      <button type="submit" className="login-btn" disabled={cargando}>
        {cargando ? 'Ingresando…' : 'Ingresar'}
      </button>

      <div className="login-links">
        <button type="button" className="login-link" onClick={onOlvido}>¿Olvidaste tu contraseña?</button>
        <button
          type="button"
          className="login-link"
          onClick={() => onInfo('Las cuentas del panel SIAU las crea el Super Administrador. Para solicitar acceso comuníquese con siau@clinicalhouse.co.')}
        >
          ¿No tienes cuenta?
        </button>
      </div>
    </form>
  );
}
