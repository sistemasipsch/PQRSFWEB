import { useCallback, useEffect, useState } from 'react';

export const RUTA_PANEL = '/gestion-siau';

const esRutaPanel = () => {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return ['/gestion-siau', '/admin'].some((r) => path.includes(r)) || hash.includes('gestion-siau') || hash.includes('admin');
};

/** Enrutador mínimo: "publico" (formulario) o "panel" (/gestion-siau, /admin). */
export default function useRuta() {
  const [ruta, setRuta] = useState(() => (esRutaPanel() ? 'panel' : 'publico'));

  useEffect(() => {
    const actualizar = () => setRuta(esRutaPanel() ? 'panel' : 'publico');
    window.addEventListener('popstate', actualizar);
    window.addEventListener('hashchange', actualizar);
    return () => {
      window.removeEventListener('popstate', actualizar);
      window.removeEventListener('hashchange', actualizar);
    };
  }, []);

  const irA = useCallback((destino) => {
    window.history.pushState({}, '', destino === 'panel' ? RUTA_PANEL : '/');
    setRuta(destino);
  }, []);

  return { ruta, irA };
}
