import { describe, expect, it } from "vitest";
import { pathForView, publicSectionHref, viewFromPath } from "./routing";

describe("routing", () => {
  it("matches only the supported application route boundaries", () => {
    expect(viewFromPath("/app")).toBe("admin");
    expect(viewFromPath("/app/leads")).toBe("admin");
    expect(viewFromPath("/application")).toBe("not-found");
    expect(viewFromPath("/legal/privacy")).toBe("policies");
    expect(viewFromPath("/legalese")).toBe("not-found");
  });

  it("builds canonical view and public section URLs", () => {
    expect(pathForView("admin")).toBe("/app");
    expect(pathForView("policies")).toBe("/legal");
    expect(publicSectionHref("servicios")).toBe("/#servicios");
    expect(publicSectionHref("servicios", "en")).toBe("/?lang=en#servicios");
  });
});
