# Pacífica Cleaning — Informe de implementación del rediseño público

Fecha de cierre técnico: 21 de julio de 2026
Rama: `feat/public-experience-redesign`

## Dictamen

P01 queda implementada y lista para revisión humana. La home pública contiene las 13 regiones canónicas, mantiene el contrato real de leads con Django, pasa lint, unitarias, build y la matriz E2E final, y fue validada sin overflow en 320, 390, 768, 1024 y 1440 px. Se generaron cinco evidencias locales de página completa y dos frames editables mediante code-to-canvas en un archivo Figma nuevo.

No se modificó Pacífica Realty. No hubo merge, push, deploy, release ni tag. No se usó Stitch MCP ni se creó o modificó ningún proyecto Stitch.

## Baseline

- Estado inicial: rama de staging existente y `docs/design/` sin seguimiento; se preservó ese contenido y no se sobrescribió trabajo no relacionado.
- Package manager: npm.
- Frontend: React 19.2.1, TypeScript 6 y Vite 8.
- Estilos: CSS global interno; no se incorporó una librería visual.
- Integración Django: CSRF en `/api/auth/csrf/` y creación de leads en `/api/v1/leads/`.
- WhatsApp: configuración existente mediante `VITE_WHATSAPP_NUMBER`.
- Baseline lint/typecheck: aprobado.
- Baseline unitario: 6 archivos, 21 pruebas aprobadas.
- Baseline build: aprobado.
- Baseline E2E: 3 aprobadas, 4 fallidas por timeout y 7 omitidas. Los cuatro fallos provenían de selectores preexistentes que buscaban `Contrasena` mientras la interfaz real exponía `Contraseña`; no eran fallos del backend.

## Archivos modificados

- `frontend/src/content.ts`: copy público y estructuras canónicas centralizadas.
- `frontend/src/public/PublicExperience.tsx`: experiencia pública completa y formulario integrado.
- `frontend/src/styles/app.css`: tokens, sistema visual, layout responsive, estados y accesibilidad.
- `frontend/src/styles/admin.css`: ajuste responsive mínimo para eliminar overflow administrativo móvil sin cambiar lógica ni permisos.
- `frontend/src/App.test.tsx`: expectativas del nuevo H1, navegación e idioma.
- `frontend/src/public/PublicExperience.test.tsx`: cobertura unitaria de P01.
- `frontend/e2e/lead-to-service.spec.ts`: selectores alineados con la UI real y diagnóstico de overflow.
- `frontend/e2e/public-experience.spec.ts`: QA funcional, accesible y responsive de P01.
- `docs/design/evidence/react-public-home/*.png`: cinco capturas locales de página completa.
- `docs/design/30-PUBLIC-REDESIGN-IMPLEMENTATION-REPORT.md`: este informe.

## Componentes creados o consolidados

`PublicHeader`, `MobileNavigation`, `Button`, `SectionHeading`, `PlaceholderMedia`, `NeedSelector`, `ProcessTimeline`, `ServiceList`, `EvidenceSection`, `TrustPrinciples`, `CoverageChips`, `FormField`, `Input`, `Select`, `Textarea`, `Checkbox`, `QuoteForm`, `Accordion`, `ErrorSummary`, `Alert`, `LoadingState`, `SuccessState` y `PublicFooter`.

La home comparte una sola composición React entre desktop y móvil. El copy aprobado vive en un único módulo y no se duplicó por viewport.

## Integración backend

El formulario mantiene exactamente ocho controles visibles:

1. `full_name`
2. `email`
3. `phone`
4. `preferred_language`
5. `required_service`
6. `details`
7. `contact_consent`
8. `privacy_consent`

La adaptación al contrato existente se realiza en cliente: `required_service` se envía como `requested_service`, `details` como `message` y `privacy_consent` como `consent_data_processing`. Se mantienen `source: website`, `consent_marketing: false`, CSRF y el honeypot técnico existente. No se modificaron modelos, endpoints, permisos, contratos, base de datos ni infraestructura.

## Responsive

Playwright validó 320, 390, 768, 1024 y 1440 px con el mismo contenido. Todos los viewports pasan sin overflow horizontal, clipping crítico o selects truncados. La navegación cambia a drawer móvil; el timeline pasa a vertical y las listas conservan jerarquía editorial.

Capturas:

- `docs/design/evidence/react-public-home/desktop-1440.png`
- `docs/design/evidence/react-public-home/desktop-1024.png`
- `docs/design/evidence/react-public-home/tablet-768.png`
- `docs/design/evidence/react-public-home/mobile-390.png`
- `docs/design/evidence/react-public-home/mobile-320.png`

## Accesibilidad

- Un único H1 y jerarquía H2/H3 coherente.
- Landmarks, skip link y foco visible.
- Targets interactivos mínimos de 44 × 44 px.
- Menú móvil con `aria-expanded`, `aria-controls`, `hidden`, Escape, cierre por enlace, bloqueo de scroll y retorno de foco.
- Labels persistentes y errores asociados.
- `ErrorSummary` enfocable, `role="alert"`, regiones `aria-live` y `aria-busy` durante envío.
- Estados loading, error y success cubiertos.
- Acordeones exclusivos con operación por teclado.
- `prefers-reduced-motion` validado.
- Tokens de color y estados implementados conforme al contrato WCAG 2.2 AA.

La estructura y las interacciones automatizadas quedan aprobadas. Como control humano complementario siguen recomendándose una pasada con lector de pantalla real y revisión de zoom alto antes de producción.

## Pruebas finales

- `npm run lint`: aprobado.
- `npm test -- --run`: 7 archivos, 31 pruebas aprobadas.
- `npm run build`: aprobado; bundle JS 292.11 kB, gzip 85.13 kB.
- `npm run test:e2e`: 18 aprobadas, 18 omitidas por la matriz deliberada de proyectos, 0 fallidas.
- Regresión aislada de agenda administrativa móvil: aprobada.

Las pruebas nuevas verifican H1 único, 13 regiones en orden, copy aprobado, menú móvil, Escape, retorno de foco, selector, FAQ, ocho controles, consentimientos, resumen de errores, loading, error, success, reduced motion y ausencia de overflow/clipping en los cinco viewports.

## Figma

- Archivo: [Pacífica Cleaning — Diseño de Producto](https://www.figma.com/design/6JSvBXNpVW1a4TfkMZW3I6)
- Frame `1:2`: `P01 — Home Pública Desktop 1440`, 1440 × 6756.
- Frame `2:2`: `P01 — Home Pública Móvil 390`, 390 × 8076.
- Método: captura code-to-canvas de la UI React local en ejecución.
- Resultado: capas editables, una sola página y exactamente dos frames superiores; sin frame 320, pruebas o duplicados.

Los metadatos y screenshots del MCP se revisaron después de la captura. Figma no se utilizó para modificar automáticamente el frontend.

El 21 de julio se intentó sincronizar nuevamente ambos frames después del ajuste final de alineación y validación del formulario. Figma bloqueó las dos capturas antes de crear nodos por el límite de llamadas MCP del plan Starter; los frames existentes permanecieron intactos y no se generaron duplicados.

## Contenido pendiente y riesgos

- Permanecen intencionalmente los marcadores aprobados: activos fotográficos por producir, contenido, testimonio, métrica y certificación por validar.
- No existe traducción pública inglesa aprobada. El control ES/EN conserva el estado de idioma y metadatos, pero no inventa copy inglés.
- Fraunces y Manrope están declaradas en la pila tipográfica; el repositorio no incluye binarios web locales, por lo que el render depende de disponibilidad del sistema y sus fallbacks hasta que se aprueben y suministren los activos tipográficos.
- La revisión manual final con tecnologías asistivas y los activos de contenido reales debe ocurrir antes del deploy.

## Seguridad y Git

- Rama creada desde el estado actual: `feat/public-experience-redesign`.
- Pacífica Realty: sin cambios.
- Backend, permisos, base de datos e infraestructura: sin cambios.
- Merge: cero.
- Push: cero.
- Deploy: cero.
- Cierre Git: un único commit local, sin publicación remota.
