import React, { useCallback, useEffect, useState } from 'react';
import Icon from '../common/Icon';
import { EmptyRow } from '../common/Field';
import NuevoUsuarioModal from '../modals/NuevoUsuarioModal';
import CambiarPasswordModal from '../modals/CambiarPasswordModal';
import EliminarUsuarioModal from '../modals/EliminarUsuarioModal';
import EditarUsuarioModal from '../modals/EditarUsuarioModal';
import { rolLabel } from '../../../utils/permisos';
import UsuariosAccesoGate from './UsuariosAccesoGate';
import { api } from '../../../services/api';
import { formatearFechaHora, iniciales } from '../../../utils/format';

/**
 * Módulo de Usuarios. Al entrar siempre pide credenciales de Super Administrador;
 * la autorización vive solo mientras el módulo está abierto (al salir se vuelve a pedir).
 */
export default function UsuariosView({ user, onNotificar }) {
  const [acceso, setAcceso] = useState(null); // { token, superAdminNombre, superAdminCorreo }
  const [avisoGate, setAvisoGate] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [cambioPassword, setCambioPassword] = useState(null); // usuario seleccionado
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null); // usuario seleccionado para eliminar
  const [usuarioAEditar, setUsuarioAEditar] = useState(null);

  /** Si la autorización expiró o fue revocada, vuelve a la puerta. */
  const manejarError = useCallback((e) => {
    if (e.motivo === 'ACCESO_REQUERIDO') {
      setAcceso(null);
      setAvisoGate(e.message);
      return true;
    }
    return false;
  }, []);

  const cargar = useCallback(async () => {
    if (!acceso) return;
    setCargando(true);
    setError('');
    try {
      setUsuarios((await api.listarUsuarios(acceso.token)) || []);
    } catch (e) {
      if (!manejarError(e)) setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [acceso, manejarError]);

  useEffect(() => { cargar(); }, [cargar]);

  if (!acceso) {
    return (
      <UsuariosAccesoGate
        aviso={avisoGate}
        onAutorizado={(a) => { setAvisoGate(''); setAcceso(a); }}
      />
    );
  }

  const toggle = async (u) => {
    try {
      await api.cambiarEstadoUsuario(u.id, !u.activo, acceso.token);
      onNotificar('exito', `${u.nombre} fue ${u.activo ? 'desactivado(a)' : 'activado(a)'}.`);
      cargar();
    } catch (e) {
      if (!manejarError(e)) onNotificar('error', e.message);
    }
  };

  return (
    <div className="tail-table-card">
      <div className="tail-table-toolbar">
        <div>
          <div className="tail-card-title">Cuentas del panel SIAU</div>
          <div className="tail-card-sub tail-gate-badge">
            <Icon name="check" size={14} /> Acceso autorizado por <strong>{acceso.superAdminNombre}</strong>
          </div>
        </div>
        <div className="tail-header-actions-group">
          <button
            type="button"
            className="tail-btn-secondary"
            onClick={() => setAcceso(null)}
            title="Cerrar el módulo y volver a pedir credenciales de Super Administrador"
          >
            <Icon name="lock" size={15} /> Bloquear
          </button>
          <span className="tail-header-actions-separator" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setModal(true)}
            className="tail-btn-primary"
          >
            <Icon name="plus" size={16} /> Nuevo usuario
          </button>
        </div>
      </div>

      <div className="tail-table-wrapper">
        <table className="tail-modern-table">
          <thead>
            <tr>
              <th>Funcionario</th>
              <th>Rol</th>
              <th>Cargo</th>
              <th>Último acceso</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody className={cargando ? 'tail-loading-fade' : ''}>
            {error ? (
              <EmptyRow colSpan={6}><span className="tail-text-danger">{error}</span></EmptyRow>
            ) : cargando && !usuarios.length ? (
              <EmptyRow colSpan={6}>Cargando usuarios…</EmptyRow>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="tail-user-cell">
                      <span className="tail-user-avatar sm">{iniciales(u.nombre)}</span>
                      <div>
                        <div className="tail-cell-strong">{u.nombre}{u.correo === user?.correo && <span className="tail-cell-sub"> (usted)</span>}</div>
                        <div className="tail-cell-sub">{u.correo}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`tail-role-pill ${u.rol === 'SUPER_ADMIN' ? 'admin' : ''}`}>{rolLabel(u.rol)}</span></td>
                  <td>
                    <div>{u.cargo || '—'}</div>
                    {u.area && <div className="tail-cell-sub">{u.area}</div>}
                  </td>
                  <td className="tail-cell-muted">{formatearFechaHora(u.ultimoAcceso)}</td>
                  <td><span className={`tail-status-pill ${u.activo ? 'solucionado' : 'inactivo'}`}>{u.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="tail-action-btn-group" style={{ justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="tail-btn-secondary sm"
                        onClick={() => setUsuarioAEditar(u)}
                        title={`Editar información de ${u.nombre}`}
                      >
                        <Icon name="edit" size={14} /> Editar
                      </button>
                      <button
                        type="button"
                        className="tail-btn-secondary sm"
                        onClick={() => setCambioPassword(u)}
                        title={`Cambiar la contraseña de ${u.nombre}`}
                      >
                        <Icon name="lock" size={14} /> Contraseña
                      </button>
                      <button
                        type="button"
                        onClick={() => toggle(u)}
                        className="tail-btn-secondary sm"
                        disabled={u.correo === user?.correo || u.correo === acceso.superAdminCorreo}
                        title={u.correo === acceso.superAdminCorreo ? 'No puede desactivar la cuenta que autorizó el acceso' : undefined}
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setUsuarioAEliminar(u)}
                        className="tail-btn-danger sm"
                        disabled={
                          u.correo === user?.correo ||
                          u.correo === acceso.superAdminCorreo ||
                          u.correo === 'admin@clinicalhouse.co' ||
                          u.correo === 'siau@clinicalhouse.co'
                        }
                        title={
                          u.correo === 'admin@clinicalhouse.co' || u.correo === 'siau@clinicalhouse.co'
                            ? 'Cuenta principal protegida del sistema'
                            : u.correo === user?.correo || u.correo === acceso.superAdminCorreo
                            ? 'No puede eliminar la cuenta que autorizó o tiene la sesión activa'
                            : `Eliminar la cuenta de ${u.nombre}`
                        }
                      >
                        <Icon name="trash" size={14} /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {cambioPassword && (
        <CambiarPasswordModal
          usuario={cambioPassword}
          accesoToken={acceso.token}
          onClose={() => setCambioPassword(null)}
          onAccesoExpirado={(e) => { setCambioPassword(null); manejarError(e); }}
          onCambiada={(u) => {
            setCambioPassword(null);
            onNotificar('exito', `Contraseña de ${u.nombre} actualizada.`);
          }}
        />
      )}

      {usuarioAEditar && (
        <EditarUsuarioModal
          usuario={usuarioAEditar}
          accesoToken={acceso.token}
          onClose={() => setUsuarioAEditar(null)}
          onAccesoExpirado={(e) => { setUsuarioAEditar(null); manejarError(e); }}
          onGuardado={(u) => {
            setUsuarioAEditar(null);
            onNotificar('exito', `${u.nombre} actualizado(a).`);
            cargar();
          }}
        />
      )}

      {modal && (
        <NuevoUsuarioModal
          accesoToken={acceso.token}
          onClose={() => setModal(false)}
          onAccesoExpirado={(e) => { setModal(false); manejarError(e); }}
          onCreado={(nuevo) => {
            setModal(false);
            onNotificar('exito', `Usuario ${nuevo.nombre} creado correctamente.`);
            cargar();
          }}
        />
      )}

      {usuarioAEliminar && (
        <EliminarUsuarioModal
          usuario={usuarioAEliminar}
          accesoToken={acceso.token}
          onClose={() => setUsuarioAEliminar(null)}
          onAccesoExpirado={(e) => { setUsuarioAEliminar(null); manejarError(e); }}
          onEliminado={(eliminado) => {
            setUsuarioAEliminar(null);
            onNotificar('exito', `Usuario ${eliminado.nombre} eliminado exitosamente.`);
            cargar();
          }}
        />
      )}
    </div>
  );
}
