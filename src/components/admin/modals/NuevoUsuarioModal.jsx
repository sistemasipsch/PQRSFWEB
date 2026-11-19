import React, { useState } from 'react';
import Modal from '../common/Modal';
import Field, { Alert } from '../common/Field';
import PasswordField from '../common/PasswordField';
import { api } from '../../../services/api';
import useCatalogos from '../../../hooks/useCatalogos';
import { ROLES } from '../../../utils/permisos';

const VACIO = { nombre: '', correo: '', cargo: '', area: '', rol: 'JEFE_SIAU', password: '', confirmPassword: '' };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Alta de usuario. La autorización de Super Admin ya se obtuvo al entrar al módulo. */
export default function NuevoUsuarioModal({ accesoToken, onClose, onCreado, onAccesoExpirado }) {
  const [d, setD] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const { cargos, areas } = useCatalogos();

  const set = (campo) => (e) => setD({ ...d, [campo]: e.target.value });

  const crear = async (e) => {
    e.preventDefault();
    const errs = {};
    if (d.nombre.trim().length < 3) errs.nombre = 'Mínimo 3 caracteres.';
    if (!EMAIL.test(d.correo.trim())) errs.correo = 'Correo no válido.';
    if (d.password.length < 8) errs.password = 'Mínimo 8 caracteres.';
    if (d.password !== d.confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden.';
    setErrores(errs);
    if (Object.keys(errs).length) return;

    setGuardando(true);
    setError('');
    try {
      const nuevo = await api.crearUsuario({
        nombre: d.nombre.trim(),
        correo: d.correo.trim().toLowerCase(),
        cargo: d.cargo || null,
        area: d.area || null,
        rol: d.rol,
        password: d.password
      }, accesoToken);
      onCreado(nuevo);
    } catch (err) {
      if (err.motivo === 'ACCESO_REQUERIDO') onAccesoExpirado(err);
      else setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal title="Nuevo usuario" subtitle="Datos de la cuenta" onClose={onClose} width={540}>
      <form onSubmit={crear} noValidate>
        <div className="tail-modal-body tail-form-grid">
          {error && <Alert tipo="error" onClose={() => setError('')}>{error}</Alert>}
          <Field label="Nombre completo" required error={errores.nombre}>
            <input type="text" value={d.nombre} onChange={set('nombre')} placeholder="Escribe el nombre completo" autoFocus />
          </Field>
          <Field label="Correo institucional" required error={errores.correo}>
            <input type="email" value={d.correo} onChange={set('correo')} placeholder="Ej. nombre@clinicalhouse.co" />
          </Field>
          <div className="tail-form-row">
            <Field label="Cargo" hint="Se administran en Configuración → Cargos">
              <select value={d.cargo} onChange={set('cargo')}>
                <option value="">Funcionario SIAU (predeterminado)</option>
                {cargos.filter((c) => c.activo).map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
              </select>
            </Field>
            <Field label="Área">
              <select value={d.area} onChange={set('area')}>
                <option value="">Sin área</option>
                {areas.filter((a) => a.activo).map((a) => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Rol" required hint="Las funcionalidades de cada rol se definen en Configuración → Permisos">
            <select value={d.rol} onChange={set('rol')}>
              {Object.entries(ROLES).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
            </select>
          </Field>
          <div className="tail-form-row">
            <Field label="Contraseña inicial" required error={errores.password} hint="Mínimo 8 caracteres">
              <PasswordField value={d.password} onChange={set('password')} placeholder="Escribe una contraseña" />
            </Field>
            <Field label="Confirmar contraseña" required error={errores.confirmPassword}>
              <PasswordField value={d.confirmPassword} onChange={set('confirmPassword')} placeholder="Repite la contraseña" />
            </Field>
          </div>
        </div>
        <div className="tail-modal-footer">
          <button type="button" onClick={onClose} className="tail-btn-secondary">Cancelar</button>
          <button type="submit" disabled={guardando} className="tail-btn-primary">
            {guardando ? 'Creando…' : 'Crear usuario'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
