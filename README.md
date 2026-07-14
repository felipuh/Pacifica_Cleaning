# Pacifica Cleaning

Plataforma operativa bilingüe para Pacífica Cleaning. React/Vite es la experiencia pública y operativa principal; Django/DRF concentra datos, reglas de negocio, autenticación, permisos y PostgreSQL.

## Arquitectura

- React sirve el sitio público y el portal en `/app`; consume la API bajo el mismo origen.
- Django/DRF es la única autoridad para validaciones, cálculos, sesiones, CSRF, roles, permisos y archivos privados.
- Django Admin en `/admin/` es una consola técnica secundaria para superadministradores.
- Nginx sirve el build React, aplica fallback SPA y envía `/api/`, `/admin/` y `/private-files/` a Django.
- PostgreSQL es la base principal. Redis/Celery permanecen opcionales para tareas asíncronas.

La decisión y la transición de las plantillas Django están documentadas en [`docs/adr/001-react-primary-frontend.md`](docs/adr/001-react-primary-frontend.md).

## Funcionalidad incluida

- Sitio público React: inicio, servicios, zonas, contacto, FAQ y políticas.
- Formulario público de leads con sesión/CSRF, honeypot y validación de backend.
- Portal React autenticado y Django Admin técnico.
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

En otra terminal, iniciar React:

```bash
cd frontend
npm ci
npm run dev
```

Abrir durante desarrollo:

- Sitio público React: `http://localhost:5174/`
- Portal React: `http://localhost:5174/app`
- Django Admin técnico: `http://localhost:8001/admin/`
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

El build `frontend/dist` debe servirse como raíz con fallback a `index.html`. Nginx envía API, Admin y archivos privados a Gunicorn; la configuración de referencia está en `infra/nginx/default.conf`.

## Docker opcional

```bash
cp .env.example .env
docker compose up --build
```

El compose usa PostgreSQL y Nginx. Celery worker/beat solo arrancan con:

```bash
docker compose --profile async up --build
```

Compose usa el nombre aislado `pacifica-cleaning`, construye React como frontend principal y reserva nombres propios para redes y volúmenes.

## Fase posterior

- Revisar textos legales con abogado antes de produccion.
- Integrar correo transaccional real y WhatsApp Cloud API oficial.
- Generar PDF de cotizacion con plantilla formal y branding definitivo.
- Agregar una accion visual en Django Admin para convertir cotizacion aceptada con seleccion de horario.
- Reintroducir Celery/Redis cuando haya recordatorios, correos masivos, backups asincronos o reportes pesados.
- Retirar las plantillas públicas Django cuando los flujos E2E React alcancen cobertura equivalente.
