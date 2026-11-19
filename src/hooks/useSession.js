import { useCallback, useState } from 'react';

const CLAVE_TOKEN = 'siau_token';
const CLAVE_USUARIO = 'siau_user';

const leerSesion = () => {
  try {
    const token = localStorage.getItem(CLAVE_TOKEN);
    const usuario = localStorage.getItem(CLAVE_USUARIO);
    return token && usuario ? JSON.parse(usuario) : null;
  } catch {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    return null;
  }
};

/** Sesión del funcionario SIAU persistida en localStorage (token JWT + datos del usuario). */
export default function useSession() {
  const [usuario, setUsuario] = useState(leerSesion);

  /** Guarda la sesión devuelta por /auth/login o /auth/perfil. */
  const guardar = useCallback((sesion) => {
    if (sesion?.token) localStorage.setItem(CLAVE_TOKEN, sesion.token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(sesion));
    setUsuario(sesion);
  }, []);

  const cerrar = useCallback(() => {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    setUsuario(null);
  }, []);

  return { usuario, guardar, cerrar };
}
