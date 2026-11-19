import React from 'react';
import Icon from '../common/Icon';
import { iniciales } from '../../../utils/format';
import { rolLabel } from '../../../utils/permisos';

const LOGO = '/assets/logo-clinical-house.png';

/** Navegación lateral. `collapsed` la reduce a íconos; en móvil se muestra como panel deslizable. */
export default function Sidebar({ user, activeTab, onNavigate, collapsed, mobileOpen, onCloseMobile, contadores, permitidas = {} }) {
  const esSuperAdmin = user?.rol === 'SUPER_ADMIN';
  const visible = (id) => permitidas[id] !== false;

  const items = [
    { seccion: 'Panel principal' },
    visible('analytics') && { id: 'analytics', label: 'Reportes y SLA', icon: 'chart' },
    visible('pqrsf') && { id: 'pqrsf', label: 'Gestión de PQRSF', icon: 'file', badge: contadores?.pendientes || null },
    visible('auditoria') && { id: 'auditoria', label: 'Auditoría', icon: 'shield' },
    { seccion: 'Administración' },
    visible('configuracion') && { id: 'configuracion', label: 'Configuración', icon: 'sliders' },
    { id: 'usuarios', label: 'Usuarios', icon: 'users', badge: esSuperAdmin ? 'Admin' : null, badgeClass: 'brand' },
    { seccion: 'Cuenta' },
    { id: 'perfil', label: 'Mi perfil', icon: 'settings' }
  ].filter(Boolean);

  return (
    <>
      {mobileOpen && <div className="tail-sidebar-backdrop" onClick={onCloseMobile} />}
      <aside className={`tail-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="tail-sidebar-header">
          <a href="/gestion-siau" className="tail-sidebar-brand" title="IPS Clinical House · Panel SIAU">
            <img src={LOGO} alt="IPS Clinical House" className="tail-brand-logo" />
          </a>
        </div>

        <nav className="tail-sidebar-nav">
          {items.map((item, i) =>
            item.seccion ? (
              <div key={`s-${i}`} className="tail-nav-section-title">
                <span>{item.seccion}</span>
              </div>
            ) : (
              <button
                key={item.id}
                type="button"
                className={`tail-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <span className="tail-nav-item-content">
                  <Icon name={item.icon} size={22} />
                  <span className="tail-nav-label">{item.label}</span>
                </span>
                {item.badge ? <span className={`tail-nav-badge ${item.badgeClass || ''}`}>{item.badge}</span> : null}
              </button>
            )
          )}

          <a href="/" target="_blank" rel="noopener noreferrer" className="tail-nav-item" title={collapsed ? 'Formulario paciente' : undefined}>
            <span className="tail-nav-item-content">
              <Icon name="globe" size={22} />
              <span className="tail-nav-label">Formulario paciente</span>
            </span>
            <Icon name="external" size={14} className="tail-nav-external" />
          </a>
        </nav>

        <div className="tail-sidebar-footer">
          <button type="button" className="tail-user-summary-card" onClick={() => onNavigate('perfil')} title="Mi perfil">
            <span className="tail-user-avatar">{iniciales(user?.nombre)}</span>
            <span className="tail-user-meta">
              <span className="tail-user-name">{user?.nombre || 'Funcionario SIAU'}</span>
              <span className="tail-user-role-badge">{user?.rol === 'SUPER_ADMIN' ? 'Super administrador' : user?.cargo || rolLabel(user?.rol)}</span>
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
