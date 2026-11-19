import React from 'react';
import { EmailField, FormGroup, TextField } from '../fields/FormFields';
import CountryPhonePicker from '../fields/CountryPhonePicker';
import { CANALES_RESPUESTA } from '../../../constants/formulario';
import { bloquearNoNumericos } from '../../../utils/validacion';

function ChannelBlock({ letra, titulo, children }) {
  return (
    <div className="response-channel-block">
      <h4 className="response-letter-title"><span className="badge-letter">{letra}</span> {titulo}</h4>
      {children}
    </div>
  );
}

/** Sección 3: medio de respuesta (A domicilio, B teléfono, C correo) y botón de envío. */
export default function MedioRespuestaSection({ form, enviando }) {
  const { datos, onChange, onTelefono, setCampo, erroresEmail } = form;
  const medio = datos.medioRespuesta;

  return (
    <section className="form-card-block response-section">
      <div className="form-section-header">
        <h2 className="section-title title-response">Forma en la que desea recibir la respuesta a su petición</h2>
        <p className="section-desc">Seleccione exclusivamente la opción A, B, o C por la cual desea ser notificado(a):</p>
      </div>

      <div className="channel-selector-row" role="radiogroup">
        {CANALES_RESPUESTA.map((c) => (
          <label key={c.valor} className={`channel-option-card ${medio === c.valor ? 'active' : ''}`}>
            <input type="radio" name="medioRespuesta" value={c.valor} checked={medio === c.valor} onChange={onChange} />
            <div className="channel-card-text">
              <span className="channel-card-title">{c.titulo}</span>
              <span className="channel-card-sub">{c.sub}</span>
            </div>
          </label>
        ))}
      </div>

      {medio === 'A' && (
        <ChannelBlock letra="A" titulo="Domicilio">
          <div className="form-row grid-3">
            <TextField name="respDireccion" label="Dirección Completa" required placeholder="Calle / Carrera / Número" datos={datos} onChange={onChange} />
            <TextField name="respBarrio" label="Barrio y/o vereda" required placeholder="Nombre del barrio" datos={datos} onChange={onChange} />
            <TextField name="respMunicipio" label="Municipio" required placeholder="Ciudad o Municipio" datos={datos} onChange={onChange} />
          </div>
        </ChannelBlock>
      )}

      {medio === 'B' && (
        <ChannelBlock letra="B" titulo="Personalmente / Vía Telefónica">
          <div className="form-row grid-2">
            <FormGroup id="respCelular" label="Número de celular" required>
              <CountryPhonePicker
                id="respCelular"
                name="respCelular"
                paisCodigo={datos.respPaisCel}
                onPaisChange={(codigo) => setCampo('respPaisCel', codigo)}
                value={datos.respCelular}
                onChange={onTelefono('respCelular')}
              />
            </FormGroup>
            <FormGroup id="respTelefono" label="Teléfono fijo (Opcional)">
              <input
                type="tel"
                id="respTelefono"
                name="respTelefono"
                value={datos.respTelefono}
                onKeyDown={bloquearNoNumericos}
                onChange={onTelefono('respTelefono')}
                placeholder="6011234567"
                maxLength="10"
              />
            </FormGroup>
          </div>
        </ChannelBlock>
      )}

      {medio === 'C' && (
        <ChannelBlock letra="C" titulo="Correo Electrónico">
          <div className="form-row grid-email-channel">
            <EmailField
              name="respCorreo"
              label="Dirección de correo electrónico de respuesta"
              value={datos.respCorreo || datos.famEmail}
              onChange={onChange}
              invalido={erroresEmail.respCorreo}
            />
          </div>
        </ChannelBlock>
      )}

      <div className="submit-action-row">
        <button type="submit" className="btn-submit" disabled={enviando}>
          Revisar y enviar solicitud
        </button>
      </div>
    </section>
  );
}
