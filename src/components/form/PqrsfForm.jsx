import React, { useState } from 'react';
import { api } from '../../services/api';
import useSolicitudForm from './hooks/useSolicitudForm';
import useAdjuntos from './hooks/useAdjuntos';
import IntroSection from './sections/IntroSection';
import DatosBasicosSection from './sections/DatosBasicosSection';
import DescripcionSection from './sections/DescripcionSection';
import MedioRespuestaSection from './sections/MedioRespuestaSection';
import SolicitudPreviewModal from './modals/SolicitudPreviewModal';
import AdjuntoLightbox from './modals/AdjuntoLightbox';
import RadicacionExitosaModal from './modals/RadicacionExitosaModal';
import TratamientoDatosModal from './modals/TratamientoDatosModal';
import { VERSION_POLITICA_DATOS } from '../../constants/politicaDatos';
import '../../styles/form.css';

/**
 * Formulario público de PQRSF.
 * Flujo: aceptar tratamiento de datos → diligenciar → validar → vista preliminar → radicar → confirmación.
 */
export default function PqrsfForm() {
  const form = useSolicitudForm();
  const adjuntos = useAdjuntos();

  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [previewAbierto, setPreviewAbierto] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [radicacion, setRadicacion] = useState(null);
  // Tratamiento de datos: sin aceptarlo el formulario queda bloqueado
  const [aceptoDatos, setAceptoDatos] = useState(false);
  const [modalDatos, setModalDatos] = useState('aceptar'); // 'aceptar' | 'ver' | null

  const mostrarError = (mensaje) => {
    setError(mensaje);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const revisar = (e) => {
    e.preventDefault();
    if (!aceptoDatos) {
      setModalDatos('aceptar');
      return;
    }
    const problema = form.validar();
    if (problema) return mostrarError(problema);
    setError('');
    setPreviewAbierto(true);
  };

  const radicar = async () => {
    if (!aceptoDatos) return setModalDatos('aceptar');
    setEnviando(true);
    setError('');
    try {
      const payload = form.construirPayload(adjuntos.archivos);
      payload.append('aceptaTratamientoDatos', 'true');
      payload.append('versionPoliticaDatos', VERSION_POLITICA_DATOS);
      const respuesta = await api.radicarPqrsf(payload);
      setPreviewAbierto(false);
      setRadicacion(respuesta);
    } catch (err) {
      setPreviewAbierto(false);
      mostrarError(err.message || 'Ocurrió un error al procesar la solicitud.');
    } finally {
      setEnviando(false);
    }
  };

  const nuevaSolicitud = () => {
    setRadicacion(null);
    form.reiniciar();
    adjuntos.limpiar();
    // Cada solicitud nueva requiere su propia autorización
    setAceptoDatos(false);
    setModalDatos('aceptar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="main-wrapper">
      <div className="form-container">
        <IntroSection />

        {aceptoDatos ? (
          <div className="datos-estado ok">
            <span>✓ Usted autorizó el tratamiento de sus datos personales.</span>
            <button type="button" className="datos-link" onClick={() => setModalDatos('ver')}>Ver política</button>
          </div>
        ) : (
          <div className="datos-estado pendiente" role="alert">
            <span>
              Para diligenciar el formulario debe aceptar la <strong>autorización de tratamiento de datos personales</strong>.
            </span>
            <button type="button" className="btn-submit btn-inline" onClick={() => setModalDatos('aceptar')}>Leer y aceptar</button>
          </div>
        )}

        {error && <div className="form-error-banner" role="alert">{error}</div>}

        <form className={`pqrs-form ${aceptoDatos ? '' : 'form-bloqueado'}`} onSubmit={revisar} noValidate aria-disabled={!aceptoDatos}>
          <fieldset className="form-fieldset-reset" disabled={!aceptoDatos}>
            <DatosBasicosSection form={form} />
            <DescripcionSection form={form} adjuntos={adjuntos} onVerPreliminar={setLightbox} />
            <MedioRespuestaSection form={form} enviando={enviando} />
          </fieldset>
        </form>
      </div>

      {modalDatos && (
        <TratamientoDatosModal
          aceptado={aceptoDatos}
          soloLectura={modalDatos === 'ver'}
          onAceptar={() => { setAceptoDatos(true); setModalDatos(null); }}
          onRechazar={() => { setAceptoDatos(false); setModalDatos(null); }}
          onCerrar={() => setModalDatos(null)}
        />
      )}

      {lightbox && <AdjuntoLightbox item={lightbox} onClose={() => setLightbox(null)} />}

      {previewAbierto && (
        <SolicitudPreviewModal
          datos={form.datos}
          archivos={adjuntos.items}
          enviando={enviando}
          onEditar={() => setPreviewAbierto(false)}
          onConfirmar={radicar}
        />
      )}

      {radicacion && <RadicacionExitosaModal radicacion={radicacion} onNueva={nuevaSolicitud} />}
    </main>
  );
}
