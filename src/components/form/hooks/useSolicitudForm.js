import { useCallback, useState } from 'react';
import { crearFormularioInicial } from '../../../constants/formulario';
import { soloDigitos, validarEmail } from '../../../utils/validacion';

const CAMPOS_EMAIL = ['famEmail', 'pacEmail', 'respCorreo'];

/** Estado, validación y armado del envío del formulario PQRSF. */
export default function useSolicitudForm() {
  const [datos, setDatos] = useState(crearFormularioInicial);
  const [erroresEmail, setErroresEmail] = useState({ famEmail: false, pacEmail: false, respCorreo: false });

  const setCampo = useCallback((nombre, valor) => {
    setDatos((prev) => ({ ...prev, [nombre]: valor }));
    if (CAMPOS_EMAIL.includes(nombre)) {
      setErroresEmail((prev) => ({ ...prev, [nombre]: valor.length > 0 && !validarEmail(valor) }));
    }
  }, []);

  /** onChange genérico para inputs con atributo name. */
  const onChange = useCallback((e) => setCampo(e.target.name, e.target.value), [setCampo]);

  /** onChange para teléfonos y números de documento: solo dígitos (también al pegar). */
  const onTelefono = useCallback((nombre) => (e) => setCampo(nombre, soloDigitos(e.target.value)), [setCampo]);

  /** Devuelve el mensaje de error de la primera regla incumplida, o null. */
  const validar = useCallback(() => {
    if (!/^[0-9]{3,15}$/.test(datos.famNumeroDocumento)) {
      return 'El número de documento del familiar solo puede contener números (entre 3 y 15 dígitos).';
    }
    if (!/^[0-9]{3,15}$/.test(datos.pacNumeroDocumento)) {
      return 'El número de documento del paciente solo puede contener números (entre 3 y 15 dígitos).';
    }
    if (!validarEmail(datos.famEmail)) {
      return 'El correo electrónico del familiar no es válido. Debe contener @ y un dominio (ej: nombre@correo.com).';
    }
    if (!validarEmail(datos.pacEmail)) {
      return 'El correo electrónico del paciente no es válido. Debe contener @ y un dominio.';
    }
    if (datos.medioRespuesta === 'A' && (!datos.respDireccion || !datos.respBarrio || !datos.respMunicipio)) {
      return 'Para la opción A (Domicilio), complete la Dirección, Barrio y Municipio.';
    }
    if (datos.medioRespuesta === 'B' && !datos.respCelular) {
      return 'Para la opción B (Telefónica), ingrese el número de celular.';
    }
    if (datos.medioRespuesta === 'C' && !validarEmail(datos.respCorreo || datos.famEmail)) {
      return 'Para la opción C (Correo Electrónico), ingrese un correo válido con @.';
    }
    return null;
  }, [datos]);

  /** FormData listo para POST /api/pqrsf. */
  const construirPayload = useCallback((archivos = []) => {
    const payload = new FormData();
    Object.entries(datos).forEach(([clave, valor]) => {
      if (clave === 'famTelefono') payload.append(clave, `${datos.famPaisTel} ${valor}`);
      else if (clave === 'pacTelefono') payload.append(clave, `${datos.pacPaisTel} ${valor}`);
      else if (clave === 'respCelular' && valor) payload.append(clave, `${datos.respPaisCel} ${valor}`);
      else if (clave === 'respCorreo' && !valor) payload.append(clave, datos.famEmail);
      else payload.append(clave, valor || '');
    });
    archivos.forEach((f) => payload.append('archivos', f));
    return payload;
  }, [datos]);

  const reiniciar = useCallback(() => {
    setDatos(crearFormularioInicial());
    setErroresEmail({ famEmail: false, pacEmail: false, respCorreo: false });
  }, []);

  return { datos, erroresEmail, setCampo, onChange, onTelefono, validar, construirPayload, reiniciar };
}
