# Seguridad, privacidad y actualizaciones

## Practicas base

- HTTPS obligatorio en produccion.
- Cookies de sesion `HttpOnly`, `Secure`, `SameSite=Lax`.
- CSRF activo para sesiones.
- Validacion backend obligatoria en todos los formularios.
- Permisos por rol y auditoria de acciones sensibles.
- Proteccion contra fuerza bruta mediante bloqueo temporal de login.
- CSP en Django 6 y Nginx.
- Subida de archivos con limites de tamano, extension y tipo MIME.
- URLs firmadas para archivos privados.
- Secretos solo por variables de entorno o gestor externo.
- Backups cifrados y restauracion probada periodicamente.

## Datos sensibles

Los datos de llaves, alarmas, accesos, documentos, fotografias y contratos se minimizan, enmascaran por defecto y se muestran solo a roles autorizados. Toda fotografia antes/despues requiere consentimiento asociado.

## Retencion

- Leads no convertidos: revisar y depurar cada 12 meses.
- Evidencias fotograficas: retencion configurable por cliente/contrato.
- Auditoria: minimo 24 meses.
- Backups: 30 dias diarios, 12 mensuales, cifrados.

## Politica de actualizacion

- Semanal: revisar Dependabot, `pip-audit`, `npm audit`, CVEs de Django, PostgreSQL, Redis, Nginx y Ubuntu.
- Mensual: aplicar parches menores en staging y desplegar si pasan pruebas.
- Trimestral: revisar dependencias no usadas y soporte LTS.
- Anual: planificar upgrades mayores con branch dedicado, pruebas de restauracion y rollback documentado.

## Respuesta a incidentes

1. Contener: rotar secretos, bloquear cuentas afectadas y aislar servicio si aplica.
2. Preservar evidencia: logs, auditoria, hashes de artefactos.
3. Erradicar: parchear vulnerabilidad, revocar tokens, limpiar accesos.
4. Recuperar: restaurar desde backup verificado si corresponde.
5. Notificar: clientes/autoridades segun obligaciones legales.
6. Aprender: postmortem y nuevas pruebas preventivas.

## Pruebas

- Automaticas: permisos por rol, bloqueo de login, validacion de archivos y agenda concurrente.
- Manuales: verificar headers, cookies, subida de archivos, enmascaramiento y revocacion de sesiones.
