import React, { useState } from 'react';
import PublicFooter from './components/layout/PublicFooter';
import PqrsfForm from './components/form/PqrsfForm';
import AdminLoginPage from './components/auth/AdminLoginPage';
import AdminDashboard from './components/admin/AdminDashboard';
import useSession from './hooks/useSession';
import useRuta from './hooks/useRuta';

/**
 * Raíz de la aplicación:
 *  - "/"              → formulario público de PQRSF
 *  - "/gestion-siau"  → acceso (si no hay sesión) o panel administrativo
 */
export default function App() {
  const { ruta, irA } = useRuta();
  const { usuario, guardar, cerrar } = useSession();
  const [avisoLogin, setAvisoLogin] = useState('');

  const cerrarSesion = (aviso = '') => {
    cerrar();
    setAvisoLogin(typeof aviso === 'string' ? aviso : '');
    irA('panel');
  };

  if (ruta === 'publico') {
    return (
      <div className="app-container">
        <PqrsfForm />
        <PublicFooter />
      </div>
    );
  }

  if (!usuario) {
    return (
      <AdminLoginPage
        key={avisoLogin}
        aviso={avisoLogin}
        onLoginSuccess={(sesion) => { setAvisoLogin(''); guardar(sesion); }}
      />
    );
  }

  return <AdminDashboard user={usuario} onUserUpdate={guardar} onLogout={cerrarSesion} />;
}
