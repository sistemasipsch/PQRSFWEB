import React from 'react';
import { EmailField, FormGroup, SelectField, TextField } from '../fields/FormFields';
import CountryPhonePicker from '../fields/CountryPhonePicker';
import { TIPOS_DOCUMENTO } from '../../../constants/formulario';
import { bloquearNoNumericos } from '../../../utils/validacion';

/**
 * Datos personales comunes a familiar y paciente.
 * `prefijo` es "fam" o "pac" (coincide con los nombres de campo del backend).
 */
export default function PersonaFields({ prefijo, etiquetaTelefono, form }) {
  const { datos, onChange, onTelefono, setCampo, erroresEmail } = form;
  const n = (campo) => `${prefijo}${campo}`;
  const props = { datos, onChange };

  return (
    <>
      <div className="form-row grid-4">
        <TextField name={n('PrimerApellido')} label="Primer Apellido" required placeholder="Ej. Gómez" {...props} />
        <TextField name={n('SegundoApellido')} label="Segundo Apellido" required placeholder="Ej. Rodríguez" {...props} />
        <TextField name={n('PrimerNombre')} label="Primer Nombre" required placeholder="Ej. María" {...props} />
        <TextField name={n('SegundoNombre')} label="Segundo Nombre" placeholder="Opcional" {...props} />
      </div>

      <div className="form-row grid-doc-email">
        <SelectField name={n('TipoDocumento')} label="Tipo de documento T.D" required opciones={TIPOS_DOCUMENTO} {...props} />
        <TextField
          name={n('NumeroDocumento')}
          label="Número T.D"
          required
          datos={datos}
          onChange={onTelefono(n('NumeroDocumento'))}
          onKeyDown={bloquearNoNumericos}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={15}
          placeholder="Solo números, sin puntos"
          title="Solo se permiten números, sin puntos, letras ni espacios"
        />
        <EmailField name={n('Email')} label="E-Mail" invalido={erroresEmail[n('Email')]} {...props} />
      </div>

      <div className="form-row grid-2">
        <TextField name={n('Direccion')} label="Dirección Domicilio" required placeholder="Ej. Calle 10 # 5-20, Barrio Centro" {...props} />
        <FormGroup id={n('Telefono')} label={etiquetaTelefono} required>
          <CountryPhonePicker
            id={n('Telefono')}
            name={n('Telefono')}
            paisCodigo={datos[n('PaisTel')]}
            onPaisChange={(codigo) => setCampo(n('PaisTel'), codigo)}
            value={datos[n('Telefono')]}
            onChange={onTelefono(n('Telefono'))}
          />
        </FormGroup>
      </div>
    </>
  );
}
