import React, { useEffect, useRef, useState } from 'react';
import Icon from '../common/Icon';
import SearchBar from './SearchBar';
import { iniciales } from '../../../utils/format';

export default function Topbar({
  user,
  onToggleSidebar,
  busqueda,
  onBusquedaChange,
  buscando,
  resultadosBusqueda,
  alertasSla,
  onVerAlertas,
  onNavigate,
  onLogout
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAbierto(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className="tail-navbar">
      <div className="tail-navbar-left">
        <button type="button" className="tail-icon-btn" onClick={onToggleSidebar} title="Mostrar u ocultar menú" aria-label="Mostrar u ocultar menú">
          <Icon name="menu" size={20} />
        </button>
        <SearchBar value={busqueda} onChange={onBusquedaChange} buscando={buscando} resultados={resultadosBusqueda} />
      </div>

      <div className="tail-navbar-right">
        <button
          type="button"
          className="tail-icon-btn"
          onClick={onVerAlertas}
          title={alertasSla > 0 ? `${alertasSla} solicitud(es) por vencer o vencidas` : 'Sin alertas de vencimiento'}
          aria-label="Alertas de vencimiento"
        >
          {alertasSla > 0 && <span className="tail-notify-count">{alertasSla > 99 ? '99+' : alertasSla}</span>}
          <Icon name="bell" size={20} />
        </button>

        <div className="tail-user-menu" ref={menuRef}>
          <button type="button" className="tail-navbar-user" onClick={() => setMenuAbierto((v) => !v)} aria-expanded={menuAbierto}>
            <span className="tail-user-avatar">{iniciales(user?.nombre)}</span>
            <span className="tail-navbar-user-name">{user?.nombre || 'Funcionario SIAU'}</span>
            <Icon name="chevronRight" size={16} style={{ transform: menuAbierto ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform .15s' }} />
          </button>

          {menuAbierto && (
            <div className="tail-dropdown">
              <div className="tail-dropdown-header">
                <strong>{user?.nombre}</strong>
                <span>{user?.correo}</span>
              </div>
              <button type="button" onClick={() => { setMenuAbierto(false); onNavigate('perfil'); }}>
                <Icon name="user" size={18} /> Mi perfil
              </button>
              <button type="button" className="danger" onClick={onLogout}>
                <Icon name="logout" size={18} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
