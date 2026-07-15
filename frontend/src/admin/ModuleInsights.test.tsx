import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ModuleInsights } from "./ModuleInsights";

describe("ModuleInsights", () => {
  it("summarizes the visible lead pipeline", () => {
    render(<ModuleInsights module="leads" rows={[
      { id: "1", status: "new" },
      { id: "2", status: "new" },
      { id: "3", status: "qualified" },
      { id: "4", status: "won" }
    ]} />);

    expect(screen.getByText("Nuevos").previousSibling).toHaveTextContent("2");
    expect(screen.getByText("Calificados").previousSibling).toHaveTextContent("1");
    expect(screen.getByText("Convertidos").previousSibling).toHaveTextContent("1");
  });

  it("keeps payment totals separated by currency", () => {
    render(<ModuleInsights module="payments" rows={[
      { id: "1", amount: "10000", currency: "CRC", method: "sinpe" },
      { id: "2", amount: "25", currency: "USD", method: "cash" }
    ]} />);

    expect(screen.getByText("Total CRC")).toBeInTheDocument();
    expect(screen.getByText("Total USD")).toBeInTheDocument();
    expect(screen.getByText("Métodos utilizados").previousSibling).toHaveTextContent("2");
  });

  it("summarizes active notification templates", () => {
    render(<ModuleInsights module="notification-templates" rows={[
      { id: "1", active: true },
      { id: "2", active: true },
      { id: "3", active: false }
    ]} />);

    expect(screen.getByText("Activas").previousSibling).toHaveTextContent("2");
    expect(screen.getByText("Inactivas").previousSibling).toHaveTextContent("1");
  });
});
