import { useEffect, useState } from 'react';

/** Devuelve `valor` después de que deje de cambiar durante `ms` milisegundos. */
export default function useDebounce(valor, ms = 350) {
  const [debounced, setDebounced] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return debounced;
}
