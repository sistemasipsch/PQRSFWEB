// Catálogos del formulario público PQRSF

export const PAISES = [
  { codigo: '+57', iso: 'co', nombre: 'Colombia' },
  { codigo: '+1', iso: 'us', nombre: 'Estados Unidos' },
  { codigo: '+34', iso: 'es', nombre: 'España' },
  { codigo: '+52', iso: 'mx', nombre: 'México' },
  { codigo: '+58', iso: 've', nombre: 'Venezuela' },
  { codigo: '+593', iso: 'ec', nombre: 'Ecuador' },
  { codigo: '+51', iso: 'pe', nombre: 'Perú' },
  { codigo: '+507', iso: 'pa', nombre: 'Panamá' },
  { codigo: '+56', iso: 'cl', nombre: 'Chile' },
  { codigo: '+54', iso: 'ar', nombre: 'Argentina' }
];

export const TIPOS_DOCUMENTO = [
  'Cedula Ciudadanía',
  'Tarjeta de Identidad',
  'Cédula de Extranjería',
  'Pasaporte',
  'Registro Civil'
];

export const REGIMENES = ['Régimen Contributivo', 'Régimen Subsidiado', 'Especial', 'Particular'];

export const POBLACIONES = ['Adulto Mayor', 'Primera Infancia', 'Infancia', 'Adolescencia', 'Juventud', 'Adulto'];

/** Opciones A, B, C de medio de respuesta. */
export const CANALES_RESPUESTA = [
  { valor: 'A', titulo: 'Opción A: Domicilio', sub: 'Notificación física en residencia' },
  { valor: 'B', titulo: 'Opción B: Telefónica', sub: 'Llamada a celular o fijo' },
  { valor: 'C', titulo: 'Opción C: Correo Electrónico', sub: 'Notificación digital directa' }
];

export const hoyISO = () => new Date().toISOString().split('T')[0];

/** Estado inicial del formulario. */
export const crearFormularioInicial = () => ({
  fechaRecepcion: hoyISO(),
  // Familiar / acompañante
  famPrimerApellido: '',
  famSegundoApellido: '',
  famPrimerNombre: '',
  famSegundoNombre: '',
  famTipoDocumento: TIPOS_DOCUMENTO[0],
  famNumeroDocumento: '',
  famPaisTel: '+57',
  famTelefono: '',
  famEmail: '',
  famDireccion: '',
  // Paciente
  pacPrimerApellido: '',
  pacSegundoApellido: '',
  pacPrimerNombre: '',
  pacSegundoNombre: '',
  pacTipoDocumento: TIPOS_DOCUMENTO[0],
  pacNumeroDocumento: '',
  pacPaisTel: '+57',
  pacTelefono: '',
  pacEmail: '',
  pacDireccion: '',
  pacRegimen: REGIMENES[0],
  pacEntidad: '',
  pacPoblacion: POBLACIONES[0],
  // Solicitud
  tipoPeticion: '(P) Petición',
  descripcionPeticion: '',
  // Medio de respuesta
  medioRespuesta: 'C',
  respDireccion: '',
  respBarrio: '',
  respMunicipio: '',
  respPaisCel: '+57',
  respCelular: '',
  respTelefono: '',
  respCorreo: ''
});
