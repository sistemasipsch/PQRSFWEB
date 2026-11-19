import React, { useEffect, useRef } from 'react';
import Icon from '../common/Icon';

/**
 * Buscador global en tiempo real. Ctrl/⌘ + K enfoca, Escape limpia.
 * La búsqueda se hace en el servidor (radicado, paciente, documento, correo, responsable, tipo o texto).
 */
export default function SearchBar({ value, onChange, buscando, resultados }) {
  const inputRef = useRef(null);
  const esMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={`tail-search-input-group ${value ? 'has-value' : ''}`}>
      <span className="tail-search-icon">
        {buscando ? <span className="tail-spinner" /> : <Icon name="search" size={20} />}
      </span>
      <input
        ref={inputRef}
        type="text"
        className="tail-search-input"
        placeholder="Buscar radicado, paciente, documento, correo o responsable…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onChange('')}
        aria-label="Buscar solicitudes PQRSF"
      />
      {value ? (
        <span className="tail-search-right">
          {typeof resultados === 'number' && !buscando && (
            <span className="tail-search-count">{resultados} resultado{resultados === 1 ? '' : 's'}</span>
          )}
          <button type="button" className="tail-search-clear" onClick={() => onChange('')} aria-label="Limpiar búsqueda">
            <Icon name="x" size={16} />
          </button>
        </span>
      ) : (
        <span className="tail-search-kbd">{esMac ? '⌘' : 'Ctrl'} K</span>
      )}
    </div>
  );
}
