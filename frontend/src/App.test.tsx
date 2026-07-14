import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

describe("App", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders public Pacifica Cleaning landing", () => {
    window.history.replaceState({}, "", "/");
    render(<App />);
    expect(screen.getAllByText("PACÍFICA")[0]).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /limpieza profesional para hogares/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /solicitar cotización/i })).toBeInTheDocument();
  });

  it("loads the protected portal route directly", () => {
    window.history.replaceState({}, "", "/app");
    render(<App />);

    expect(screen.getByRole("heading", { name: /portal administrativo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: "Nuevo" }));
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Lead operativo" } });
    fireEvent.change(screen.getByLabelText("Teléfono"), { target: { value: "8000-3000" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(requests.some((item) => item.url.endsWith("/api/v1/leads/") && item.method === "POST")).toBe(true));
    expect(await screen.findByText("Registro creado.")).toBeInTheDocument();
  });
});
