import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { faqs, processSteps, services } from "../content";

describe("public experience", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.history.replaceState({}, "", "/");
  });

  it("renders one H1, ten principal H2 and the 13 ordered regions", () => {
    render(<App />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(10);
    const regions = Array.from(document.querySelectorAll("[data-public-region]")).map((node) => node.getAttribute("data-public-region"));
    expect(regions).toEqual([
      "header", "hero", "selector-de-necesidad", "metodo-de-trabajo", "propiedades-vacacionales", "servicios",
      "evidencia", "confianza", "cobertura", "formulario", "faq", "cta-final", "footer",
    ]);
  });

  it("keeps approved process, services and FAQ copy intact", () => {
    render(<App />);
    processSteps.forEach((copy) => expect(screen.getByText(copy)).toBeInTheDocument());
    services.forEach((copy) => expect(screen.getAllByText(copy).length).toBeGreaterThan(0));
    faqs.forEach(({ question, answer }) => {
      expect(screen.getByRole("button", { name: question })).toBeInTheDocument();
      expect(screen.getByText(answer)).toBeInTheDocument();
    });
  });

  it("opens and closes mobile navigation with Escape and restores focus", async () => {
    render(<App />);
    const trigger = screen.getByRole("button", { name: "Abrir menú" });
    fireEvent.click(trigger);
    const panel = document.getElementById("mobile-navigation") as HTMLElement;
    expect(panel).not.toHaveAttribute("hidden");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(document.activeElement).toBe(within(panel).getByRole("link", { name: "Hogares" }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(panel).toHaveAttribute("hidden");
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("keeps only one need and one FAQ panel open per group", () => {
    render(<App />);
    const home = screen.getByRole("button", { name: "Mi hogar" });
    const reservations = screen.getByRole("button", { name: "Entre reservas" });
    expect(home).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(reservations);
    expect(home).toHaveAttribute("aria-expanded", "false");
    expect(reservations).toHaveAttribute("aria-expanded", "true");

    const firstFaq = screen.getByRole("button", { name: faqs[0].question });
    const secondFaq = screen.getByRole("button", { name: faqs[1].question });
    fireEvent.click(secondFaq);
    expect(firstFaq).toHaveAttribute("aria-expanded", "false");
    expect(secondFaq).toHaveAttribute("aria-expanded", "true");
  });

  it("exposes exactly the eight approved visible controls and both consent names", () => {
    render(<App />);
    const form = document.querySelector("form.quote-form") as HTMLFormElement;
    const names = Array.from(form.elements)
      .map((element) => (element as HTMLInputElement).name)
      .filter((name) => name && name !== "website");
    expect(names).toEqual([
      "full_name", "email", "phone", "preferred_language", "required_service", "details", "contact_consent", "privacy_consent",
    ]);
    expect(screen.getByRole("checkbox", { name: /Autorizo que me contacten/ })).toBeRequired();
    expect(screen.getByRole("checkbox", { name: /Acepto el tratamiento de mis datos/ })).toBeRequired();
  });

  it("focuses the error summary after invalid submission", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }));
    const summary = document.querySelector(".error-summary") as HTMLElement;
    await waitFor(() => expect(summary).toHaveFocus());
    expect(summary).toHaveFocus();
    expect(summary).toHaveTextContent("Debe aceptar el tratamiento de datos para enviar la solicitud.");
  });

  it("shows one shared contact error only after validation and clears it with either valid contact", () => {
    render(<App />);
    const email = screen.getByLabelText("Correo electrónico");
    const phone = screen.getByLabelText("Teléfono");
    expect(document.getElementById("contact-method-error")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }));
    const contactErrors = screen.getAllByText("Ingresa al menos un correo electrónico o un teléfono.");
    expect(contactErrors).toHaveLength(1);
    expect(contactErrors[0]).toHaveAttribute("id", "contact-method-error");
    expect(contactErrors[0]).toHaveAttribute("role", "alert");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(phone).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAttribute("aria-describedby", "contact-method-error");
    expect(phone).toHaveAttribute("aria-describedby", "contact-method-error");

    fireEvent.change(email, { target: { value: "cliente@example.com" } });
    expect(document.getElementById("contact-method-error")).not.toBeInTheDocument();
    expect(email).toHaveAttribute("aria-invalid", "false");
    expect(phone).toHaveAttribute("aria-invalid", "false");

    fireEvent.change(email, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }));
    fireEvent.change(phone, { target: { value: "+506 8888-8888" } });
    expect(document.getElementById("contact-method-error")).not.toBeInTheDocument();
    expect(email).toHaveAttribute("aria-invalid", "false");
    expect(phone).toHaveAttribute("aria-invalid", "false");
  });

  it("keeps field-specific contact errors below their controls", () => {
    render(<App />);
    const email = screen.getByLabelText("Correo electrónico");
    const phone = screen.getByLabelText("Teléfono");
    fireEvent.change(email, { target: { value: "correo-invalido" } });
    fireEvent.blur(email);
    fireEvent.change(phone, { target: { value: "123" } });
    fireEvent.blur(phone);

    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAttribute("aria-describedby", "email-error");
    expect(document.getElementById("email-error")).toHaveTextContent("Ingresa un correo electrónico válido.");
    expect(phone).toHaveAttribute("aria-invalid", "true");
    expect(phone).toHaveAttribute("aria-describedby", "phone-error");
    expect(document.getElementById("phone-error")).toHaveTextContent("Ingresa un teléfono válido.");
  });

  it("announces loading and success while preserving the backend contract", async () => {
    let resolveCsrf!: (response: Response) => void;
    const csrfResponse = new Promise<Response>((resolve) => { resolveCsrf = resolve; });
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => csrfResponse)
      .mockResolvedValueOnce(Response.json({ id: "lead-public" }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    fireEvent.change(screen.getByLabelText("Nombre completo"), { target: { value: "Solicitud pública" } });
    fireEvent.change(screen.getByLabelText("Teléfono"), { target: { value: "80000000" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /Autorizo que me contacten/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Acepto el tratamiento de mis datos/ }));
    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }));
    expect(screen.getByText("Enviando solicitud…")).toBeInTheDocument();
    resolveCsrf(Response.json({ csrfToken: "csrf" }));
    expect(await screen.findByText(/Recibimos su solicitud/)).toHaveAttribute("role", "status");
    const request = fetchMock.mock.calls[1];
    expect(JSON.parse(request[1].body)).toMatchObject({
      full_name: "Solicitud pública", phone: "80000000", consent_data_processing: true, consent_marketing: false, source: "website",
    });
  });

  it("announces a recoverable API error", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith("/api/auth/csrf/")) return Response.json({ csrfToken: "csrf" });
      return Response.json({ detail: "Unavailable" }, { status: 503 });
    }));
    render(<App />);
    fireEvent.change(screen.getByLabelText("Nombre completo"), { target: { value: "Solicitud pública" } });
    fireEvent.change(screen.getByLabelText("Teléfono"), { target: { value: "80000000" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /Autorizo que me contacten/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Acepto el tratamiento de mis datos/ }));
    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }));
    expect(await screen.findByText(/No pudimos enviar la solicitud/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Intentar nuevamente" })).toBeInTheDocument();
  });
});
