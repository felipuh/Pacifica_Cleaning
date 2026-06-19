# Manuales operativos

## Instalacion local

1. Instalar Docker Desktop o Docker Engine.
2. Copiar `.env.example` a `.env`.
3. Cambiar `DJANGO_SECRET_KEY` y contrasenas.
4. Ejecutar `docker compose up --build`.
5. Crear superusuario con `bootstrap_system`.

## Despliegue en VPS

1. Usar Ubuntu Server 26.04 LTS.
2. Crear usuario sin privilegios: `adduser deploy`.
3. Activar UFW: `ufw allow OpenSSH`, `ufw allow 80`, `ufw allow 443`, `ufw enable`.
4. Deshabilitar login SSH por password y root.
5. Instalar Docker desde repositorio oficial.
6. Clonar repo en `/opt/pacifica-cleaning`.
7. Crear `.env` de produccion con secretos reales.
8. Ejecutar `docker compose -f docker-compose.yml up -d --build`.
9. Configurar DNS `pacificacleaning.cr` y `admin.pacificacleaning.cr` si se separan subdominios.
10. Emitir certificados con reverse proxy o Certbot en host.

## Backups

Ejecutar:

```bash
infra/scripts/backup.sh
```

Restaurar en staging antes de produccion:

```bash
infra/scripts/restore.sh backups/pacifica_YYYYmmdd_HHMMSS.sql.gz.enc
```

## Administrador

- Crear usuarios con rol minimo necesario.
- Revisar auditoria semanalmente.
- No cargar datos de acceso a propiedades sin consentimiento.
- Configurar servicios, tareas, exclusiones, precios y vigencia.
- Revisar vencimientos de INS, CCSS, contratos y documentos.

## Usuario operativo

- Crear lead o cliente.
- Registrar propiedad con instrucciones de acceso.
- Generar cotizacion desde catalogo.
- Convertir cotizacion aceptada a orden de servicio.
- Asignar personal verificando conflictos.
- Completar checklist y evidencias autorizadas.
- Registrar pago/gasto y revisar margen.

## Pruebas manuales

- Iniciar sesion, cerrar sesion y recuperar contrasena.
- Enviar solicitud publica y confirmar que aparece como lead.
- Crear cotizacion con descuento permitido.
- Intentar solapar asignaciones y confirmar bloqueo.
- Generar PDF.
- Ejecutar backup y restaurarlo en entorno limpio.
