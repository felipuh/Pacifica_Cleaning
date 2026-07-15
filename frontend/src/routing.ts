export type View = "public" | "admin" | "policies" | "not-found";

export function viewFromPath(path: string): View {
  if (path === "/") return "public";
  if (path === "/app" || path.startsWith("/app/")) return "admin";
  if (path === "/legal" || path.startsWith("/legal/")) return "policies";
  return "not-found";
}

export function pathForView(view: View): string {
  if (view === "admin") return "/app";
  if (view === "policies") return "/legal";
  return "/";
}

export function publicSectionHref(section: string, language: "es" | "en" = "es"): string {
  return language === "en" ? `/?lang=en#${section}` : `/#${section}`;
}
