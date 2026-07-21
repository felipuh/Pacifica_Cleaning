import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

describe("App", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders public Pacifica Cleaning landing", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState({}, "", "/");
    render(<App />);
    expect(screen.getAllByText("PACÍFICA CLEANING")[0]).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cada espacio listo. Cada coordinación bajo control." })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /solicitar cotización/i })[0]).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads the protected portal route directly", () => {
    window.history.replaceState({}, "", "/app");
    render(<App />);

    expect(screen.getByRole("heading", { name: /portal administrativo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /navegación principal/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Correo")).toHaveValue("");
  });

  it("uses root-qualified links for public sections", () => {
    window.history.replaceState({}, "", "/legal");
    render(<App />);

    expect(screen.getByRole("link", { name: "Hogares" })).toHaveAttribute("href", "/#necesidades");
    expect(screen.getByRole("link", { name: "Cobertura" })).toHaveAttribute("href", "/#cobertura");
  });

  it("renders the public experience in English and updates SEO metadata", async () => {
    window.history.replaceState({}, "", "/?lang=en");
    render(<App />);

    expect(screen.getByRole("heading", { name: "Cada espacio listo. Cada coordinación bajo control." })).toBeInTheDocument();
    await waitFor(() => expect(document.documentElement).toHaveAttribute("lang", "en"));
    expect(document.title).toMatch(/Professional cleaning in Guanacaste/);
    expect(document.querySelector('link[rel="alternate"][hreflang="es"]')).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /idioma actual: inglés/i }));
    expect(screen.getByRole("heading", { name: "Cada espacio listo. Cada coordinación bajo control." })).toBeInTheDocument();
    expect(window.location.search).toBe("");
  });

  it("creates an operational lead through the real API contract", async () => {
    const requests: Array<{ url: string; method: string }> = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      requests.push({ url, method });
      if (url.endsWith("/api/auth/me/")) return Response.json({ id: "user-1", email: "sales@example.test", first_name: "", last_name: "", role: "sales" });
      if (url.endsWith("/api/auth/csrf/")) return Response.json({ csrfToken: "test-csrf" });
      if (url.endsWith("/api/v1/dashboard/")) return Response.json({ leads_new: 0, leads_pending: 0, quotes_pending: 0, quotes_sent: 0, quotes_accepted: 0, services_upcoming: 0, services_completed: 0, recurrent_customers: 0, estimated_revenue: "0", confirmed_revenue: "0", conversion_rate: 0, recent_activity: [] });
      if (url.endsWith("/api/v1/leads/") && method === "POST") return Response.json({ id: "lead-1", full_name: "Lead operativo" }, { status: 201 });
      if (url.includes("/api/v1/")) return Response.json({ count: 0, results: [] });
      return Response.json({ detail: "Not found" }, { status: 404 });
    }));
    window.history.replaceState({}, "", "/app");
    render(<App />);

    await screen.findByRole("heading", { name: /panel administrativo/i });
    fireEvent.click(screen.getByRole("button", { name: /Leads/ }));
    fireEvent.click(screen.getByRole("button", { name: "Nuevo" }));
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Lead operativo" } });
    fireEvent.change(screen.getByLabelText("Teléfono"), { target: { value: "8000-3000" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(requests.some((item) => item.url.endsWith("/api/v1/leads/") && item.method === "POST")).toBe(true));
    expect(await screen.findByText("Registro creado.")).toBeInTheDocument();
  });

  it("shows the dashboard as its own menu view", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/auth/me/")) return Response.json({ id: "user-1", email: "ops@example.test", first_name: "Ops", last_name: "Test", role: "operations" });
      if (url.endsWith("/api/v1/users/eligible-lead-assignees/")) return Response.json([]);
      if (url.endsWith("/api/v1/dashboard/")) return Response.json({ leads_new: 3, leads_pending: 2, quotes_pending: 1, quotes_sent: 0, quotes_accepted: 0, services_upcoming: 4, services_completed: 0, recurrent_customers: 0, estimated_revenue: "0", confirmed_revenue: "0", conversion_rate: 0, recent_activity: [] });
      if (url.endsWith("/api/v1/leads/")) return Response.json({ count: 2, next: null, previous: null, results: [{ id: "lead-1", full_name: "Nuevo lead", phone: "8000-1000", status: "new" }, { id: "lead-2", full_name: "Lead listo", phone: "8000-2000", status: "qualified" }] });
      return Response.json({ count: 0, next: null, previous: null, results: [] });
    }));
    window.history.replaceState({}, "", "/app");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Estado del negocio" })).toBeInTheDocument();
    expect(await screen.findByText("3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Leads/ }));
    expect(window.location.pathname).toBe("/app/leads");
    expect(screen.getByRole("heading", { name: "Leads" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Estado del negocio" })).not.toBeInTheDocument();
    expect(screen.queryByText("Leads nuevos")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Resumen/ }));
    expect(window.location.pathname).toBe("/app");
    expect(screen.getByRole("heading", { name: "Estado del negocio" })).toBeInTheDocument();
  });

  it("loads only the requested module on a direct admin URL", async () => {
    const urls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url.endsWith("/api/auth/me/")) return Response.json({ id: "user-1", email: "sales@example.test", first_name: "", last_name: "", role: "sales" });
      if (url.endsWith("/api/v1/users/eligible-lead-assignees/")) return Response.json([]);
      if (url.endsWith("/api/v1/dashboard/")) return Response.json({ leads_new: 0, leads_pending: 0, quotes_pending: 0, quotes_sent: 0, quotes_accepted: 0, services_upcoming: 0, services_completed: 0, recurrent_customers: 0, estimated_revenue: "0", confirmed_revenue: "0", conversion_rate: 0, recent_activity: [] });
      if (url.endsWith("/api/v1/leads/")) return Response.json({ count: 2, next: null, previous: null, results: [{ id: "lead-1", full_name: "Nuevo lead", phone: "8000-1000", status: "new" }, { id: "lead-2", full_name: "Lead listo", phone: "8000-2000", status: "qualified" }] });
      return Response.json({ count: 0, next: null, previous: null, results: [] });
    }));
    window.history.replaceState({}, "", "/app/leads");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Leads" })).toBeInTheDocument();
    await waitFor(() => expect(urls.some((url) => url.endsWith("/api/v1/leads/"))).toBe(true));
    expect(screen.getByRole("combobox", { name: "Estado" })).toHaveDisplayValue("Todos");
    expect(screen.getByText("Calificados").previousSibling).toHaveTextContent("1");
    expect(urls.some((url) => url.endsWith("/api/v1/customers/"))).toBe(false);
    expect(urls.some((url) => url.endsWith("/api/v1/quotes/"))).toBe(false);
    expect(urls.some((url) => url.endsWith("/api/v1/work-orders/"))).toBe(false);
  });

  it("queries the weekly agenda with persisted operational filters", async () => {
    const urls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url.endsWith("/api/auth/me/")) return Response.json({ id: "user-1", email: "ops@example.test", first_name: "Ops", last_name: "Test", role: "operations" });
      if (url.endsWith("/api/v1/users/eligible-lead-assignees/")) return Response.json([]);
      if (url.endsWith("/api/v1/dashboard/")) return Response.json({ leads_new: 0, leads_pending: 0, quotes_pending: 0, quotes_sent: 0, quotes_accepted: 0, services_upcoming: 0, services_completed: 0, recurrent_customers: 0, estimated_revenue: "0", confirmed_revenue: "0", conversion_rate: 0, recent_activity: [] });
      return Response.json({ count: 0, next: null, previous: null, results: [] });
    }));
    window.history.replaceState({}, "", "/app");
    render(<App />);
    await screen.findByRole("heading", { name: /panel administrativo/i });
    fireEvent.click(screen.getByRole("button", { name: /Agenda/ }));
    expect(screen.queryByLabelText("Buscar")).not.toBeInTheDocument();
    expect(screen.queryByRole("table", { name: /Listado de Agenda/i })).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "Semana" }));
    fireEvent.change(screen.getByLabelText("Estado", { selector: "select" }), { target: { value: "confirmed" } });
    await waitFor(() => expect(urls.some((url) => url.includes("work-orders/?") && url.includes("status=confirmed") && url.includes("date_from=") && url.includes("date_to="))).toBe(true));
  });

  it("allows finance users to create payments without exposing unrelated editors", async () => {
    const requests: Array<{ url: string; method: string; body?: string }> = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      requests.push({ url, method, body: typeof init?.body === "string" ? init.body : undefined });
      if (url.endsWith("/api/auth/me/")) return Response.json({ id: "finance-1", email: "finance@example.test", first_name: "", last_name: "", role: "finance" });
      if (url.endsWith("/api/auth/csrf/")) return Response.json({ csrfToken: "test-csrf" });
      if (url.endsWith("/api/v1/dashboard/")) return Response.json({ leads_new: 0, leads_pending: 0, quotes_pending: 0, quotes_sent: 0, quotes_accepted: 0, services_upcoming: 0, services_completed: 0, recurrent_customers: 0, estimated_revenue: "0", confirmed_revenue: "0", conversion_rate: 0, recent_activity: [] });
      if (url.endsWith("/api/v1/customers/")) return Response.json({ count: 1, next: null, previous: null, results: [{ id: "customer-1", display_name: "Cliente Uno" }] });
      if (url.endsWith("/api/v1/payments/") && method === "POST") return Response.json({ id: "payment-1" }, { status: 201 });
      return Response.json({ count: 0, next: null, previous: null, results: [] });
    }));
    window.history.replaceState({}, "", "/app");
    render(<App />);

    await screen.findByRole("heading", { name: /panel administrativo/i });
    fireEvent.click(screen.getByRole("button", { name: /Servicios/ }));
    expect(screen.queryByRole("button", { name: "Nuevo" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Finanzas/ }));
    fireEvent.click(screen.getByRole("button", { name: "Nuevo" }));
    await screen.findByRole("option", { name: "Cliente Uno" });
    fireEvent.change(screen.getByLabelText("Cliente"), { target: { value: "customer-1" } });
    fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "25000" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(requests.some((request) => request.url.endsWith("/api/v1/payments/") && request.method === "POST")).toBe(true));
    const request = requests.find((item) => item.url.endsWith("/api/v1/payments/") && item.method === "POST");
    expect(JSON.parse(request?.body ?? "{}")).toMatchObject({ customer: "customer-1", amount: "25000", currency: "CRC", method: "sinpe" });
  });

  it("registers inventory changes through stock movements", async () => {
    const requests: Array<{ url: string; method: string; body?: string }> = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      requests.push({ url, method, body: typeof init?.body === "string" ? init.body : undefined });
      if (url.endsWith("/api/auth/me/")) return Response.json({ id: "ops-1", email: "ops@example.test", first_name: "", last_name: "", role: "operations" });
      if (url.endsWith("/api/auth/csrf/")) return Response.json({ csrfToken: "test-csrf" });
      if (url.endsWith("/api/v1/dashboard/")) return Response.json({ leads_new: 0, leads_pending: 0, quotes_pending: 0, quotes_sent: 0, quotes_accepted: 0, services_upcoming: 0, services_completed: 0, recurrent_customers: 0, estimated_revenue: "0", confirmed_revenue: "0", conversion_rate: 0, recent_activity: [] });
      if (url.endsWith("/api/v1/inventory-items/")) return Response.json({ count: 1, next: null, previous: null, results: [{ id: "item-1", name: "Desinfectante", category: "insumos", unit: "litro", stock_on_hand: "4", minimum_stock: "2", unit_cost: "3000", below_minimum: false }] });
      if (url.endsWith("/api/v1/stock-movements/") && method === "POST") return Response.json({ id: "movement-1" }, { status: 201 });
      return Response.json({ count: 0, next: null, previous: null, results: [] });
    }));
    window.history.replaceState({}, "", "/app/inventory-items");
    render(<App />);

    await screen.findByText("Desinfectante");
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Cantidad"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar movimiento" }));

    await waitFor(() => expect(requests.some((request) => request.url.endsWith("/api/v1/stock-movements/") && request.method === "POST")).toBe(true));
    const request = requests.find((item) => item.url.endsWith("/api/v1/stock-movements/") && item.method === "POST");
    expect(JSON.parse(request?.body ?? "{}")).toMatchObject({ item: "item-1", movement_type: "in", quantity: "3" });
  });

  it("allows sales users to manage campaigns but not notification templates", async () => {
    const requests: Array<{ url: string; method: string; body?: string }> = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      requests.push({ url, method, body: typeof init?.body === "string" ? init.body : undefined });
      if (url.endsWith("/api/auth/me/")) return Response.json({ id: "sales-1", email: "sales@example.test", first_name: "", last_name: "", role: "sales" });
      if (url.endsWith("/api/auth/csrf/")) return Response.json({ csrfToken: "test-csrf" });
      if (url.endsWith("/api/v1/dashboard/")) return Response.json({ leads_new: 0, leads_pending: 0, quotes_pending: 0, quotes_sent: 0, quotes_accepted: 0, services_upcoming: 0, services_completed: 0, recurrent_customers: 0, estimated_revenue: "0", confirmed_revenue: "0", conversion_rate: 0, recent_activity: [] });
      if (url.endsWith("/api/v1/campaigns/") && method === "POST") return Response.json({ id: "campaign-1" }, { status: 201 });
      return Response.json({ count: 0, next: null, previous: null, results: [] });
    }));
    window.history.replaceState({}, "", "/app");
    render(<App />);

    await screen.findByRole("heading", { name: /panel administrativo/i });
    fireEvent.click(screen.getByRole("button", { name: /Plantillas/ }));
    expect(screen.queryByRole("button", { name: "Nuevo" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Campañas/ }));
    fireEvent.click(screen.getByRole("button", { name: "Nuevo" }));
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Temporada verde" } });
    fireEvent.change(screen.getByLabelText("Canal"), { target: { value: "email" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(requests.some((request) => request.url.endsWith("/api/v1/campaigns/") && request.method === "POST")).toBe(true));
    const request = requests.find((item) => item.url.endsWith("/api/v1/campaigns/") && item.method === "POST");
    expect(JSON.parse(request?.body ?? "{}")).toMatchObject({ name: "Temporada verde", channel: "email", consent_required: true });
  });
});
