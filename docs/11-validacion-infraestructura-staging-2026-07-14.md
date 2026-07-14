# Validación de infraestructura y staging controlado — 2026-07-14

## Resumen ejecutivo

- Avance inicial: **94 %**.
- Avance final verificable: **98 %**; los P1 técnicos de Compose, PostgreSQL y backup/restauración quedaron cerrados con infraestructura real.
- Dictamen: **GO FOR CONTROLLED PRODUCTION**.
- Rama: `chore/staging-infrastructure-validation`.
- HEAD funcional de referencia confirmado: `8a6b3af`.
- HEAD de infraestructura al validar: `ec77114`.
- Árbol Git: limpio y sincronizado con `origin` al cierre.
- Push funcional: `Everything up-to-date`; no había commits funcionales pendientes.
- Push de infraestructura: realizado sin fuerza, únicamente a su rama.
- Pacífica Real Estate: intacto; no se abrió, inspeccionó, ejecutó, modificó ni desplegó.

El resultado se apoya en la ejecución real exitosa de GitHub Actions `29370627414`, SHA `ec77114`, Ubuntu 24.04, duración **4 min 21 s**. No hubo deploy, merge, Pull Request, tag ni release.

## Push controlado

| Rama | Commit | Remoto | Resultado |
|---|---|---|---|
| `feat/enterprise-product-completion` | `8a6b3af` | `origin` | `Everything up-to-date`; tracking confirmado |
| `chore/staging-infrastructure-validation` | `ec77114` | `origin` | push normal exitoso; rama sincronizada |

No se creó merge ni PR. GitHub solo mostró la URL informativa estándar para crear un PR; no se utilizó.

## Entorno

| Elemento | Host local | Runner validado |
|---|---|---|
| Sistema | Linux 5.14, x86_64 | Ubuntu 24.04 GitHub-hosted |
| Docker | No disponible | Disponible; Compose config/build/up/down ejecutados |
| Docker Compose | No disponible | Disponible |
| PostgreSQL | cliente 13.23, incompatible con Django actual | **PostgreSQL 16.14**, Alpine, 64-bit |
| Python | global 3.9.25; venv del repo 3.12 | Python 3.12.13 |
| Node | 20.20.2 | Node 24.17.0 |
| Zona horaria | America/Costa_Rica | America/Costa_Rica explícita |

Se eligió la ruta remota porque Docker no existe en el host y PostgreSQL 13.23 no cumple el mínimo 14. El proyecto remoto fue exclusivamente `pacifica-cleaning-staging`, con datos y credenciales sintéticos efímeros.

## Compose

- `docker compose -p pacifica-cleaning-staging config --quiet`: PASS.
- `build --pull`: PASS para backend y frontend.
- `up -d`: PASS; `db`, Redis, API, frontend y Nginx iniciaron.
- Health checks: PostgreSQL, Redis, API, volumen frontend y Nginx alcanzaron estado healthy.
- `nginx -t`: PASS.
- Rutas `/`, `/app`, `/legal`, `/api/v1/health/` y `/admin/`: PASS.
- `/private-files/not-present`: no devolvió 200; protección confirmada.
- Asset JavaScript del build: servido con éxito.
- `/api/` y `/admin/`: enrutados a Django, no al fallback SPA.
- Migraciones y `collectstatic`: ejecutados al inicio; estáticos disponibles desde volumen aislado.
- Reinicio completo: fingerprint sin cambios.
- `down` sin `-v` y nuevo `up -d`: fingerprint sin cambios.
- Logs: sin reinicios constantes, errores de permisos ni secretos completos del runtime.
- Limpieza: `down -v --remove-orphans` únicamente para `pacifica-cleaning-staging`, después de conservar la evidencia.

Resultado Compose: **PASS**.

## PostgreSQL

- Servidor: `PostgreSQL 16.14 on x86_64-pc-linux-musl`.
- Base origen: `pacifica_cleaning_staging_source` nueva y aislada.
- `migrate --plan`: PASS; sin operaciones pendientes después del arranque desde cero.
- `migrate --noinput`: PASS.
- `makemigrations --check --dry-run`: PASS, `No changes detected`.
- `check`: PASS, 0 issues.
- Suite Django sobre PostgreSQL real: **34/34 PASS**, 0 fallos, 0 skips, 16.316 s.
- La suite cubrió permisos, CSRF, recuperación, conversión única, transacciones, duplicados, conflictos, `Decimal`, estados, historial y archivado.
- E2E real a través de Nginx/API/PostgreSQL: **6 PASS efectivos, 6 skips deliberados por aplicabilidad de proyecto, 0 fallos**, 18.9 s.
- Los skips mantienen los escenarios desktop en Chromium y los escenarios exclusivamente móviles en Pixel 5; no se redujo ningún escenario vigente.

Resultado PostgreSQL: **PASS**.

## Backup

- Script: `infra/scripts/backup.sh`, ejecutado directamente con permisos `0755`.
- Base: `pacifica_cleaning_staging_source`.
- Archivo enmascarado: `pacifica_<timestamp>.sql.gz.enc`.
- Tamaño: **17,584 bytes**.
- Permisos: **0600**.
- SHA-256: `7d01d06d437f4d07cdef189f5f4dd04e55dc1e37d3ceabcf3672eb7f630b6839`.
- Cifrado: OpenSSL AES-256-CBC, salt y PBKDF2, passphrase efímera no registrada.
- Código de salida: 0.
- Backup + creación de base + restauración: 1 s según el contador del paso.
- El archivo fue temporal, no se publicó como artefacto y fue eliminado tras las comprobaciones.

Resultado backup: **PASS**.

## Restauración e integridad

- Base destino vacía y separada: `pacifica_cleaning_staging_restore`.
- Script: `infra/scripts/restore.sh`, ejecutado con `RESTORE_DATABASE` explícita y `psql -v ON_ERROR_STOP=1`.
- Descifrado: archivo temporal exclusivo mediante `mktemp`, eliminado por `trap`.
- Restauración: código 0, mensaje `Restore completed`.
- Integridad: fingerprint SHA-256 determinista y conteos de todos los modelos idénticos entre origen y destino antes del smoke.
- La huella incluye relaciones, usuarios/roles, consentimientos, estados, fechas, archivados y campos monetarios serializados de forma exacta; no usa tolerancia aproximada para `Decimal`.
- `check` restaurado: PASS.
- Pruebas de autenticación y sitio sobre la restaurada: 8/8 PASS, 0 skips, 2.080 s.
- Smoke operacional restaurado: PASS para login forzado de administrador, dashboard, leads, clientes, propiedades, cotizaciones, agenda/órdenes, historiales incluidos en serialización, creación de lead, conversión y persistencia de lead/cliente.

Se confirmó conjuntamente:

```text
BACKUP CREADO
+ BACKUP NO VACÍO
+ RESTAURACIÓN EJECUTADA
+ BASE RESTAURADA OPERATIVA
+ INTEGRIDAD VALIDADA
```

Resultado backup/restore: **PASS**.

## Pruebas

| Comando/etapa | Resultado | Conteo / duración | Fallos | Skips / advertencias |
|---|---|---:|---:|---|
| `make test` local inicial | PASS | 34, 62.674 s | 0 | 0 |
| `make check` local | PASS | 0 issues | 0 | 0 |
| Ruff en venv | PASS | sin hallazgos | 0 | 0 |
| `pip-audit` en venv | PASS | 0 vulnerabilidades | 0 | 0 |
| Vitest local inicial | PASS | 6/6 | 0 | 0 |
| lint/build local | PASS | build 1,690 módulos | 0 | 0 |
| Playwright local inicial | FAIL y repetición focal PASS | 5 pass/6 skip/1 fail; luego 1/1 | 1 intermitente | overflow móvil inicial, documentado |
| Compose config/build/up | PASS | stack completo | 0 | 0 |
| Migraciones desde cero PostgreSQL | PASS | todas aplicadas | 0 | 0 |
| Django PostgreSQL | PASS | 34/34, 16.316 s | 0 | 0 |
| Vitest remoto | PASS | 6/6 | 0 | 0 |
| TypeScript/build remoto | PASS | build exitoso | 0 | 0 |
| Playwright PostgreSQL | PASS | 6 pass, 18.9 s | 0 | 6 deliberados |
| Persistencia restart/down-up | PASS | 3 fingerprints iguales | 0 | 0 |
| Restore auth/public | PASS | 8/8, 2.080 s | 0 | 0 |
| Smoke restaurado | PASS | 6 consultas + crear/convertir/persistir | 0 | 0 |
| `check --deploy` | PASS | 0 issues | 0 | 0 |
| `pip-audit` remoto | PASS | 0 vulnerabilidades | 0 | 0 |
| `npm audit` remoto | PASS | 0 vulnerabilidades | 0 | 0 |

La invocación global local de Ruff/Python/pip-audit no encontraba dependencias porque el proyecto usa `backend/.venv`; se repitió dentro de ese entorno. `makemigrations` contra el PostgreSQL 13.23 local reprodujo correctamente la incompatibilidad; el resultado definitivo se obtuvo con PostgreSQL 16.14 real. El E2E local mostró una intermitencia móvil que pasó al aislarla y pasó de nuevo en dos ejecuciones remotas completas posteriores.

## Defectos encontrados

| Síntoma | Causa raíz | Corrección / regresión | Commit |
|---|---|---|---|
| `/` devolvía 500 en Compose | Nginx no declaraba el root del volumen SPA | `root`/`index` explícitos, `nginx -t` y rutas reales | `4abe121` |
| Test CSRF fallaba en producción | La prueba dependía implícitamente de settings de desarrollo | `override_settings` con origen exacto | `9a89a6e` |
| E2E remoto no iniciaba | Chromium no estaba instalado | instalación Chromium con dependencias | `2b40590` |
| Hora reprogramada distinta | Runner en UTC | TZ Costa Rica explícita | `75cfcff` |
| Backup devolvía 126 | scripts sin bit ejecutable | modos `0755` | `e5a984e` |
| Smoke restaurado devolvía 400 | cliente usaba Host no autorizado | Host sintético `api`, sin ampliar hosts | `ec77114` |

## Commits

| Hash | Mensaje | Alcance y validación |
|---|---|---|
| `fe4fcde` | `test(infra): validate restored staging integrity` | workflow, Compose aislable, fingerprint, scripts; validación iterativa |
| `4abe121` | `fix(compose): serve staged frontend from shared volume` | Nginx SPA; rutas PASS |
| `9a89a6e` | `test(infra): isolate development CSRF origin assertion` | suite 34/34 PASS en producción/PostgreSQL |
| `2b40590` | `fix(compose): install browser for staging E2E` | Playwright real habilitado |
| `75cfcff` | `fix(compose): align staging runner timezone` | E2E 6/6 efectivos PASS |
| `e5a984e` | `fix(backup): make operational scripts executable` | backup/restauración código 0 |
| `6a83a6f` | `test(infra): smoke restored operational workflows` | smoke amplio restaurado |
| `ec77114` | `fix(database): use authorized host in restored smoke` | ejecución final completa PASS |

## Seguridad de contenedores y configuración

- Backend ejecuta como usuario no root `pacifica`.
- PostgreSQL no publica puerto al host; Nginx es el único punto de entrada.
- Imágenes principales tienen versiones definidas; los pulls quedaron resueltos por digest en el log.
- Secretos se generaron en runtime, no entraron en imágenes ni Git.
- `DEBUG=False`, hosts y orígenes CSRF/CORS explícitos.
- Cookies seguras permanecen como default productivo; el HTTP efímero de staging las desactivó explícitamente y `check --deploy` se ejecutó aparte con flags seguros.
- Headers Nginx, límites de carga, CSRF, CORS y archivos privados se conservaron.
- Nginx mantiene proceso master estándar; el backend sí opera sin root. No se cambió seguridad productiva para ocultar pruebas.

## Pendientes

### P0

- Ninguno identificado.

### P1

- Ninguno técnico crítico de esta fase.

### P2

- Historial forense campo por campo para clientes y propiedades.
- QA WCAG 2.2 AA y matriz visual manual completa.
- Programar backup en el servidor objetivo y probar retención/rotación.

### P3

- Observabilidad avanzada y optimización de historiales extensos.

### Externos

- Dominio, DNS, TLS, secretos productivos, servidor objetivo, correo productivo, monitoreo y almacenamiento definitivo de backups.

Estos externos impiden declarar `GO FOR PRODUCTION`, pero no invalidan el staging controlado ni el cierre técnico realizado con datos sintéticos.

## Dictamen

**GO FOR CONTROLLED PRODUCTION**

Compose, PostgreSQL 16, migraciones desde cero, backend, frontend, E2E sobre PostgreSQL, persistencia, backup cifrado, restauración separada, integridad exacta, smoke restaurado y auditorías pasaron en una ejecución real verificable. No se declara `GO FOR PRODUCTION` mientras falte la infraestructura productiva externa indicada.
