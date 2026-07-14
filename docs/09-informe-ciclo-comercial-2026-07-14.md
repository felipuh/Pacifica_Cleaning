# Informe de ciclo comercial operativo — 2026-07-14

## Resumen ejecutivo

- Estado inicial de esta ejecución: **72 %**, `GO WITH RESTRICTIONS`.
- Estado final estimado y verificable: **87 %**.
- Dictamen: **GO FOR STAGING**.

El ciclo principal `visitante → lead → cliente → propiedad → cotización → aceptación → servicio → agenda → finalización → dashboard` funciona con React y API reales y fue ejecutado de extremo a extremo en Chromium. No se declara 100 %: quedan controles avanzados de panel, cobertura visual más amplia e infraestructura productiva externa.

## Funcionalidad completada

### Leads

- Listado paginado por DRF, búsqueda, estado y orden seguro.
- Edición, asignación backend, notas, actividad, cambios de estado y archivado lógico.
- Conversión transaccional única a cliente, preservando consentimientos.
- Detección razonable de duplicados por correo o teléfono.
- Creación de cotización asociada al lead convertido.

### Clientes y propiedades

- CRUD, búsqueda, filtros, tipos de cliente, etiquetas, notas, consentimientos, estado y archivado.
- Prevención de duplicados activos.
- Propiedades asociadas a cliente con zona, tipo, tamaño, dormitorios, baños, frecuencia e instrucciones.
- Enmascaramiento de acceso y alarmas para roles sin permiso sensible.

### Cotizaciones y servicios

- Líneas, cantidad, precio unitario, descuento, impuesto, subtotal, total y margen calculados con `Decimal` en Django.
- Validación de propiedad/cliente y trazabilidad desde lead.
- Transiciones borrador → enviada → aceptada; rechazo y vencimiento.
- Historial de estados.
- Conversión transaccional única a orden de servicio.
- Precio copiado desde el total autoritativo de la cotización.
- Reprogramación backend con detección de conflictos del personal.
- Transiciones planificado → confirmado → en proceso → completado y cancelación controlada.
- Marcas temporales de inicio/finalización e historial.

### Agenda y dashboard

- Agenda diaria responsive en React con servicios reales y acciones de estado.
- Filtros API por fechas, estado y personal.
- Dashboard sin mocks: leads, cotizaciones, servicios, clientes recurrentes, ingresos estimados/confirmados, conversión y actividad reciente.
- Estado vacío y errores de API visibles.

### Autenticación, CSRF y permisos

- Los orígenes exactos de Vite `localhost:5174` y `127.0.0.1:5174` solo son defaults de desarrollo/pruebas.
- Producción inicia sin orígenes confiables y exige `DJANGO_CSRF_TRUSTED_ORIGINS` explícito.
- No se usan comodines.
- Prueba de regresión con cliente CSRF estricto y mutación autenticada desde Vite.
- Superadministrador y administrador gestionan usuarios.
- Operaciones gestiona agenda; ventas no puede hacerlo.
- Solo lectura no puede mutar ni convertir.
- Personal solo ve servicios asignados y no puede cambiar su estado.
- Sesión expirada devuelve al login en React.

## Migraciones

- `crm/0002_customer_consent_data_processing_and_more.py`
- `services/0002_quote_source_lead_quote_terms_quotestatushistory.py`
- `operations/0003_workorder_cancellation_reason_workorder_completed_at_and_more.py`

`makemigrations --check --dry-run`: PASS, sin cambios pendientes. Las migraciones se aplicaron desde cero sobre SQLite efímera durante cada ejecución E2E. PostgreSQL real continúa pendiente de validación de infraestructura.

## Pruebas finales

| Comando | Resultado | Evidencia |
| --- | --- | --- |
| `make test` | PASS | 31 pruebas, 0 fallos |
| `make check` | PASS | 0 problemas |
| `ruff check backend` | PASS | 0 hallazgos |
| `makemigrations --check --dry-run` | PASS | sin cambios |
| `check --deploy` con configuración efímera | PASS | 0 advertencias |
| `pip-audit -r backend/requirements.txt` | PASS | 0 vulnerabilidades conocidas |
| `npm test -- --run` | PASS | 3 pruebas, 0 fallos |
| `npm run lint` | PASS | TypeScript sin errores |
| `npm run build` | PASS | JS 239.06 kB, 73.66 kB gzip |
| `npm audit` | PASS | 0 vulnerabilidades |
| `npm run test:e2e` | PASS | 4 escenarios efectivos; 4 duplicados de proyecto omitidos intencionalmente |

Las pruebas backend incluyen permisos negativos, conversión duplicada, descuentos inválidos, transiciones inválidas y conflicto de agenda. Playwright ejecutó:

1. Ciclo público completo hasta servicio finalizado y dashboard actualizado.
2. Login inválido, error de red y 404.
3. Sesión expirada.
4. Vista móvil crítica sin desbordamiento horizontal.

Playwright usó Chromium y emulación Pixel 5, Django/Vite reales y SQLite efímera aislada en `/tmp`; no usó datos comerciales reales.

## Commits de esta ejecución

| Hash | Mensaje |
| --- | --- |
| `1db38fd` | `feat(leads): complete operational lead management` |
| `774a8cd` | `feat(workflows): complete quote and service lifecycle` |
| `359a0ba` | `feat(admin): connect operational CRUD agenda and dashboard` |
| `f8a3ea8` | `fix(security): scope Vite CSRF origins to development` |
| `93943f1` | `test(e2e): cover lead-to-service lifecycle` |
| `7bd0fe0` | `fix(api): publish clean operational schema` |

No se hizo push, Pull Request ni despliegue.

## Pendientes

- P0: ninguno conocido en los flujos ejecutados.
- P1: controles UI de paginación; asignación visual de responsable/personal; reprogramación visual; vista semanal; filtros visuales de agenda por personal/estado; detalle consolidado de historial; Compose/PostgreSQL y restauración real.
- P2: exportaciones UI, configuración completa desde React, QA visual en más navegadores/tamaños, accesibilidad integral WCAG 2.2 AA, PDF/correo productivo e i18n total.
- P3: calendario mensual avanzado, integraciones externas, analítica y optimizaciones de carga.
- Externos: dominio, DNS, TLS, servidor, secretos, correo productivo, monitoreo y backup objetivo.

## Protección y estado Git

Se trabajó únicamente en `/home/felipe/proyectos/Pacifica_Cleaning`, rama `feat/enterprise-product-completion`. Pacífica Real Estate no fue abierta ni modificada. Al cierre se debe confirmar nuevamente árbol limpio después del commit de este informe.

## Dictamen

**GO FOR STAGING**

El ciclo comercial crítico está implementado y probado localmente. Producción permanece restringida hasta validar PostgreSQL/Compose, backup/restauración, infraestructura externa y cerrar los P1 visuales del panel.
