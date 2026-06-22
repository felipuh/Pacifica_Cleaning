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
  Menu,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X
} from "lucide-react";
import { createLead, getMe, listResource, login, SessionUser } from "./api";
import { benefits, coverageZones, faqs, processSteps, services, whatsappUrl } from "./content";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const setAppView = (nextView: View) => {
    setView(nextView);
    closeMenu();
  };

  return (
    <header className="topbar">
      <button className="brand" onClick={() => setView("public")} aria-label="Inicio Pacifica Cleaning">
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
      <TestimonialsSection />
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

function TestimonialsSection() {
  return (
    <section className="section testimonials-section">
      <div className="section-heading reveal">
        <div>
          <p className="eyebrow">Testimonios</p>
          <h2>Opiniones de clientes</h2>
        </div>
      </div>
      <div className="testimonial-grid">
        {["Testimonio pendiente de cliente real.", "Aquí se mostrará la opinión de clientes satisfechos.", "Espacio reservado para una reseña verificada."].map((text) => (
          <article className="testimonial-card reveal" key={text}>
            <div className="stars" aria-label="Espacio para calificación">
              <Star size={17} /><Star size={17} /><Star size={17} /><Star size={17} /><Star size={17} />
            </div>
            <p>{text}</p>
            <span>Reemplazar por testimonio real</span>
          </article>
        ))}
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
