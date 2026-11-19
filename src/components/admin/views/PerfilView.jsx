import React, { useState } from 'react';
import Field, { Alert } from '../common/Field';
import PasswordField from '../common/PasswordField';
import { api } from '../../../services/api';
import { iniciales } from '../../../utils/format';
import { rolLabel } from '../../../utils/permisos';
import useCatalogos from '../../../hooks/useCatalogos';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mi perfil: nombre, correo de acceso, cargo y contraseña. */
export default function PerfilView({ user, onUserUpdate }) {
  const [datos, setDatos] = useState({ nombre: user?.nombre || '', correo: user?.correo || '', cargo: user?.cargo || '' });
  const [pass, setPass] = useState({ nuevo: '', confirmar: '' });
  const [passwordActual, setPasswordActual] = useState('');
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const { cargos } = useCatalogos();

  const cambiosDatos =
    datos.nombre.trim() !== (user?.nombre || '') ||
    datos.correo.trim().toLowerCase() !== (user?.correo || '') ||
    datos.cargo.trim() !== (user?.cargo || '');
  const hayCambios = cambiosDatos || pass.nuevo.length > 0;

  const guardar = async (e) => {
    e.preventDefault();
    const errs = {};
    if (datos.nombre.trim().length < 3) errs.nombre = 'Mínimo 3 caracteres.';
    if (!EMAIL.test(datos.correo.trim())) errs.correo = 'Correo no válido.';
    if (pass.nuevo && pass.nuevo.length < 8) errs.nuevo = 'Mínimo 8 caracteres.';
    if (pass.nuevo !== pass.confirmar) errs.confirmar = 'Las contraseñas no coinciden.';
    if (!passwordActual) errs.actual = 'Requerida para guardar cambios.';
    setErrores(errs);
    if (Object.keys(errs).length) return;

    setGuardando(true);
    setMensaje(null);
    try {
      const sesion = await api.actualizarPerfil({
        nombre: datos.nombre.trim(),
        correo: datos.correo.trim().toLowerCase(),
        cargo: datos.cargo.trim(),
        passwordActual,
        nuevoPassword: pass.nuevo || null
      });
      onUserUpdate(sesion);
      setPass({ nuevo: '', confirmar: '' });
      setPasswordActual('');
      setMensaje({ tipo: 'exito', texto: 'Perfil actualizado correctamente.' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="tail-profile-grid" onSubmit={guardar} noValidate>
      <section className="tail-chart-card tail-profile-card">
        <span className="tail-user-avatar xl">{iniciales(datos.nombre || user?.nombre)}</span>
        <h3>{user?.nombre}</h3>
        <p>{user?.cargo || 'Funcionario SIAU'}</p>
        <span className={`tail-role-pill ${user?.rol === 'SUPER_ADMIN' ? 'admin' : ''}`}>
          {rolLabel(user?.rol)}
        </span>
        <div className="tail-profile-mail">{user?.correo}</div>
      </section>

      <div className="tail-profile-forms">
        {mensaje && <Alert tipo={mensaje.tipo} onClose={() => setMensaje(null)}>{mensaje.texto}</Alert>}

        <section className="tail-chart-card">
          <div className="tail-chart-header-left" style={{ marginBottom: 16 }}>
            <h3>Datos de la cuenta</h3>
            <p>El correo es el usuario con el que inicia sesión.</p>
          </div>
          <div className="tail-form-grid">
            <div className="tail-form-row">
              <Field label="Nombre completo" required error={errores.nombre}>
                <input type="text" value={datos.nombre} onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} placeholder="Escribe tu nombre completo" />
              </Field>
              <Field label="Cargo">
                <select value={datos.cargo} onChange={(e) => setDatos({ ...datos, cargo: e.target.value })}>
                  {datos.cargo && !cargos.some((c) => c.nombre === datos.cargo) && <option value={datos.cargo}>{datos.cargo}</option>}
                  {cargos.filter((c) => c.activo || c.nombre === datos.cargo).map((c) => (
                    <option key={c.id} value={c.nombre} disabled={!c.activo}>{c.nombre}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Correo / usuario de acceso" required error={errores.correo}>
              <input type="email" value={datos.correo} onChange={(e) => setDatos({ ...datos, correo: e.target.value })} placeholder="nombre@clinicalhouse.co" />
            </Field>
          </div>
        </section>

        <section className="tail-chart-card">
          <div className="tail-chart-header-left" style={{ marginBottom: 16 }}>
            <h3>Cambiar contraseña</h3>
            <p>Déjelo en blanco si no desea cambiarla.</p>
          </div>
          <div className="tail-form-row">
            <Field label="Nueva contraseña" error={errores.nuevo} hint="Mínimo 8 caracteres">
              <PasswordField value={pass.nuevo} onChange={(e) => setPass({ ...pass, nuevo: e.target.value })} placeholder="Escribe la nueva contraseña" />
            </Field>
            <Field label="Confirmar nueva contraseña" error={errores.confirmar}>
              <PasswordField value={pass.confirmar} onChange={(e) => setPass({ ...pass, confirmar: e.target.value })} placeholder="Repite la nueva contraseña" />
            </Field>
          </div>
        </section>

        <section className="tail-chart-card tail-profile-save">
          <Field label="Contraseña actual" required error={errores.actual} hint="Por seguridad, confirme su contraseña para guardar cualquier cambio.">
            <PasswordField value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} placeholder="Escribe tu contraseña actual" autoComplete="current-password" />
          </Field>
          <button type="submit" className="tail-btn-primary" disabled={!hayCambios || guardando}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </section>
      </div>
    </form>
  );
}
