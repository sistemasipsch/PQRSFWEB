import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Icon from '../common/Icon';
import { api } from '../../../services/api';
import { formatearBytes } from '../../../utils/format';

/**
 * Visor de adjuntos: imágenes y PDF se muestran en línea; Word se descarga.
 * Los archivos se piden con la sesión del funcionario (no son públicos) y se muestran desde memoria.
 */
export default function FilePreviewModal({ adjunto, onClose }) {
  const nombre = adjunto.nombreOriginal || '';
  const mime = adjunto.tipoMime || '';
  const esImagen = mime.startsWith('image/') || /\.(png|jpe?g)$/i.test(nombre);
  const esPdf = mime.includes('pdf') || /\.pdf$/i.test(nombre);

  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let vivo = true;
    let creada = '';
    api.cargarAdjunto(adjunto)
      .then((blob) => {
        if (!vivo) return;
        const tipo = esPdf ? 'application/pdf' : (blob.type || mime || 'application/octet-stream');
        creada = URL.createObjectURL(new Blob([blob], { type: tipo }));
        setUrl(creada);
      })
      .catch((e) => vivo && setError(e.message));
    return () => {
      vivo = false;
      if (creada) URL.revokeObjectURL(creada);
    };
  }, [adjunto, esPdf, mime]);

  return (
    <Modal
      title={nombre}
      subtitle={`${esImagen ? 'Imagen' : esPdf ? 'Documento PDF' : 'Documento'} · ${formatearBytes(adjunto.tamanoBytes)}`}
      onClose={onClose}
      width={960}
      footer={
        <a
          className="tail-btn-primary"
          href={url || undefined}
          download={nombre}
          aria-disabled={!url}
          style={url ? undefined : { opacity: 0.5, pointerEvents: 'none' }}
        >
          <Icon name="download" size={16} /> Descargar
        </a>
      }
    >
      <div className="tail-file-preview">
        {error ? (
          <div className="tail-chart-empty"><span className="tail-text-danger">{error}</span></div>
        ) : !url ? (
          <div className="tail-chart-empty">Cargando archivo…</div>
        ) : esImagen ? (
          <img src={url} alt={nombre} />
        ) : esPdf ? (
          <iframe src={url} title={nombre} />
        ) : (
          <div className="tail-chart-empty">
            La vista previa no está disponible para este formato. Use «Descargar» para abrirlo.
          </div>
        )}
      </div>
    </Modal>
  );
}
