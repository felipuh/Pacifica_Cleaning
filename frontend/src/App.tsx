import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  Home,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users
} from "lucide-react";
import {
  DashboardMetrics,
  getDashboard,
  getMe,
  listResource,
  listEligibleLeadAssignees,
  logout,
  queryResource,
  SessionUser,
} from "./api";
import { Pagination, PaginationState } from "./Pagination";
import { pathForView, View, viewFromPath } from "./routing";
import { AdminSection, adminModules, emptyResourceMap, ModuleKey, ResourceRow } from "./admin/config";
import { DashboardOverview } from "./admin/DashboardOverview";
import type { DashboardMetric } from "./admin/DashboardOverview";
import { formatModuleValue } from "./admin/formatters";
import { adminSectionFromPath, pathForAdminSection } from "./admin/routing";
import { ModuleInsights } from "./admin/ModuleInsights";
import { Agenda, formatFieldName, formatMoney, OperationalEditor, rowLabel } from "./admin/operations";
import { PublicHeader, PublicSite } from "./public/PublicExperience";
import { LoginPanel } from "./auth/LoginPanel";
import { NotFound, Policies } from "./public/StaticPages";
import { PublicLanguageProvider } from "./public/i18n";

function emptyPaginationMap(): Record<ModuleKey, PaginationState> {
  return adminModules.reduce((accumulator, module) => {
    accumulator[module.key] = { page: 1, pageSize: 25, count: 0 };
    return accumulator;
  }, {} as Record<ModuleKey, PaginationState>);
}

export function App() {
  const [view, setViewState] = useState<View>(() => viewFromPath(window.location.pathname));
  const [user, setUser] = useState<SessionUser | null>(null);
  const sessionChecked = useRef(false);

  useEffect(() => {
    const navigate = () => setViewState(viewFromPath(window.location.pathname));
    const expireSession = () => {
      sessionChecked.current = true;
      setUser(null);
    };
    window.addEventListener("popstate", navigate);
    window.addEventListener("pacifica:session-expired", expireSession);
    return () => {
      window.removeEventListener("popstate", navigate);
      window.removeEventListener("pacifica:session-expired", expireSession);
    };
  }, []);

  useEffect(() => {
    if (view !== "admin" || sessionChecked.current) return;
    sessionChecked.current = true;
    getMe().then(setUser).catch(() => undefined);
  }, [view]);

  const setView = (nextView: View) => {
    const path = pathForView(nextView);
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
    setViewState(nextView);
    window.scrollTo({ top: 0 });
  };

  return (
    <PublicLanguageProvider>
      <div className="app-shell">
        {view !== "admin" && <PublicHeader view={view} setView={setView} />}
        {view === "public" && <PublicSite />}
        {view === "admin" && <AdminPortal user={user} onSessionChange={setUser} />}
        {view === "policies" && <Policies />}
        {view === "not-found" && <NotFound setView={setView} />}
      </div>
    </PublicLanguageProvider>
  );
}

function AdminPortal({ user, onSessionChange }: { user: SessionUser | null; onSessionChange: (user: SessionUser | null) => void }) {
  if (!user) {
    return <LoginPanel onLogin={onSessionChange} />;
  }
  return <Dashboard user={user} onLogout={() => onSessionChange(null)} />;
}

function canManageModule(role: string, module: ModuleKey): boolean {
  const admin = ["superadmin", "managing_partner"].includes(role);
  if (admin) return module !== "work-orders";
  if (["leads", "customers", "contacts", "properties", "quotes", "campaigns", "coupons"].includes(module)) return ["sales", "operations"].includes(role);
  if (["workers", "inventory-items"].includes(module)) return role === "operations";
  if (["quality-reviews", "incidents"].includes(module)) return ["quality", "operations"].includes(role);
  if (["payments", "expenses"].includes(module)) return role === "finance";
  return false;
}

function Dashboard({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const [selectedSection, setSelectedSection] = useState<AdminSection>(() => adminSectionFromPath(window.location.pathname));
  const [resources, setResources] = useState<Record<ModuleKey, ResourceRow[]>>(() => emptyResourceMap());
  const [pagination, setPagination] = useState<Record<ModuleKey, PaginationState>>(() => emptyPaginationMap());
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editing, setEditing] = useState<ResourceRow | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [notice, setNotice] = useState("");
  const [eligibleAssignees, setEligibleAssignees] = useState<SessionUser[]>([]);
  const loadedModules = useRef(new Set<ModuleKey>());
  const loadingModules = useRef(new Set<ModuleKey>());
  const assigneesRequested = useRef(false);
  const dashboardLoading = useRef(false);

  function selectSection(section: AdminSection) {
    const path = pathForAdminSection(section);
    if (window.location.pathname !== path) window.history.pushState({}, "", path);
    setSelectedSection(section);
  }

  async function loadModules(keys: ModuleKey[], force = false) {
    const keysToLoad = keys.filter((key) => (force || !loadedModules.current.has(key)) && !loadingModules.current.has(key));
    if (keysToLoad.length === 0) return;
    keysToLoad.forEach((key) => loadingModules.current.add(key));
    setLoading(true);
    await Promise.all(keysToLoad.map(async (key) => {
      const module = adminModules.find((candidate) => candidate.key === key);
      if (!module) return;
      try {
        const data = await listResource<ResourceRow>(module.endpoint);
        setResources((current) => ({ ...current, [key]: data.results }));
        setPagination((current) => ({ ...current, [key]: { page: 1, pageSize: 25, count: data.count } }));
        setErrors((current) => ({ ...current, [key]: "" }));
        loadedModules.current.add(key);
      } catch {
        setResources((current) => ({ ...current, [key]: [] }));
        setErrors((current) => ({ ...current, [key]: "No se pudo cargar este módulo. Revise permisos, sesión o API." }));
      } finally {
        loadingModules.current.delete(key);
      }
    }));
    setLoading(false);
  }

  useEffect(() => {
    const navigate = () => setSelectedSection(adminSectionFromPath(window.location.pathname));
    window.addEventListener("popstate", navigate);
    return () => window.removeEventListener("popstate", navigate);
  }, []);

  useEffect(() => {
    if (selectedSection === "dashboard") {
      if (dashboardLoading.current) return;
      dashboardLoading.current = true;
      getDashboard().then(setDashboard).catch(() => setDashboard(null)).finally(() => { dashboardLoading.current = false; });
      return;
    }
    setSearch("");
    setStatusFilter("");
    setShowEditor(false);
    setNotice("");
    const dependencies: Partial<Record<ModuleKey, ModuleKey[]>> = {
      properties: ["customers"],
      contacts: ["customers"],
      "price-versions": ["services"],
      quotes: ["customers", "properties", "services"],
      payments: ["customers"],
      "work-orders": ["workers"],
      "quality-reviews": ["work-orders"],
      incidents: ["work-orders"]
    };
    const keys = Array.from(new Set([selectedSection, ...(dependencies[selectedSection] ?? [])]));
    void loadModules(keys);
    if (selectedSection === "leads" && !assigneesRequested.current) {
      assigneesRequested.current = true;
      listEligibleLeadAssignees().then(setEligibleAssignees).catch(() => {
        assigneesRequested.current = false;
        setEligibleAssignees([]);
      });
    }
  }, [selectedSection]);

  async function filterSelected(event: React.FormEvent) {
    event.preventDefault();
    await loadSelectedPage(1, pagination[selected.key].pageSize);
  }

  async function loadSelectedPage(page: number, pageSize: number, nextSearch = search, nextStatus = statusFilter) {
    setLoading(true);
    const params = new URLSearchParams();
    if (nextSearch) params.set("search", nextSearch);
    if (nextStatus) params.set("status", nextStatus);
    params.set("page", String(page));
    params.set("page_size", String(pageSize));
    try {
      const data = await queryResource<ResourceRow>(selected.endpoint, params);
      setResources((current) => ({ ...current, [selected.key]: data.results }));
      const totalPages = Math.max(1, Math.ceil(data.count / pageSize));
      setPagination((current) => ({ ...current, [selected.key]: { page: Math.min(page, totalPages), pageSize, count: data.count } }));
      setErrors((current) => ({ ...current, [selected.key]: "" }));
    } catch {
      setErrors((current) => ({ ...current, [selected.key]: "No se pudo aplicar el filtro." }));
    } finally {
      setLoading(false);
    }
  }

  async function endSession() {
    try {
      await logout();
    } finally {
      onLogout();
    }
  }

  const selected = adminModules.find((module) => module.key === selectedSection) ?? adminModules[0];
  const selectedRows = resources[selected.key] ?? [];
  const metrics = useMemo<DashboardMetric[]>(() => [
    ["Leads nuevos", dashboard?.leads_new ?? 0, Users],
    ["Leads pendientes", dashboard?.leads_pending ?? 0, Users],
    ["Cotizaciones pendientes", dashboard?.quotes_pending ?? 0, ClipboardCheck],
    ["Cotizaciones enviadas", dashboard?.quotes_sent ?? 0, ClipboardCheck],
    ["Cotizaciones aceptadas", dashboard?.quotes_accepted ?? 0, BadgeCheck],
    ["Servicios próximos", dashboard?.services_upcoming ?? 0, CalendarDays],
    ["Servicios completados", dashboard?.services_completed ?? 0, CheckCircle2],
    ["Clientes recurrentes", dashboard?.recurrent_customers ?? 0, Home],
    ["Ingresos estimados", dashboard ? formatMoney(dashboard.estimated_revenue) : "—", DollarSign],
    ["Ingresos confirmados", dashboard ? formatMoney(dashboard.confirmed_revenue) : "—", DollarSign],
    ["Conversión", dashboard ? `${dashboard.conversion_rate}%` : "—", BadgeCheck]
  ], [dashboard]);

  const canEditSelected = canManageModule(user.role, selected.key);
  const canEditAgenda = ["superadmin", "managing_partner", "operations"].includes(user.role);

  return (
    <main className="admin-layout">
      <aside className="sidebar" role="navigation" aria-label="Módulos administrativos">
        <div className="sidebar-heading">
          <LayoutDashboard size={22} />
          <span>Portal operativo</span>
        </div>
        <button type="button" aria-current={selectedSection === "dashboard" ? "page" : undefined} className={selectedSection === "dashboard" ? "active" : ""} onClick={() => selectSection("dashboard")}>
          <LayoutDashboard size={18} />
          <span>Resumen</span>
          <small>General</small>
        </button>
        {adminModules.map((module) => {
          const Icon = module.icon;
          return (
            <button type="button" aria-current={selectedSection === module.key ? "page" : undefined} className={selectedSection === module.key ? "active" : ""} key={module.key} onClick={() => selectSection(module.key)}>
              <Icon size={18} />
              <span>{module.label}</span>
              <small>{module.group}</small>
            </button>
          );
        })}
      </aside>
      <section className="workspace">
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">Operacion diaria en React</p>
            <h1>Panel administrativo</h1>
            <p className="workspace-intro">Interfaz principal para validar datos operativos desde la API. Django Admin queda solo como herramienta tecnica secundaria.</p>
          </div>
          <div className="admin-actions">
            <span className="user-pill"><ShieldCheck size={16} /> {user.role}</span>
            <button className="ghost admin-logout" onClick={endSession}><LogOut size={17} /> Salir</button>
          </div>
        </div>
        {selectedSection === "dashboard" ? (
          <DashboardOverview metrics={metrics} dashboard={dashboard} />
        ) : (
        <div className="table-panel" data-testid="module-workspace">
          <div className="module-heading">
            <div>
              <p className="eyebrow">{selected.group}</p>
              <h2>{selected.label}</h2>
              <p>{selected.description}</p>
            </div>
            <div className="admin-actions">
              <span className="user-pill">{loading ? "Cargando" : `${selectedRows.length} registros`}</span>
              {canEditSelected && (
                <button className="primary" onClick={() => { setEditing(null); setShowEditor(true); }}>Nuevo</button>
              )}
            </div>
          </div>
          {selected.key === "work-orders" ? (
            <Agenda workers={resources.workers} canEdit={canEditAgenda} onChanged={async () => loadModules(["work-orders", "workers"], true)} />
          ) : (
          <>
          <ModuleInsights module={selected.key} rows={selectedRows} />
          {(selected.supportsSearch || selected.statusOptions) && <form className="admin-filters" onSubmit={filterSelected}>
            {selected.supportsSearch && <label>Buscar<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, correo, teléfono o zona" /></label>}
            {selected.statusOptions && (
              <label>Estado<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Todos</option>{selected.statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            )}
            <button className="ghost">Aplicar filtros</button>
            <button className="ghost" type="button" onClick={() => { setSearch(""); setStatusFilter(""); void loadSelectedPage(1, pagination[selected.key].pageSize, "", ""); }}>Limpiar filtros</button>
          </form>}
          {notice && <p className="success" role="status">{notice}</p>}
          {errors[selected.key] && <p className="error">{errors[selected.key]}</p>}
          {!errors[selected.key] && selectedRows.length === 0 ? (
            <p>No hay registros cargados para este modulo o falta sembrar datos de prueba.</p>
          ) : (
            <div className={`admin-table ${canEditSelected ? "has-actions" : ""}`} role="table" aria-label={`Listado de ${selected.label}`}>
              <div className="admin-table-head" role="row">
                <span>Registro</span>
                {selected.fields.slice(0, 4).map((field) => <span key={field}>{formatFieldName(field)}</span>)}
                {canEditSelected && <span>Acciones</span>}
              </div>
              {selectedRows.slice(0, 8).map((row, index) => (
                <div className="admin-table-row" role="row" key={row.id ?? `${selected.key}-${index}`}>
                  <strong>{rowLabel(row, index)}</strong>
                  {selected.fields.slice(0, 4).map((field) => <span key={field}>{formatModuleValue(selected.key, field, row[field])}</span>)}
                  {canEditSelected && <button className="ghost" onClick={() => { setEditing(row); setShowEditor(true); }}>Editar</button>}
                </div>
              ))}
            </div>
          )}
          <Pagination state={pagination[selected.key]} onChange={loadSelectedPage} />
          {showEditor && (
            <OperationalEditor
              module={selected.key}
              row={editing}
              resources={resources}
              eligibleAssignees={eligibleAssignees}
              onClose={() => setShowEditor(false)}
              onSaved={async (message) => { setShowEditor(false); setNotice(message); await loadModules([selected.key], true); }}
            />
          )}
          </>
          )}
        </div>
        )}
      </section>
    </main>
  );
}
