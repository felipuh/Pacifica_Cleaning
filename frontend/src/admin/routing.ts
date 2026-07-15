import { adminModules, type AdminSection } from "./config";

const moduleKeys = new Set<AdminSection>(adminModules.map((module) => module.key));

export function adminSectionFromPath(path: string): AdminSection {
  if (path === "/app" || path === "/app/") return "dashboard";
  const section = path.replace(/^\/app\//, "").replace(/\/$/, "") as AdminSection;
  return moduleKeys.has(section) ? section : "dashboard";
}

export function pathForAdminSection(section: AdminSection): string {
  return section === "dashboard" ? "/app" : `/app/${section}`;
}
