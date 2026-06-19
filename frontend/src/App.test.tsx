import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders public Pacifica Cleaning landing", () => {
    render(<App />);
    expect(screen.getAllByText("Pacifica Cleaning")[0]).toBeInTheDocument();
    expect(screen.getByText("Solicitar cotizacion")).toBeInTheDocument();
  });
});
