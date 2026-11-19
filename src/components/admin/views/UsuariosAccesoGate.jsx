import React, { useState } from 'react';
import Icon from '../common/Icon';
import Field, { Alert } from '../common/Field';
import PasswordField from '../common/PasswordField';
import { api } from '../../../services/api';

/**
 * Puerta del módulo de Usuarios: pide credenciales de Super Administrador.
 * - Credenciales de Super Admin → onAutorizado({ token, superAdminNombre, ... })
 * - Credenciales válidas pero de otro rol → letrero de acceso denegado
 * - Credenciales incorrectas → mensaje de error (con bloqueo tras varios intentos)
 */
export default function UsuariosAccesoGate({ onAutorizado, aviso }) {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(aviso || '');
  const [denegado, setDenegado] = useState(null);
  const [validando, setValidando] = useState(false);

  const ingresar = async (e) => {
    e.preventDefault();
    if (!correo.trim() || !password) {
      setError('Ingrese el correo y la contraseña del Super Administrador.');
      return;
    }
    setValidando(true);
    setError('');
    try {
      onAutorizado(await api.accesoUsuarios(correo.trim().toLowerCase(), password));
    } catch (err) {
      setPassword('');
      if (err.motivo === 'NO_SUPER_ADMIN') setDenegado(err.message);
      else setError(err.message);
    } finally {
      setValidando(false);
    }
  };

  if (denegado) {
    return (
      <div className="tail-gate">
        <div className="tail-gate-card denied" role="alert">
          <span className="tail-gate-icon denied"><Icon name="alert" size={30} /></span>
          <h2>Acceso denegado</h2>
          <p>{denegado}</p>
          <p className="tail-gate-hint">Si necesita gestionar cuentas, solicítelo a un Super Administrador del sistema.</p>
          <button type="button" className="tail-btn-secondary" onClick={() => { setDenegado(null); setCorreo(''); }}>
            Intentar con otras credenciales
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tail-gate">
      <form className="tail-gate-card" onSubmit={ingresar} noValidate autoComplete="off">
        <span className="tail-gate-icon"><Icon name="lock" size={28} /></span>
        <h2>Área restringida</h2>
        <p>El módulo de Usuarios solo está disponible para <strong>Super Administradores</strong>. Ingrese sus credenciales para continuar.</p>

        {error && <Alert tipo="error" onClose={() => setError('')}>{error}</Alert>}

        <div className="tail-form-grid">
          <Field label="Correo del Super Administrador" required>
            {/* Texto guía genérico (sin mostrar cuentas reales) y sin autocompletado del navegador */}
            <input
              type="email"
              name="acceso-usuarios-correo"
              placeholder="Escribe el correo del Super Administrador"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
          </Field>
          <Field label="Contraseña" required>
            <PasswordField
              name="acceso-usuarios-clave"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Escribe la contraseña"
            />
          </Field>
        </div>

        <button type="submit" className="tail-btn-primary tail-gate-submit" disabled={validando}>
          <Icon name="lock" size={16} /> {validando ? 'Validando…' : 'Ingresar a Usuarios'}
        </button>
      </form>
    </div>
  );
}
