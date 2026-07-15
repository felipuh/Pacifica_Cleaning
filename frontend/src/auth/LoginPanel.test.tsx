import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginPanel } from "./LoginPanel";

afterEach(() => vi.restoreAllMocks());

describe("LoginPanel MFA", () => {
  it("completes the second-factor challenge in the UI", async () => {
    const onLogin = vi.fn();
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/api/auth/csrf/")) return Response.json({ csrfToken: "test-csrf" });
      if (url.endsWith("/api/auth/login/")) return Response.json({ mfaRequired: true });
      if (url.endsWith("/api/auth/mfa/verify/")) {
        expect(init?.body).toBe(JSON.stringify({ code: "123456" }));
        return Response.json({ id: "user-1", email: "admin@example.test", first_name: "Ada", last_name: "Admin", role: "superadmin" });
      }
      return new Response(null, { status: 404 });
    });

    render(<LoginPanel onLogin={onLogin} />);
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "admin@example.test" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "Safe-Test-Password-123" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    const code = await screen.findByLabelText("Código de verificación");
    fireEvent.change(code, { target: { value: "123 456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith(expect.objectContaining({ role: "superadmin" })));
  });
});
