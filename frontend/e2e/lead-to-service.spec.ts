import { expect, test } from "@playwright/test";

test("visitor lead becomes a completed scheduled service", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop project covers the full lifecycle");
  const suffix = Date.now().toString();
  const leadName = `Solicitud E2E ${suffix}`;
  const customerPhone = `8${suffix.slice(-7)}`;
  const propertyName = `Casa E2E ${suffix.slice(-5)}`;
  const serviceDate = new Date(Date.now() + 3 * 86_400_000);
  const date = serviceDate.toISOString().slice(0, 10);
  const start = `${date}T09:00`;
  const end = `${date}T11:00`;

  await page.goto("/");
  await page.getByLabel("Nombre").fill(leadName);
  await page.getByLabel("Correo").fill(`lead-${suffix}@example.test`);
  await page.getByLabel("Telefono").fill(customerPhone);
  await page.getByLabel(/Acepto el tratamiento de datos/).check();
  await page.getByRole("button", { name: "Enviar solicitud" }).click();
  await expect(page.getByText("Solicitud recibida.")).toBeVisible();

  await page.getByRole("button", { name: "Admin" }).click();
  await page.getByLabel("Correo").fill("admin@pacifica.local");
  await page.getByLabel("Contrasena").fill("E2E-Only-Password-12345");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Panel administrativo" })).toBeVisible();
  const leadRow = page.locator(".admin-table-row").filter({ hasText: leadName });
  await expect(leadRow).toBeVisible();
  await leadRow.getByRole("button", { name: "Editar" }).click();
  await page.getByRole("button", { name: "Convertir en cliente" }).click();
  await expect(page.getByText(/Acción convert completada/)).toBeVisible();

  await page.getByRole("button", { name: /Propiedades/ }).click();
  await page.getByRole("button", { name: "Nuevo" }).click();
  await page.getByLabel("Cliente").selectOption({ label: leadName });
  await page.getByLabel("Nombre").fill(propertyName);
  await page.getByLabel("Dirección").fill("Dirección de prueba, Tempate");
  await page.getByLabel("Zona").fill("Tempate");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Registro creado.")).toBeVisible();

  await page.getByRole("button", { name: /Cotizaciones/ }).click();
  await page.getByRole("button", { name: "Nuevo" }).click();
  await page.locator('select[name="quote_customer"]').selectOption({ label: leadName });
  await page.locator('select[name="quote_property"]').selectOption({ label: propertyName });
  await page.locator('select[name="quote_service"]').selectOption({ index: 1 });
  await page.getByLabel("Descripción").fill("Limpieza E2E");
  await page.getByLabel("Precio unitario").fill("25000");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Registro creado.")).toBeVisible();

  const quoteRow = page.locator(".admin-table-row").first();
  await quoteRow.getByRole("button", { name: "Editar" }).click();
  await page.getByRole("button", { name: "Marcar enviada" }).click();
  await quoteRow.getByRole("button", { name: "Editar" }).click();
  await page.getByRole("button", { name: "Aceptar" }).click();
  await quoteRow.getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("Inicio del servicio").fill(start);
  await page.getByLabel("Fin del servicio").fill(end);
  await page.getByRole("button", { name: "Crear servicio" }).click();

  await page.getByRole("button", { name: /Agenda/ }).click();
  await page.getByLabel("Fecha").fill(date);
  await page.getByRole("button", { name: "Confirmar" }).click();
  await page.getByRole("button", { name: "Iniciar" }).click();
  await page.getByRole("button", { name: "Finalizar" }).click();
  await expect(page.locator(".metric").filter({ hasText: "Servicios completados" }).getByText("1")).toBeVisible();
});

test("invalid login, denied API, network error and 404 are handled", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop project covers failure states");
  await page.goto("/app");
  await page.getByLabel("Correo").fill("missing@example.test");
  await page.getByLabel("Contrasena").fill("Invalid-Password-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText(/Credenciales invalidas/)).toBeVisible();

  await page.route("**/api/v1/leads/", (route) => route.abort("failed"));
  await page.goto("/");
  await page.getByLabel("Nombre").fill("Error de red E2E");
  await page.getByLabel("Telefono").fill("80009999");
  await page.getByLabel(/Acepto el tratamiento de datos/).check();
  await page.getByRole("button", { name: "Enviar solicitud" }).click();
  await expect(page.getByText(/No se pudo enviar/)).toBeVisible();
  await page.unroute("**/api/v1/leads/");
  await page.goto("/ruta-inexistente");
  await expect(page.getByRole("heading", { name: "Página no encontrada" })).toBeVisible();
});

test("expired session returns the operator to login", async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop project covers session expiry");
  await page.goto("/app");
  await page.getByLabel("Correo").fill("admin@pacifica.local");
  await page.getByLabel("Contrasena").fill("E2E-Only-Password-12345");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Panel administrativo" })).toBeVisible();
  await context.clearCookies();
  await page.getByRole("button", { name: "Aplicar filtros" }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByRole("heading", { name: "Portal administrativo" })).toBeVisible();
});

test("P1 pagination, assignments, rescheduling, weekly filters and history", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop project covers P1 mutations");
  await page.goto("/app");
  await page.getByLabel("Correo").fill("admin@pacifica.local");
  await page.getByLabel("Contrasena").fill("E2E-Only-Password-12345");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Panel administrativo" })).toBeVisible();

  const fixture = await page.evaluate(async () => {
    const csrf = await fetch("/api/auth/csrf/", { credentials: "include" }).then((response) => response.json()).then((data) => data.csrfToken as string);
    const headers = { "Content-Type": "application/json", "X-CSRFToken": csrf };
    for (let index = 0; index < 28; index += 1) {
      await fetch("/api/v1/leads/", { method: "POST", credentials: "include", headers, body: JSON.stringify({ full_name: `Paginación P1 ${index}`, phone: `7000${String(index).padStart(4, "0")}`, consent_data_processing: true }) });
    }
    const customers = await fetch("/api/v1/customers/?page_size=100", { credentials: "include" }).then((response) => response.json());
    const customer = customers.results[0] ?? await fetch("/api/v1/customers/", { method: "POST", credentials: "include", headers, body: JSON.stringify({ display_name: "Cliente P1 E2E", phone: "82220000", customer_type: "individual" }) }).then((response) => response.json());
    const properties = await fetch("/api/v1/properties/?page_size=100", { credentials: "include" }).then((response) => response.json());
    const property = properties.results[0] ?? await fetch("/api/v1/properties/", { method: "POST", credentials: "include", headers, body: JSON.stringify({ customer: customer.id, name: "Propiedad P1 E2E", address: "Tempate", zone: "Tempate", property_type: "home" }) }).then((response) => response.json());
    const worker = await fetch("/api/v1/workers/", { method: "POST", credentials: "include", headers, body: JSON.stringify({ full_name: "Personal P1 E2E", phone: "81110000", worker_type: "employee", status: "active" }) }).then((response) => response.json());
    const date = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10);
    const order = await fetch("/api/v1/work-orders/", { method: "POST", credentials: "include", headers, body: JSON.stringify({ customer: customer.id, property: property.id, scheduled_start: `${date}T09:00:00Z`, scheduled_end: `${date}T11:00:00Z`, price: "30000.00" }) }).then((response) => response.json());
    return { date, workerId: worker.id as string, orderId: order.id as string };
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Panel administrativo" })).toBeVisible();

  await page.getByRole("button", { name: /Leads/ }).click();
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page.getByText(/Página 1 de 2/)).toBeVisible();
  await page.getByRole("button", { name: "Página siguiente" }).click();
  await expect(page.getByText(/Página 2 de 2/)).toBeVisible();
  await page.getByLabel("Buscar").fill("Paginación P1 27");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page.getByText(/Página 1 de 1/)).toBeVisible();

  await page.getByRole("button", { name: /Agenda/ }).click();
  await page.getByLabel("Fecha").fill(fixture.date);
  await expect(page.getByText("Sin asignar")).toBeVisible();
  await page.getByRole("button", { name: "Asignar personal" }).click();
  await page.getByRole("checkbox", { name: "Personal P1 E2E" }).check();
  await page.getByRole("button", { name: "Confirmar asignación" }).click();
  await expect(page.getByText(/Personal: Personal P1 E2E/)).toBeVisible();
  await page.getByRole("button", { name: "Reprogramar" }).click();
  await page.getByLabel("Nuevo inicio").fill(`${fixture.date}T13:00`);
  await page.getByLabel("Nuevo fin").fill(`${fixture.date}T15:00`);
  await page.getByLabel("Motivo").fill("Ajuste operativo E2E");
  await page.getByRole("button", { name: "Confirmar reprogramación" }).click();
  await expect(page.getByText(/13:00|1:00 p. m./).first()).toBeVisible();
  await page.evaluate(async ({ orderId, workerId, date }) => {
    const csrf = await fetch("/api/auth/csrf/", { credentials: "include" }).then((response) => response.json()).then((data) => data.csrfToken as string);
    const order = await fetch(`/api/v1/work-orders/${orderId}/`, { credentials: "include" }).then((response) => response.json());
    await fetch("/api/v1/work-orders/", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", "X-CSRFToken": csrf }, body: JSON.stringify({ customer: order.customer, property: order.property, scheduled_start: `${date}T16:00:00-06:00`, scheduled_end: `${date}T18:00:00-06:00`, assignments: [{ worker: workerId, role: "Limpieza" }] }) });
  }, fixture);
  await page.getByRole("button", { name: "Reprogramar" }).click();
  await page.getByLabel("Nuevo inicio").fill(`${fixture.date}T16:30`);
  await page.getByLabel("Nuevo fin").fill(`${fixture.date}T17:30`);
  await page.getByLabel("Motivo").fill("Conflicto controlado E2E");
  await page.getByRole("button", { name: "Confirmar reprogramación" }).click();
  await expect(page.getByText(/conflicto de agenda/i)).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await page.getByRole("button", { name: "Semana" }).click();
  await page.locator(".agenda-toolbar").getByLabel("Estado").selectOption("planned");
  await page.locator(".agenda-toolbar").getByLabel("Personal").selectOption(fixture.workerId);
  await expect(page.locator(".agenda-card")).toHaveCount(2);
  await page.locator(".agenda-card").filter({ hasText: /13:00|1:00 p. m./ }).getByText(/Historial/).click();
  await expect(page.getByText(/Reprogramado/)).toBeVisible();
});

test("mobile public view has no horizontal overflow", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile project only");
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await expect(page.getByRole("heading", { name: /Limpieza profesional/ })).toBeVisible();
});

test("mobile weekly agenda has no critical horizontal overflow", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile project only");
  await page.goto("/app");
  await page.getByLabel("Correo").fill("admin@pacifica.local");
  await page.getByLabel("Contrasena").fill("E2E-Only-Password-12345");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByRole("button", { name: /Agenda/ }).evaluate((button: HTMLButtonElement) => button.click());
  await page.getByRole("button", { name: "Semana" }).evaluate((button: HTMLButtonElement) => button.click());
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
