import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Check, ChevronDown, Menu, MessageCircle, X } from "lucide-react";
import { createLead } from "../api";
import {
  coverageZones,
  faqs,
  formMessages,
  needOptions,
  processSteps,
  publicNavigation,
  services,
  trustPrinciples,
  whatsappUrl,
} from "../content";
import type { View } from "../routing";
import { usePublicLanguage } from "./i18n";

type PublicHeaderProps = { view: View; setView: (view: View) => void };
type ButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
};

const region = (name: string) => ({ "data-public-region": name });

export function Button({ children, className = "", disabled, href, onClick, type = "button" }: ButtonProps) {
  const classes = `button ${className}`.trim();
  if (href) return <a className={classes} href={href} onClick={onClick}>{children}</a>;
  return <button className={classes} disabled={disabled} onClick={onClick} type={type}>{children}</button>;
}

function Wordmark() {
  return <span className="wordmark">PACÍFICA CLEANING</span>;
}

function NavigationLinks({ onSelect }: { onSelect?: () => void }) {
  return (
    <>
      {publicNavigation.map((item) => <a key={item.href} href={item.href} onClick={onSelect}>{item.label}</a>)}
    </>
  );
}

export function MobileNavigation({ onNavigate }: { onNavigate: (view?: View) => void }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const panelId = "mobile-navigation";

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstLinkRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="mobile-navigation">
      <button
        ref={triggerRef}
        className="mobile-navigation__trigger"
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-controls={panelId}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      <div className="mobile-navigation__backdrop" hidden={!open} onClick={() => close(true)} />
      <nav id={panelId} className="mobile-navigation__panel" aria-label="Navegación principal" hidden={!open}>
        <div className="mobile-navigation__heading">
          <Wordmark />
          <button type="button" aria-label="Cerrar menú" onClick={() => close(true)}><X aria-hidden="true" /></button>
        </div>
        <a ref={firstLinkRef} href="/#necesidades" onClick={() => close()}>Hogares</a>
        {publicNavigation.slice(1).map((item) => <a key={item.href} href={item.href} onClick={() => close()}>{item.label}</a>)}
        <a href="/#cotizar" className="mobile-navigation__cta" onClick={() => close()}>Solicitar cotización</a>
        <button type="button" className="mobile-navigation__admin" onClick={() => { close(); onNavigate("admin"); }}>Admin</button>
      </nav>
    </div>
  );
}

export function PublicHeader({ view, setView }: PublicHeaderProps) {
  const { language, setLanguage } = usePublicLanguage();
  const goHome = () => setView("public");
  return (
    <header className="public-header" {...region("header")}>
      <a className="skip-link" href="#contenido-principal">Saltar al contenido</a>
      <div className="public-header__inner">
        <button className="public-header__brand" type="button" aria-label="Inicio Pacífica Cleaning" onClick={goHome}><Wordmark /></button>
        <nav className="desktop-navigation" aria-label="Navegación principal">
          <NavigationLinks />
          <button type="button" className="language-control" aria-label={`Idioma actual: ${language === "es" ? "español" : "inglés"}`} onClick={() => setLanguage(language === "es" ? "en" : "es")}>ES / EN</button>
          <button type="button" className={view === "admin" ? "active" : "admin-access"} onClick={() => setView("admin")}>Admin</button>
        </nav>
        <Button href="/#cotizar" className="button--primary public-header__cta">Solicitar cotización</Button>
        <MobileNavigation onNavigate={(next) => next && setView(next)} />
      </div>
    </header>
  );
}

export function SectionHeading({ eyebrow, children, id }: { eyebrow?: string; children: ReactNode; id?: string }) {
  return <div className="section-heading">{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2 id={id}>{children}</h2></div>;
}

export function PlaceholderMedia() {
  return <div className="placeholder-media" role="img" aria-label="Activo fotográfico pendiente"><span>[ACTIVO FOTOGRÁFICO POR PRODUCIR]</span></div>;
}

export function Accordion({ items, initialOpen = 0, groupLabel }: { items: ReadonlyArray<{ title: string; content: ReactNode }>; initialOpen?: number | null; groupLabel: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(initialOpen);
  const baseId = useId();
  return (
    <div className="accordion" aria-label={groupLabel}>
      {items.map((item, index) => {
        const open = openIndex === index;
        const triggerId = `${baseId}-trigger-${index}`;
        const panelId = `${baseId}-panel-${index}`;
        return (
          <div className="accordion__item" key={item.title}>
            <h3>
              <button id={triggerId} type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpenIndex(open ? null : index)}>
                <span>{item.title}</span><ChevronDown aria-hidden="true" />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={triggerId} hidden={!open} className="accordion__panel">{item.content}</div>
          </div>
        );
      })}
    </div>
  );
}

export function NeedSelector() {
  const items = needOptions.map((title) => ({ title, content: <p>[CONTENIDO POR VALIDAR]</p> }));
  return (
    <section id="necesidades" className="public-section need-selector" aria-labelledby="need-title" {...region("selector-de-necesidad")}>
      <SectionHeading id="need-title">Selector de necesidad</SectionHeading>
      <Accordion items={items} groupLabel="Selector de necesidad" />
    </section>
  );
}

export function ProcessTimeline() {
  return (
    <ol className="process-timeline">
      {processSteps.map((step, index) => <li key={step}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}
    </ol>
  );
}

export function ServiceList() {
  return <ol className="service-list">{services.map((service, index) => <li key={service}><span>{String(index + 1).padStart(2, "0")}</span><strong>{service}</strong></li>)}</ol>;
}

export function EvidenceSection() {
  return (
    <section className="public-section evidence-section" aria-labelledby="evidence-title" {...region("evidencia")}>
      <SectionHeading id="evidence-title">Evidencia</SectionHeading>
      <div className="evidence-placeholder">[CONTENIDO POR VALIDAR]</div>
    </section>
  );
}

export function TrustPrinciples() {
  return (
    <section className="public-section trust-section" aria-labelledby="trust-title" {...region("confianza")}>
      <SectionHeading id="trust-title">Confianza</SectionHeading>
      <div className="trust-principles">
        {trustPrinciples.map((principle) => <article key={principle}><Check aria-hidden="true" /><h3>{principle}</h3></article>)}
      </div>
      <div className="validation-placeholders">
        <div>[TESTIMONIO POR VALIDAR]</div><div>[MÉTRICA POR VALIDAR]</div><div>[CERTIFICACIÓN POR VALIDAR]</div>
      </div>
    </section>
  );
}

export function CoverageChips() {
  return <ul className="coverage-chips">{coverageZones.map((zone) => <li key={zone}>{zone}</li>)}</ul>;
}

type FieldShellProps = { id: string; label: string; error?: string; children: ReactNode; sharedError?: string };
export function FormField({ id, label, error, children, sharedError }: FieldShellProps) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {children}
      <div className="form-field__message">
        {error && <p className="form-field__error" id={`${id}-error`}>{error}</p>}
        {sharedError && <p className="form-field__error" id="contact-method-error" role="alert">{sharedError}</p>}
      </div>
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) { return <input {...props} />; }
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) { return <select {...props} />; }
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...props} />; }
export function Checkbox({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="checkbox"><input type="checkbox" {...props} /><span>{label}</span></label>;
}

export function ErrorSummary({ errors, summaryRef }: { errors: Record<string, string>; summaryRef: React.RefObject<HTMLDivElement | null> }) {
  const entries = Object.entries(errors).filter(([field]) => field !== "contact_method");
  if (!entries.length) return null;
  return (
    <div className="error-summary" role="alert" tabIndex={-1} ref={summaryRef}>
      <h3>Revise los datos</h3>
      <ul>{entries.map(([field, message]) => <li key={field}><a href={`#${field}`}>{message}</a></li>)}</ul>
    </div>
  );
}

export function Alert({ children }: { children: ReactNode }) { return <div className="alert" role="alert">{children}</div>; }
export function LoadingState() { return <span className="loading-state" role="status">{formMessages.sending}</span>; }
export function SuccessState() { return <div className="success-state" role="status">{formMessages.success}</div>; }

type QuoteFormValues = {
  full_name: string; email: string; phone: string; preferred_language: "es" | "en"; required_service: string;
  details: string; contact_consent: boolean; privacy_consent: boolean; website: string;
};

const initialForm = (language: "es" | "en"): QuoteFormValues => ({
  full_name: "", email: "", phone: "", preferred_language: language, required_service: services[0], details: "",
  contact_consent: false, privacy_consent: false, website: "",
});

export function QuoteForm() {
  const { language } = usePublicLanguage();
  const [form, setForm] = useState<QuoteFormValues>(() => initialForm(language));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contactTouched, setContactTouched] = useState({ email: false, phone: false });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => setForm((current) => ({ ...current, preferred_language: language })), [language]);

  const contactError = errors.contact_method;
  const describedBy = (field: string) => errors[field] ? `${field}-error` : undefined;
  const contactDescribedBy = (field: "email" | "phone") => [describedBy(field), contactError && "contact-method-error"].filter(Boolean).join(" ") || undefined;
  const isValidEmail = (value: string) => !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const isValidPhone = (value: string) => !value.trim() || /^\+?[\d\s().-]{8,20}$/.test(value.trim()) && value.replace(/\D/g, "").length >= 8;

  const update = <K extends keyof QuoteFormValues>(key: K, value: QuoteFormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (key !== "email" && key !== "phone") return;
    setErrors((current) => {
      const next = { ...current };
      const text = String(value);
      if (key === "email" && text.trim() && isValidEmail(text)) delete next.contact_method;
      if (key === "phone" && text.trim() && isValidPhone(text)) delete next.contact_method;
      if (key === "email" && isValidEmail(text)) delete next.email;
      if (key === "phone" && isValidPhone(text)) delete next.phone;
      return next;
    });
  };

  const validateContactField = (field: "email" | "phone") => {
    const value = form[field];
    const nextTouched = { ...contactTouched, [field]: true };
    setContactTouched(nextTouched);
    setErrors((current) => {
      const next = { ...current };
      if (field === "email" && value.trim() && !isValidEmail(value)) next.email = "Ingresa un correo electrónico válido.";
      else if (field === "phone" && value.trim() && !isValidPhone(value)) next.phone = "Ingresa un teléfono válido.";
      else delete next[field];
      if (nextTouched.email && nextTouched.phone && !form.email.trim() && !form.phone.trim()) next.contact_method = formMessages.contact;
      return next;
    });
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.full_name.trim()) nextErrors.full_name = "Nombre completo es requerido.";
    if (!form.email.trim() && !form.phone.trim()) nextErrors.contact_method = formMessages.contact;
    if (form.email.trim() && !isValidEmail(form.email)) nextErrors.email = "Ingresa un correo electrónico válido.";
    if (form.phone.trim() && !isValidPhone(form.phone)) nextErrors.phone = "Ingresa un teléfono válido.";
    if (!form.preferred_language) nextErrors.preferred_language = "Idioma preferido es requerido.";
    if (!form.required_service) nextErrors.required_service = "Servicio que necesita es requerido.";
    if (!form.contact_consent) nextErrors.contact_consent = "Debe autorizar el contacto para enviar la solicitud.";
    if (!form.privacy_consent) nextErrors.privacy_consent = formMessages.privacy;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStatus("idle");
      window.requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setStatus("loading");
    try {
      await createLead({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        preferred_language: form.preferred_language,
        requested_service: form.required_service,
        message: form.details,
        consent_data_processing: form.privacy_consent,
        consent_marketing: false,
        source: "website",
        website: form.website,
      });
      setStatus("success");
      setForm(initialForm(language));
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="quote-form" noValidate onSubmit={submit} aria-busy={status === "loading"}>
      <ErrorSummary errors={errors} summaryRef={summaryRef} />
      <div className="quote-form__grid">
        <FormField id="full_name" label="Nombre completo" error={errors.full_name}>
          <Input id="full_name" name="full_name" autoComplete="name" required value={form.full_name} aria-invalid={Boolean(errors.full_name)} aria-describedby={describedBy("full_name")} onChange={(e) => update("full_name", e.target.value)} />
        </FormField>
        <FormField id="email" label="Correo electrónico" error={errors.email} sharedError={contactError}>
          <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" value={form.email} aria-invalid={Boolean(errors.email || contactError)} aria-describedby={contactDescribedBy("email")} onBlur={() => validateContactField("email")} onChange={(e) => update("email", e.target.value)} />
        </FormField>
        <FormField id="phone" label="Teléfono" error={errors.phone}>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" value={form.phone} aria-invalid={Boolean(errors.phone || contactError)} aria-describedby={contactDescribedBy("phone")} onBlur={() => validateContactField("phone")} onChange={(e) => update("phone", e.target.value)} />
        </FormField>
        <FormField id="preferred_language" label="Idioma preferido" error={errors.preferred_language}>
          <Select id="preferred_language" name="preferred_language" required value={form.preferred_language} aria-invalid={Boolean(errors.preferred_language)} aria-describedby={describedBy("preferred_language")} onChange={(e) => update("preferred_language", e.target.value as "es" | "en")}><option value="es">Español</option><option value="en">English</option></Select>
        </FormField>
        <FormField id="required_service" label="Servicio que necesita" error={errors.required_service}>
          <Select id="required_service" name="required_service" required value={form.required_service} aria-invalid={Boolean(errors.required_service)} aria-describedby={describedBy("required_service")} onChange={(e) => update("required_service", e.target.value)}>{services.map((service) => <option key={service} value={service}>{service}</option>)}</Select>
        </FormField>
        <FormField id="details" label="Cuéntenos sobre el espacio y lo que necesita">
          <Textarea id="details" name="details" rows={5} value={form.details} onChange={(e) => update("details", e.target.value)} />
        </FormField>
      </div>
      <div className="honeypot" aria-hidden="true"><label htmlFor="website">Sitio web</label><input id="website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update("website", e.target.value)} /></div>
      <div className="consent-group">
        <Checkbox id="contact_consent" name="contact_consent" required checked={form.contact_consent} aria-invalid={Boolean(errors.contact_consent)} aria-describedby={describedBy("contact_consent")} onChange={(e) => update("contact_consent", e.target.checked)} label="Autorizo que me contacten para dar seguimiento a esta solicitud." />
        {errors.contact_consent && <p id="contact_consent-error" className="form-field__error">{errors.contact_consent}</p>}
        <Checkbox id="privacy_consent" name="privacy_consent" required checked={form.privacy_consent} aria-invalid={Boolean(errors.privacy_consent)} aria-describedby={describedBy("privacy_consent")} onChange={(e) => update("privacy_consent", e.target.checked)} label="Acepto el tratamiento de mis datos para responder y gestionar esta solicitud." />
        {errors.privacy_consent && <p id="privacy_consent-error" className="form-field__error">{errors.privacy_consent}</p>}
      </div>
      <p className="form-disclaimer">Enviar el formulario no confirma precio, fecha ni servicio.</p>
      <div className="form-actions">
        <Button type="submit" disabled={status === "loading"} className="button--primary">{status === "loading" ? <LoadingState /> : "Enviar solicitud"}</Button>
        <Button href={whatsappUrl} className="button--secondary"><MessageCircle aria-hidden="true" />Contactar por WhatsApp</Button>
      </div>
      {status === "success" && <SuccessState />}
      {status === "error" && <Alert><p>{formMessages.error}</p><Button type="submit" className="button--quiet">Intentar nuevamente</Button></Alert>}
    </form>
  );
}

export function PublicFooter() {
  return (
    <footer className="public-footer" {...region("footer")}>
      <div className="public-footer__inner">
        <div><Wordmark /><p>Servicio profesional de coordinación de limpieza en Guanacaste.</p></div>
        <nav aria-label="Enlaces del pie"><a href="/#cotizar">Contacto / WhatsApp</a><a href="/legal">Privacidad</a><span>ES / EN</span><a href="/app">Admin</a></nav>
        <p className="copyright">© 2026 Pacífica Cleaning · Guanacaste, Costa Rica</p>
      </div>
    </footer>
  );
}

export function PublicSite() {
  return (
    <>
      <main id="contenido-principal">
        <section className="hero" id="inicio" aria-labelledby="hero-title" {...region("hero")}>
          <div className="hero__content">
            <p className="eyebrow">Tempate, Guanacaste</p>
            <h1 id="hero-title" aria-label="Cada espacio listo. Cada coordinación bajo control."><span>Cada espacio listo.</span><span>Cada coordinación bajo control.</span></h1>
            <div className="hero__actions"><Button href="#cotizar" className="button--primary">Coordinar una cotización</Button><Button href="#como-trabajamos" className="button--secondary">Cómo trabajamos</Button><Button href={whatsappUrl} className="button--quiet">Contactar por WhatsApp</Button></div>
          </div>
          <PlaceholderMedia />
          <ol className="hero-log" aria-label="Bitácora del servicio"><li><span>01</span>Solicitud</li><li><span>02</span>Coordinación</li><li><span>03</span>Limpieza</li><li><span>04</span>Espacio listo</li></ol>
        </section>

        <NeedSelector />

        <section id="como-trabajamos" className="public-section process-section" aria-labelledby="process-title" {...region("metodo-de-trabajo")}>
          <SectionHeading id="process-title">Método de trabajo</SectionHeading><ProcessTimeline />
        </section>

        <section id="propiedades-vacacionales" className="public-section vacation-section" aria-labelledby="vacation-title" {...region("propiedades-vacacionales")}>
          <div><SectionHeading id="vacation-title">Propiedades vacacionales</SectionHeading><p>[CONTENIDO POR VALIDAR]</p><Button href="#cotizar" className="button--primary">Coordinar una cotización</Button></div><PlaceholderMedia />
        </section>

        <section id="servicios" className="public-section services-section" aria-labelledby="services-title" {...region("servicios")}>
          <SectionHeading id="services-title">Servicios</SectionHeading><ServiceList />
        </section>

        <EvidenceSection />
        <TrustPrinciples />

        <section id="cobertura" className="public-section coverage-section" aria-labelledby="coverage-title" {...region("cobertura")}>
          <SectionHeading id="coverage-title">Cobertura</SectionHeading><p className="coverage-base">Base central: Tempate</p><CoverageChips /><p>Cobertura final sujeta a logística y confirmación del servicio.</p>
        </section>

        <section id="cotizar" className="public-section quote-section" aria-labelledby="quote-title" {...region("formulario")}>
          <SectionHeading id="quote-title">Formulario</SectionHeading><QuoteForm />
        </section>

        <section className="public-section faq-section" aria-labelledby="faq-title" {...region("faq")}>
          <SectionHeading id="faq-title">FAQ</SectionHeading><Accordion groupLabel="Preguntas frecuentes" items={faqs.map(({ question, answer }) => ({ title: question, content: <p>{answer}</p> }))} />
        </section>

        <section className="final-cta" aria-labelledby="final-cta-title" {...region("cta-final")}>
          <SectionHeading id="final-cta-title">[CONTENIDO POR VALIDAR]</SectionHeading><div><Button href="#cotizar" className="button--primary">Coordinar una cotización</Button><Button href={whatsappUrl} className="button--secondary">Contactar por WhatsApp</Button></div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
