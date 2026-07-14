# ADR 001: React como experiencia principal

- Estado: aceptado
- Fecha: 2026-07-14

## Contexto

El repositorio contenía un sitio público completo en plantillas Django y una aplicación React marcada como `legacy-frontend`. Mantener dos experiencias públicas activas duplica navegación y presentación, y hace ambiguo cuál debe validarse y desplegarse.

## Decisión

React/Vite es la experiencia principal para el sitio público y el portal operativo. Nginx sirve el build estático y aplica fallback a `index.html` para `/`, `/app` y `/legal`. Django conserva autoridad sobre datos, reglas, sesiones, CSRF, permisos, archivos privados y API. Django Admin permanece como consola técnica restringida.

La autenticación usa sesión Django con cookie `HttpOnly`, SameSite y Secure en producción. React obtiene el token CSRF de `/api/auth/csrf/` y lo envía en operaciones mutables. Nginx mantiene bajo Django `/api/`, `/admin/`, `/private-files/`, `/static/` y `/media/`.

Las plantillas públicas Django se conservan temporalmente como fallback de desarrollo y referencia durante la migración; no son servidas por el proxy público de producción. Se retirarán cuando los flujos públicos y E2E de React alcancen cobertura equivalente.

## Consecuencias

- Las rutas React soportan recarga directa mediante fallback SPA.
- API y frontend comparten origen en producción, reduciendo complejidad CORS/CSRF.
- Las reglas de negocio no se implementan en React.
- El build frontend pasa a ser obligatorio en Compose.
- El acceso directo al sitio Django queda limitado al backend en desarrollo o soporte.
