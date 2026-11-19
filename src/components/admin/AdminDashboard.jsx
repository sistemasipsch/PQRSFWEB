import React, { useCallback, useEffect, useState } from 'react';
import Sidebar from './layout/Sidebar';
import Topbar from './layout/Topbar';
import { Alert } from './common/Field';
import AnalyticsView from './views/AnalyticsView';
import PqrsfView from './views/PqrsfView';
import AuditoriaView from './views/AuditoriaView';
import UsuariosView from './views/UsuariosView';
import PerfilView from './views/PerfilView';
import ConfiguracionView from './views/ConfiguracionView';
import DetallePqrsfModal from './modals/DetallePqrsfModal';
import RespuestaCorreoModal from './modals/RespuestaCorreoModal';
import WhatsappModal from './modals/WhatsappModal';
import { api, SESSION_EXPIRED_EVENT } from '../../services/api';
import { NIVELES_RIESGO, aplicarConfigSla } from '../../constants/pqrsf';
import { primerNombre, saludoSegunHora } from '../../utils/format';
import { esSuperAdmin, puede } from '../../utils/permisos';
import useLocalStorage from '../../hooks/useLocalStorage';
import '../../styles/admin.css';

/** Títulos de cada sección (se calculan en cada render: los plazos SLA son configurables). */
const titulos = () => ({
  analytics: { titulo: 'Reportes y SLA', sub: 'Indicadores de oportunidad y cumplimiento del SIAU' },
  pqrsf: {
    titulo: 'Gestión de PQRSF',
    sub: `Semáforo automático · ${Object.values(NIVELES_RIESGO).map((n) => `${n.label.replace('Riesgo ', '')}: ${n.plazo}`).join(' · ')}`
  },
  auditoria: { titulo: 'Auditoría', sub: 'Eventos del día · las fechas anteriores se consultan por día' },
  configuracion: { titulo: 'Configuración', sub: 'Tiempos de respuesta, áreas, cargos y permisos' },
  perfil: { titulo: 'Mi perfil', sub: 'Sus datos de acceso y contraseña' }
});

/** Secciones visibles según los permisos del rol. */
export const seccionesPermitidas = (user) => ({
  analytics: puede(user, 'VER_REPORTES'),
  pqrsf: puede(user, 'VER_PQRSF'),
  auditoria: puede(user, 'VER_AUDITORIA'),
  configuracion: esSuperAdmin(user) || puede(user, 'CONFIGURAR_TIEMPOS'),
  usuarios: true, // la puerta del módulo exige credenciales de Super Admin
  perfil: true
});

const esMovil = () => typeof window !== 'undefined' && window.innerWidth < 900;

/** Contenedor del panel administrativo SIAU. */
export default function AdminDashboard({ user, onUserUpdate, onLogout }) {
  const [activeTab, setActiveTab] = useLocalStorage('siau_tab', 'analytics');
  const [colapsado, setColapsado] = useLocalStorage('siau_sidebar_colapsado', false);
  const [menuMovil, setMenuMovil] = useState(false);

  const [busqueda, setBusqueda] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState(null);
  const [filtroSla, setFiltroSla] = useState('todos');

  const [reporte, setReporte] = useState(null);
  const [cargandoReporte, setCargandoReporte] = useState(false);
  const [fechas, setFechas] = useState({ desde: '', hasta: '' });
  const [stats, setStats] = useState(null);
  const [recargarToken, setRecargarToken] = useState(0);
  const [, setSlaVersion] = useState(0);

  const [detalle, setDetalle] = useState(null);
  const [respuesta, setRespuesta] = useState(null);
  const [whatsapp, setWhatsapp] = useState(null);
  const [aviso, setAviso] = useState(null);

  const permitidas = seccionesPermitidas(user);
  const tab = permitidas[activeTab] ? activeTab : Object.keys(permitidas).find((k) => permitidas[k]);

  // -------------------------------------------------------------- Notificaciones
  const notificar = useCallback((tipo, mensaje) => setAviso({ tipo, mensaje, id: Date.now() }), []);
  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(null), 4500);
    return () => clearTimeout(t);
  }, [aviso]);

  // -------------------------------------------------------------- Sesión vencida
  useEffect(() => {
    const vencida = () => onLogout('Su sesión expiró. Inicie sesión nuevamente.');
    window.addEventListener(SESSION_EXPIRED_EVENT, vencida);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, vencida);
  }, [onLogout]);

  // -------------------------------------------------------------- Permisos y tiempos de respuesta vigentes
  useEffect(() => {
    // Trae los permisos actuales del rol (pueden haber cambiado desde el último inicio de sesión)
    api.sesionActual().then((s) => s && onUserUpdate({ ...user, ...s, token: undefined })).catch(() => {});
    api.obtenerConfigSla().then((c) => { aplicarConfigSla(c); setSlaVersion((v) => v + 1); }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------- Datos globales
  const verReportes = puede(user, 'VER_REPORTES');

  const cargarReporte = useCallback(async (f = fechas) => {
    if (!verReportes) return;
    setCargandoReporte(true);
    try {
      setReporte(await api.obtenerReportes(f.desde, f.hasta));
    } catch (e) {
      notificar('error', e.message);
    } finally {
      setCargandoReporte(false);
    }
  }, [fechas, notificar, verReportes]);

  const cargarStats = useCallback(async () => {
    try {
      setStats(await api.obtenerEstadisticas());
    } catch {
      /* no bloquea el panel */
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargarReporte(); cargarStats(); }, [verReportes]);

  const datosCambiados = useCallback(() => {
    cargarReporte();
    cargarStats();
  }, [cargarReporte, cargarStats]);

  // -------------------------------------------------------------- Navegación
  const navegar = (id) => {
    setActiveTab(id);
    setMenuMovil(false);
  };

  const toggleSidebar = () => (esMovil() ? setMenuMovil((v) => !v) : setColapsado((v) => !v));

  const cambiarBusqueda = (valor) => {
    setBusqueda(valor);
    if (valor && tab !== 'pqrsf' && permitidas.pqrsf) setActiveTab('pqrsf');
    if (!valor) setResultados(null);
  };

  const verSemaforo = (nivel) => {
    setFiltroSla(nivel);
    navegar('pqrsf');
  };

  /** Tras responder (correo o WhatsApp): refresca la bandeja, los KPI y el detalle abierto. */
  const respuestaRegistrada = (act, mensaje) => {
    notificar('exito', mensaje);
    setRecargarToken((n) => n + 1);
    datosCambiados();
  };

  const alertasSla = (reporte?.alertaAmarillo || 0) + (reporte?.vencidasRojo || 0);
  const pendientes = stats ? (stats.total || 0) - (stats.solucionados || 0) : null;
  const TITULOS = titulos();
  const info = TITULOS[tab] || TITULOS.analytics;

  return (
    <div className={`tail-dashboard-layout ${colapsado ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        user={user}
        activeTab={tab}
        onNavigate={navegar}
        collapsed={colapsado}
        mobileOpen={menuMovil}
        onCloseMobile={() => setMenuMovil(false)}
        contadores={{ pendientes }}
        permitidas={permitidas}
      />

      <div className="tail-main-wrapper">
        <Topbar
          user={user}
          onToggleSidebar={toggleSidebar}
          busqueda={busqueda}
          onBusquedaChange={cambiarBusqueda}
          buscando={buscando}
          resultadosBusqueda={busqueda ? resultados : null}
          alertasSla={alertasSla}
          onVerAlertas={() => verSemaforo(reporte?.vencidasRojo ? 'rojo' : 'amarillo')}
          onNavigate={navegar}
          onLogout={() => onLogout()}
        />

        <main className="tail-body-container">
          {aviso && (
            <div className="tail-toast" key={aviso.id}>
              <Alert tipo={aviso.tipo} onClose={() => setAviso(null)}>{aviso.mensaje}</Alert>
            </div>
          )}

          {tab === 'analytics' ? (
            <div className="tail-welcome">
              <div>
                <p className="tail-welcome-eyebrow">{saludoSegunHora()}</p>
                <h1>Te damos la bienvenida, {primerNombre(user?.nombre)}</h1>
                <p>
                  {alertasSla > 0
                    ? <>Tienes <strong>{alertasSla}</strong> solicitud{alertasSla === 1 ? '' : 'es'} por vencer o vencida{alertasSla === 1 ? '' : 's'}. </>
                    : 'Todas las solicitudes están dentro del plazo. '}
                  {pendientes !== null && <>Hay <strong>{pendientes}</strong> PQRSF sin solucionar.</>}
                </p>
              </div>
              <div className="tail-welcome-actions">
                {alertasSla > 0 && permitidas.pqrsf && (
                  <button type="button" className="tail-btn-primary" onClick={() => verSemaforo(reporte?.vencidasRojo ? 'rojo' : 'amarillo')}>
                    Atender alertas
                  </button>
                )}
                {permitidas.pqrsf && <button type="button" className="tail-btn-secondary" onClick={() => navegar('pqrsf')}>Ir a la bandeja</button>}
              </div>
            </div>
          ) : tab === 'usuarios' ? null /* Usuarios: solo el acceso/tabla, sin encabezado */ : (
            <div className="tail-breadcrumb-bar">
              <div className="tail-page-title-group">
                <h1>{info.titulo}</h1>
                <p>{info.sub}</p>
              </div>
            </div>
          )}

          {tab === 'analytics' && (
            <AnalyticsView
              user={user}
              reporte={reporte}
              cargando={cargandoReporte}
              fechas={fechas}
              onFechasChange={setFechas}
              onAplicarFechas={(f) => cargarReporte(f && 'desde' in f ? f : fechas)}
              onVerSemaforo={verSemaforo}
              onError={(m) => notificar('error', m)}
            />
          )}

          {tab === 'pqrsf' && (
            <PqrsfView
              user={user}
              termino={busqueda}
              filtroSla={filtroSla}
              onFiltroSlaChange={setFiltroSla}
              onBuscando={setBuscando}
              onResultados={setResultados}
              onVerDetalle={setDetalle}
              onResponder={setRespuesta}
              onWhatsapp={setWhatsapp}
              onNotificar={notificar}
              recargarToken={recargarToken}
              onDatosCambiados={datosCambiados}
            />
          )}

          {tab === 'auditoria' && <AuditoriaView />}
          {tab === 'configuracion' && (
            <ConfiguracionView
              user={user}
              onNotificar={notificar}
              onSlaCambiado={() => { setSlaVersion((v) => v + 1); setRecargarToken((n) => n + 1); datosCambiados(); }}
            />
          )}
          {tab === 'usuarios' && <UsuariosView user={user} onNotificar={notificar} />}
          {tab === 'perfil' && <PerfilView user={user} onUserUpdate={onUserUpdate} />}
        </main>
      </div>

      {detalle && (
        <DetallePqrsfModal
          pqrsf={detalle}
          user={user}
          onClose={() => setDetalle(null)}
          onResponder={(p) => { setDetalle(null); setRespuesta(p); }}
          onWhatsapp={(p) => { setDetalle(null); setWhatsapp(p); }}
          onActualizada={() => setRecargarToken((n) => n + 1)}
        />
      )}

      {respuesta && (
        <RespuestaCorreoModal
          pqrsf={respuesta}
          user={user}
          onClose={() => setRespuesta(null)}
          onEnviado={(act, destino) => {
            setRespuesta(null);
            respuestaRegistrada(act, `Respuesta de ${act.consecutivo} enviada a ${destino}.`);
          }}
        />
      )}

      {whatsapp && (
        <WhatsappModal
          pqrsf={whatsapp}
          user={user}
          onClose={() => setWhatsapp(null)}
          onRegistrado={() => {
            // La confirmación la muestra el propio modal; aquí solo se refrescan los datos
            setRecargarToken((n) => n + 1);
            datosCambiados();
          }}
        />
      )}
    </div>
  );
}
