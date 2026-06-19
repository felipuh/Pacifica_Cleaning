# Registro de decisiones tecnicas

## ADR-001: Monolito modular

Se elige monolito modular Django + React porque la empresa inicia con operacion local, equipo pequeno y necesidad de velocidad con consistencia transaccional. Microservicios agregarian despliegue, observabilidad y costos innecesarios.

## ADR-002: Sesiones HTTP-only

Se prefieren sesiones Django con cookies HTTP-only y CSRF sobre JWT en localStorage para reducir exposicion ante XSS en el portal administrativo.

## ADR-003: Django 6.0.6 y Python 3.14.6

Django 6.0.6 es estable y soporta Python 3.12, 3.13 y 3.14. Python 3.14 esta en bugfix activo. DRF 3.17.1 declara soporte para Django 6.0 y Python 3.14, lo que cierra la compatibilidad.

## ADR-004: Celery con Redis

Celery 5.6.3 se mantiene como cola robusta para tareas, aunque Django 6 introduce un framework de tareas. Django aun no provee worker propio; Celery mantiene mejor ecosistema operacional.

## ADR-005: PostgreSQL 18

PostgreSQL 18.4 esta soportado hasta 2030 y ofrece una base madura para datos relacionales, JSON controlado, concurrencia y reportes.

## ADR-006: Facturacion electronica como integracion futura

El sistema no se presenta como software contable certificado. Solo prepara entidades y eventos para integrarse luego con un proveedor autorizado o sistemas oficiales.
