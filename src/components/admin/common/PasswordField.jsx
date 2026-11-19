import React, { useState } from 'react';
import Icon from './Icon';

/** Campo de contraseña con botón de ojo para mostrar u ocultar lo que se escribe. */
export default function PasswordField({ value, onChange, placeholder, autoComplete = 'new-password', name, autoFocus, maxLength = 72 }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="tail-password-field">
      <input
        type={visible ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        maxLength={maxLength}
        spellCheck={false}
      />
      <button
        type="button"
        className={`tail-password-eye ${visible ? 'on' : ''}`}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Ver contraseña'}
        title={visible ? 'Ocultar contraseña' : 'Ver contraseña'}
        tabIndex={-1}
      >
        <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
      </button>
    </div>
  );
}
