import { useEffect, useState } from 'react';
import { api } from '../services/api';

/** Catálogos de cargos y áreas (para listas desplegables). */
export default function useCatalogos() {
  const [cargos, setCargos] = useState([]);
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    let vivo = true;
    api.listarCargos().then((l) => vivo && setCargos(l || [])).catch(() => {});
    api.listarAreas().then((l) => vivo && setAreas(l || [])).catch(() => {});
    return () => { vivo = false; };
  }, []);

  return { cargos, areas };
}
