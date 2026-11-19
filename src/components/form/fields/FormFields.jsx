import React from 'react';

/** Etiqueta con asterisco de obligatorio. */
export function Label({ htmlFor, children, required }) {
  return (
    <label htmlFor={htmlFor}>
      {children} {required && <span className="required">*</span>}
    </label>
  );
}

/** Grupo genérico: etiqueta + control + mensaje de error. */
export function FormGroup({ id, label, required, error, className = '', children }) {
  return (
    <div className={`form-group ${className}`.trim()}>
      {label && <Label htmlFor={id} required={required}>{label}</Label>}
      {children}
      {error && <span className="input-error-hint">{error}</span>}
    </div>
  );
}

/** Input de texto/correo enlazado al estado del formulario por `name`. */
export function TextField({ name, label, datos, onChange, required, type = 'text', placeholder, error, className, ...rest }) {
  return (
    <FormGroup id={name} label={label} required={required} error={error} className={className}>
      <input
        type={type}
        id={name}
        name={name}
        value={datos[name]}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={error ? 'input-has-error' : undefined}
        {...rest}
      />
    </FormGroup>
  );
}

/** Correo con validación visual en tiempo real. */
export function EmailField({ name, label, datos, onChange, invalido, required = true, value }) {
  return (
    <TextField
      type="email"
      name={name}
      label={label}
      datos={value !== undefined ? { [name]: value } : datos}
      onChange={onChange}
      required={required}
      placeholder="ejemplo@correo.com"
      error={invalido ? "Debe incluir '@' y un dominio válido" : null}
    />
  );
}

/** Select con el envoltorio de flecha del diseño institucional. */
export function SelectField({ name, label, datos, onChange, opciones, required, className }) {
  return (
    <FormGroup id={name} label={label} required={required} className={className}>
      <div className="select-wrapper">
        <select id={name} name={name} value={datos[name]} onChange={onChange} required={required}>
          {opciones.map((o) => {
            const valor = typeof o === 'string' ? o : o.value;
            const texto = typeof o === 'string' ? o : o.label;
            return <option key={valor} value={valor}>{texto}</option>;
          })}
        </select>
      </div>
    </FormGroup>
  );
}
