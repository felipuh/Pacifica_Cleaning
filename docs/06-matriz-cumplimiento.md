# Matriz de cumplimiento del requerimiento maestro

Estado usado:

- Cumple: existe implementacion funcional o documento suficiente.
- Parcial: existe base util, pero faltan piezas importantes.
- No cumple: no hay evidencia suficiente.
- No verificado: no fue posible validarlo en esta revision.

## Revision 2026-06-22

| Area | Estado | Evidencia | Brecha / accion requerida |
| --- | --- | --- | --- |
| Stack Django + DRF | Cumple | `backend/`, routers DRF en `backend/pacifica/urls.py` | Mantener pruebas de API y permisos. |
| Stack React + TypeScript + Vite | Parcial | `frontend/` existe y compila | Debe volver a ser frontend principal para landing, formularios y portal admin. |
| PostgreSQL | Parcial | Configuracion Django/Docker existente | Verificar despliegue y backups. |
| Redis/Celery | Parcial | Apps y Docker conservan soporte | Requiere ejecucion activa para tareas reales. |
| Sitio publico comercial | Parcial | Django templates y React landing mejorados | El requerimiento asigna landing/formularios a React; falta decidir despliegue principal sin duplicar experiencias. |
| Portal administrativo React | Parcial | Login, dashboard y consumo de API en `frontend/src/App.tsx` | Debe ampliarse a CRUD real, calendario, permisos y flujos operativos. |
| Django Admin como herramienta secundaria | Parcial | `/admin/` existe | Documentar que no es panel operativo diario. |
| Autenticacion y sesiones | Parcial | `/api/auth/login/`, `/api/auth/logout/`, CSRF, `me` | Falta recuperacion de contrasena y UI completa de MFA. |
| Roles y permisos | Parcial | Modelo de usuario con rol y permisos base | Falta matriz completa aplicada por modulo en UI/API. |
| CRM | Parcial | Modelos y endpoints de leads, customers, contacts, properties | Falta UI completa de alta/edicion/seguimiento. |
| Propiedades | Parcial | Modelo/API y enmascaramiento de accesos | Falta UI visual completa y geolocalizacion. |
| Servicios y precios | Parcial | Modelos/API de services y price-versions | Falta UI de gestion completa y cotizador visual. |
| Cotizaciones | Parcial | Modelo/API y regla de conversion | Falta PDF, envio e interfaz completa. |
| Agenda y operaciones | Parcial | Work orders y reglas basicas | Falta calendario real, asignaciones visuales y rutas. |
| Personal/prestadores | Parcial | Modelos/API de workers | Falta UI y alerta visual de subordinacion. |
| Calidad | Parcial | Modelos de operaciones/calidad segun backend | Falta UI y reportes. |
| Finanzas | Parcial | Payments/expenses API | Falta UI de reportes, margenes y exportacion. |
| Inventario | Parcial | Inventory API | Falta UI operativa completa. |
| Marketing | Parcial | Campaigns/coupons API | Falta UI y consentimientos analiticos. |
| Notificaciones | Parcial | Templates API | Falta integracion real con correo/WhatsApp oficial. |
| Reportes y KPIs | No cumple | No hay dashboard completo de KPIs | Crear reportes agregados backend y UI. |
| Bilingue | Parcial | Templates publicos y textos React tienen ES/EN parcial | Falta i18n sistematico en React admin. |
| PWA | No cumple | No hay service worker funcional verificado | Implementar cuando la experiencia principal React quede definida. |
| Seguridad OWASP | Parcial | CSRF, sesiones, throttling login, CSP en Django | Falta pruebas de seguridad completas y hardening desplegado. |
| SEO local | Parcial | sitemap/robots existen en frontend; meta basico Django | Falta structured data, OG completo y estrategia unica de frontend. |
| Docker/Nginx | Parcial | `docker-compose.yml`, `infra/` | El perfil frontend esta marcado legacy; debe alinearse al requerimiento. |
| CI/CD | No verificado | No revisado en esta pasada | Confirmar workflows y gates. |
| Backups | Parcial | Scripts en `infra/scripts` | Falta prueba de restauracion documentada. |
| Pruebas automaticas | Parcial | Tests Django/React existentes | Falta cobertura de permisos, e2e y concurrencia. |

## Decision correctiva principal

La direccion Django-only documentada en `README.md` no coincide con el requerimiento maestro. El proyecto debe corregirse hacia:

- Django/DRF como backend y API.
- React/Vite como interfaz publica y administrativa principal.
- Django Admin solo como herramienta secundaria de emergencia o superadministracion.

## Criterio para cerrar cumplimiento al 100%

No se debe declarar cumplimiento total hasta que:

1. El despliegue principal sirva React como experiencia publica y administrativa.
2. El portal React cubra los modulos administrativos diarios con CRUD y flujos clave.
3. Las APIs tengan permisos por rol y pruebas.
4. El sitio publico React tenga SEO, accesibilidad, formularios y bilingue completo.
5. Docker/Nginx/CI/CD esten alineados con esa arquitectura.
6. Manuales y pruebas automaticas respalden cada modulo critico.
