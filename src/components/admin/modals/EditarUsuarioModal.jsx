import React, { useState } from 'react';
import Modal from '../common/Modal';
import Field, { Alert } from '../common/Field';
import Icon from '../common/Icon';
import { api } from '../../../services/api';
import useCatalogos from '../../../hooks/useCatalogos';
import { ROLES } from '../../../utils/permisos';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Modal para editar la información de un usuario existente.
 */
export default function EditarUsuarioModal({ usuario, accesoToken, onClose, onGuardado, onActualizado, onAccesoExpirado }) {
  const [d, setD] = useState({
    nombre: usuario.nombre || '',
    correo: usuario.correo || '',
    cargo: usuario.cargo || '',
    area: usuario.area || '',
    rol: usuario.rol || 'JEFE_SIAU'
  });

  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const { cargos, areas } = useCatalogos();

  const esAdminPrincipal = usuario.correo === 'admin@clinicalhouse.co';

  const set = (campo) => (e) => setD({ ...d, [campo]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    const errs = {};
    if (d.nombre.trim().length < 3) errs.nombre = 'El nombre debe tener al menos 3 caracteres.';
    if (!EMAIL.test(d.correo.trim())) errs.correo = 'El formato del correo no es válido.';
    setErrores(errs);
    if (Object.keys(errs).length) return;

    setGuardando(true);
    setError('');
    try {
      const actualizado = await api.editarUsuario(usuario.id, {
        nombre: d.nombre.trim(),
        correo: d.correo.trim().toLowerCase(),
        cargo: d.cargo || null,
        area: d.area, // '' = quitar el área
        rol: d.rol
      }, accesoToken);
      (onGuardado || onActualizado)?.(actualizado);
    } catch (err) {
      if (err.motivo === 'ACCESO_REQUERIDO') {
        onAccesoExpirado(err);
      } else {
        setError(err.message || 'Error al actualizar el usuario.');
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      title="Editar usuario"
      subtitle={`Modificar información de ${usuario.nombre}`}
      onClose={guardando ? undefined : onClose}
      width={540}
    >
      <form onSubmit={guardar} noValidate>
        <div className="tail-modal-body tail-form-grid">
          {error && <Alert tipo="error" onClose={() => setError('')}>{error}</Alert>}

          <Field label="Nombre completo" required error={errores.nombre}>
            <input
              type="text"
              value={d.nombre}
              onChange={set('nombre')}
              placeholder="Nombre y apellidos"
              autoFocus
            />
          </Field>

          <Field
            label="Correo institucional"
            required
            error={errores.correo}
            hint={esAdminPrincipal ? 'La cuenta principal del Super Administrador no puede cambiar de correo.' : undefined}
          >
            <input
              type="email"
              value={d.correo}
              onChange={set('correo')}
              placeholder="ejemplo@clinicalhouse.co"
              disabled={esAdminPrincipal}
            />
          </Field>

          <div className="tail-form-row">
            <Field label="Cargo" hint="Se gestionan en Configuración → Cargos">
              <select value={d.cargo} onChange={set('cargo')}>
                <option value="">Funcionario SIAU (predeterminado)</option>
                {cargos.filter((c) => c.activo).map((c) => (
                  <option key={c.id} value={c.nombre}>{c.nombre}</option>
                ))}
              </select>
            </Field>

            <Field label="Área">
              <select value={d.area} onChange={set('area')}>
                <option value="">Sin área</option>
                {areas.filter((a) => a.activo).map((a) => (
                  <option key={a.id} value={a.nombre}>{a.nombre}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field
            label="Rol en el sistema"
            required
            hint={esAdminPrincipal ? 'La cuenta principal del Super Administrador no puede cambiar de rol.' : 'Define los permisos asignados a este usuario'}
          >
            <select value={d.rol} onChange={set('rol')} disabled={esAdminPrincipal}>
              {Object.entries(ROLES).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>{etiqueta}</option>
              ))}
            </select>
          </Field>

          <div style={{ fontSize: '13px', color: 'var(--tail-text-body)', lineHeight: 1.5, background: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--tail-stroke-soft)' }}>
            💡 <strong>Sincronización automática:</strong> Si modifica el nombre de este funcionario, todas las solicitudes PQRSF donde figure como responsable se actualizarán automáticamente con el nuevo nombre.
          </div>
        </div>

        <div className="tail-modal-footer">
          <button type="button" onClick={onClose} className="tail-btn-secondary" disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" disabled={guardando} className="tail-btn-primary">
            <Icon name="check" size={16} />
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
