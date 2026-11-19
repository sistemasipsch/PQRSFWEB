# PQRSF SIAU — Aplicación Web (Frontend) · IPS Clinical House

Sistema de recepción y gestión de **Peticiones, Quejas, Reclamos, Sugerencias, Felicitaciones y Tutelas (PQRSF)** para el Servicio de Información y Atención al Usuario (SIAU) de **IPS Clinical House**.

---

## 🚀 Tecnologías

- **Framework:** React 18 + Vite 5
- **Estilos:** CSS nativo modular con diseño TailAdmin Analytics
- **Visualización:** ApexCharts y React-ApexCharts
- **Manejo de estados:** Hooks nativos de React
- **Arquitectura:** SPA (Single Page Application) modular

---

## 📋 Módulos Principales

1. **Formulario Ciudadano Público:**
   - Radicación con validación paso a paso de datos de paciente y acompañante.
   - Aceptación obligatoria de la política institucional de tratamiento de datos personales.
   - Adjuntos de soporte (imágenes, documentos PDF/Word) con validación de tamaño y tipo.
   - Vista preliminar antes de enviar.
   - Comprobante imprimible en PDF con número de radicado oficial.

2. **Panel Administrativo SIAU:**
   - **Gestión de PQRSF:** Bandeja con semáforo SLA de 3 niveles, filtros por estado, área, responsable y buscador en tiempo real.
   - **Trazabilidad y Respuestas:** Cambio de estado, asignación de responsable, respuestas por correo electrónico y generación de mensajes para WhatsApp.
   - **Reportes y Analytics:** Indicadores de oportunidad, cumplimiento de SLA y distribución por áreas con gráficos interactivos y exportación en CSV.
   - **Módulo de Usuarios:** Gestión de funcionarios (crear, editar, activar/desactivar, restablecer contraseña y eliminar), protegido por doble factor de acceso de Super Administrador.
   - **Configuración:** Administración de tiempos SLA, áreas institucionales, cargos y matriz de permisos por rol.
   - **Auditoría:** Registro de eventos del sistema consultable por fecha.

---

## 💻 Requisitos y Puesta en Marcha

### Requisitos previos
- **Node.js:** v18.0.0 o superior
- **npm:** v9.0.0 o superior

### Instalación de dependencias
```bash
npm install
```

### Modo de desarrollo
Inicia el servidor local de desarrollo en `http://localhost:5173`:
```bash
npm run dev
```

### Compilación para producción
Genera el paquete optimizado en la carpeta `dist/`:
```bash
npm run build
```

### Vista previa del build de producción
```bash
npm run preview
```

---

## ⚙️ Configuración del Entorno

Por defecto, la aplicación se comunica con el backend en `/api` (a través del proxy de Vite o el servidor web). Si requiere conectar a una URL externa o específica, cree un archivo `.env` o `.env.production`:

```env
VITE_API_URL=http://localhost:8080/api
```

---

## 🔒 Seguridad y Buenas Prácticas
- No almacena contraseñas ni secretos en el código fuente.
- Toda comunicación protegida viaja con autenticación JWT en cabeceras HTTP.
- Control de acceso por roles y permisos en vistas y modales.
