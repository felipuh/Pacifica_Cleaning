import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders public Pacifica Cleaning landing", () => {
    render(<App />);
    expect(screen.getAllByText("PACÍFICA")[0]).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /limpieza profesional para hogares/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /solicitar cotización/i })).toBeInTheDocument();
  });
});
