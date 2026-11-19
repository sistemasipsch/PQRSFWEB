import { useCallback, useEffect, useRef, useState } from 'react';
import { ADJUNTOS } from '../../../constants/pqrsf';
import { formatearBytes } from '../../../utils/format';

const extension = (nombre) => nombre.substring(nombre.lastIndexOf('.')).toLowerCase();

const tipoArchivo = (ext) =>
  ['.jpg', '.jpeg', '.png'].includes(ext) ? 'image' : ext === '.pdf' ? 'pdf' : 'word';

/**
 * Manejo de adjuntos del formulario: valida cantidad, formato y el máximo
 * de 20 MB en total, y genera las vistas previas (URL de objeto).
 */
export default function useAdjuntos() {
  const [items, setItems] = useState([]); // { file, name, size, type, url }
  const [error, setError] = useState('');
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Liberar URLs de objeto al desmontar
  useEffect(() => () => itemsRef.current.forEach((i) => i.url && URL.revokeObjectURL(i.url)), []);

  const totalBytes = items.reduce((acc, i) => acc + i.file.size, 0);

  const agregar = useCallback((fileList) => {
    const nuevos = Array.from(fileList || []);
    setError('');
    if (!nuevos.length) return;

    const actuales = itemsRef.current;
    if (actuales.length + nuevos.length > ADJUNTOS.maxArchivos) {
      setError(`Solo se permite adjuntar un máximo de ${ADJUNTOS.maxArchivos} archivos en total.`);
      return;
    }

    const total = actuales.reduce((a, i) => a + i.file.size, 0) + nuevos.reduce((a, f) => a + f.size, 0);
    if (total > ADJUNTOS.maxTotalBytes) {
      setError(`Los adjuntos sumarían ${formatearBytes(total)} y el máximo permitido es 20 MB por solicitud.`);
      return;
    }

    const invalido = nuevos.find((f) => !ADJUNTOS.extensiones.includes(extension(f.name)));
    if (invalido) {
      setError(`El archivo "${invalido.name}" no es compatible. Formatos permitidos: Word (.doc, .docx), PDF (.pdf), Imágenes (.jpg, .jpeg, .png).`);
      return;
    }

    setItems((prev) => [
      ...prev,
      ...nuevos.map((f) => {
        const type = tipoArchivo(extension(f.name));
        return {
          file: f,
          name: f.name,
          size: formatearBytes(f.size),
          type,
          url: type !== 'word' ? URL.createObjectURL(f) : null
        };
      })
    ]);
  }, []);

  const quitar = useCallback((indice) => {
    setItems((prev) => {
      const item = prev[indice];
      if (item?.url) URL.revokeObjectURL(item.url);
      return prev.filter((_, i) => i !== indice);
    });
    setError('');
  }, []);

  const limpiar = useCallback(() => {
    itemsRef.current.forEach((i) => i.url && URL.revokeObjectURL(i.url));
    setItems([]);
    setError('');
  }, []);

  return { items, archivos: items.map((i) => i.file), totalBytes, error, setError, agregar, quitar, limpiar };
}
