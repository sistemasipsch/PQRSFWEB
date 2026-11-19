import React from 'react';
import { SelectField } from '../fields/FormFields';
import AdjuntosField from './AdjuntosField';
import { TIPOS_SOLICITUD } from '../../../constants/pqrsf';

const OPCIONES_TIPO = TIPOS_SOLICITUD.map((t) => ({ value: t.value, label: t.value }));

/** Sección 2: tipo de solicitud, descripción y adjuntos. */
export default function DescripcionSection({ form, adjuntos, onVerPreliminar }) {
  const { datos, onChange } = form;

  return (
    <section className="form-card-block">
      <div className="form-section-header">
        <h2 className="section-title">2. DESCRIPCIÓN DE LA PETICIÓN, QUEJA, RECLAMO, SUGERENCIA O FELICITACIÓN</h2>
      </div>

      <fieldset className="form-fieldset">
        <div className="form-row grid-select-peticion">
          <SelectField
            name="tipoPeticion"
            label="Tipo de Solicitud (Seleccione)"
            required
            opciones={OPCIONES_TIPO}
            datos={datos}
            onChange={onChange}
            className="col-tipo"
          />
          <div className="form-tip-box">
            <p><strong>Nota:</strong> Diligencie de forma clara los hechos, fechas y personas involucradas para facilitar la gestión oportuna de su requerimiento.</p>
          </div>
        </div>

        <div className="form-row single-field-row">
          <div className="form-group full-width">
            <label htmlFor="descripcionPeticion">Detalle de su solicitud <span className="required">*</span></label>
            <textarea
              id="descripcionPeticion"
              name="descripcionPeticion"
              rows="7"
              value={datos.descripcionPeticion}
              onChange={onChange}
              placeholder="Escriba aquí los detalles de su petición, queja, reclamo, sugerencia o felicitación..."
              required
            />
          </div>
        </div>

        <AdjuntosField adjuntos={adjuntos} onVerPreliminar={onVerPreliminar} />
      </fieldset>
    </section>
  );
}
