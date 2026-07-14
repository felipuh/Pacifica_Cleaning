# Pacifica Cleaning

Plataforma operativa bilingue para Pacifica Cleaning. La ruta actual prioriza un monolito Django simple: sitio publico, Django Admin, API interna minima y PostgreSQL.

## Diagnostico breve

- El repositorio tenia backend Django modular, frontend React/Vite, Docker, Nginx, Redis y Celery.
- El backend ya incluia modelos utiles para CRM, propiedades, servicios, cotizaciones, agenda, finanzas e inventario.
- El frontend separado aumentaba el costo de despliegue del MVP y duplicaba validaciones que ya existen en Django/DRF.
- Redis y Celery no son necesarios para captar leads, administrar catalogo/cotizaciones ni operar agenda inicial.

## Arquitectura objetivo

Django-only para el MVP: Django sirve paginas publicas con templates, Django Admin opera el backoffice, DRF queda para API interna, PostgreSQL es la base principal y Celery/Redis quedan como opcion de fase posterior.

## Funcionalidad incluida

- Sitio publico bilingue: inicio, servicios, zonas, contacto, FAQ y politicas.
- Formulario publico de leads con CSRF, honeypot y validacion de backend.
- Django Admin para leads, clientes, propiedades, servicios, cotizaciones y ordenes de servicio.
- Modelos base existentes para CRM, catalogo, cotizaciones, agenda, finanzas e inventario.
- Health check en `/api/v1/health/`.
- Docker conservado como opcion, pero no como requisito de operacion.

## Arranque local sin Docker

Requisitos:

- Python 3.12
- PostgreSQL 14 o superior (16 recomendado)

El repositorio fija la linea base en `.python-version`, `runtime.txt` y `pyproject.toml`. En Rocky/RHEL, instala Python 3.12 con:

```bash
sudo dnf install -y python3.12 python3.12-pip
```

En Ubuntu:

```bash
sudo apt update
sudo apt install -y python3.12 python3.12-venv
```

Crear base local:

```bash
createdb pacifica
createuser pacifica
psql -c "ALTER USER pacifica WITH PASSWORD 'pacifica_dev_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE pacifica TO pacifica;"
```

Preparar entorno:

```bash
cp .env.example .env
make install
make migrate
make seed
make admin
make run
```

Abrir:

- Sitio publico: `http://localhost:8001/`
- Contacto/leads: `http://localhost:8001/contacto/`
- Admin: `http://localhost:8001/admin/`
- API docs: `http://localhost:8001/api/docs/`
- Health: `http://localhost:8001/api/v1/health/`

Puerto opcional:

```bash
PORT=8011 make run
```

Este proyecto debe correr de forma independiente de `guanacaste-real-esta`; la linea base local usa `8001` para evitar conflicto con el backend inmobiliario en `8000`.

## Validacion

```bash
make check
make test
DJANGO_ENV=production DJANGO_DEBUG=false DJANGO_SECRET_KEY="replace-with-a-long-production-secret" DJANGO_ALLOWED_HOSTS=example.com DATABASE_URL="postgres://pacifica:pacifica_dev_password@localhost:5432/pacifica" make deploy-check
```

La estacion debe ejecutar estos comandos con `python3.12`; `python3` puede apuntar a una version anterior segun el sistema.

## Flujo operativo minimo

Convertir una cotizacion aceptada en orden de servicio:

```bash
curl -X POST http://localhost:8001/api/v1/quotes/<quote-id>/convert-to-work-order/ \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: <csrf-token>" \
  --cookie "sessionid=<session-id>; csrftoken=<csrf-token>" \
  -d '{"scheduled_start":"2026-07-01T08:00:00-06:00","scheduled_end":"2026-07-01T11:00:00-06:00","route_zone":"Tempate"}'
```

La API rechaza cotizaciones no aceptadas, fechas invalidas y conversiones duplicadas.

## Produccion simple en VPS

Instalar dependencias del sistema:

```bash
sudo apt update
sudo apt install -y python3.12 python3.12-venv postgresql nginx
```

Variables minimas:

```bash
DJANGO_ENV=production
DJANGO_DEBUG=false
DJANGO_SECRET_KEY=<secreto-largo>
DJANGO_ALLOWED_HOSTS=pacificacleaning.cr,www.pacificacleaning.cr
DJANGO_CSRF_TRUSTED_ORIGINS=https://pacificacleaning.cr,https://www.pacificacleaning.cr
DATABASE_URL=postgres://pacifica:<password>@127.0.0.1:5432/pacifica
DJANGO_SECURE_SSL_REDIRECT=true
```

Proceso web:

```bash
cd backend
source .venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
gunicorn pacifica.wsgi:application --bind 127.0.0.1:8000 --workers 2 --timeout 60
```

Nginx debe servir `/static/` desde `backend/staticfiles` y proxyear el resto a `127.0.0.1:8000`.

## Docker opcional

```bash
cp .env.example .env
docker compose up --build
```

El compose usa PostgreSQL y Nginx. Celery worker/beat solo arrancan con:

```bash
docker compose --profile async up --build
```

El frontend React queda bajo el perfil `legacy-frontend`; no es parte del MVP operativo.

## Fase posterior

- Revisar textos legales con abogado antes de produccion.
- Integrar correo transaccional real y WhatsApp Cloud API oficial.
- Generar PDF de cotizacion con plantilla formal y branding definitivo.
- Agregar una accion visual en Django Admin para convertir cotizacion aceptada con seleccion de horario.
- Reintroducir Celery/Redis cuando haya recordatorios, correos masivos, backups asincronos o reportes pesados.
- Decidir si el frontend React se elimina definitivamente o se reserva para portal cliente.
