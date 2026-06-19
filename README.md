# Pacifica Cleaning Platform

Plataforma web para Pacifica Cleaning, empresa de servicios de limpieza en Tempate, Guanacaste, Costa Rica.

La solucion se organiza como un monolito modular:

- `backend/`: Django 5, Django REST Framework, Celery, PostgreSQL y Redis.
- `frontend/`: React 19, TypeScript y Vite.
- `infra/`: Docker Compose, Nginx, scripts de despliegue, backups y restauracion.
- `docs/`: requisitos, arquitectura, reglas de negocio, seguridad, manuales y decisiones tecnicas.

## Versiones base

Linea base unificada para facilitar migraciones VPS entre proyectos:

- Python `3.12.x`: baseline backend comun con guanacaste-real-esta.
- Django `5.0.x`: baseline backend comun con guanacaste-real-esta y orion_construct.
- Django REST Framework `3.15.x`: baseline comun de API.
- React `19.2.1`: parche estable de React 19.2.
- TypeScript `6.0.3`: release estable.
- Vite `8.0.16`: version estable; requiere Node `20.19+` o `22.12+`.
- Node.js `24.17.0`: LTS oficial actual.
- PostgreSQL `16`: baseline comun en docker-compose.
- Redis `6/7/8`: soportado; en compose local se mantiene Redis 8.
- Celery `5.6.3`: mantenido.
- Nginx `1.30.x`: mantenido.
- Ubuntu Server `26.04 LTS`: LTS vigente con soporte estandar hasta mayo de 2031.

## Arranque local con Docker

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Luego abrir:

- Sitio y app: `http://localhost`
- API: `http://localhost/api/`
- Admin Django de emergencia: `http://localhost/admin/`

Crear usuario inicial:

```powershell
docker compose exec api python manage.py bootstrap_system --email admin@pacifica.local --password "Cambiar-Esto-123!"
```

## Verificacion

```powershell
docker compose exec api python manage.py test
docker compose exec frontend npm run test -- --run
docker compose exec frontend npm run build
```

En esta estacion no habia `python`, `node`, `npm` ni `docker` en PATH; por eso la verificacion ejecutable debe correrse en Docker o VPS.
