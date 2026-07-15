import {
  BadgeCheck,
  Building2,
  CalendarDays,
  ClipboardCheck,
  DollarSign,
  Home,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";

export type ResourceRow = Record<string, unknown> & {
  id?: string;
  full_name?: string;
  display_name?: string;
  name_es?: string;
  name?: string;
  title?: string;
  status?: string;
};

export type ModuleKey =
  | "leads"
  | "customers"
  | "contacts"
  | "properties"
  | "services"
  | "price-versions"
  | "quotes"
  | "work-orders"
  | "quality-reviews"
  | "incidents"
  | "workers"
  | "payments"
  | "expenses"
  | "campaigns"
  | "coupons"
  | "notification-templates"
  | "inventory-items";

export type AdminSection = "dashboard" | ModuleKey;

export const adminModules: Array<{
  key: ModuleKey;
  label: string;
  group: string;
  endpoint: string;
  icon: typeof Users;
  description: string;
  fields: string[];
  supportsSearch?: boolean;
  statusOptions?: Array<{ value: string; label: string }>;
}> = [
  { key: "leads", label: "Leads", group: "CRM", endpoint: "leads", icon: Users, description: "Prospectos, fuente comercial, consentimiento y seguimiento inicial.", fields: ["phone", "requested_service", "status", "next_follow_up_at"], supportsSearch: true, statusOptions: [{ value: "new", label: "Nuevo" }, { value: "contacted", label: "Contactado" }, { value: "qualified", label: "Calificado" }, { value: "won", label: "Convertido" }, { value: "lost", label: "Perdido" }] },
  { key: "customers", label: "Clientes", group: "CRM", endpoint: "customers", icon: Home, description: "Clientes activos, preferencias, etiquetas y relacion con propiedades.", fields: ["phone", "customer_type", "status", "tags"], supportsSearch: true, statusOptions: [{ value: "active", label: "Activo" }, { value: "inactive", label: "Inactivo" }, { value: "delinquent", label: "Moroso" }] },
  { key: "contacts", label: "Contactos", group: "CRM", endpoint: "contacts", icon: Users, description: "Personas de contacto asociadas a clientes y responsables principales.", fields: ["email", "phone", "role", "is_primary"] },
  { key: "properties", label: "Propiedades", group: "Operacion", endpoint: "properties", icon: Building2, description: "Casas, Airbnb, accesos, zona, complejidad y datos operativos.", fields: ["name", "zone", "property_type", "bedrooms", "bathrooms"], supportsSearch: true },
  { key: "services", label: "Servicios", group: "Catalogo", endpoint: "services", icon: Sparkles, description: "Catalogo comercial, tareas, exclusiones y configuracion base.", fields: ["name_en", "pricing_mode", "is_active", "slug"] },
  { key: "price-versions", label: "Tarifas", group: "Catálogo", endpoint: "price-versions", icon: DollarSign, description: "Versiones de precio, impuestos, mínimos y margen esperado por servicio.", fields: ["currency", "fixed_price", "hourly_rate", "valid_from"] },
  { key: "quotes", label: "Cotizaciones", group: "Ventas", endpoint: "quotes", icon: ClipboardCheck, description: "Estados, totales, descuento, margen y conversion a orden de servicio.", fields: ["status", "currency", "total", "valid_until"], supportsSearch: true, statusOptions: [{ value: "draft", label: "Borrador" }, { value: "sent", label: "Enviada" }, { value: "accepted", label: "Aceptada" }, { value: "rejected", label: "Rechazada" }, { value: "expired", label: "Caducada" }] },
  { key: "work-orders", label: "Agenda", group: "Operacion", endpoint: "work-orders", icon: CalendarDays, description: "Ordenes de servicio, horarios, rutas, estado operativo y checklist.", fields: ["status", "scheduled_start", "scheduled_end", "route_zone"] },
  { key: "quality-reviews", label: "Calidad", group: "Calidad", endpoint: "quality-reviews", icon: BadgeCheck, description: "Evaluaciones, NPS, observaciones y retrabajos asociados a servicios.", fields: ["score", "nps", "rework_required", "rework_cost"] },
  { key: "incidents", label: "Incidencias", group: "Calidad", endpoint: "incidents", icon: ShieldCheck, description: "Incidencias operativas, severidad, seguimiento y resolución.", fields: ["severity", "description", "resolved_at", "follow_up"] },
  { key: "workers", label: "Personal", group: "Equipo", endpoint: "workers", icon: ShieldCheck, description: "Personal y prestadores separados, disponibilidad, documentos y alertas.", fields: ["phone", "worker_type", "status", "independence_risk_flags"] },
  { key: "payments", label: "Finanzas", group: "Finanzas", endpoint: "payments", icon: DollarSign, description: "Pagos, metodos, conciliacion operativa e ingresos por servicio.", fields: ["amount", "currency", "method", "paid_at"] },
  { key: "expenses", label: "Gastos", group: "Finanzas", endpoint: "expenses", icon: DollarSign, description: "Egresos operativos por categoría, proveedor y fecha de incurrencia.", fields: ["category", "amount", "currency", "incurred_at"] },
  { key: "campaigns", label: "Campañas", group: "Marketing", endpoint: "campaigns", icon: Sparkles, description: "Campañas por canal, vigencia, presupuesto y consentimiento.", fields: ["channel", "starts_at", "ends_at", "budget"] },
  { key: "coupons", label: "Cupones", group: "Marketing", endpoint: "coupons", icon: BadgeCheck, description: "Descuentos promocionales, vigencia, límites de uso y activación.", fields: ["description", "discount_percent", "valid_until", "active"] },
  { key: "notification-templates", label: "Plantillas", group: "Notificaciones", endpoint: "notification-templates", icon: ClipboardCheck, description: "Mensajes reutilizables para correo, WhatsApp y notificaciones internas.", fields: ["channel", "subject", "active", "key"] },
  { key: "inventory-items", label: "Inventario", group: "Operacion", endpoint: "inventory-items", icon: ClipboardCheck, description: "Productos, equipos, stock minimo, costos y responsables.", fields: ["category", "stock_on_hand", "minimum_stock", "below_minimum"] }
];

export function emptyResourceMap(): Record<ModuleKey, ResourceRow[]> {
  return adminModules.reduce((resources, module) => {
    resources[module.key] = [];
    return resources;
  }, {} as Record<ModuleKey, ResourceRow[]>);
}
