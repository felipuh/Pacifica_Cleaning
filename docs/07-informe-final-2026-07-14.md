# Informe de auditoria y hardening — 2026-07-14

## 1. Resumen ejecutivo

Estado inicial estimado: 55 %. Existia una base funcional amplia, pero el comando oficial y CI ejecutaban cero pruebas, habia una prueba rota oculta, dependencias con 32 vulnerabilidades conocidas, contenido placeholder visible y un enlace de WhatsApp invalido.

Estado final estimado: 65 %. Los bloqueos anteriores quedaron corregidos y verificados. El sistema conserva brechas importantes de producto y despliegue, por lo que el dictamen es **GO WITH RESTRICTIONS** y no autoriza produccion.

## 2. Proteccion de Real Estate

- Ruta trabajada exclusivamente: `/home/felipe/proyectos/Pacifica_Cleaning`.
- `pwd` y `git rev-parse --show-toplevel` devolvieron esa misma ruta.
- Rama `main`, inicialmente limpia y alineada con `origin/main`.
- No se encontraron enlaces simbolicos ni referencias a Real Estate.
- No se usaron `sudo`, Docker, despliegues, push, commits ni comandos destructivos.

## 3. Documentacion analizada

Se revisaron `README.md`, `docs/00-producto-y-arquitectura.md` a `docs/06-matriz-cumplimiento.md`, configuracion Django/Vite, modelos, serializers, vistas, pruebas, migraciones, CI, Dockerfiles, Compose, Nginx y scripts de backup/restauracion.

Contradiccion principal: README define Django-only para MVP, mientras `docs/06-matriz-cumplimiento.md`, mas reciente y especifico, exige React como experiencia principal. La implementacion actual sirve Django por defecto y deja React en perfil legacy. No se hizo una sustitucion masiva sin una decision de producto y pruebas E2E; queda como P1.

## 4. Cambios realizados

### Backend y seguridad

- Django 5.0.6 a 5.2.16, DRF 3.15.1 a 3.17.1 y Pillow 11.2.1 a 12.3.0.
- Se eliminaron 32 vulnerabilidades reportadas por `pip-audit`.
- Las pruebas locales usan SQLite aislado; CI conserva PostgreSQL moderno. Esto evita tocar PostgreSQL 13 local, no compatible con Django 5.2.
- Se agrego cobertura del lead publico, denegacion de listado anonimo y health check con base de datos.
- Se corrigio un import sin uso.

### Frontend publico

- Se eliminaron testimonios placeholder visibles en Django y React.
- WhatsApp React ahora usa `VITE_WHATSAPP_NUMBER`, normaliza el numero y, sin configuracion, dirige al formulario en vez de crear un enlace invalido.
- `.env.example` documenta la nueva variable sin incluir datos reales.

### CI y calidad

- `make test` descubre explicitamente el paquete `tests` (12 pruebas en vez de 0).
- CI usa Python 3.12, alineado con `pyproject.toml`, runtime y Dockerfile.
- CI ejecuta el paquete real de pruebas backend.

## 5. Funcionalidades verificadas

- Pagina publica ES/EN: probada.
- Formulario Django crea lead real: probado.
- API publica crea lead sin exponer el listado anonimamente: probado.
- Health check y conexion de base: probado.
- Calculo de cotizacion, inventario, conflicto de agenda, enmascaramiento de accesos y conversion unica a orden: probados.
- Build React, tipado TypeScript y prueba de render/formulario: probados.

## 6. Pruebas ejecutadas

| Comando | Resultado | Evidencia |
| --- | --- | --- |
| `make test` | PASS | 12 pruebas, 0 fallos |
| `make check` | PASS | 0 problemas |
| `makemigrations --check --dry-run` con DB aislada | PASS | sin cambios |
| `ruff check backend` | PASS | sin hallazgos |
| `npm test -- --run` | PASS | 1 archivo, 1 prueba |
| `npm run lint` | PASS | TypeScript sin errores |
| `npm run build` | PASS | bundle JS 221.01 kB, gzip 69.75 kB |
| `npm audit` | PASS | 0 vulnerabilidades |
| `pip-audit -r backend/requirements.txt` | PASS | 0 vulnerabilidades conocidas |
| `manage.py check --deploy` con variables seguras de validacion | PASS | 0 advertencias |
| `docker compose config --quiet` | NOT TESTED | Docker no esta instalado |
| restauracion de backup | NOT TESTED | Docker no esta instalado; no se declara validada |

## 7. Migraciones

No se crearon migraciones. El plan esta consistente y `makemigrations --check --dry-run` no detecta cambios. CI debe validar migracion completa contra PostgreSQL 16/18 antes de staging.

## 8. Seguridad

Corregido: dependencias vulnerables, enlace de contacto invalido y falta de pruebas de privacidad basica del endpoint de leads. Se verificaron CSRF, permisos anonimos, configuracion segura de produccion y ausencia de secretos nuevos.

Riesgos residuales: cobertura de permisos incompleta, recuperacion de contrasena ausente, subida de archivos sin pruebas suficientes, Bandit conserva un falso positivo bajo por comparar la clave local insegura, y no hay prueba dinamica desplegada de headers/TLS.

## 9. Rendimiento

El build React produce 69.75 kB gzip de JavaScript. Los querysets principales usan `select_related` donde corresponde. No se ejecutaron Lighthouse, carga, profiling SQL ni QA en navegadores reales.

## 10. Preparacion para produccion

| Elemento | Estado |
| --- | --- |
| Backend check y pruebas criticas | PASS |
| Frontend test, lint y build | PASS |
| Dependencias Python/Node | PASS |
| Migraciones sin cambios | PASS |
| Configuracion segura Django | PASS |
| Docker/Compose ejecutable | NOT TESTED |
| Backup y restauracion controlada | FAIL |
| Dominio, DNS, HTTPS y secretos reales | FAIL |
| Arquitectura React/Django unificada | FAIL |
| Panel operativo React CRUD completo | FAIL |
| E2E y QA visual multidispositivo | FAIL |
| Observabilidad desplegada | FAIL |

## 11. Pendientes

- P0: ninguno conocido dentro de los flujos automaticos ejecutados.
- P1: decidir y unificar frontend principal; completar CRUD/roles del panel; recuperacion de contrasena; E2E; probar Compose, migraciones PostgreSQL 16+, backup y restauracion; dominio/HTTPS/secretos/observabilidad.
- P2: contenido administrable completo, SEO estructurado, i18n React integral, PDF/envio de cotizaciones, calendario visual, reportes/KPIs y QA WCAG 2.2 AA.
- P3: PWA, integraciones oficiales de WhatsApp/correo/facturacion y optimizaciones avanzadas.

## 12. Archivos modificados

- Calidad/CI: `Makefile`, `.github/workflows/ci.yml`, `backend/tests/test_public_site.py`.
- Dependencias: `backend/requirements.txt`.
- Publico: `backend/templates/public_site/home.html`, `frontend/src/App.tsx`, `frontend/src/content.ts`.
- Configuracion: `.env.example`.
- Limpieza: `backend/apps/services/management/commands/seed_initial_data.py`.
- Documentacion: este informe.

## 13. Commits

No se realizaron commits ni push.

## 14. Comandos de ejecucion

- Desarrollo: `make install && make migrate && make seed && make run`.
- Pruebas: `make test && cd frontend && npm test -- --run`.
- Build: `cd frontend && npm run build`.
- Migraciones: `make migrate` sobre PostgreSQL 14 o superior.
- Produccion opcional: `docker compose up --build` despues de configurar `.env` real.
- Backup: `BACKUP_PASSPHRASE=... infra/scripts/backup.sh`.
- Restauracion: `BACKUP_PASSPHRASE=... infra/scripts/restore.sh <archivo.enc>` solo en staging aislado primero.

## 15. Dictamen final

**GO WITH RESTRICTIONS**

La base es apta para continuar hacia staging controlado, pero no para produccion hasta cerrar los P1 y validar infraestructura, restauracion, E2E, seguridad y arquitectura de interfaz.
