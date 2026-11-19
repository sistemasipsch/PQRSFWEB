// Permisos de funcionalidades (deben coincidir con Permiso.java).
// El SUPER_ADMIN siempre puede todo; el resto depende de lo configurado en Configuración → Permisos.

export const ROLES = {
  SUPER_ADMIN: 'Super administrador',
  JEFE_SIAU: 'Jefe SIAU',
  FUNCIONARIO_SIAU: 'Funcionario SIAU'
};

export const rolLabel = (rol) => ROLES[rol] || rol || '—';

export const esSuperAdmin = (user) => user?.rol === 'SUPER_ADMIN';

/**
 * ¿El usuario tiene la funcionalidad? Sesiones iniciadas antes de existir los permisos
 * (sin lista `permisos`) se tratan como antes: con acceso completo, hasta que el panel
 * refresca la sesión con /auth/sesion.
 */
export const puede = (user, permiso) => {
  if (!user) return false;
  if (esSuperAdmin(user)) return true;
  if (!Array.isArray(user.permisos)) return true;
  return user.permisos.includes(permiso);
};
