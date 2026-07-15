import { describe, expect, it } from "vitest";
import { adminSectionFromPath, pathForAdminSection } from "./routing";

describe("admin routing", () => {
  it("resolves direct module URLs", () => {
    expect(adminSectionFromPath("/app")).toBe("dashboard");
    expect(adminSectionFromPath("/app/leads")).toBe("leads");
    expect(adminSectionFromPath("/app/campaigns")).toBe("campaigns");
    expect(adminSectionFromPath("/app/notification-templates")).toBe("notification-templates");
    expect(adminSectionFromPath("/app/work-orders/")).toBe("work-orders");
    expect(adminSectionFromPath("/app/unknown")).toBe("dashboard");
  });

  it("creates canonical admin URLs", () => {
    expect(pathForAdminSection("dashboard")).toBe("/app");
    expect(pathForAdminSection("quotes")).toBe("/app/quotes");
  });
});
