import React from 'react';
import PersonaFields from './PersonaFields';
import { SelectField, TextField } from '../fields/FormFields';
import { POBLACIONES, REGIMENES, hoyISO } from '../../../constants/formulario';

/** Sección 1: datos del familiar/acompañante y del paciente. */
export default function DatosBasicosSection({ form }) {
  const { datos, onChange } = form;

  return (
    <section className="form-card-block">
      <div className="form-section-header">
        <div className="section-title-wrap">
          <h2 className="section-title">1. DATOS BÁSICOS</h2>
          <h3 className="section-subtitle">DATOS PERSONALES DEL FAMILIAR, CUIDADOR Y/O ACOMPAÑANTE:</h3>
        </div>

        <div className="reception-date-box">
          <label htmlFor="fechaRecepcion">Fecha de Recepción <span className="required">*</span></label>
          <div className="styled-date-input">
            <input type="date" id="fechaRecepcion" name="fechaRecepcion" max={hoyISO()} value={datos.fechaRecepcion} onChange={onChange} required />
          </div>
        </div>
      </div>

      <fieldset className="form-fieldset">
        <PersonaFields prefijo="fam" etiquetaTelefono="Teléfono de Contacto" form={form} />
      </fieldset>

      <div className="subsection-divider">
        <h3 className="section-subtitle subtitle-strong">DATOS DEL PACIENTE:</h3>
      </div>

      <fieldset className="form-fieldset">
        <PersonaFields prefijo="pac" etiquetaTelefono="Teléfono del Paciente" form={form} />

        <div className="form-row grid-3">
          <SelectField name="pacRegimen" label="Régimen de afiliación al SGSSS" required opciones={REGIMENES} datos={datos} onChange={onChange} />
          <TextField name="pacEntidad" label="ENTIDAD (EPS):" required placeholder="Ej. Sanitas, Nueva EPS, Sura..." datos={datos} onChange={onChange} />
          <SelectField name="pacPoblacion" label="Tipo de población:" required opciones={POBLACIONES} datos={datos} onChange={onChange} />
        </div>
      </fieldset>
    </section>
  );
}
