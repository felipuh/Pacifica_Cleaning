# Cierre P1 de staging — 2026-07-14

## Resumen ejecutivo

- Avance inicial: **87 %**.
- Avance final verificable: **94 %**.
- Dictamen: **GO WITH RESTRICTIONS**.
- Rama: `feat/enterprise-product-completion`.
- Git al redactar: cambios funcionales confirmados en commits locales; el informe es el último cambio pendiente de confirmar.
- Pacífica Real Estate: permaneció fuera de alcance; no se abrió, inspeccionó, ejecutó ni modificó.

Los siete P1 funcionales del panel quedaron conectados a Django/DRF y cubiertos por pruebas. Los tres P1 de infraestructura no pueden cerrarse en este host: Docker no está instalado y PostgreSQL disponible es 13.23, mientras la versión instalada de Django requiere PostgreSQL 14 o superior. Backup y restauración real dependen de una base PostgreSQL compatible y, por tanto, no fueron simulados ni declarados PASS.

## P1 funcionales cerrados

### 1. Paginación visual — PASS

- Componente reutilizable `frontend/src/Pagination.tsx`.
- Página actual, páginas totales, conteo, anterior/siguiente, acceso directo y tamaño 10/25/50/100.
- Conservación de búsqueda/filtros y reinicio a página 1 al aplicarlos.
- La API conserva la autoridad mediante `OperationalPagination`, con máximo de 100.
- Pruebas: estados habilitado/deshabilitado, cambio de página, tamaño, vacío y E2E con 28 leads sintéticos.

### 2. Asignación de responsables y personal — PASS

- Responsable de lead visible y editable mediante lista de usuarios activos y elegibles.
- Django rechaza usuarios inactivos y roles no elegibles.
- Acción transaccional `work-orders/{id}/assign/` para asignar, reasignar o retirar personal.
- Django valida permisos, actividad, duplicados y conflictos; los conflictos responden `409`.
- Las asignaciones y reasignaciones se incorporan al historial operativo.
- Pruebas positivas y negativas para ventas, operaciones, auditor y personal asignado.

### 3. Reprogramación visual — PASS

- Modal desde la agenda con inicio, fin, duración implícita y motivo obligatorio.
- Actualización sin recarga de página completa y refresco posterior de agenda/dashboard.
- Bloqueo backend de servicios completados o cancelados.
- Conflicto y edición concurrente usan `409`; validaciones inválidas usan `400`; falta de permiso usa `403`.
- Historial registra la reprogramación y el motivo.
- E2E confirma operación válida y conflicto no persistido.

### 4. Agenda semanal y filtros — PASS

- Vistas diaria y semanal, navegación anterior/siguiente, hoy y fecha directa.
- Rango visible y agrupación por día.
- Filtros API por estado y personal; combinación y limpieza sin perder el periodo.
- Cliente, propiedad, horario, personal, estado, acciones e historial en tarjetas.
- CSS móvil elimina el scroll horizontal crítico de la cuadrícula semanal.
- No se agregó ninguna dependencia de calendario.

### 5. Historial consolidado — PASS WITH RESTRICTIONS

- Componente de línea de tiempo reutilizable en detalles de lead, cliente, propiedad y cotización, y detalle expandible del servicio en agenda.
- Integra actividades/status history existentes con creación y última actualización.
- Asignaciones, transiciones y reprogramaciones nuevas quedan persistidas con actor y fecha.
- La representación reutiliza serializers autorizados; las instrucciones sensibles de propiedades siguen enmascaradas para roles no autorizados.
- Restricción: cliente y propiedad no poseen todavía un modelo histórico de campo por campo; su línea de tiempo expone creación/actualización y relaciones existentes, no un diff forense.

### 6. Cierre de permisos P1 — PASS

- 34 pruebas backend incluyen lectura permitida y mutaciones denegadas.
- Cobertura explícita: responsable elegible/inactivo, rol de personal, asignación operativa, conflicto, reprogramación, servicio finalizado y visibilidad exclusiva del personal asignado.
- Se preservan `200/201`, `400`, `403` y `409` según resultado; no se normalizaron errores a `200`.

### 7. Ampliación E2E — PASS

- Chromium escritorio y emulación Pixel 5.
- Backend Django y frontend Vite reales con SQLite efímero aislado y datos sintéticos.
- Flujo comercial completo, login inválido, error de red, 404, sesión expirada, vista móvil, paginación, filtros, asignación, reprogramación, conflicto, agenda semanal e historial.
- Resultado final: **6 PASS efectivos, 6 SKIP deliberados por aplicabilidad de proyecto, 0 FAIL**, 58.4 s.
- Los SKIP evitan ejecutar el flujo de escritorio en el proyecto móvil y los casos exclusivamente móviles en escritorio; no eliminan escenarios.

## Pruebas y validaciones finales

| Validación | Resultado | Evidencia |
|---|---|---|
| Backend Django | PASS | 34 pruebas, 54.258 s |
| Frontend Vitest | PASS | 6 pruebas, 2 archivos |
| Playwright | PASS | 6 efectivos / 6 skips por proyecto / 0 fallos |
| Ruff | PASS | `All checks passed!` |
| Migraciones efímeras | PASS | `makemigrations --check --dry-run`: no changes |
| Django `check` | PASS | 0 issues |
| Django `check --deploy` | PASS | 0 issues con variables efímeras de producción |
| TypeScript/lint | PASS | `tsc -b` |
| Build Vite | PASS | 1,690 módulos; JS 249.32 kB, gzip 75.99 kB |
| `pip-audit` | PASS | sin vulnerabilidades conocidas |
| `npm audit` | PASS | 0 vulnerabilidades |
| Docker/Compose | NOT TESTED | `docker: command not found` |
| PostgreSQL real | NOT TESTED | host 13.23; Django exige 14+ |
| Backup/restauración | NOT TESTED | requiere PostgreSQL compatible aislado |

La primera invocación de `check --deploy` usó nombres de variables incorrectos y reportó seis advertencias de configuración local. Se repitió con `DJANGO_ENV=production`, `DJANGO_DEBUG=False`, secreto efímero robusto, hosts y orígenes explícitos; el resultado definitivo fue 0 issues.

## Migraciones

- No se agregaron modelos ni archivos de migración.
- `makemigrations --check --dry-run` sobre la base efímera: PASS, sin cambios.
- Aplicación desde cero en el entorno E2E SQLite: PASS.
- Compatibilidad PostgreSQL real: **NOT TESTED** porque el servidor disponible es PostgreSQL 13.23 y Django aborta con `PostgreSQL 14 or later is required`.

## Infraestructura

### Docker y Compose — NOT TESTED

- `docker --version`: comando no encontrado.
- `docker compose version`: comando no encontrado.
- No se usó `sudo`, no se intentó instalar Docker y no se tocaron recursos ajenos.
- `docker compose config/build/up/ps`, Nginx, health checks Compose, estáticos, medios, reinicio y persistencia quedan pendientes de un runner con Docker.
- El proyecto Compose previsto conserva el nombre aislado `pacifica-cleaning`.

### PostgreSQL — NOT TESTED

- Cliente/servidor detectado: PostgreSQL 13.23.
- Bloqueo reproducible: la versión instalada de Django requiere PostgreSQL 14+.
- No se declaró validación PostgreSQL basándose en SQLite.
- Constraints, índices, transacciones, conversiones, conflictos y `Decimal` sí están cubiertos por la suite funcional, pero deben repetirse sobre PostgreSQL 14+.

## Backup y restauración — NOT TESTED

- Scripts preparados: `infra/scripts/backup.sh` e `infra/scripts/restore.sh`.
- No se creó un artefacto para aparentar cobertura.
- No se restauró ninguna base.
- Falta ejecutar, sobre dos bases PostgreSQL 14+ aisladas y datos sintéticos: backup, verificación no vacía/cifrado aplicable, restauración separada, conteos, relaciones, totales, historial y smoke test.

## QA visual y accesibilidad

- Pixel 5 E2E: PASS sin overflow horizontal crítico en la vista pública y agenda semanal.
- Responsive CSS: agenda semanal colapsa a una columna por debajo de 680 px; modales limitan altura y permiten scroll; controles tienen etiquetas y botones navegables.
- Teclado y etiquetas accesibles cubiertos en paginación, filtros, selects y diálogos.
- No se declara auditoría integral WCAG 2.2 AA.
- No se ejecutó una matriz manual independiente en cada ancho 320/375/390/768/1024/1440; queda como QA visual complementario, no como P1 funcional bloqueante.

## Commits locales

| Hash | Mensaje | Alcance |
|---|---|---|
| `85ef5a4` | `feat(ui): complete reusable operational pagination` | Paginación API/React y pruebas |
| `0623a70` | `feat(schedule): complete assignments weekly agenda and rescheduling` | Asignaciones, agenda, filtros, historial, permisos y pruebas |
| `196be2e` | `fix(dashboard): refresh metrics after agenda mutations` | Métricas reales tras transiciones |
| `b7e68b6` | `test(e2e): cover P1 operational panel workflows` | Paginación, asignación, conflicto, semana e historial |
| `037333c` | `test(e2e): stabilize session and mobile workflow checks` | Estabilidad de sesión expirada y Pixel 5 |

No se hizo push, rebase, amend, PR ni despliegue.

## Pendientes

### P0

- Ninguno identificado.

### P1

1. **Compose real**: bloqueado porque Docker no está instalado. Acción: ejecutar la fase 8 completa en un runner aislado con Docker Engine y Compose.
2. **PostgreSQL real**: bloqueado por PostgreSQL 13.23 incompatible. Acción: proveer PostgreSQL 14+ aislado, migrar desde cero y repetir backend/E2E.
3. **Backup y restauración real**: bloqueado por los dos puntos anteriores. Acción: ejecutar scripts sobre base sintética origen y restaurar en una segunda base, verificando integridad.

### P2

- Persistir historial de cambios campo por campo para cliente y propiedad, además de sus eventos actuales de creación/actualización.
- Ejecutar QA visual manual documentado en los seis anchos solicitados.

### P3

- Carga progresiva dedicada para historiales excepcionalmente extensos.

### Externos

- Dominio, DNS, TLS, secretos productivos, correo y monitoreo del entorno objetivo.

## Dictamen

**GO WITH RESTRICTIONS**

El panel P1 funcional es apto para continuar validación de staging. No corresponde `GO FOR CONTROLLED PRODUCTION`: Compose, PostgreSQL compatible y el ciclo completo de backup/restauración permanecen **NOT TESTED**. Tampoco corresponde 100 % mientras esos tres P1 de infraestructura sigan abiertos.
