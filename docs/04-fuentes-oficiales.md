# Fuentes oficiales consultadas

Consulta realizada el 18 de junio de 2026.

- Python.org Downloads: Python 3.14.6 publicado el 10 de junio de 2026 y Python 3.14 en mantenimiento bugfix. Fuente: https://www.python.org/downloads/
- Django download: version oficial estable 6.0.6. Fuente: https://www.djangoproject.com/download/
- Django 6.0 release notes: soporte para Python 3.12, 3.13 y 3.14; CSP y Tasks framework. Fuente: https://docs.djangoproject.com/en/stable/releases/6.0/
- Django REST Framework release notes: 3.17.1 del 24 de marzo de 2026; 3.17.0 agrega soporte Django 6.0 y Python 3.14. Fuente: https://www.django-rest-framework.org/community/release-notes/
- React versions: version mayor actual 19.2 y releases 19.2.1. Fuente: https://react.dev/versions
- Node.js releases: Node 24.17.0 Latest LTS; produccion debe usar Active/Maintenance LTS. Fuente: https://nodejs.org/en/about/previous-releases
- Vite docs: Vite 8.0.16, requiere Node 20.19+ o 22.12+. Fuente: https://vite.dev/guide/
- TypeScript releases: 6.0.3 estable. Fuente: https://www.typescriptlang.org/docs/
- PostgreSQL docs/versioning: PostgreSQL 18.4 soportado, version 19 en beta no usada. Fuente: https://www.postgresql.org/docs/
- Redis docs: versiones estables Redis Open Source/Redis for Kubernetes 8.0.18 y guia de seguridad Redis. Fuente: https://redis.io/docs/latest/operate/oss_and_stack/management/security/
- Celery docs: documentacion estable 5.6.3. Fuente: https://docs.celeryq.dev/en/stable/
- Nginx downloads: estable 1.30.3; mainline 1.31.2 no se usa para produccion inicial. Fuente: https://nginx.org/en/download.html
- Ubuntu release cycle: Ubuntu 26.04 LTS liberado en abril de 2026 con mantenimiento estandar hasta mayo de 2031. Fuente: https://ubuntu.com/about/release-cycle

## Politica de actualizacion y vulnerabilidades

- Revisar mensualmente releases de seguridad y changelogs oficiales.
- Ejecutar `pip-audit -r backend/requirements.txt`, `npm audit --omit=dev` y escaneo de imagenes antes de desplegar.
- Aplicar parches de seguridad de framework y sistema operativo en ventana controlada, con backup verificado previo.
- No subir versiones mayores automaticamente; primero correr pruebas unitarias, API, permisos, E2E y restauracion.
- Mantener `requirements.txt`, `package.json`, `package-lock.json`, Dockerfiles y CI con versiones exactas.
