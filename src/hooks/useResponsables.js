import { useEffect, useState } from 'react';
import { api } from '../services/api';

/** Responsables posibles: los usuarios activos del sistema (el equipo de la Jefe SIAU). */
export default function useResponsables() {
  const [responsables, setResponsables] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let vivo = true;
    api.listarResponsables()
      .then((lista) => vivo && setResponsables(lista || []))
      .catch((e) => vivo && setError(e.message));
    return () => { vivo = false; };
  }, []);

  return { responsables, nombres: responsables.map((r) => r.nombre), error };
}
