import React from 'react';
import Modal from '../common/Modal';
import Icon from '../common/Icon';

/** Confirmación genérica para acciones definitivas. */
export default function ConfirmarModal({ titulo, children, confirmar = 'Confirmar', peligro = false, onConfirmar, onCancelar }) {
  return (
    <Modal title={titulo} onClose={onCancelar} width={480}>
      <div className="tail-modal-body">
        <div className="tail-confirm-box">
          <Icon name="alert" size={20} />
          <div>{children}</div>
        </div>
      </div>
      <div className="tail-modal-footer">
        <button type="button" className="tail-btn-secondary" onClick={onCancelar}>Cancelar</button>
        <button type="button" className={peligro ? 'tail-btn-danger' : 'tail-btn-primary'} onClick={onConfirmar} autoFocus>
          {confirmar}
        </button>
      </div>
    </Modal>
  );
}
