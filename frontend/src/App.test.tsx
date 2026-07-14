import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
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
});
