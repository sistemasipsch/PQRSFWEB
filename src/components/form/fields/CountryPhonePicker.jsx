import React, { useEffect, useRef, useState } from 'react';
import { PAISES } from '../../../constants/formulario';
import { bloquearNoNumericos } from '../../../utils/validacion';

const bandera = (iso) => `https://flagcdn.com/24x18/${iso}.png`;

/** Teléfono con selector de indicativo de país (banderas). */
export default function CountryPhonePicker({ paisCodigo, onPaisChange, value, onChange, id, name, placeholder = '3001234567', required = true }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  const actual = PAISES.find((p) => p.codigo === paisCodigo) || PAISES[0];

  useEffect(() => {
    const fuera = (e) => ref.current && !ref.current.contains(e.target) && setAbierto(false);
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, []);

  return (
    <div className="custom-phone-group" ref={ref}>
      <div className="flag-select-container">
        <button
          type="button"
          className="flag-trigger-btn"
          onClick={() => setAbierto((v) => !v)}
          title={`País seleccionado: ${actual.nombre} (${actual.codigo})`}
          aria-haspopup="listbox"
          aria-expanded={abierto}
        >
          <img src={bandera(actual.iso)} alt={actual.nombre} className="flag-icon-img" />
          <span>{actual.codigo}</span>
          <span className="flag-caret">▼</span>
        </button>

        {abierto && (
          <div className="flag-dropdown-panel" role="listbox">
            {PAISES.map((p) => (
              <button
                key={p.codigo + p.iso}
                type="button"
                role="option"
                aria-selected={p.codigo === actual.codigo}
                className={`flag-dropdown-item ${p.codigo === actual.codigo ? 'active' : ''}`}
                onClick={() => { onPaisChange(p.codigo); setAbierto(false); }}
              >
                <img src={bandera(p.iso)} alt={p.nombre} className="flag-icon-img" />
                <span className="flag-item-name">{p.nombre}</span>
                <span className="flag-item-code">{p.codigo}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <input
        type="tel"
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onKeyDown={bloquearNoNumericos}
        placeholder={placeholder}
        maxLength="12"
        required={required}
        className="phone-number-input"
      />
    </div>
  );
}
