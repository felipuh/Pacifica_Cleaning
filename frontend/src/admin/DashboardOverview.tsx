import type { LucideIcon } from "lucide-react";
import type { DashboardMetrics } from "../api";
import { formatValue } from "./formatters";

export type DashboardMetric = [label: string, value: string | number, icon: LucideIcon];

function money(value: string, currency: string) {
  return new Intl.NumberFormat("es-CR", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value));
}

export function DashboardOverview({ metrics, dashboard }: { metrics: DashboardMetric[]; dashboard: DashboardMetrics | null }) {
  return (
    <section aria-labelledby="dashboard-overview-title">
      <div className="module-heading dashboard-heading">
        <div>
          <p className="eyebrow">Resumen general</p>
          <h2 id="dashboard-overview-title">Estado del negocio</h2>
          <p>Indicadores comerciales y operativos para priorizar el trabajo del día.</p>
        </div>
      </div>
      <div className="metric-grid">
        {metrics.map(([label, value, Icon]) => (
          <article className="metric" key={label}>
            <Icon size={22} />
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </div>
      <section className="dashboard-reports" aria-labelledby="dashboard-reports-title">
        <h3 id="dashboard-reports-title">Reportes operativos</h3>
        <div className="report-grid">
          <article>
            <h4>Finanzas por moneda</h4>
            {!dashboard?.finance_by_currency?.length && <p>Sin movimientos financieros.</p>}
            {dashboard?.finance_by_currency?.map((row) => (
              <p key={row.currency}><strong>{row.currency}</strong> · Ingresos {money(row.income, row.currency)} · Gastos {money(row.expenses, row.currency)} · Margen {money(row.margin, row.currency)}</p>
            ))}
          </article>
          <article>
            <h4>Calidad y retrabajos</h4>
            <p>Calificación promedio: <strong>{dashboard?.quality_average == null ? "Sin datos" : `${Number(dashboard.quality_average).toFixed(1)} / 5`}</strong></p>
            <p>Tasa de retrabajo: <strong>{dashboard ? `${dashboard.rework_rate}%` : "—"}</strong></p>
          </article>
          <article>
            <h4>Alertas operativas</h4>
            <p>Incidencias abiertas: <strong>{dashboard?.open_incidents ?? 0}</strong> ({dashboard?.high_incidents ?? 0} altas)</p>
            <p>Ítems bajo mínimo: <strong>{dashboard?.inventory_below_minimum ?? 0}</strong></p>
          </article>
        </div>
      </section>
      <section className="recent-activity">
        <h3>Actividad reciente</h3>
        {!dashboard && <p>Cargando actividad…</p>}
        {dashboard && dashboard.recent_activity.length === 0 && <p>No hay actividad reciente.</p>}
        {dashboard?.recent_activity.map((item) => (
          <p key={`${item.type}-${item.id}`}><strong>{item.label}</strong> · {item.status} · {formatValue(item.at)}</p>
        ))}
      </section>
    </section>
  );
}
