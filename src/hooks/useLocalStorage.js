import { useEffect, useState } from 'react';

/** Estado persistido en localStorage (tolerante a navegadores sin almacenamiento). */
export default function useLocalStorage(clave, inicial) {
  const [valor, setValor] = useState(() => {
    try {
      const guardado = localStorage.getItem(clave);
      return guardado !== null ? JSON.parse(guardado) : inicial;
    } catch {
      return inicial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
    } catch {
      /* sin almacenamiento disponible */
    }
  }, [clave, valor]);

  return [valor, setValor];
}
