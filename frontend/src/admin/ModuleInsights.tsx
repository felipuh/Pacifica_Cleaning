import type { ModuleKey, ResourceRow } from "./config";

type Insight = { label: string; value: string | number };

const statusLabels: Partial<Record<ModuleKey, Record<string, string>>> = {
  leads: { new: "Nuevos", contacted: "Contactados", qualified: "Calificados", won: "Convertidos" },
  customers: { active: "Activos", inactive: "Inactivos", delinquent: "Morosos" },
  quotes: { draft: "Borradores", sent: "Enviadas", accepted: "Aceptadas", expired: "Caducadas" }
};

function countByStatus(rows: ResourceRow[], labels: Record<string, string>): Insight[] {
  return Object.entries(labels).map(([status, label]) => ({
    label,
    value: rows.filter((row) => row.status === status).length
  }));
}

function paymentInsights(rows: ResourceRow[]): Insight[] {
  const totals = rows.reduce<Record<string, number>>((result, row) => {
    const currency = String(row.currency || "CRC");
    result[currency] = (result[currency] ?? 0) + Number(row.amount || 0);
    return result;
  }, {});
  return [
    { label: "Pagos visibles", value: rows.length },
    ...Object.entries(totals).map(([currency, total]) => ({
      label: `Total ${currency}`,
      value: new Intl.NumberFormat("es-CR", { style: "currency", currency }).format(total)
    })),
    { label: "Métodos utilizados", value: new Set(rows.map((row) => row.method).filter(Boolean)).size }
  ];
}

function expenseInsights(rows: ResourceRow[]): Insight[] {
  const totals = rows.reduce<Record<string, number>>((result, row) => {
    const currency = String(row.currency || "CRC");
    result[currency] = (result[currency] ?? 0) + Number(row.amount || 0);
    return result;
  }, {});
  return [
    { label: "Gastos visibles", value: rows.length },
    ...Object.entries(totals).map(([currency, total]) => ({
      label: `Total ${currency}`,
      value: new Intl.NumberFormat("es-CR", { style: "currency", currency }).format(total)
    })),
    { label: "Categorías utilizadas", value: new Set(rows.map((row) => row.category).filter(Boolean)).size }
  ];
}

function inventoryInsights(rows: ResourceRow[]): Insight[] {
  return [
    { label: "Artículos visibles", value: rows.length },
    { label: "Bajo mínimo", value: rows.filter((row) => row.below_minimum === true).length },
    { label: "Con vencimiento", value: rows.filter((row) => Boolean(row.expires_at)).length }
  ];
}

function serviceInsights(rows: ResourceRow[]): Insight[] {
  return [
    { label: "Servicios visibles", value: rows.length },
    { label: "Activos", value: rows.filter((row) => row.is_active === true).length },
    { label: "Precio fijo", value: rows.filter((row) => row.pricing_mode === "fixed").length }
  ];
}

function booleanInsights(rows: ResourceRow[], activeField: string, labels: [string, string, string]): Insight[] {
  return [
    { label: labels[0], value: rows.length },
    { label: labels[1], value: rows.filter((row) => row[activeField] === true).length },
    { label: labels[2], value: rows.filter((row) => row[activeField] !== true).length }
  ];
}

function qualityInsights(rows: ResourceRow[]): Insight[] {
  const scored = rows.filter((row) => Number(row.score) > 0);
  const average = scored.length ? scored.reduce((total, row) => total + Number(row.score), 0) / scored.length : 0;
  return [
    { label: "Revisiones visibles", value: rows.length },
    { label: "Puntuación promedio", value: average.toFixed(1) },
    { label: "Requieren retrabajo", value: rows.filter((row) => row.rework_required === true).length }
  ];
}

function incidentInsights(rows: ResourceRow[]): Insight[] {
  return [
    { label: "Incidencias visibles", value: rows.length },
    { label: "Severidad alta", value: rows.filter((row) => row.severity === "high").length },
    { label: "Sin resolver", value: rows.filter((row) => !row.resolved_at).length }
  ];
}

export function ModuleInsights({ module, rows }: { module: ModuleKey; rows: ResourceRow[] }) {
  const labels = statusLabels[module];
  const insights = module === "payments"
    ? paymentInsights(rows)
    : module === "expenses"
      ? expenseInsights(rows)
    : module === "inventory-items"
      ? inventoryInsights(rows)
      : module === "services"
        ? serviceInsights(rows)
        : module === "contacts"
          ? booleanInsights(rows, "is_primary", ["Contactos visibles", "Principales", "Secundarios"])
          : module === "campaigns"
            ? booleanInsights(rows, "consent_required", ["Campañas visibles", "Con consentimiento", "Sin requisito"])
            : module === "coupons"
              ? booleanInsights(rows, "active", ["Cupones visibles", "Activos", "Inactivos"])
              : module === "notification-templates"
                ? booleanInsights(rows, "active", ["Plantillas visibles", "Activas", "Inactivas"])
                : module === "quality-reviews"
                  ? qualityInsights(rows)
                  : module === "incidents"
                    ? incidentInsights(rows)
        : labels ? countByStatus(rows, labels) : [];
  if (insights.length === 0) return null;

  return (
    <section className="module-insights" aria-label="Indicadores del módulo">
      {insights.map((insight) => (
        <article key={insight.label}>
          <strong>{insight.value}</strong>
          <span>{insight.label}</span>
        </article>
      ))}
    </section>
  );
}
