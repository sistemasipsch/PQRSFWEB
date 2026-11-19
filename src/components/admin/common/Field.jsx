import React from 'react';

/** Campo de formulario con etiqueta, ayuda y error. */
export default function Field({ label, error, hint, children, required }) {
  return (
    <label className="tail-field">
      {label && (
        <span className="tail-field-label">
          {label}
          {required && <span className="tail-required"> *</span>}
        </span>
      )}
      {children}
      {error ? <span className="tail-field-error">{error}</span> : hint ? <span className="tail-field-hint">{hint}</span> : null}
    </label>
  );
}

export function Alert({ tipo = 'exito', children, onClose }) {
  return (
    <div className={`tail-alert ${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <span>{children}</span>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Cerrar aviso">
          &times;
        </button>
      )}
    </div>
  );
}

export function EmptyRow({ colSpan, children }) {
  return (
    <tr>
      <td colSpan={colSpan} className="tail-empty-cell">
        {children}
      </td>
    </tr>
  );
}
