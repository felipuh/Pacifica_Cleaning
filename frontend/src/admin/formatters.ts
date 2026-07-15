import type { ModuleKey } from "./config";

const valueLabels: Partial<Record<ModuleKey, Record<string, Record<string, string>>>> = {
  leads: { status: { new: "Nuevo", contacted: "Contactado", qualified: "Calificado", won: "Convertido", lost: "Perdido" } },
  customers: {
    status: { active: "Activo", inactive: "Inactivo", delinquent: "Moroso" },
    customer_type: { individual: "Persona", business: "Empresa", property_manager: "Administrador" }
  },
  quotes: { status: { draft: "Borrador", sent: "Enviada", accepted: "Aceptada", rejected: "Rechazada", expired: "Caducada" } },
  payments: { method: { sinpe: "SINPE", cash: "Efectivo", transfer: "Transferencia", card: "Tarjeta", other: "Otro" } },
  expenses: { category: { supplies: "Insumos", transport: "Transporte", payroll: "Remuneraciones", contractor: "Honorarios", equipment: "Equipo", other: "Otro" } },
  incidents: { severity: { low: "Baja", medium: "Media", high: "Alta" } }
};

export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "number") return new Intl.NumberFormat("es-CR").format(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Intl.DateTimeFormat("es-CR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  }
  return String(value);
}

export function formatModuleValue(module: ModuleKey, field: string, value: unknown): string {
  const label = valueLabels[module]?.[field]?.[String(value)];
  if (label) return label;
  if (module === "coupons" && field === "discount_percent" && value !== null && value !== undefined) {
    return `${new Intl.NumberFormat("es-CR", { maximumFractionDigits: 2 }).format(Number(value) * 100)} %`;
  }
  if (["amount", "total", "fixed_price", "hourly_rate", "minimum_fee", "unit_cost", "budget"].includes(field) && value !== null && value !== undefined) {
    return new Intl.NumberFormat("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
  }
  return formatValue(value);
}
