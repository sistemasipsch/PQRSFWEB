import React from 'react';

/** Encabezado y texto introductorio oficial del formulario. */
export default function IntroSection() {
  return (
    <section className="intro-section">
      <h1 className="main-title">
        Formulario para presentar peticiones, quejas, reclamos, sugerencias o felicitaciones
      </h1>

      <div className="intro-content">
        <p>
          Apreciado usuario: Para <span className="brand-text">IPS Clinical House</span> es muy importante su opinión acerca de nuestros servicios.
        </p>
        <p>
          Si tienes una petición (P), queja (Q), reclamo (R), sugerencia (S) o felicitación (F), te invitamos a diligenciar la siguiente información, que permitirá la mejora continua de los procesos y la prestación de los servicios con alta calidad.
        </p>
        <p>
          Para hacer seguimiento a su mensaje y responderlo oportunamente, le solicitamos llenar todos los campos del formato con la mayor claridad.
        </p>
      </div>

      <div className="star-divider">
        <span className="star-icon">★</span>
      </div>
    </section>
  );
}
