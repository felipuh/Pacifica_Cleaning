import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardCheck, DollarSign, Home, LayoutDashboard, LogIn, MessageCircle, ShieldCheck, Users } from "lucide-react";
import { createLead, getMe, listResource, login, SessionUser } from "./api";
import { coverageZones, faqs, services } from "./content";

type View = "public" | "admin" | "policies";

export function App() {
  const [view, setView] = useState<View>("public");
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    getMe().then(setUser).catch(() => undefined);
  }, []);

  return (
    <div className="app-shell">
      <Header view={view} setView={setView} user={user} />
      {view === "public" && <PublicSite />}
      {view === "admin" && <AdminPortal user={user} onLogin={setUser} />}
      {view === "policies" && <Policies />}
    </div>
  );
}

function Header({ view, setView, user }: { view: View; setView: (view: View) => void; user: SessionUser | null }) {
  return (
    <header className="topbar">
      <button className="brand" onClick={() => setView("public")} aria-label="Inicio Pacifica Cleaning">
        <span className="brand-mark">PC</span>
        <span>Pacifica Cleaning</span>
      </button>
      <nav aria-label="Navegacion principal">
        <button className={view === "public" ? "active" : ""} onClick={() => setView("public")}>Sitio</button>
        <button className={view === "admin" ? "active" : ""} onClick={() => setView("admin")}>Admin</button>
        <button className={view === "policies" ? "active" : ""} onClick={() => setView("policies")}>Legal</button>
      </nav>
      {user ? <span className="user-pill">{user.role}</span> : <span className="user-pill muted">Privado</span>}
    </header>
  );
}

function PublicSite() {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Tempate, Guanacaste</p>
          <h1>Pacifica Cleaning</h1>
          <p>Limpieza residencial, profunda y para propiedades vacacionales con procesos claros, seguimiento y atencion bilingue.</p>
          <div className="hero-actions">
            <a className="primary" href="#cotizar">Solicitar cotizacion</a>
            <a className="ghost" href="https://wa.me/" target="_blank" rel="noreferrer">
              <MessageCircle size={18} /> WhatsApp
            </a>
          </div>
        </div>
        <div className="hero-panel" aria-label="Resumen operativo">
          <div><strong>6</strong><span>servicios base</span></div>
          <div><strong>2</strong><span>idiomas</span></div>
          <div><strong>24h</strong><span>seguimiento inicial</span></div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Servicios</p>
          <h2>Opciones listas para cotizar y adaptar</h2>
        </div>
        <div className="service-grid">
          {services.map((service) => (
            <article key={service.title} className="service-card">
              <ClipboardCheck size={22} />
              <h3>{service.title}</h3>
              <p>{service.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="band">
        <div>
          <p className="eyebrow">Como funciona</p>
          <h2>Solicitud, inspeccion, cotizacion y servicio con checklist</h2>
        </div>
        <ol className="steps">
          <li>Recibimos datos, propiedad y consentimiento.</li>
          <li>Definimos alcance o inspeccion previa.</li>
          <li>Enviamos cotizacion con vigencia.</li>
          <li>Agendamos, ejecutamos y registramos calidad.</li>
        </ol>
      </section>

      <section className="section split">
        <div>
          <p className="eyebrow">Cobertura inicial</p>
          <h2>Zonas configurables desde operaciones</h2>
          <div className="zones">{coverageZones.map((zone) => <span key={zone}>{zone}</span>)}</div>
        </div>
        <div>
          <p className="eyebrow">Confianza</p>
          <h2>Procesos verificables</h2>
          <p>El sistema evita promesas no comprobadas: documentos, polizas, capacitaciones y consentimientos deben cargarse antes de mostrarse como evidencia comercial.</p>
        </div>
      </section>

      <QuoteForm />

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">FAQ</p>
          <h2>Preguntas frecuentes</h2>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
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

function AdminPortal({ user, onLogin }: { user: SessionUser | null; onLogin: (user: SessionUser) => void }) {
  if (!user) {
    return <LoginPanel onLogin={onLogin} />;
  }
  return <Dashboard user={user} />;
}

function LoginPanel({ onLogin }: { onLogin: (user: SessionUser) => void }) {
  const [email, setEmail] = useState("admin@pacifica.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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

  return (
    <main className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <LogIn size={28} />
        <h1>Portal administrativo</h1>
        <label>Correo<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Contrasena<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button className="primary">Entrar</button>
        {error && <p className="error">{error}</p>}
      </form>
    </main>
  );
}

function Dashboard({ user }: { user: SessionUser }) {
  const [leads, setLeads] = useState<Array<{ id: string; full_name: string; status: string }>>([]);

  useEffect(() => {
    listResource<{ id: string; full_name: string; status: string }>("leads").then((data) => setLeads(data.results)).catch(() => undefined);
  }, []);

  const metrics = useMemo(() => [
    ["Leads", leads.length.toString(), Users],
    ["Agenda", "0", CalendarDays],
    ["Cotizaciones", "0", ClipboardCheck],
    ["Pagos", "0", DollarSign]
  ], [leads.length]);

  return (
    <main className="admin-layout">
      <aside className="sidebar">
        <LayoutDashboard size={22} />
        <span>Dashboard</span>
        <span>CRM</span>
        <span>Agenda</span>
        <span>Finanzas</span>
        <span>Calidad</span>
      </aside>
      <section className="workspace">
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">Operacion</p>
            <h1>Panel de control</h1>
          </div>
          <span className="user-pill"><ShieldCheck size={16} /> {user.role}</span>
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
          <h2>Leads recientes</h2>
          {leads.length === 0 ? <p>No hay leads cargados o falta iniciar API.</p> : leads.map((lead) => (
            <div className="row" key={lead.id}><Home size={18} /><span>{lead.full_name}</span><strong>{lead.status}</strong></div>
          ))}
        </div>
      </section>
    </main>
  );
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
