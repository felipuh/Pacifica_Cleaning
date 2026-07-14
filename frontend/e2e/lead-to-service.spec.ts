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
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page.getByRole("heading", { name: "Portal administrativo" })).toBeVisible();
});

test("mobile public view has no horizontal overflow", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile project only");
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await expect(page.getByRole("heading", { name: /Limpieza profesional/ })).toBeVisible();
});
