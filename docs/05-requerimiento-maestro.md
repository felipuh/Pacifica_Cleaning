# Requerimiento maestro de Pacifica Cleaning

Este documento es la referencia obligatoria para cualquier ajuste del proyecto Pacifica Cleaning. Si una decision tecnica, visual o funcional contradice este documento, debe corregirse o documentarse como excepcion aprobada.

## Principio central

La plataforma debe tener dos componentes principales:

1. Sitio publico comercial.
2. Sistema administrativo privado.

No se debe construir solo un prototipo visual. La solucion debe quedar preparada para operar una empresa real de limpieza profesional en Guanacaste.

## Stack base requerido

- Python.
- Django.
- Django REST Framework.
- React.
- TypeScript.
- Vite.
- PostgreSQL.
- Redis.
- Celery o mecanismo equivalente para tareas asincronas.
- Nginx.
- Servidor de aplicacion compatible con Django.
- Docker y Docker Compose.
- Git.
- GitHub Actions o CI/CD equivalente.
- Linux Ubuntu LTS o distribucion estable recomendada para VPS.

No se debe usar Create React App. Las dependencias deben estar mantenidas activamente y fijadas en archivos de dependencias y lockfiles.

## Arquitectura obligatoria

La arquitectura inicial es un monolito modular, no microservicios innecesarios.

El backend Django/DRF es responsable de:

- Reglas de negocio.
- Autenticacion.
- Permisos.
- Base de datos.
- API.
- Tareas asincronas.
- Reportes.
- Notificaciones.
- Auditoria.
- Integraciones.

El frontend React es responsable de:

- Landing page.
- Formularios publicos.
- Portal administrativo.
- Paneles de control.
- Calendario.
- Gestion visual de clientes, personal y servicios.
- Experiencia movil.

## Regla sobre Django Admin

Django Admin puede usarse unicamente como herramienta interna de emergencia, superadministracion o soporte tecnico.

La operacion diaria debe contar con una interfaz React profesional.

Por lo tanto, no se considera cumplimiento del requerimiento decir que el panel administrativo principal es Django Admin.

## Idiomas y localizacion

- Espanol como idioma principal.
- Ingles como segundo idioma.
- Arquitectura preparada para internacionalizacion.
- Formatos monetarios en colones costarricenses y dolares.
- Zona horaria de Costa Rica.
- Fechas y horas localizadas correctamente.

## Sitio publico requerido

El sitio publico debe incluir:

- Pagina de inicio.
- Hero con propuesta de valor.
- Servicios.
- Limpieza residencial.
- Limpieza profunda.
- Limpieza recurrente.
- Oficinas pequenas.
- Propiedades vacacionales y Airbnb.
- Organizacion de espacios.
- Como funciona.
- Zonas de cobertura.
- Ventajas de Pacifica Cleaning.
- Personal capacitado y asegurado solo cuando pueda comprobarse.
- Procesos de calidad.
- Preguntas frecuentes.
- Testimonios verificados.
- Formulario para solicitar cotizacion.
- Formulario para agendar inspeccion.
- Boton de WhatsApp.
- Pagina de contacto.
- Pagina "Trabaje con nosotros".
- Politicas de privacidad.
- Terminos y condiciones.
- Politica de cancelacion.
- Consentimiento para tratamiento de datos.
- Aviso de cookies cuando corresponda.
- Blog preparado para SEO.
- Contenido bilingue.
- Diseno accesible.
- Optimizacion para buscadores locales.
- Datos estructurados para negocio local y servicios.
- Open Graph y metadatos para redes sociales.
- Sitemap.
- Robots.txt.
- Rendimiento y Core Web Vitals.
- Captcha o mecanismo anti-spam accesible.

## Sistema administrativo requerido

El sistema administrativo privado debe ser una interfaz React profesional con modulos separados pero integrados.

### Autenticacion y seguridad

- Inicio y cierre de sesion.
- Recuperacion de contrasena.
- Autenticacion multifactor.
- Roles y permisos.
- Sesiones seguras.
- Cookies HTTP-only cuando corresponda.
- Proteccion CSRF, XSS, SQL injection y fuerza bruta.
- Registro de actividad.
- Auditoria de acciones sensibles.
- Bloqueo temporal.
- Gestion segura de secretos.
- Control de dispositivos y sesiones.

Roles iniciales:

- Superadministrador.
- Socio administrador.
- Operaciones.
- Ventas.
- Finanzas.
- Supervisor de calidad.
- Personal operativo.
- Prestador independiente.
- Consulta o auditoria.

### CRM y clientes

- Prospectos.
- Clientes.
- Contactos.
- Fuente del lead.
- Historial de comunicaciones.
- Etiquetas.
- Seguimientos.
- Referidos.
- Estado comercial.
- Propiedades asociadas.
- Preferencias.
- Mascotas.
- Instrucciones especiales.
- Llaves y accesos.
- Alarmas.
- Restricciones.
- Consentimientos.
- Documentos.
- Fotografias autorizadas.

### Propiedades

- Direccion.
- Geolocalizacion.
- Zona.
- Distancia.
- Metraje.
- Habitaciones.
- Banos.
- Tipo de piso.
- Nivel de complejidad.
- Inventario basico.
- Amenidades.
- Informacion para Airbnb.
- Horarios de check-in y check-out.
- Instrucciones de acceso.
- Tiempo estandar estimado.
- Historial de servicios.
- Incidencias.

### Servicios, precios y cotizaciones

- Catalogo.
- Servicios configurables.
- Tareas incluidas.
- Exclusiones.
- Precio por hora.
- Precio fijo.
- Tarifa minima.
- Recargos.
- Descuentos controlados.
- Planes recurrentes.
- Paquetes.
- Impuestos.
- Costos estimados.
- Margen esperado.
- Versionado de precios.
- Cotizador automatico.
- Aprobacion manual para casos especiales.
- PDF profesional.
- Envio por correo y WhatsApp mediante integraciones oficiales.
- Estados, caducidad, aceptacion e historial.
- Conversion a orden de servicio.

### Agenda y operaciones

- Calendario diario, semanal y mensual.
- Servicios unicos y recurrentes.
- Vista por persona, zona y cliente.
- Deteccion de conflictos.
- Tiempo de traslado.
- Capacidad disponible.
- Asignacion de personal.
- Confirmaciones.
- Reprogramaciones.
- Cancelaciones.
- Lista de espera.
- Recordatorios.
- Rutas.
- Estados del servicio.
- Inicio y finalizacion.
- Evidencia de llegada.
- Checklists digitales.
- Reportes de incidencias.
- Fotografias antes y despues con autorizacion.
- Firma o confirmacion del cliente.
- Supervision de calidad.

### Personal y prestadores

Los expedientes de personal laboral y prestadores independientes deben mantenerse separados.

El sistema debe advertir cuando la forma de operacion presenta indicadores de subordinacion.

### Calidad, finanzas, inventario, marketing, notificaciones y reportes

Debe incluir gestion de calidad, reclamos, retrabajos, finanzas operativas, pagos, gastos, inventario, campanas, cupones, notificaciones, plantillas, KPIs y reportes.

El modulo financiero no debe presentarse como software contable certificado. Debe prepararse para una futura integracion con facturacion electronica de Costa Rica.

## Infraestructura y DevOps

Debe contemplar:

- Entornos local, desarrollo, pruebas y produccion.
- Dockerfiles y Docker Compose.
- Variables de entorno.
- Nginx.
- HTTPS.
- Certificados.
- Dominio y subdominios.
- Firewall.
- SSH endurecido.
- Usuario sin privilegios.
- Backups automatizados y externos cifrados.
- Prueba periodica de restauracion.
- Logs, monitoreo, alertas y rotacion.
- Health checks.
- Despliegue sin perdida de datos.
- Migraciones seguras.
- Rollback.
- Renovacion de certificados.
- Politica de parches.
- Escaneo de dependencias.
- Proteccion ante archivos maliciosos.
- Limitacion de tamano y tipo de archivos.

## Privacidad, seguridad y pruebas

Se deben aplicar practicas OWASP y privacidad desde el diseno.

La plataforma debe tener pruebas unitarias, integracion, API, permisos, e2e, seguridad, restauracion, concurrencia de agenda, datos de prueba y CI que impida desplegar codigo defectuoso.

## Entregables tecnicos requeridos

El proyecto debe mantener documentados:

1. Resumen de requisitos.
2. Preguntas y supuestos.
3. Alcance MVP.
4. Alcance fase 2.
5. Alcance futuro.
6. Arquitectura.
7. Diagramas.
8. Modelo entidad-relacion.
9. Entidades y campos.
10. Reglas de negocio.
11. Roles y permisos.
12. Historias de usuario.
13. Criterios de aceptacion.
14. Diseno de API.
15. Estructura de repositorio.
16. Prototipo de navegacion.
17. Sistema de diseno.
18. Plan por sprints.
19. Codigo backend.
20. Codigo frontend.
21. Pruebas.
22. Docker y VPS.
23. CI/CD.
24. Manuales de instalacion, despliegue, backups, administrador y usuario.
25. Registro de decisiones tecnicas.

## Regla de cumplimiento

Para afirmar que el proyecto cumple el requerimiento, debe existir evidencia ejecutable o documental en el repositorio. Las funciones simuladas, placeholders criticos o dependencias exclusivas de Django Admin no cuentan como cumplimiento operativo.
