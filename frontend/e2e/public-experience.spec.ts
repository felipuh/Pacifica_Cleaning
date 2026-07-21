import { expect, test } from "@playwright/test";

const viewports = [
  { width: 320, height: 800, file: "mobile-320.png" },
  { width: 390, height: 844, file: "mobile-390.png" },
  { width: 768, height: 1024, file: "tablet-768.png" },
  { width: 1024, height: 900, file: "desktop-1024.png" },
  { width: 1440, height: 1000, file: "desktop-1440.png" },
] as const;

test.describe("P01 public experience", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "A single Chromium project validates the five canonical viewports");
    await page.goto("/");
  });

  test("has the canonical structure, controls and approved content", async ({ page }) => {
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h2")).toHaveCount(10);
    await expect(page.locator("[data-public-region]")).toHaveCount(13);
    await expect(page.locator('form [name]:not([name="website"])')).toHaveCount(8);
    await expect(page.getByRole("button", { name: "¿Enviar la solicitud confirma el servicio?" })).toBeVisible();
    await expect(page.getByText("© 2026 Pacífica Cleaning · Guanacaste, Costa Rica")).toBeVisible();
  });

  test("mobile navigation handles Escape, link close and focus return", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const trigger = page.getByRole("button", { name: "Abrir menú" });
    await trigger.click();
    await expect(page.locator("#mobile-navigation")).toBeVisible();
    await expect(page.getByRole("link", { name: "Hogares" }).last()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator("#mobile-navigation")).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.locator("#mobile-navigation").getByRole("link", { name: "Cobertura" }).click();
    await expect(page.locator("#mobile-navigation")).toBeHidden();
  });

  test("need selector and FAQ permit one open panel at a time", async ({ page }) => {
    const home = page.getByRole("button", { name: "Mi hogar" });
    const reservation = page.getByRole("button", { name: "Entre reservas" });
    await reservation.click();
    await expect(home).toHaveAttribute("aria-expanded", "false");
    await expect(reservation).toHaveAttribute("aria-expanded", "true");
    const faqOne = page.getByRole("button", { name: "¿Enviar la solicitud confirma el servicio?" });
    const faqTwo = page.getByRole("button", { name: "¿Atienden hogares y propiedades vacacionales?" });
    await faqTwo.click();
    await expect(faqOne).toHaveAttribute("aria-expanded", "false");
    await expect(faqTwo).toHaveAttribute("aria-expanded", "true");
  });

  test("invalid form focuses its error summary", async ({ page }) => {
    await page.getByRole("button", { name: "Enviar solicitud" }).click();
    const summary = page.locator(".error-summary");
    await expect(summary).toBeFocused();
    await expect(summary).toContainText("Debe aceptar el tratamiento de datos para enviar la solicitud.");
    const contactError = page.locator("#contact-method-error");
    await expect(contactError).toHaveCount(1);
    await expect(contactError).toHaveText("Ingresa al menos un correo electrónico o un teléfono.");
    await expect(contactError).toHaveAttribute("role", "alert");
    await expect(page.getByLabel("Correo electrónico")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Teléfono")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Correo electrónico")).toHaveAttribute("aria-describedby", "contact-method-error");
    await expect(page.getByLabel("Teléfono")).toHaveAttribute("aria-describedby", "contact-method-error");
  });

  test("contact validation clears with a valid email or phone and keeps specific invalid errors", async ({ page }) => {
    const email = page.getByLabel("Correo electrónico");
    const phone = page.getByLabel("Teléfono");
    await expect(page.locator("#contact-method-error")).toHaveCount(0);
    await page.getByRole("button", { name: "Enviar solicitud" }).click();
    await expect(page.locator("#contact-method-error")).toHaveCount(1);
    await email.fill("cliente@example.com");
    await expect(page.locator("#contact-method-error")).toHaveCount(0);
    await email.fill("");
    await page.getByRole("button", { name: "Enviar solicitud" }).click();
    await phone.fill("+506 8888-8888");
    await expect(page.locator("#contact-method-error")).toHaveCount(0);
    await email.fill("correo-invalido");
    await email.blur();
    await expect(page.locator("#email-error")).toBeVisible();
    await phone.fill("123");
    await phone.blur();
    await expect(page.locator("#phone-error")).toBeVisible();
  });

  test("supports reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    const duration = await page.locator(".accordion__item svg").first().evaluate((node) => getComputedStyle(node).transitionDuration);
    expect(["0s", "0.00001s", "1e-05s"]).toContain(duration);
  });

  for (const viewport of viewports) {
    test(`${viewport.width}px has no horizontal overflow, clipping or hidden content`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.reload();
      const metrics = await page.evaluate(() => {
        const width = document.documentElement.clientWidth;
        const isClipped = (element: HTMLElement) => {
          if (element.closest(".honeypot") || element.hidden || getComputedStyle(element).display === "none") return false;
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && (rect.right > width + 1 || rect.left < -1);
        };
        return {
          overflow: document.documentElement.scrollWidth > width,
          h1: document.querySelectorAll("h1").length,
          clippedControls: Array.from(document.querySelectorAll<HTMLElement>("input, select, textarea, button, a")).filter(isClipped).length,
          offenders: Array.from(document.querySelectorAll<HTMLElement>("body *")).filter(isClipped).map((node) => `${node.tagName}.${node.className}`).slice(0, 12),
        };
      });
      expect(metrics, JSON.stringify(metrics.offenders)).toEqual({ overflow: false, h1: 1, clippedControls: 0, offenders: [] });
      await expect(page.getByLabel("Idioma preferido")).toBeVisible();
      await expect(page.getByLabel("Servicio que necesita")).toBeVisible();
      if (viewport.width >= 768) {
        const topEdges = await page.locator("#full_name, #email, #phone, #preferred_language").evaluateAll((controls) =>
          controls.map((control) => Math.round(control.getBoundingClientRect().top)),
        );
        expect(topEdges[0]).toBe(topEdges[1]);
        expect(topEdges[2]).toBe(topEdges[3]);
      }
      await page.screenshot({ path: `../docs/design/evidence/react-public-home/${viewport.file}`, fullPage: true });
    });
  }
});
