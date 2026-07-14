import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  DollarSign,
  Home,
  Hotel,
  KeyRound,
  LayoutDashboard,
  Leaf,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Users,
  X
} from "lucide-react";
import {
  createLead,
  createResource,
  DashboardMetrics,
  getDashboard,
  getMe,
  listResource,
  listEligibleLeadAssignees,
  login,
  logout,
  queryResource,
  requestPasswordReset,
  resourceAction,
  SessionUser,
  updateResource
} from "./api";
import { benefits, coverageZones, faqs, processSteps, services, whatsappUrl } from "./content";
import { Pagination, PaginationState } from "./Pagination";

type View = "public" | "admin" | "policies" | "not-found";
type ResourceRow = Record<string, unknown> & { id?: string; full_name?: string; display_name?: string; name_es?: string; name?: string; title?: string; status?: string };
type ModuleKey = "leads" | "customers" | "properties" | "services" | "quotes" | "work-orders" | "workers" | "payments" | "inventory-items";

const adminModules: Array<{
  key: ModuleKey;
  label: string;
  group: string;
  endpoint: string;
  icon: typeof Users;
  description: string;
  fields: string[];
}> = [
  {
    key: "leads",
    label: "Leads",
    group: "CRM",
    endpoint: "leads",
    icon: Users,
    description: "Prospectos, fuente comercial, consentimiento y seguimiento inicial.",
    fields: ["full_name", "phone", "email", "requested_service", "status"]
  },
  {
    key: "customers",
    label: "Clientes",
    group: "CRM",
    endpoint: "customers",
    icon: Home,
    description: "Clientes activos, preferencias, etiquetas y relacion con propiedades.",
    fields: ["full_name", "phone", "email", "status"]
  },
  {
    key: "properties",
    label: "Propiedades",
    group: "Operacion",
    endpoint: "properties",
    icon: Building2,
    description: "Casas, Airbnb, accesos, zona, complejidad y datos operativos.",
    fields: ["name", "zone", "property_type", "bedrooms", "bathrooms"]
  },
  {
    key: "services",
    label: "Servicios",
    group: "Catalogo",
    endpoint: "services",
    icon: Sparkles,
    description: "Catalogo comercial, tareas, exclusiones y configuracion base.",
    fields: ["name_es", "category", "is_active"]
  },
  {
    key: "quotes",
    label: "Cotizaciones",
    group: "Ventas",
    endpoint: "quotes",
    icon: ClipboardCheck,
    description: "Estados, totales, descuento, margen y conversion a orden de servicio.",
    fields: ["code", "status", "subtotal", "tax", "total"]
  },
  {
    key: "work-orders",
    label: "Agenda",
    group: "Operacion",
    endpoint: "work-orders",
    icon: CalendarDays,
    description: "Ordenes de servicio, horarios, rutas, estado operativo y checklist.",
    fields: ["status", "scheduled_start", "scheduled_end", "route_zone"]
  },
  {
    key: "workers",
    label: "Personal",
    group: "Equipo",
    endpoint: "workers",
    icon: ShieldCheck,
    description: "Personal y prestadores separados, disponibilidad, documentos y alertas.",
    fields: ["full_name", "worker_type", "status", "subordination_risk"]
  },
  {
    key: "payments",
    label: "Finanzas",
    group: "Finanzas",
    endpoint: "payments",
    icon: DollarSign,
    description: "Pagos, metodos, conciliacion operativa e ingresos por servicio.",
    fields: ["amount", "method", "status", "paid_at"]
  },
  {
    key: "inventory-items",
    label: "Inventario",
    group: "Operacion",
    endpoint: "inventory-items",
    icon: ClipboardCheck,
    description: "Productos, equipos, stock minimo, costos y responsables.",
    fields: ["name", "category", "current_stock", "minimum_stock"]
  }
];

function emptyResourceMap(): Record<ModuleKey, ResourceRow[]> {
  return adminModules.reduce((accumulator, module) => {
    accumulator[module.key] = [];
    return accumulator;
  }, {} as Record<ModuleKey, ResourceRow[]>);
}

function emptyPaginationMap(): Record<ModuleKey, PaginationState> {
  return adminModules.reduce((accumulator, module) => {
    accumulator[module.key] = { page: 1, pageSize: 25, count: 0 };
    return accumulator;
  }, {} as Record<ModuleKey, PaginationState>);
}

export function App() {
  const [view, setViewState] = useState<View>(() => viewFromPath(window.location.pathname));
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    getMe().then(setUser).catch(() => undefined);
    const navigate = () => setViewState(viewFromPath(window.location.pathname));
    const expireSession = () => setUser(null);
    window.addEventListener("popstate", navigate);
    window.addEventListener("pacifica:session-expired", expireSession);
    return () => {
      window.removeEventListener("popstate", navigate);
      window.removeEventListener("pacifica:session-expired", expireSession);
    };
  }, []);

  const setView = (nextView: View) => {
    const path = pathForView(nextView);
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
    setViewState(nextView);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="app-shell">
      <Header view={view} setView={setView} user={user} />
      {view === "public" && <PublicSite />}
      {view === "admin" && <AdminPortal user={user} onSessionChange={setUser} />}
      {view === "policies" && <Policies />}
      {view === "not-found" && <NotFound setView={setView} />}
    </div>
  );
}

function viewFromPath(path: string): View {
  if (path === "/") return "public";
  if (path.startsWith("/app")) return "admin";
  if (path.startsWith("/legal")) return "policies";
  return "not-found";
}

function pathForView(view: View): string {
  return view === "admin" ? "/app" : view === "policies" ? "/legal" : "/";
}

function Header({ view, setView, user }: { view: View; setView: (view: View) => void; user: SessionUser | null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const setAppView = (nextView: View) => {
    setView(nextView);
    closeMenu();
  };

  return (
    <header className="topbar">
      <button className="brand" onClick={() => setAppView("public")} aria-label="Inicio Pacifica Cleaning">
        <span className="brand-mark">PC</span>
        <span>
          <strong>PACÍFICA</strong>
          <small>Cleaning</small>
        </span>
      </button>
      <button className="menu-toggle" onClick={() => setMenuOpen((current) => !current)} aria-label="Abrir menú" aria-expanded={menuOpen}>
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <nav className={menuOpen ? "open" : ""} aria-label="Navegación principal">
        <button className={view === "public" ? "active" : ""} onClick={() => setAppView("public")}>Inicio</button>
        <a href="#servicios" onClick={closeMenu}>Servicios</a>
        <a href="#airbnb" onClick={closeMenu}>Airbnb</a>
        <a href="#proceso" onClick={closeMenu}>Proceso</a>
        <a href="#cotizar" onClick={closeMenu}>Contacto</a>
        <button className={view === "admin" ? "active" : ""} onClick={() => setAppView("admin")}>Admin</button>
        <button className={view === "policies" ? "active" : ""} onClick={() => setAppView("policies")}>Legal</button>
      </nav>
      <a className="header-cta" href={whatsappUrl} target="_blank" rel="noreferrer">
        <MessageCircle size={18} /> Cotizar
      </a>
      {user ? <span className="user-pill desktop-only">{user.role}</span> : <span className="user-pill muted desktop-only">Privado</span>}
    </header>
  );
}

function PublicSite() {
  return (
    <main>
      <Hero />
      <ServicesSection />
      <BenefitsSection />
      <AirbnbSection />
      <ProcessSection />
      <TrustSection />
      <QuoteForm />
      <FinalCTA />
      <FAQSection />
      <Footer />
      <WhatsAppButton />
    </main>
  );
}

function Hero() {
  return (
    <section className="hero" id="inicio">
      <div className="hero-copy reveal">
        <p className="eyebrow">Tempate, Guanacaste</p>
        <h1>Limpieza profesional para hogares y propiedades vacacionales en Guanacaste</h1>
        <p>Cuidamos cada espacio con detalle, puntualidad y confianza. Ideal para casas, Airbnb, alquileres vacacionales y propiedades familiares.</p>
        <div className="hero-actions">
          <a className="primary" href={whatsappUrl} target="_blank" rel="noreferrer">
            <MessageCircle size={19} /> Solicitar cotización
          </a>
          <a className="ghost" href="#servicios">
            Ver servicios <ChevronRight size={18} />
          </a>
        </div>
        <div className="hero-badges" aria-label="Beneficios principales">
          <span><ShieldCheck size={16} /> Servicio confiable</span>
          <span><MessageCircle size={16} /> Atención por WhatsApp</span>
          <span><Hotel size={16} /> Ideal para Airbnb</span>
          <span><Sparkles size={16} /> Limpieza residencial</span>
        </div>
      </div>
      <div className="hero-visual reveal delay-1">
        <img
          src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=82"
          alt="Profesional de limpieza preparando una sala residencial luminosa"
        />
        <div className="floating-card top">
          <BadgeCheck size={19} />
          <span>Más que limpieza, tranquilidad para tu hogar.</span>
        </div>
        <div className="floating-card bottom">
          <strong>24h</strong>
          <span>Seguimiento inicial y coordinación clara.</span>
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  const icons = [Home, Sparkles, CalendarDays, KeyRound, ClipboardCheck, Building2];
  return (
    <section id="servicios" className="section">
      <div className="section-heading reveal">
        <div>
          <p className="eyebrow">Servicios</p>
          <h2>Soluciones de limpieza listas para hogares, negocios y reservas.</h2>
        </div>
        <a className="section-link" href={whatsappUrl} target="_blank" rel="noreferrer">Cotizar un servicio</a>
      </div>
      <div className="service-grid">
        {services.map((service, index) => {
          const Icon = icons[index] ?? ClipboardCheck;
          return (
            <article key={service.title} className="service-card reveal">
              <span className="icon-chip"><Icon size={23} /></span>
              <h3>{service.title}</h3>
              <p>{service.detail}</p>
              <a href="#cotizar">Solicitar información <ChevronRight size={16} /></a>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="benefits-band">
      <div className="benefits-copy reveal">
        <p className="eyebrow">Por qué elegirnos</p>
        <h2>Servicio local, confiable y puntual en Guanacaste.</h2>
        <p>Combinamos procesos claros con una atención humana y cercana para que cada limpieza se sienta ordenada desde el primer mensaje.</p>
      </div>
      <div className="benefits-grid">
        {benefits.map((benefit) => (
          <article key={benefit} className="benefit-item reveal">
            <CheckCircle2 size={20} />
            <span>{benefit}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function AirbnbSection() {
  return (
    <section id="airbnb" className="airbnb-section">
      <div className="airbnb-media reveal">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=82"
          alt="Casa vacacional luminosa lista para huéspedes en Costa Rica"
          loading="lazy"
        />
      </div>
      <div className="airbnb-copy reveal delay-1">
        <p className="eyebrow">Airbnb y propiedades vacacionales</p>
        <h2>Espacios impecables para cada visita, reserva o familia.</h2>
        <p>Apoyamos a anfitriones, administradores e inmobiliarias con limpieza entre reservas, preparación antes del check-in y reporte básico de incidencias.</p>
        <div className="feature-list">
          <span><KeyRound size={18} /> Preparación entre check-out y check-in</span>
          <span><Hotel size={18} /> Revisión visual básica del espacio</span>
          <span><ClipboardCheck size={18} /> Seguimiento e incidencias autorizadas</span>
          <span><CalendarDays size={18} /> Servicio recurrente antes de cada reserva</span>
        </div>
        <a className="primary" href={whatsappUrl} target="_blank" rel="noreferrer">Solicitar plan para propiedades vacacionales</a>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section id="proceso" className="section process-section">
      <div className="section-heading reveal">
        <div>
          <p className="eyebrow">Proceso</p>
          <h2>Cotizar es simple, claro y rápido.</h2>
        </div>
      </div>
      <ol className="process-grid">
        {processSteps.map((step, index) => (
          <li key={step} className="process-card reveal">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{step}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="section split trust-section">
      <div className="reveal">
        <p className="eyebrow">Cobertura inicial</p>
        <h2>Atención local desde Tempate hacia zonas clave de Guanacaste.</h2>
        <div className="zones">{coverageZones.map((zone) => <span key={zone}>{zone}</span>)}</div>
      </div>
      <div className="trust-card reveal delay-1">
        <Leaf size={24} />
        <h3>Cuidamos tu hogar como si fuera nuestro.</h3>
        <p>Procesos verificables, consentimiento para evidencias y comunicación clara antes, durante y después del servicio.</p>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="final-cta reveal">
      <p className="eyebrow">Cotiza fácil por WhatsApp</p>
      <h2>¿Listo para tener un espacio limpio, fresco y ordenado?</h2>
      <p>Solicita una cotización rápida por WhatsApp y cuéntanos qué tipo de limpieza necesitas.</p>
      <a className="primary" href={whatsappUrl} target="_blank" rel="noreferrer">
        <PhoneCall size={19} /> Cotizar por WhatsApp
      </a>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="section">
      <div className="section-heading reveal">
        <div>
          <p className="eyebrow">FAQ</p>
          <h2>Preguntas frecuentes</h2>
        </div>
      </div>
      <div className="faq-list">
        {faqs.map(([question, answer]) => (
          <details key={question} className="reveal">
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div>
        <button className="brand footer-brand" aria-label="Pacífica Cleaning">
          <span className="brand-mark">PC</span>
          <span>
            <strong>PACÍFICA</strong>
            <small>Cleaning</small>
          </span>
        </button>
        <p>Limpieza profesional con atención al detalle para hogares, Airbnb y propiedades vacacionales en Guanacaste.</p>
      </div>
      <div>
        <h3>Servicios</h3>
        <a href="#servicios">Residencial</a>
        <a href="#servicios">Profunda</a>
        <a href="#airbnb">Airbnb</a>
        <a href="#servicios">Oficinas</a>
      </div>
      <div>
        <h3>Zona de atención</h3>
        <p>Tempate, Brasilito, Flamingo, Potrero, Huacas, Tamarindo y zonas cercanas.</p>
      </div>
      <div>
        <h3>Contacto</h3>
        <a href={whatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a>
        <a href="#cotizar">Formulario de cotización</a>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Volver arriba</button>
      </div>
      <p className="copyright">© {new Date().getFullYear()} Pacífica Cleaning. Derechos reservados.</p>
    </footer>
  );
}

function WhatsAppButton() {
  return (
    <a className="whatsapp-float" href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Cotizar por WhatsApp">
      <MessageCircle size={24} />
    </a>
  );
}

function QuoteForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    preferred_language: "es" as const,
    requested_service: "limpieza-residencial",
    message: "",
    consent_data_processing: false,
    consent_marketing: false,
    source: "website",
    website: ""
  });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    try {
      await createLead(form);
      setStatus("sent");
      setForm({ ...form, full_name: "", email: "", phone: "", message: "", consent_data_processing: false, consent_marketing: false, website: "" });
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="cotizar" className="quote-band">
      <div>
        <p className="eyebrow">Cotizacion o inspeccion</p>
        <h2>Cuente que necesita y coordinamos el siguiente paso</h2>
      </div>
      <form className="quote-form" onSubmit={submit}>
        <label>Nombre<input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></label>
        <label>Correo<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Telefono<input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
        <label>Servicio<select value={form.requested_service} onChange={(e) => setForm({ ...form, requested_service: e.target.value })}>{services.map((service) => <option key={service.title}>{service.title}</option>)}</select></label>
        <label className="wide">Mensaje<textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
        <label className="honeypot" aria-hidden="true" tabIndex={-1}>Sitio web<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></label>
        <label className="check"><input type="checkbox" required checked={form.consent_data_processing} onChange={(e) => setForm({ ...form, consent_data_processing: e.target.checked })} /> Acepto el tratamiento de datos para responder mi solicitud.</label>
        <label className="check"><input type="checkbox" checked={form.consent_marketing} onChange={(e) => setForm({ ...form, consent_marketing: e.target.checked })} /> Acepto recibir comunicaciones comerciales.</label>
        <button className="primary" disabled={status === "sending"}>{status === "sending" ? "Enviando..." : "Enviar solicitud"}</button>
        {status === "sent" && <p className="success">Solicitud recibida.</p>}
        {status === "error" && <p className="error">No se pudo enviar. Revise los datos.</p>}
      </form>
    </section>
  );
}

function AdminPortal({ user, onSessionChange }: { user: SessionUser | null; onSessionChange: (user: SessionUser | null) => void }) {
  if (!user) {
    return <LoginPanel onLogin={onSessionChange} />;
  }
  return <Dashboard user={user} onLogout={() => onSessionChange(null)} />;
}

function LoginPanel({ onLogin }: { onLogin: (user: SessionUser) => void }) {
  const [email, setEmail] = useState("admin@pacifica.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const result = await login(email, password);
      if ("mfaRequired" in result) {
        setError("MFA requerido. Use el endpoint MFA para completar la sesion.");
        return;
      }
      onLogin(result);
    } catch {
      setError("Credenciales invalidas o cuenta bloqueada temporalmente.");
    }
  }

  async function recover() {
    setError("");
    setRecoveryMessage("");
    try {
      const result = await requestPasswordReset(email);
      setRecoveryMessage(result.detail);
    } catch {
      setError("No se pudo procesar la solicitud. Intente nuevamente más tarde.");
    }
  }

  return (
    <main className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <LogIn size={28} />
        <h1>Portal administrativo</h1>
        <label>Correo<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Contrasena<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button className="primary">Entrar</button>
        <button className="ghost" type="button" onClick={recover}>Olvidé mi contraseña</button>
        {recoveryMessage && <p className="success" role="status">{recoveryMessage}</p>}
        {error && <p className="error">{error}</p>}
      </form>
    </main>
  );
}

function Dashboard({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const [selectedModule, setSelectedModule] = useState<ModuleKey>("leads");
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

  async function loadResources() {
    setLoading(true);
    const nextResources = emptyResourceMap();
    const nextPagination = emptyPaginationMap();
    const nextErrors: Record<string, string> = {};
    await Promise.all(adminModules.map(async (module) => {
      try {
        const data = await listResource<ResourceRow>(module.endpoint);
        nextResources[module.key] = data.results;
        nextPagination[module.key] = { page: 1, pageSize: 25, count: data.count };
      } catch {
        nextResources[module.key] = [];
        nextErrors[module.key] = "No se pudo cargar este módulo. Revise permisos, sesión o API.";
      }
    }));
    setResources(nextResources);
    setPagination(nextPagination);
    setErrors(nextErrors);
    setLoading(false);
    getDashboard().then(setDashboard).catch(() => setDashboard(null));
    listEligibleLeadAssignees().then(setEligibleAssignees).catch(() => setEligibleAssignees([]));
  }

  useEffect(() => {
    let mounted = true;
    loadResources().catch(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

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

  const selected = adminModules.find((module) => module.key === selectedModule) ?? adminModules[0];
  const selectedRows = resources[selected.key] ?? [];
  const metrics = useMemo<Array<[string, string | number, typeof Users]>>(() => [
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

  const editableModules: ModuleKey[] = ["leads", "customers", "properties", "quotes"];
  const canEdit = ["superadmin", "managing_partner", "operations", "sales"].includes(user.role);

  return (
    <main className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-heading">
          <LayoutDashboard size={22} />
          <span>Portal operativo</span>
        </div>
        {adminModules.map((module) => {
          const Icon = module.icon;
          return (
            <button className={selectedModule === module.key ? "active" : ""} key={module.key} onClick={() => setSelectedModule(module.key)}>
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
        <div className="metric-grid">
          {metrics.map(([label, value, Icon]) => (
            <article className="metric" key={label as string}>
              <Icon size={22} />
              <strong>{value as string}</strong>
              <span>{label as string}</span>
            </article>
          ))}
        </div>
        <div className="table-panel">
          <div className="module-heading">
            <div>
              <p className="eyebrow">{selected.group}</p>
              <h2>{selected.label}</h2>
              <p>{selected.description}</p>
            </div>
            <div className="admin-actions">
              <span className="user-pill">{loading ? "Cargando" : `${selectedRows.length} registros`}</span>
              {canEdit && editableModules.includes(selected.key) && (
                <button className="primary" onClick={() => { setEditing(null); setShowEditor(true); }}>Nuevo</button>
              )}
            </div>
          </div>
          <form className="admin-filters" onSubmit={filterSelected}>
            <label>Buscar<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, correo, teléfono o zona" /></label>
            <label>Estado<input value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} placeholder="new, sent, completed…" /></label>
            <button className="ghost">Aplicar filtros</button>
            <button className="ghost" type="button" onClick={() => { setSearch(""); setStatusFilter(""); void loadSelectedPage(1, pagination[selected.key].pageSize, "", ""); }}>Limpiar filtros</button>
          </form>
          {notice && <p className="success" role="status">{notice}</p>}
          {errors[selected.key] && <p className="error">{errors[selected.key]}</p>}
          {!errors[selected.key] && selectedRows.length === 0 ? (
            <p>No hay registros cargados para este modulo o falta sembrar datos de prueba.</p>
          ) : (
            <div className="admin-table" role="table" aria-label={`Listado de ${selected.label}`}>
              <div className="admin-table-head" role="row">
                <span>Registro</span>
                {selected.fields.slice(0, 4).map((field) => <span key={field}>{formatFieldName(field)}</span>)}
              </div>
              {selectedRows.slice(0, 8).map((row, index) => (
                <div className="admin-table-row" role="row" key={row.id ?? `${selected.key}-${index}`}>
                  <strong>{rowLabel(row, index)}</strong>
                  {selected.fields.slice(0, 4).map((field) => <span key={field}>{formatValue(row[field])}</span>)}
                  {canEdit && editableModules.includes(selected.key) && <button className="ghost" onClick={() => { setEditing(row); setShowEditor(true); }}>Editar</button>}
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
              onSaved={async (message) => { setShowEditor(false); setNotice(message); await loadResources(); }}
            />
          )}
          {selected.key === "work-orders" && <Agenda workers={resources.workers} canEdit={canEdit} />}
          {dashboard && selected.key === "leads" && (
            <section className="recent-activity">
              <h3>Actividad reciente</h3>
              {dashboard.recent_activity.map((item) => <p key={`${item.type}-${item.id}`}><strong>{item.label}</strong> · {item.status} · {formatValue(item.at)}</p>)}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function OperationalEditor({
  module,
  row,
  resources,
  eligibleAssignees,
  onClose,
  onSaved
}: {
  module: ModuleKey;
  row: ResourceRow | null;
  resources: Record<ModuleKey, ResourceRow[]>;
  eligibleAssignees: SessionUser[];
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [form, setForm] = useState<Record<string, string | boolean>>(() => editorDefaults(module, row));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const field = (name: string, value: string | boolean) => setForm((current) => ({ ...current, [name]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = editorPayload(module, form);
      if (row?.id) await updateResource(adminModules.find((item) => item.key === module)!.endpoint, row.id, payload);
      else await createResource(adminModules.find((item) => item.key === module)!.endpoint, payload);
      await onSaved(row ? "Registro actualizado." : "Registro creado.");
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function action(name: string, payload: unknown = {}) {
    if (!row?.id) return;
    setSaving(true);
    setError("");
    try {
      await resourceAction(adminModules.find((item) => item.key === module)!.endpoint, row.id, name, payload);
      await onSaved(`Acción ${name} completada.`);
    } catch (caught) {
      setError(apiErrorMessage(caught));
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="editor-panel" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <div className="module-heading">
          <h3 id="editor-title">{row ? "Editar" : "Crear"} {moduleLabel(module)}</h3>
          <button className="ghost" type="button" onClick={onClose} aria-label="Cerrar editor"><X size={18} /></button>
        </div>
        <form className="editor-form" onSubmit={submit}>
          {module === "leads" && <>
            <label>Nombre<input required value={String(form.full_name)} onChange={(e) => field("full_name", e.target.value)} /></label>
            <label>Correo<input type="email" value={String(form.email)} onChange={(e) => field("email", e.target.value)} /></label>
            <label>Teléfono<input required value={String(form.phone)} onChange={(e) => field("phone", e.target.value)} /></label>
            <label>Servicio<input value={String(form.requested_service)} onChange={(e) => field("requested_service", e.target.value)} /></label>
            <label>Estado<select value={String(form.status)} onChange={(e) => field("status", e.target.value)}><option value="new">Nuevo</option><option value="contacted">Contactado</option><option value="qualified">Calificado</option><option value="lost">Perdido</option><option value="won">Convertido</option></select></label>
            <label>Responsable<select value={String(form.assigned_to)} onChange={(e) => field("assigned_to", e.target.value)}><option value="">Sin asignar</option>{eligibleAssignees.map((item) => <option key={item.id} value={item.id}>{`${item.first_name} ${item.last_name}`.trim() || item.email}</option>)}</select></label>
            <label className="wide">Notas<textarea value={String(form.notes)} onChange={(e) => field("notes", e.target.value)} /></label>
            <label className="check"><input type="checkbox" checked={Boolean(form.consent_data_processing)} onChange={(e) => field("consent_data_processing", e.target.checked)} /> Consentimiento de datos</label>
          </>}
          {module === "customers" && <>
            <label>Nombre<input required value={String(form.display_name)} onChange={(e) => field("display_name", e.target.value)} /></label>
            <label>Tipo<select value={String(form.customer_type)} onChange={(e) => field("customer_type", e.target.value)}><option value="individual">Persona</option><option value="business">Empresa</option><option value="property_manager">Administrador de propiedades</option></select></label>
            <label>Correo<input type="email" value={String(form.email)} onChange={(e) => field("email", e.target.value)} /></label>
            <label>Teléfono<input value={String(form.phone)} onChange={(e) => field("phone", e.target.value)} /></label>
            <label>Estado<select value={String(form.status)} onChange={(e) => field("status", e.target.value)}><option value="active">Activo</option><option value="inactive">Inactivo</option><option value="delinquent">Moroso</option></select></label>
            <label>Etiquetas<input value={String(form.tags)} onChange={(e) => field("tags", e.target.value)} placeholder="airbnb, recurrente" /></label>
            <label className="wide">Notas<textarea value={String(form.notes)} onChange={(e) => field("notes", e.target.value)} /></label>
          </>}
          {module === "properties" && <>
            <label>Cliente<select required value={String(form.customer)} onChange={(e) => field("customer", e.target.value)}><option value="">Seleccione</option>{resources.customers.map((item) => <option key={String(item.id)} value={String(item.id)}>{rowLabel(item, 0)}</option>)}</select></label>
            <label>Nombre<input required value={String(form.name)} onChange={(e) => field("name", e.target.value)} /></label>
            <label className="wide">Dirección<textarea required value={String(form.address)} onChange={(e) => field("address", e.target.value)} /></label>
            <label>Zona<input required value={String(form.zone)} onChange={(e) => field("zone", e.target.value)} /></label>
            <label>Tipo<select value={String(form.property_type)} onChange={(e) => field("property_type", e.target.value)}><option value="home">Residencial</option><option value="office">Oficina</option><option value="vacation">Vacacional / Airbnb</option></select></label>
            <label>Dormitorios<input type="number" min="0" value={String(form.bedrooms)} onChange={(e) => field("bedrooms", e.target.value)} /></label>
            <label>Baños<input type="number" min="0" step="0.5" value={String(form.bathrooms)} onChange={(e) => field("bathrooms", e.target.value)} /></label>
            <label>Tamaño m²<input type="number" min="0" value={String(form.area_m2)} onChange={(e) => field("area_m2", e.target.value)} /></label>
            <label>Frecuencia<input value={String(form.frequency)} onChange={(e) => field("frequency", e.target.value)} /></label>
            <label className="wide">Indicaciones operativas<textarea value={String(form.operational_notes)} onChange={(e) => field("operational_notes", e.target.value)} /></label>
            <label className="wide">Acceso protegido<textarea value={String(form.access_instructions)} onChange={(e) => field("access_instructions", e.target.value)} /></label>
          </>}
          {module === "quotes" && <>
            <label>Cliente<select name="quote_customer" required value={String(form.customer)} onChange={(e) => field("customer", e.target.value)}><option value="">Seleccione</option>{resources.customers.map((item) => <option key={String(item.id)} value={String(item.id)}>{rowLabel(item, 0)}</option>)}</select></label>
            <label>Propiedad<select name="quote_property" required value={String(form.property)} onChange={(e) => field("property", e.target.value)}><option value="">Seleccione</option>{resources.properties.filter((item) => !form.customer || item.customer === form.customer).map((item) => <option key={String(item.id)} value={String(item.id)}>{rowLabel(item, 0)}</option>)}</select></label>
            <label>Servicio<select name="quote_service" required value={String(form.service)} onChange={(e) => field("service", e.target.value)}><option value="">Seleccione</option>{resources.services.map((item) => <option key={String(item.id)} value={String(item.id)}>{rowLabel(item, 0)}</option>)}</select></label>
            <label>Descripción<input required value={String(form.description)} onChange={(e) => field("description", e.target.value)} /></label>
            <label>Cantidad<input type="number" min="0.01" step="0.01" value={String(form.quantity)} onChange={(e) => field("quantity", e.target.value)} /></label>
            <label>Precio unitario<input type="number" min="0" step="0.01" value={String(form.unit_price)} onChange={(e) => field("unit_price", e.target.value)} /></label>
            <label>Descuento<input type="number" min="0" step="0.01" value={String(form.discount)} onChange={(e) => field("discount", e.target.value)} /></label>
            <label>Impuesto (0–1)<input type="number" min="0" max="1" step="0.0001" value={String(form.tax_rate)} onChange={(e) => field("tax_rate", e.target.value)} /></label>
            <label>Vigente hasta<input type="date" required value={String(form.valid_until)} onChange={(e) => field("valid_until", e.target.value)} /></label>
            <label className="wide">Condiciones<textarea value={String(form.terms)} onChange={(e) => field("terms", e.target.value)} /></label>
            <label>Inicio del servicio<input type="datetime-local" value={String(form.scheduled_start)} onChange={(e) => field("scheduled_start", e.target.value)} /></label>
            <label>Fin del servicio<input type="datetime-local" value={String(form.scheduled_end)} onChange={(e) => field("scheduled_end", e.target.value)} /></label>
            {row && <p className="wide">Los totales mostrados se recalculan exclusivamente en Django.</p>}
          </>}
          {error && <p className="error wide" role="alert">{error}</p>}
          {row && <div className="wide"><ConsolidatedHistory module={module} row={row} /></div>}
          <div className="editor-actions wide">
            <button className="primary" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button>
            <button className="ghost" type="button" onClick={onClose}>Cancelar</button>
            {row && module === "leads" && <><button className="ghost" type="button" onClick={() => action("activities", { activity_type: "note", detail: form.notes })}>Registrar nota</button><button className="ghost" type="button" onClick={() => action("convert")}>Convertir en cliente</button><button className="ghost danger" type="button" onClick={() => action("archive")}>Archivar</button></>}
            {row && module === "customers" && <button className="ghost danger" type="button" onClick={() => action("archive")}>Archivar</button>}
            {row && module === "quotes" && <><button className="ghost" type="button" onClick={() => action("send")}>Marcar enviada</button><button className="ghost" type="button" onClick={() => action("accept")}>Aceptar</button><button className="ghost" type="button" onClick={() => action("convert-to-work-order", { scheduled_start: form.scheduled_start, scheduled_end: form.scheduled_end })}>Crear servicio</button></>}
          </div>
        </form>
      </section>
    </div>
  );
}

function Agenda({ workers, canEdit }: { workers: ResourceRow[]; canEdit: boolean }) {
  const today = new Date().toISOString().slice(0, 10);
  const [anchor, setAnchor] = useState(today);
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [statusFilter, setStatusFilter] = useState("");
  const [workerFilter, setWorkerFilter] = useState("");
  const [rows, setRows] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rescheduling, setRescheduling] = useState<ResourceRow | null>(null);
  const [assigning, setAssigning] = useState<ResourceRow | null>(null);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const range = agendaRange(anchor, viewMode);

  async function loadAgenda() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ date_from: range.start, date_to: range.end, page_size: "100" });
    if (statusFilter) params.set("status", statusFilter);
    if (workerFilter) params.set("worker", workerFilter);
    try {
      setRows((await queryResource<ResourceRow>("work-orders", params)).results);
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadAgenda(); }, [anchor, viewMode, statusFilter, workerFilter]);

  async function transition(row: ResourceRow, status: string) {
    if (!row.id) return;
    try { await resourceAction("work-orders", row.id, "transition", { status }); await loadAgenda(); }
    catch (caught) { setError(apiErrorMessage(caught)); }
  }

  async function saveAssignment() {
    if (!assigning?.id) return;
    try { await resourceAction("work-orders", assigning.id, "assign", { worker_ids: selectedWorkers }); setAssigning(null); await loadAgenda(); }
    catch (caught) { setError(apiErrorMessage(caught)); }
  }

  const days = dateSequence(range.start, range.end);
  return (
    <section className="agenda-panel" aria-label="Agenda operativa">
      <div className="module-heading"><div><p className="eyebrow">Vista {viewMode === "day" ? "diaria" : "semanal"}</p><h3>Agenda operativa</h3><p>{range.start} — {range.end}</p></div>
        <div className="admin-actions"><button className={viewMode === "day" ? "primary" : "ghost"} onClick={() => setViewMode("day")}>Día</button><button className={viewMode === "week" ? "primary" : "ghost"} onClick={() => setViewMode("week")}>Semana</button></div>
      </div>
      <div className="agenda-toolbar">
        <button className="ghost" onClick={() => setAnchor(shiftDate(anchor, viewMode === "day" ? -1 : -7))} aria-label="Periodo anterior">Anterior</button>
        <button className="ghost" onClick={() => setAnchor(today)}>Hoy</button>
        <button className="ghost" onClick={() => setAnchor(shiftDate(anchor, viewMode === "day" ? 1 : 7))} aria-label="Periodo siguiente">Siguiente</button>
        <label>Fecha<input type="date" value={anchor} onChange={(e) => setAnchor(e.target.value)} /></label>
        <label>Estado<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">Todos</option><option value="planned">Planificado</option><option value="confirmed">Confirmado</option><option value="in_progress">En proceso</option><option value="completed">Completado</option><option value="cancelled">Cancelado</option></select></label>
        <label>Personal<select value={workerFilter} onChange={(e) => setWorkerFilter(e.target.value)}><option value="">Todo el personal</option>{workers.filter((worker) => worker.status === "active").map((worker) => <option key={String(worker.id)} value={String(worker.id)}>{rowLabel(worker, 0)}</option>)}</select></label>
        {(statusFilter || workerFilter) && <button className="ghost" onClick={() => { setStatusFilter(""); setWorkerFilter(""); }}>Limpiar filtros</button>}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {loading && <p role="status">Cargando agenda…</p>}
      {!loading && rows.length === 0 && <p>No hay servicios para el periodo y filtros seleccionados.</p>}
      <div className={viewMode === "week" ? "agenda-week" : "agenda-grid"}>
        {days.map((day) => <section className="agenda-day" key={day}><h4>{new Intl.DateTimeFormat("es-CR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`))}</h4>
          {rows.filter((row) => String(row.scheduled_start).slice(0, 10) === day).map((row) => {
            const assignments = Array.isArray(row.assignments) ? row.assignments as ResourceRow[] : [];
            return <article className="agenda-card" key={String(row.id)}>
              <strong>{formatValue(row.scheduled_start)}</strong><span>{String(row.customer_name ?? "Cliente")}</span><span>{String(row.property_name ?? "Propiedad")}</span><span>Estado: {formatValue(row.status)}</span><span>Personal: {assignments.map((item) => String(item.worker_name)).join(", ") || "Sin asignar"}</span>
              {canEdit && <div className="admin-actions"><button className="ghost" onClick={() => setRescheduling(row)}>Reprogramar</button><button className="ghost" onClick={() => { setAssigning(row); setSelectedWorkers(assignments.map((item) => String(item.worker))); }}>Asignar personal</button>
                {row.status === "planned" && <button className="ghost" onClick={() => transition(row, "confirmed")}>Confirmar</button>}{row.status === "confirmed" && <button className="ghost" onClick={() => transition(row, "in_progress")}>Iniciar</button>}{row.status === "in_progress" && <button className="ghost" onClick={() => transition(row, "completed")}>Finalizar</button>}
              </div>}
              <HistoryTimeline row={row} />
            </article>;
          })}
        </section>)}
      </div>
      {rescheduling && <RescheduleDialog row={rescheduling} onClose={() => setRescheduling(null)} onSaved={async () => { setRescheduling(null); await loadAgenda(); }} />}
      {assigning && <div className="modal-backdrop"><section className="editor-panel assignment-dialog" role="dialog" aria-modal="true" aria-labelledby="assignment-title"><h3 id="assignment-title">Asignar personal</h3><div className="check-list">{workers.filter((worker) => worker.status === "active").map((worker) => <label className="check" key={String(worker.id)}><input type="checkbox" checked={selectedWorkers.includes(String(worker.id))} onChange={(e) => setSelectedWorkers((current) => e.target.checked ? [...current, String(worker.id)] : current.filter((id) => id !== String(worker.id)))} />{rowLabel(worker, 0)}</label>)}</div><div className="editor-actions"><button className="primary" onClick={saveAssignment}>Confirmar asignación</button><button className="ghost" onClick={() => setAssigning(null)}>Cancelar</button></div></section></div>}
    </section>
  );
}

function RescheduleDialog({ row, onClose, onSaved }: { row: ResourceRow; onClose: () => void; onSaved: () => Promise<void> }) {
  const local = (value: unknown) => String(value ?? "").slice(0, 16);
  const [start, setStart] = useState(local(row.scheduled_start));
  const [end, setEnd] = useState(local(row.scheduled_end));
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) { event.preventDefault(); try { await resourceAction("work-orders", String(row.id), "reschedule", { scheduled_start: start, scheduled_end: end, reason }); await onSaved(); } catch (caught) { setError(apiErrorMessage(caught)); } }
  return <div className="modal-backdrop"><section className="editor-panel" role="dialog" aria-modal="true" aria-labelledby="reschedule-title"><h3 id="reschedule-title">Reprogramar servicio</h3><form className="editor-form" onSubmit={submit}><label>Nuevo inicio<input required type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} /></label><label>Nuevo fin<input required type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} /></label><label className="wide">Motivo<textarea required value={reason} onChange={(e) => setReason(e.target.value)} /></label>{error && <p className="error wide" role="alert">{error}</p>}<div className="editor-actions wide"><button className="primary">Confirmar reprogramación</button><button className="ghost" type="button" onClick={onClose}>Cancelar</button></div></form></section></div>;
}

function HistoryTimeline({ row }: { row: ResourceRow }) {
  const events = Array.isArray(row.status_history) ? row.status_history as ResourceRow[] : [];
  if (!events.length) return <details><summary>Historial</summary><p>Sin actividad registrada.</p></details>;
  return <details><summary>Historial ({events.length})</summary><ol className="history-timeline">{events.map((event, index) => <li key={String(event.id ?? index)}><time>{formatValue(event.created_at)}</time><strong>{String(event.from_status || "Registro")} → {String(event.to_status || "Actualización")}</strong><span>{String(event.notes || "Sin notas")}</span><small>{String(event.changed_by_name || "Sistema")}</small></li>)}</ol></details>;
}

function ConsolidatedHistory({ module, row }: { module: ModuleKey; row: ResourceRow }) {
  const source = module === "leads" && Array.isArray(row.activities) ? row.activities : Array.isArray(row.status_history) ? row.status_history : [];
  const events = (source as ResourceRow[]).map((event) => ({
    id: event.id,
    at: event.created_at,
    actor: event.created_by_name ?? event.changed_by_name ?? "Sistema",
    title: event.activity_type ?? `${event.from_status || "Registro"} → ${event.to_status || "Actualización"}`,
    detail: event.detail ?? event.notes ?? "Sin notas",
  }));
  if (row.created_at) events.push({ id: "created", at: row.created_at, actor: "Sistema", title: "Creación", detail: `${moduleLabel(module)} creado.` });
  if (row.updated_at && row.updated_at !== row.created_at) events.push({ id: "updated", at: row.updated_at, actor: "Sistema", title: "Última actualización", detail: "Datos operativos actualizados." });
  events.sort((left, right) => String(right.at).localeCompare(String(left.at)));
  return <section aria-labelledby="history-title"><h4 id="history-title">Historial consolidado</h4>{events.length === 0 ? <p>Sin actividad registrada.</p> : <ol className="history-timeline">{events.map((event, index) => <li key={String(event.id ?? index)}><time>{formatValue(event.at)}</time><strong>{String(event.title)}</strong><span>{String(event.detail)}</span><small>{String(event.actor)}</small></li>)}</ol>}</section>;
}

function shiftDate(date: string, days: number) { const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); }
function agendaRange(anchor: string, mode: "day" | "week") { if (mode === "day") return { start: anchor, end: anchor }; const value = new Date(`${anchor}T12:00:00Z`); const mondayOffset = (value.getUTCDay() + 6) % 7; return { start: shiftDate(anchor, -mondayOffset), end: shiftDate(anchor, 6 - mondayOffset) }; }
function dateSequence(start: string, end: string) { const dates: string[] = []; for (let current = start; current <= end; current = shiftDate(current, 1)) dates.push(current); return dates; }

function editorDefaults(module: ModuleKey, row: ResourceRow | null): Record<string, string | boolean> {
  const value = (name: string, fallback = "") => String(row?.[name] ?? fallback);
  if (module === "leads") return { full_name: value("full_name"), email: value("email"), phone: value("phone"), requested_service: value("requested_service"), status: value("status", "new"), assigned_to: value("assigned_to"), notes: value("notes"), consent_data_processing: Boolean(row?.consent_data_processing ?? true) };
  if (module === "customers") return { display_name: value("display_name"), customer_type: value("customer_type", "individual"), email: value("email"), phone: value("phone"), status: value("status", "active"), tags: Array.isArray(row?.tags) ? row.tags.join(", ") : "", notes: value("notes") };
  if (module === "properties") return { customer: value("customer"), name: value("name"), address: value("address"), zone: value("zone"), property_type: value("property_type", "home"), bedrooms: value("bedrooms", "0"), bathrooms: value("bathrooms", "0"), area_m2: value("area_m2"), frequency: value("frequency"), operational_notes: value("operational_notes"), access_instructions: value("access_instructions") };
  const line = Array.isArray(row?.lines) ? row.lines[0] as Record<string, unknown> | undefined : undefined;
  return { customer: value("customer"), property: value("property"), service: String(line?.service ?? ""), description: String(line?.description ?? ""), quantity: String(line?.quantity ?? "1"), unit_price: String(line?.unit_price ?? "0"), discount: value("discount", "0"), tax_rate: String(line?.tax_rate ?? "0.13"), valid_until: value("valid_until", new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)), terms: value("terms"), scheduled_start: "", scheduled_end: "" };
}

function editorPayload(module: ModuleKey, form: Record<string, string | boolean>): unknown {
  if (module === "leads") return { ...form, assigned_to: form.assigned_to || null };
  if (module === "customers") return { ...form, tags: String(form.tags).split(",").map((tag) => tag.trim()).filter(Boolean) };
  if (module === "properties") return { ...form, bedrooms: Number(form.bedrooms), bathrooms: String(form.bathrooms), area_m2: form.area_m2 ? Number(form.area_m2) : null };
  if (module === "quotes") return { customer: form.customer, property: form.property, currency: "CRC", valid_until: form.valid_until, discount: form.discount, terms: form.terms, lines: [{ service: form.service, description: form.description, quantity: form.quantity, estimated_hours: "0", unit_price: form.unit_price, tax_rate: form.tax_rate, expected_cost: "0" }] };
  return form;
}

function moduleLabel(module: ModuleKey) {
  return adminModules.find((item) => item.key === module)?.label ?? module;
}

function apiErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "Error inesperado.";
  try {
    const parsed = JSON.parse(error.message);
    return parsed.detail ?? Object.values(parsed).flat().join(" ");
  } catch {
    return error.message;
  }
}

function formatMoney(value: string) {
  return new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(Number(value));
}

function rowLabel(row: ResourceRow, index: number) {
  return String(row.full_name ?? row.display_name ?? row.name_es ?? row.name ?? row.title ?? row.id ?? `Registro ${index + 1}`);
}

function formatFieldName(field: string) {
  return field.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "Si" : "No";
  }
  if (typeof value === "number") {
    return new Intl.NumberFormat("es-CR").format(value);
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Intl.DateTimeFormat("es-CR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  }
  return String(value);
}

function Policies() {
  return (
    <main className="section legal">
      <h1>Politicas y terminos</h1>
      <h2>Privacidad y consentimiento</h2>
      <p>Pacifica Cleaning recopila unicamente los datos necesarios para responder solicitudes, cotizar, agendar y ejecutar servicios. El tratamiento requiere consentimiento y puede revocarse.</p>
      <h2>Cancelaciones</h2>
      <p>Las cancelaciones y reprogramaciones se gestionan segun la anticipacion, disponibilidad y costos ya incurridos.</p>
      <h2>Cookies</h2>
      <p>La analitica y pixeles comerciales se activaran solo cuando exista consentimiento aplicable.</p>
      <h2>Trabajo con nosotros</h2>
      <p>Los expedientes de personal laboral y prestadores independientes se mantienen separados para evitar mezclar obligaciones y controles.</p>
    </main>
  );
}

function NotFound({ setView }: { setView: (view: View) => void }) {
  return <main className="section legal"><p className="eyebrow">404</p><h1>Página no encontrada</h1><p>La ruta solicitada no existe.</p><button className="primary" onClick={() => setView("public")}>Volver al inicio</button></main>;
}
