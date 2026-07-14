import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  afterEach(cleanup);

  it("navigates pages and exposes correct disabled states", () => {
    const onChange = vi.fn();
    render(<Pagination state={{ page: 1, pageSize: 10, count: 24 }} onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Página siguiente" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(onChange).toHaveBeenCalledWith(2, 10);
  });

  it("changes page size and handles empty results", () => {
    const onChange = vi.fn();
    render(<Pagination state={{ page: 1, pageSize: 25, count: 0 }} onChange={onChange} />);
    expect(screen.getByText(/0 registros/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Página siguiente" })).toBeDisabled();
    fireEvent.change(screen.getByRole("combobox", { name: "Registros por página" }), { target: { value: "50" } });
    expect(onChange).toHaveBeenCalledWith(1, 50);
  });
});
