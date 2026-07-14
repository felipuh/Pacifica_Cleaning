# Roles y permisos

La autorización se valida en DRF mediante `RoleActionPermission`; ocultar controles en React no concede ni revoca permisos. Los roles de producto se implementan así:

| Rol de producto | Rol backend |
| --- | --- |
| Superadministrador | `superadmin` |
| Administrador | `managing_partner` |
| Operaciones | `operations` |
| Ventas | `sales` |
| Personal de limpieza | `staff` |
| Solo lectura | `auditor` |

`finance` y `quality` son especializaciones internas; `contractor` identifica prestadores sin acceso administrativo implícito.

## Matriz recurso × acción

| Recurso | Ver | Crear/editar/archivar | Asignar/cambiar estado | Exportar/configurar |
| --- | --- | --- | --- | --- |
| Leads, clientes, contactos, propiedades | admin, operaciones, ventas, finanzas, calidad, auditor | admin, operaciones, ventas | admin, operaciones, ventas | admin |
| Servicios y precios | usuarios autenticados de lectura | admin | admin | admin |
| Cotizaciones | usuarios autenticados de lectura | admin, operaciones, ventas | admin, operaciones, ventas | admin |
| Órdenes y agenda | usuarios autenticados de lectura | admin, operaciones | admin, operaciones, calidad | admin |
| Personal | usuarios autenticados de lectura | admin, operaciones | admin, operaciones | admin |
| Finanzas | admin, finanzas | admin, finanzas | admin, finanzas | admin, finanzas |
| Inventario | usuarios autenticados de lectura | admin, operaciones | admin, operaciones | admin |
| Usuarios y configuración global | admin | admin | admin | admin |

“Admin” representa `superadmin` y `managing_partner`. Cada ViewSet mantiene su mapa `action_roles`; toda acción nueva debe declarar explícitamente su conjunto autorizado y añadir una prueba negativa.
