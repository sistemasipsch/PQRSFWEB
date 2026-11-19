import React, { useState } from 'react';
import Modal from '../common/Modal';
import { Alert } from '../common/Field';
import Icon from '../common/Icon';
import { api } from '../../../services/api';

/**
 * Modal de confirmación para eliminar un usuario definitivamente.
 */
export default function EliminarUsuarioModal({ usuario, accesoToken, onClose, onEliminado, onAccesoExpirado }) {
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState('');

  const confirmarEliminar = async () => {
    setEliminando(true);
    setError('');
    try {
      await api.eliminarUsuario(usuario.id, accesoToken);
      onEliminado(usuario);
    } catch (err) {
      if (err.motivo === 'ACCESO_REQUERIDO') {
        onAccesoExpirado(err);
      } else {
        setError(err.message || 'No se pudo eliminar el usuario.');
      }
    } finally {
      setEliminando(false);
    }
  };

  const footer = (
    <>
      <button
        type="button"
        className="tail-btn-secondary"
        onClick={onClose}
        disabled={eliminando}
      >
        Cancelar
      </button>
      <button
        type="button"
        className="tail-btn-danger-solid"
        onClick={confirmarEliminar}
        disabled={eliminando}
      >
        <Icon name="trash" size={16} />
        {eliminando ? 'Eliminando…' : 'Eliminar usuario definitivamente'}
      </button>
    </>
  );

  return (
    <Modal
      title="Eliminar usuario"
      subtitle="Confirmación de baja de funcionario en el sistema SIAU"
      onClose={eliminando ? undefined : onClose}
      footer={footer}
      width={520}
    >
      <div className="tail-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert tipo="error">{error}</Alert>}

        <div className="tail-confirm-box" style={{ borderColor: '#FECACA', background: '#FEF2F2' }}>
          <Icon name="alert" size={22} style={{ color: '#DC2626', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#991B1B', display: 'block', marginBottom: '4px', fontSize: '14.5px' }}>
              ¿Está seguro de eliminar permanentemente a este usuario?
            </strong>
            <span style={{ color: '#7F1D1D', fontSize: '13.5px', lineHeight: 1.5 }}>
              Esta acción es irreversible y revoca de inmediato cualquier acceso de este funcionario a la plataforma.
            </span>
          </div>
        </div>

        <div style={{ background: 'var(--tail-bg-body)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--tail-stroke)' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--tail-text-muted)', marginBottom: '8px', fontWeight: 600 }}>
            Datos de la cuenta seleccionada
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '13.5px' }}>
            <span style={{ color: 'var(--tail-text-body)' }}>Funcionario:</span>
            <strong style={{ color: 'var(--tail-black)' }}>{usuario.nombre}</strong>

            <span style={{ color: 'var(--tail-text-body)' }}>Correo:</span>
            <span style={{ color: 'var(--tail-black)' }}>{usuario.correo}</span>

            <span style={{ color: 'var(--tail-text-body)' }}>Rol:</span>
            <span style={{ color: 'var(--tail-black)' }}>
              {usuario.rol === 'SUPER_ADMIN' ? 'Super Administrador' : 'Jefe SIAU'}
            </span>

            <span style={{ color: 'var(--tail-text-body)' }}>Cargo:</span>
            <span style={{ color: 'var(--tail-black)' }}>{usuario.cargo || '—'}</span>
          </div>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--tail-text-body)', lineHeight: 1.5, background: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--tail-stroke-soft)' }}>
          💡 <strong>Continuidad institucional:</strong> Si este funcionario figura como responsable asignado en casos de PQRSF activos, dichas solicitudes serán reasignadas de forma automática a <em>«Sin asignar»</em> y quedará constancia en la traza de auditoría.
        </div>
      </div>
    </Modal>
  );
}
