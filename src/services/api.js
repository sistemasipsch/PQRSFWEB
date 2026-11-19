// ============================================================================
// CLIENTE API - PQRSF SIAU CLINICAL HOUSE
// ============================================================================

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const SESSION_EXPIRED_EVENT = 'siau:session-expired';

function authHeader() {
  const token = localStorage.getItem('siau_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Petición genérica. Lanza Error con el mensaje del backend ({ message }).
 * Si la sesión venció (401) emite el evento SESSION_EXPIRED_EVENT.
 */
async function request(path, { method = 'GET', body, auth = true, headers: extra = {}, fallbackError = 'Error de comunicación con el servidor' } = {}) {
  const headers = { ...(auth ? authHeader() : {}), ...extra };
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body)
    });
  } catch {
    throw new Error('No hay conexión con el servidor. Verifique que el backend esté en ejecución.');
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && auth) {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
    const error = new Error(data?.message || fallbackError);
    error.status = res.status;
    error.motivo = data?.motivo; // p. ej. NO_SUPER_ADMIN, CREDENCIALES_INVALIDAS, ACCESO_REQUERIDO
    throw error;
  }
  return data;
}

export const api = {
  // ---------------------------------------------------------------- Público
  radicarPqrsf: (formData) =>
    request('/pqrsf', { method: 'POST', body: formData, auth: false, fallbackError: 'Error al radicar la solicitud' }),

  consultarPorConsecutivo: (consecutivo) =>
    request(`/pqrsf/consulta/${encodeURIComponent(consecutivo)}`, { auth: false, fallbackError: 'No se encontró el radicado ingresado' }),

  // ---------------------------------------------------------------- Autenticación
  login: (correo, password) =>
    request('/auth/login', { method: 'POST', body: { correo, password }, auth: false, fallbackError: 'Credenciales incorrectas' }),

  solicitarRecuperacion: (correo) =>
    request('/auth/recuperar/solicitar', { method: 'POST', body: { correo }, auth: false }),

  confirmarRecuperacion: (correo, codigo, nuevoPassword) =>
    request('/auth/recuperar/confirmar', { method: 'POST', body: { correo, codigo, nuevoPassword }, auth: false }),

  actualizarPerfil: (datos) =>
    request('/auth/perfil', { method: 'PUT', body: datos, fallbackError: 'No se pudo actualizar el perfil' }),

  // ---------------------------------------------------------------- PQRSF (panel)
  listarPqrsf: ({ estado = 'todos', responsable = 'todos', area = 'todos', termino = '', page = 0, size = 15 } = {}) => {
    const params = new URLSearchParams({ estado, responsable, area, termino, page, size });
    return request(`/pqrsf?${params}`, { fallbackError: 'Error al cargar la lista de solicitudes' });
  },

  obtenerEstadisticas: () => request('/pqrsf/stats', { fallbackError: 'Error al cargar estadísticas' }),

  obtenerDetallePqrsf: (id) => request(`/pqrsf/${id}`, { fallbackError: 'Error al cargar el detalle' }),

  cambiarEstado: (id, nuevoEstado, observacion) =>
    request(`/pqrsf/${id}/estado`, { method: 'PUT', body: { nuevoEstado, observacion }, fallbackError: 'Error al actualizar el estado' }),

  asignarResponsable: (id, responsable, observacion) =>
    request(`/pqrsf/${id}/responsable`, { method: 'PUT', body: { responsable, observacion }, fallbackError: 'Error al asignar responsable' }),

  responderPorCorreo: (id, { correoDestino, asunto, mensaje, marcarSolucionado }) =>
    request(`/pqrsf/${id}/respuesta`, {
      method: 'POST',
      body: { correoDestino, asunto, mensaje, marcarSolucionado },
      fallbackError: 'No se pudo enviar la respuesta'
    }),

  obtenerReportes: (fechaDesde = '', fechaHasta = '') => {
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);
    const qs = params.toString() ? `?${params}` : '';
    return request(`/pqrsf/reportes${qs}`, { fallbackError: 'Error al generar el reporte' });
  },

  /** Funcionarios activos que pueden ser responsables de una PQRSF. */
  listarResponsables: () => request('/auth/responsables', { fallbackError: 'Error al cargar los responsables' }),

  // ---------------------------------------------------------------- Adjuntos
  /** Descarga un adjunto con la sesión del funcionario (los adjuntos no son públicos). */
  cargarAdjunto: async (adjunto) => {
    let res;
    try {
      res = await fetch(`${BASE_URL}/files/${encodeURIComponent(adjunto.nombreAlmacenado)}`, { headers: authHeader() });
    } catch {
      throw new Error('No hay conexión con el servidor.');
    }
    if (!res.ok) {
      if (res.status === 401) window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
      const data = await res.json().catch(() => null);
      throw new Error(data?.message || 'No se pudo cargar el archivo.');
    }
    return res.blob();
  },
  asignarArea: (id, area) =>
    request(`/pqrsf/${id}/area`, { method: 'PUT', body: { area: area || '' }, fallbackError: 'Error al asignar el área' }),

  registrarWhatsapp: (id, { telefono, mensaje, marcarSolucionado }) =>
    request(`/pqrsf/${id}/whatsapp`, { method: 'POST', body: { telefono, mensaje, marcarSolucionado }, fallbackError: 'No se pudo registrar la respuesta por WhatsApp' }),

  /** Todas las solicitudes del periodo, con su SLA, para exportar el detalle. */
  exportarPqrsf: (fechaDesde = '', fechaHasta = '') => {
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);
    const qs = params.toString() ? `?${params}` : '';
    return request(`/pqrsf/exportar${qs}`, { fallbackError: 'Error al exportar las solicitudes' });
  },

  /** Datos y permisos vigentes de la sesión. */
  sesionActual: () => request('/auth/sesion', { fallbackError: 'No se pudo validar la sesión' }),

  // ---------------------------------------------------------------- Auditoría
  /** Eventos de un día (AAAA-MM-DD; por defecto hoy). Devuelve la página de Spring. */
  obtenerAuditoria: (fecha = '', page = 0, size = 100) => {
    const params = new URLSearchParams({ page, size });
    if (fecha) params.append('fecha', fecha);
    return request(`/auditoria?${params}`, { fallbackError: 'Error al cargar la auditoría' });
  },

  // ---------------------------------------------------------------- Configuración
  obtenerConfigSla: () => request('/config/sla', { fallbackError: 'Error al cargar los tiempos de respuesta' }),
  guardarConfigSla: (plazosHoras, umbralAlertaPorcentaje) =>
    request('/config/sla', { method: 'PUT', body: { plazosHoras, umbralAlertaPorcentaje }, fallbackError: 'No se pudieron guardar los tiempos de respuesta' }),

  listarAreas: () => request('/config/areas', { fallbackError: 'Error al cargar las áreas' }),
  guardarArea: (area) =>
    request(area.id ? `/config/areas/${area.id}` : '/config/areas', { method: area.id ? 'PUT' : 'POST', body: area, fallbackError: 'No se pudo guardar el área' }),
  eliminarArea: (id) => request(`/config/areas/${id}`, { method: 'DELETE', fallbackError: 'No se pudo eliminar el área' }),

  listarCargos: () => request('/config/cargos', { fallbackError: 'Error al cargar los cargos' }),
  guardarCargo: (cargo) =>
    request(cargo.id ? `/config/cargos/${cargo.id}` : '/config/cargos', { method: cargo.id ? 'PUT' : 'POST', body: cargo, fallbackError: 'No se pudo guardar el cargo' }),
  eliminarCargo: (id) => request(`/config/cargos/${id}`, { method: 'DELETE', fallbackError: 'No se pudo eliminar el cargo' }),

  obtenerPermisos: () => request('/config/permisos', { fallbackError: 'Error al cargar los permisos' }),
  guardarPermisos: (cargo, permisos) =>
    request('/config/permisos', { method: 'PUT', body: { cargo, permisos }, fallbackError: 'No se pudieron guardar los permisos' }),

  // ---------------------------------------------------------------- Módulo de Usuarios
  // Protegido por credenciales de Super Administrador: primero se obtiene una autorización
  // temporal con accesoUsuarios() y luego se envía en el header X-Acceso-Usuarios.
  accesoUsuarios: (correo, password) =>
    request('/auth/usuarios/acceso', { method: 'POST', body: { correo, password }, fallbackError: 'No se pudo validar el acceso' }),

  listarUsuarios: (acceso) =>
    request('/auth/usuarios', { headers: { 'X-Acceso-Usuarios': acceso }, fallbackError: 'Error al cargar la lista de usuarios' }),

  crearUsuario: (datos, acceso) =>
    request('/auth/usuarios', { method: 'POST', body: datos, headers: { 'X-Acceso-Usuarios': acceso }, fallbackError: 'Error al crear usuario' }),

  editarUsuario: (id, datos, acceso) =>
    request(`/auth/usuarios/${id}`, { method: 'PUT', body: datos, headers: { 'X-Acceso-Usuarios': acceso }, fallbackError: 'No se pudo actualizar el usuario' }),

  cambiarPasswordUsuario: (id, nuevoPassword, acceso) =>
    request(`/auth/usuarios/${id}/password`, { method: 'PUT', body: { nuevoPassword }, headers: { 'X-Acceso-Usuarios': acceso }, fallbackError: 'No se pudo cambiar la contraseña' }),

  cambiarEstadoUsuario: (id, activo, acceso) =>
    request(`/auth/usuarios/${id}/estado`, { method: 'PUT', body: { activo }, headers: { 'X-Acceso-Usuarios': acceso }, fallbackError: 'Error al actualizar el usuario' }),

  eliminarUsuario: (id, acceso) =>
    request(`/auth/usuarios/${id}`, { method: 'DELETE', headers: { 'X-Acceso-Usuarios': acceso }, fallbackError: 'No se pudo eliminar el usuario' })
};
