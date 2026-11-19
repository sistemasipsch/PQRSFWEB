/**
 * Autorización de tratamiento de datos personales del formulario público de PQRSF.
 * Al cambiar el texto, actualice VERSION_POLITICA_DATOS: la versión aceptada queda guardada en cada radicado.
 * IMPORTANTE: el texto debe ser validado por el área jurídica / oficial de protección de datos de la IPS.
 */
export const VERSION_POLITICA_DATOS = '2026-11-19';

export const RESPONSABLE = {
  nombre: 'IPS Clinical House',
  correo: 'siau@clinicalhouse.co',
  web: 'clinicalhouse.co'
};

export const SECCIONES_POLITICA = [
  {
    titulo: 'Marco legal',
    texto:
      'En cumplimiento de la Ley Estatutaria 1581 de 2012, el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015), ' +
      'la Ley 1266 de 2008 modificada por la Ley 2157 de 2021 y demás normas concordantes sobre protección de datos personales y habeas data, ' +
      `${RESPONSABLE.nombre}, como responsable del tratamiento, solicita su autorización previa, expresa e informada.`
  },
  {
    titulo: 'Datos que se recolectan',
    texto:
      'Nombres y apellidos, tipo y número de documento, teléfonos, correo electrónico, dirección, EPS y régimen, ' +
      'población a la que pertenece, la descripción de su solicitud y los documentos que adjunte. Algunos de estos datos ' +
      'pueden relacionarse con su salud o la del paciente y son considerados datos sensibles.'
  },
  {
    titulo: 'Finalidad',
    texto:
      'Radicar, tramitar, dar respuesta y hacer seguimiento a su petición, queja, reclamo, sugerencia o felicitación; ' +
      'comunicarnos con usted por el medio que elija; generar indicadores de calidad del servicio; y atender requerimientos ' +
      'de las autoridades de vigilancia y control en salud.'
  },
  {
    titulo: 'Datos sensibles',
    texto:
      'Usted no está obligado(a) a autorizar el tratamiento de datos sensibles ni de datos de menores de edad. ' +
      'Si los suministra, serán tratados con especial reserva y únicamente para las finalidades descritas.'
  },
  {
    titulo: 'Sus derechos',
    texto:
      'Conocer, actualizar, rectificar y suprimir sus datos; solicitar prueba de esta autorización; ser informado(a) del uso ' +
      'que se les ha dado; revocar la autorización cuando no se respeten los principios, derechos y garantías legales; ' +
      'y presentar quejas ante la Superintendencia de Industria y Comercio.'
  },
  {
    titulo: 'Cómo ejercerlos',
    texto:
      `Escribiendo a ${RESPONSABLE.correo} o en el Servicio de Información y Atención al Usuario (SIAU) de ${RESPONSABLE.nombre}. ` +
      'Su información se conserva de forma confidencial, con medidas de seguridad, y solo la consulta el personal autorizado.'
  }
];

export const TEXTO_ACEPTACION =
  `Autorizo de manera previa, expresa e informada a ${RESPONSABLE.nombre} para el tratamiento de mis datos personales ` +
  'y los del paciente, incluidos los datos sensibles, con las finalidades descritas en esta política.';
