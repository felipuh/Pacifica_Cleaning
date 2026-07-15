import { useEffect, useState } from "react";
import type React from "react";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Home,
  Hotel,
  KeyRound,
  Leaf,
  Menu,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  X
} from "lucide-react";
import { createLead } from "../api";
import { benefits, coverageZones, faqs, processSteps, services, whatsappUrl } from "../content";
import { publicSectionHref, type View } from "../routing";
import { usePublicLanguage } from "./i18n";

export function PublicHeader({ view, setView }: { view: View; setView: (view: View) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { language, pick, setLanguage } = usePublicLanguage();
  const closeMenu = () => setMenuOpen(false);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);
  const setAppView = (nextView: View) => {
    setView(nextView);
    closeMenu();
  };

  return (
    <header className="topbar">
      <button className="brand" onClick={() => setAppView("public")} aria-label={pick("Inicio Pacifica Cleaning", "Pacifica Cleaning home")}>
        <span className="brand-mark">PC</span>
        <span>
          <strong>PACÍFICA</strong>
          <small>Cleaning</small>
        </span>
      </button>
      <button className="menu-toggle" onClick={() => setMenuOpen((current) => !current)} aria-label={pick("Abrir menú", "Open menu")} aria-expanded={menuOpen}>
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <nav className={menuOpen ? "open" : ""} aria-label={pick("Navegación principal", "Main navigation")}>
        <button className={view === "public" ? "active" : ""} onClick={() => setAppView("public")}>{pick("Inicio", "Home")}</button>
        <a href={publicSectionHref("servicios", language)} onClick={closeMenu}>{pick("Servicios", "Services")}</a>
        <a href={publicSectionHref("airbnb", language)} onClick={closeMenu}>Airbnb</a>
        <a href={publicSectionHref("proceso", language)} onClick={closeMenu}>{pick("Proceso", "Process")}</a>
        <a href={publicSectionHref("cotizar", language)} onClick={closeMenu}>{pick("Contacto", "Contact")}</a>
        <button className={view === "admin" ? "active" : ""} onClick={() => setAppView("admin")}>Admin</button>
        <button className={view === "policies" ? "active" : ""} onClick={() => setAppView("policies")}>{pick("Legal", "Legal")}</button>
        <span className="language-switch" aria-label={pick("Idioma", "Language")}>
          <button className={language === "es" ? "active" : ""} onClick={() => setLanguage("es")} aria-pressed={language === "es"}>ES</button>
          <button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")} aria-pressed={language === "en"}>EN</button>
        </span>
      </nav>
      <a className="header-cta" href={whatsappUrl} target="_blank" rel="noreferrer">
        <MessageCircle size={18} /> {pick("Cotizar", "Quote")}
      </a>
    </header>
  );
}

export function PublicSite() {
  return (
    <>
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
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

function Hero() {
  const { pick } = usePublicLanguage();
  return (
    <section className="hero" id="inicio">
      <div className="hero-copy reveal">
        <p className="eyebrow">Tempate, Guanacaste</p>
        <h1>{pick("Limpieza profesional para hogares y propiedades vacacionales en Guanacaste", "Professional cleaning for homes and vacation rentals in Guanacaste")}</h1>
        <p>{pick("Cuidamos cada espacio con detalle, puntualidad y confianza. Ideal para casas, Airbnb, alquileres vacacionales y propiedades familiares.", "We care for every space with detail, punctuality and trust. Ideal for homes, Airbnb properties and vacation rentals.")}</p>
        <div className="hero-actions">
          <a className="primary" href={whatsappUrl} target="_blank" rel="noreferrer">
            <MessageCircle size={19} /> {pick("Solicitar cotización", "Request a quote")}
          </a>
          <a className="ghost" href="#servicios">
            {pick("Ver servicios", "View services")} <ChevronRight size={18} />
          </a>
        </div>
        <div className="hero-badges" aria-label="Beneficios principales">
          <span><ShieldCheck size={16} /> {pick("Servicio confiable", "Reliable service")}</span>
          <span><MessageCircle size={16} /> {pick("Atención por WhatsApp", "WhatsApp support")}</span>
          <span><Hotel size={16} /> {pick("Ideal para Airbnb", "Airbnb ready")}</span>
          <span><Sparkles size={16} /> {pick("Limpieza residencial", "Residential cleaning")}</span>
        </div>
      </div>
      <div className="hero-visual reveal delay-1">
        <img
          src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=82"
          alt={pick("Profesional de limpieza preparando una sala residencial luminosa", "Cleaning professional preparing a bright residential room")}
        />
        <div className="floating-card top">
          <BadgeCheck size={19} />
          <span>{pick("Más que limpieza, tranquilidad para tu hogar.", "More than cleaning: peace of mind for your home.")}</span>
        </div>
        <div className="floating-card bottom">
          <strong>24h</strong>
          <span>{pick("Seguimiento inicial y coordinación clara.", "Initial follow-up and clear coordination.")}</span>
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  const { language, pick } = usePublicLanguage();
  const icons = [Home, Sparkles, CalendarDays, KeyRound, ClipboardCheck, Building2];
  const englishServices = [
    ["Residential cleaning", "Clear routines for family homes, condominiums and occupied spaces, tailored to preferences and special instructions."],
    ["Deep cleaning", "Detailed service for resets, moves, high season or properties that need an extra level of care."],
    ["Recurring cleaning", "Weekly, biweekly or monthly plans to keep every space clean, fresh and presentable."],
    ["Airbnb cleaning", "Turnover preparation, pre-check-in support and a basic visual review for hosts and property managers."],
    ["Post-event cleaning", "We restore order after meetings, family celebrations and events at vacation properties."],
    ["Offices and small businesses", "Discreet, punctual cleaning for offices, practices and low-to-medium-occupancy workplaces."]
  ];
  return (
    <section id="servicios" className="section">
      <div className="section-heading reveal">
        <div>
          <p className="eyebrow">{pick("Servicios", "Services")}</p>
          <h2>{pick("Soluciones de limpieza listas para hogares, negocios y reservas.", "Cleaning solutions for homes, businesses and reservations.")}</h2>
        </div>
        <a className="section-link" href={whatsappUrl} target="_blank" rel="noreferrer">{pick("Cotizar un servicio", "Quote a service")}</a>
      </div>
      <div className="service-grid">
        {services.map((service, index) => {
          const Icon = icons[index] ?? ClipboardCheck;
          return (
            <article key={service.title} className="service-card reveal">
              <span className="icon-chip"><Icon size={23} /></span>
              <h3>{language === "en" ? englishServices[index][0] : service.title}</h3>
              <p>{language === "en" ? englishServices[index][1] : service.detail}</p>
              <a href="#cotizar">{pick("Solicitar información", "Request information")} <ChevronRight size={16} /></a>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BenefitsSection() {
  const { language, pick } = usePublicLanguage();
  const englishBenefits = ["Punctual, clear coordination", "Trustworthy and respectful staff", "Fast WhatsApp support", "Detailed, consistent cleaning", "Vacation-rental expertise", "Flexible recurring plans", "Local Guanacaste service", "Simple, hassle-free quoting"];
  return (
    <section className="benefits-band">
      <div className="benefits-copy reveal">
        <p className="eyebrow">{pick("Por qué elegirnos", "Why choose us")}</p>
        <h2>{pick("Servicio local, confiable y puntual en Guanacaste.", "Local, reliable and punctual service in Guanacaste.")}</h2>
        <p>{pick("Combinamos procesos claros con una atención humana y cercana para que cada limpieza se sienta ordenada desde el primer mensaje.", "We combine clear processes with friendly, personal service so every cleaning feels organized from the first message.")}</p>
      </div>
      <div className="benefits-grid">
        {benefits.map((benefit, index) => (
          <article key={benefit} className="benefit-item reveal">
            <CheckCircle2 size={20} />
            <span>{language === "en" ? englishBenefits[index] : benefit}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function AirbnbSection() {
  const { pick } = usePublicLanguage();
  return (
    <section id="airbnb" className="airbnb-section">
      <div className="airbnb-media reveal">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=82"
          alt={pick("Casa vacacional luminosa lista para huéspedes en Costa Rica", "Bright vacation home ready for guests in Costa Rica")}
          loading="lazy"
        />
      </div>
      <div className="airbnb-copy reveal delay-1">
        <p className="eyebrow">{pick("Airbnb y propiedades vacacionales", "Airbnb and vacation rentals")}</p>
        <h2>{pick("Espacios impecables para cada visita, reserva o familia.", "Impeccable spaces for every visit, reservation and family.")}</h2>
        <p>{pick("Apoyamos a anfitriones, administradores e inmobiliarias con limpieza entre reservas, preparación antes del check-in y reporte básico de incidencias.", "We support hosts, property managers and real-estate teams with turnover cleaning, check-in preparation and basic incident reporting.")}</p>
        <div className="feature-list">
          <span><KeyRound size={18} /> {pick("Preparación entre check-out y check-in", "Preparation between check-out and check-in")}</span>
          <span><Hotel size={18} /> {pick("Revisión visual básica del espacio", "Basic visual property review")}</span>
          <span><ClipboardCheck size={18} /> {pick("Seguimiento e incidencias autorizadas", "Authorized incident follow-up")}</span>
          <span><CalendarDays size={18} /> {pick("Servicio recurrente antes de cada reserva", "Recurring service before every reservation")}</span>
        </div>
        <a className="primary" href={whatsappUrl} target="_blank" rel="noreferrer">{pick("Solicitar plan para propiedades vacacionales", "Request a vacation-rental plan")}</a>
      </div>
    </section>
  );
}

function ProcessSection() {
  const { language, pick } = usePublicLanguage();
  const englishSteps = ["Write to us on WhatsApp or send the form.", "We collect details about the space, location and cleaning type.", "We send a clear quote based on scope, frequency and needs.", "We schedule the service and access instructions.", "We clean using a checklist and close attention to detail.", "We follow up to confirm satisfaction and future services."];
  return (
    <section id="proceso" className="section process-section">
      <div className="section-heading reveal">
        <div>
          <p className="eyebrow">{pick("Proceso", "Process")}</p>
          <h2>{pick("Cotizar es simple, claro y rápido.", "Getting a quote is simple, clear and fast.")}</h2>
        </div>
      </div>
      <ol className="process-grid">
        {processSteps.map((step, index) => (
          <li key={step} className="process-card reveal">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{language === "en" ? englishSteps[index] : step}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function TrustSection() {
  const { pick } = usePublicLanguage();
  return (
    <section className="section split trust-section">
      <div className="reveal">
        <p className="eyebrow">{pick("Cobertura inicial", "Service area")}</p>
        <h2>{pick("Atención local desde Tempate hacia zonas clave de Guanacaste.", "Local service from Tempate to key areas across Guanacaste.")}</h2>
        <div className="zones">{coverageZones.map((zone) => <span key={zone}>{zone}</span>)}</div>
      </div>
      <div className="trust-card reveal delay-1">
        <Leaf size={24} />
        <h3>{pick("Cuidamos tu hogar como si fuera nuestro.", "We care for your home as if it were our own.")}</h3>
        <p>{pick("Procesos verificables, consentimiento para evidencias y comunicación clara antes, durante y después del servicio.", "Verifiable processes, consent for evidence and clear communication before, during and after service.")}</p>
      </div>
    </section>
  );
}

function FinalCTA() {
  const { pick } = usePublicLanguage();
  return (
    <section className="final-cta reveal">
      <p className="eyebrow">{pick("Cotiza fácil por WhatsApp", "Easy quotes via WhatsApp")}</p>
      <h2>{pick("¿Listo para tener un espacio limpio, fresco y ordenado?", "Ready for a clean, fresh and organized space?")}</h2>
      <p>{pick("Solicita una cotización rápida por WhatsApp y cuéntanos qué tipo de limpieza necesitas.", "Request a quick quote on WhatsApp and tell us what type of cleaning you need.")}</p>
      <a className="primary" href={whatsappUrl} target="_blank" rel="noreferrer">
        <PhoneCall size={19} /> {pick("Cotizar por WhatsApp", "Quote via WhatsApp")}
      </a>
    </section>
  );
}

function FAQSection() {
  const { language, pick } = usePublicLanguage();
  const englishFaqs = [["Do you bring cleaning products?", "We confirm this according to the service, available inventory and customer preferences."], ["Can I request an inspection?", "Yes. The form allows you to request a visit or review before receiving a quote."], ["Do you work with Airbnb properties?", "Yes. Our operation supports check-in and check-out times, incidents and authorized evidence."], ["Are photos required?", "No. Photos are taken and stored only with express authorization."]];
  return (
    <section className="section">
      <div className="section-heading reveal">
        <div>
          <p className="eyebrow">FAQ</p>
          <h2>{pick("Preguntas frecuentes", "Frequently asked questions")}</h2>
        </div>
      </div>
      <div className="faq-list">
        {faqs.map(([question, answer], index) => (
          <details key={question} className="reveal">
            <summary>{language === "en" ? englishFaqs[index][0] : question}</summary>
            <p>{language === "en" ? englishFaqs[index][1] : answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  const { pick } = usePublicLanguage();
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
        <p>{pick("Limpieza profesional con atención al detalle para hogares, Airbnb y propiedades vacacionales en Guanacaste.", "Professional, detail-oriented cleaning for homes, Airbnb properties and vacation rentals in Guanacaste.")}</p>
      </div>
      <div>
        <h3>{pick("Servicios", "Services")}</h3>
        <a href="#servicios">{pick("Residencial", "Residential")}</a>
        <a href="#servicios">{pick("Profunda", "Deep cleaning")}</a>
        <a href="#airbnb">Airbnb</a>
        <a href="#servicios">{pick("Oficinas", "Offices")}</a>
      </div>
      <div>
        <h3>{pick("Zona de atención", "Service area")}</h3>
        <p>{pick("Tempate, Brasilito, Flamingo, Potrero, Huacas, Tamarindo y zonas cercanas.", "Tempate, Brasilito, Flamingo, Potrero, Huacas, Tamarindo and nearby areas.")}</p>
      </div>
      <div>
        <h3>{pick("Contacto", "Contact")}</h3>
        <a href={whatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a>
        <a href="#cotizar">{pick("Formulario de cotización", "Quote form")}</a>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>{pick("Volver arriba", "Back to top")}</button>
      </div>
      <p className="copyright">© {new Date().getFullYear()} Pacífica Cleaning. {pick("Derechos reservados.", "All rights reserved.")}</p>
    </footer>
  );
}

function WhatsAppButton() {
  const { pick } = usePublicLanguage();
  return (
    <a className="whatsapp-float" href={whatsappUrl} target="_blank" rel="noreferrer" aria-label={pick("Cotizar por WhatsApp", "Request a quote on WhatsApp")}>
      <MessageCircle size={24} />
    </a>
  );
}

function QuoteForm() {
  const { language, pick } = usePublicLanguage();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    preferred_language: language,
    requested_service: services[0].title,
    message: "",
    consent_data_processing: false,
    consent_marketing: false,
    source: "website",
    website: ""
  });
  const englishServiceNames = ["Residential cleaning", "Deep cleaning", "Recurring cleaning", "Airbnb cleaning", "Post-event cleaning", "Offices and small businesses"];

  useEffect(() => {
    setForm((current) => ({ ...current, preferred_language: language }));
  }, [language]);

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
        <p className="eyebrow">{pick("Cotización o inspección", "Quote or inspection")}</p>
        <h2>{pick("Cuéntenos qué necesita y coordinamos el siguiente paso", "Tell us what you need and we will coordinate the next step")}</h2>
      </div>
      <form className="quote-form" onSubmit={submit}>
        <label>{pick("Nombre", "Name")}<input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></label>
        <label>{pick("Correo", "Email")}<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>{pick("Teléfono", "Phone")}<input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
        <label>{pick("Servicio", "Service")}<select value={form.requested_service} onChange={(e) => setForm({ ...form, requested_service: e.target.value })}>{services.map((service, index) => <option key={service.title} value={service.title}>{language === "en" ? englishServiceNames[index] : service.title}</option>)}</select></label>
        <label className="wide">{pick("Mensaje", "Message")}<textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
        <label className="honeypot" aria-hidden="true" tabIndex={-1}>Sitio web<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></label>
        <label className="check"><input type="checkbox" required checked={form.consent_data_processing} onChange={(e) => setForm({ ...form, consent_data_processing: e.target.checked })} /> {pick("Acepto el tratamiento de datos para responder mi solicitud.", "I accept data processing so my request can be answered.")}</label>
        <label className="check"><input type="checkbox" checked={form.consent_marketing} onChange={(e) => setForm({ ...form, consent_marketing: e.target.checked })} /> {pick("Acepto recibir comunicaciones comerciales.", "I agree to receive marketing communications.")}</label>
        <button className="primary" disabled={status === "sending"}>{status === "sending" ? pick("Enviando...", "Sending...") : pick("Enviar solicitud", "Send request")}</button>
        {status === "sent" && <p className="success">{pick("Solicitud recibida.", "Request received.")}</p>}
        {status === "error" && <p className="error">{pick("No se pudo enviar. Revise los datos.", "The request could not be sent. Please review the information.")}</p>}
      </form>
    </section>
  );
}
