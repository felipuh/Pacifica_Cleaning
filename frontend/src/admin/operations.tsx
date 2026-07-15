import { useEffect, useRef, useState } from "react";
import type React from "react";
import { X } from "lucide-react";
import { createResource, queryResource, resourceAction, type SessionUser, updateResource } from "../api";
import { adminModules, type ModuleKey, type ResourceRow } from "./config";
import { formatValue } from "./formatters";

export function OperationalEditor({
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
  const panelRef = useRef<HTMLElement>(null);
  const field = (name: string, value: string | boolean) => setForm((current) => ({ ...current, [name]: value }));

  useEffect(() => {
    panelRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, saving]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = editorPayload(module, form, Boolean(row));
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

  async function registerStockMovement() {
    if (!row?.id || module !== "inventory-items") return;
    setSaving(true);
    setError("");
    try {
      await createResource("stock-movements", {
        item: row.id,
        movement_type: form.movement_type,
        quantity: form.movement_quantity,
        notes: form.movement_notes
      });
      await onSaved("Movimiento de inventario registrado.");
    } catch (caught) {
      setError(apiErrorMessage(caught));
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section ref={panelRef} tabIndex={-1} className="editor-panel" role="dialog" aria-modal="true" aria-labelledby="editor-title">
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
          {module === "contacts" && <>
            <label>Cliente<select required value={String(form.customer)} onChange={(e) => field("customer", e.target.value)}><option value="">Seleccione</option>{resources.customers.map((item) => <option key={String(item.id)} value={String(item.id)}>{rowLabel(item, 0)}</option>)}</select></label>
            <label>Nombre<input required value={String(form.full_name)} onChange={(e) => field("full_name", e.target.value)} /></label>
            <label>Correo<input type="email" value={String(form.email)} onChange={(e) => field("email", e.target.value)} /></label>
            <label>Teléfono<input value={String(form.phone)} onChange={(e) => field("phone", e.target.value)} /></label>
            <label>Rol o relación<input value={String(form.role)} onChange={(e) => field("role", e.target.value)} placeholder="Administración, propietario…" /></label>
            <label className="check"><input type="checkbox" checked={Boolean(form.is_primary)} onChange={(e) => field("is_primary", e.target.checked)} /> Contacto principal</label>
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
          {module === "services" && <>
            <label>Nombre en español<input required value={String(form.name_es)} onChange={(e) => field("name_es", e.target.value)} /></label>
            <label>Nombre en inglés<input required value={String(form.name_en)} onChange={(e) => field("name_en", e.target.value)} /></label>
            <label>Identificador URL<input required pattern="[a-z0-9-]+" value={String(form.slug)} onChange={(e) => field("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))} /></label>
            <label>Modalidad<select value={String(form.pricing_mode)} onChange={(e) => field("pricing_mode", e.target.value)}><option value="hourly">Por hora</option><option value="fixed">Precio fijo</option><option value="package">Paquete</option></select></label>
            <label className="wide">Descripción en español<textarea required value={String(form.description_es)} onChange={(e) => field("description_es", e.target.value)} /></label>
            <label className="wide">Descripción en inglés<textarea value={String(form.description_en)} onChange={(e) => field("description_en", e.target.value)} /></label>
            <label className="check"><input type="checkbox" checked={Boolean(form.is_active)} onChange={(e) => field("is_active", e.target.checked)} /> Servicio activo</label>
          </>}
          {module === "price-versions" && <>
            <label>Servicio<select required value={String(form.service)} onChange={(e) => field("service", e.target.value)}><option value="">Seleccione</option>{resources.services.map((item) => <option key={String(item.id)} value={String(item.id)}>{rowLabel(item, 0)}</option>)}</select></label>
            <label>Moneda<select value={String(form.currency)} onChange={(e) => field("currency", e.target.value)}><option value="CRC">CRC</option><option value="USD">USD</option></select></label>
            <label>Precio fijo<input type="number" min="0" step="0.01" value={String(form.fixed_price)} onChange={(e) => field("fixed_price", e.target.value)} /></label>
            <label>Precio por hora<input type="number" min="0" step="0.01" value={String(form.hourly_rate)} onChange={(e) => field("hourly_rate", e.target.value)} /></label>
            <label>Tarifa mínima<input type="number" min="0" step="0.01" value={String(form.minimum_fee)} onChange={(e) => field("minimum_fee", e.target.value)} /></label>
            <label>Impuesto (0–1)<input type="number" min="0" max="1" step="0.0001" value={String(form.tax_rate)} onChange={(e) => field("tax_rate", e.target.value)} /></label>
            <label>Margen esperado (0–1)<input type="number" min="0" max="1" step="0.0001" value={String(form.expected_margin)} onChange={(e) => field("expected_margin", e.target.value)} /></label>
            <label>Válida desde<input required type="date" value={String(form.valid_from)} onChange={(e) => field("valid_from", e.target.value)} /></label>
            <label>Válida hasta<input type="date" value={String(form.valid_to)} onChange={(e) => field("valid_to", e.target.value)} /></label>
            <label className="wide">Notas<textarea value={String(form.notes)} onChange={(e) => field("notes", e.target.value)} /></label>
          </>}
          {module === "workers" && <>
            <label>Nombre<input required value={String(form.full_name)} onChange={(e) => field("full_name", e.target.value)} /></label>
            <label>Teléfono<input required value={String(form.phone)} onChange={(e) => field("phone", e.target.value)} /></label>
            <label>Correo<input type="email" value={String(form.email)} onChange={(e) => field("email", e.target.value)} /></label>
            <label>Relación<select value={String(form.worker_type)} onChange={(e) => field("worker_type", e.target.value)}><option value="employee">Personal laboral</option><option value="contractor">Prestador independiente</option></select></label>
            <label>Estado<select value={String(form.status)} onChange={(e) => field("status", e.target.value)}><option value="active">Activo</option><option value="inactive">Inactivo</option><option value="suspended">Suspendido</option></select></label>
            <label>Fecha de inicio<input type="date" value={String(form.start_date)} onChange={(e) => field("start_date", e.target.value)} /></label>
            <label>Zonas<input value={String(form.zones)} onChange={(e) => field("zones", e.target.value)} placeholder="Tempate, Tamarindo" /></label>
            <label>Habilidades<input value={String(form.skills)} onChange={(e) => field("skills", e.target.value)} placeholder="Profunda, Airbnb" /></label>
            {form.worker_type === "contractor" && <div className="wide contractor-checks">
              <p>Indicadores de riesgo de subordinación</p>
              <label className="check"><input type="checkbox" checked={Boolean(form.contractor_exclusivity)} onChange={(e) => field("contractor_exclusivity", e.target.checked)} /> Exclusividad</label>
              <label className="check"><input type="checkbox" checked={Boolean(form.contractor_fixed_schedule)} onChange={(e) => field("contractor_fixed_schedule", e.target.checked)} /> Horario fijo impuesto</label>
              <label className="check"><input type="checkbox" checked={Boolean(form.contractor_direct_supervision)} onChange={(e) => field("contractor_direct_supervision", e.target.checked)} /> Supervisión directa</label>
              <label className="check"><input type="checkbox" checked={Boolean(form.contractor_company_tools_required)} onChange={(e) => field("contractor_company_tools_required", e.target.checked)} /> Herramientas obligatorias</label>
            </div>}
          </>}
          {module === "quality-reviews" && <>
            <label>Servicio<select required value={String(form.work_order)} onChange={(e) => field("work_order", e.target.value)}><option value="">Seleccione</option>{resources["work-orders"].map((item) => <option key={String(item.id)} value={String(item.id)}>{rowLabel(item, 0)}</option>)}</select></label>
            <label>Puntuación (1–5)<input required type="number" min="1" max="5" value={String(form.score)} onChange={(e) => field("score", e.target.value)} /></label>
            <label>NPS (-100 a 100)<input type="number" min="-100" max="100" value={String(form.nps)} onChange={(e) => field("nps", e.target.value)} /></label>
            <label>Costo de retrabajo<input type="number" min="0" step="0.01" value={String(form.rework_cost)} onChange={(e) => field("rework_cost", e.target.value)} /></label>
            <label className="wide">Observaciones<textarea value={String(form.observations)} onChange={(e) => field("observations", e.target.value)} /></label>
            <label className="wide">Reclamo<textarea value={String(form.claim)} onChange={(e) => field("claim", e.target.value)} /></label>
            <label className="check"><input type="checkbox" checked={Boolean(form.rework_required)} onChange={(e) => field("rework_required", e.target.checked)} /> Requiere retrabajo</label>
          </>}
          {module === "incidents" && <>
            <label>Servicio<select required value={String(form.work_order)} onChange={(e) => field("work_order", e.target.value)}><option value="">Seleccione</option>{resources["work-orders"].map((item) => <option key={String(item.id)} value={String(item.id)}>{rowLabel(item, 0)}</option>)}</select></label>
            <label>Severidad<select value={String(form.severity)} onChange={(e) => field("severity", e.target.value)}><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option></select></label>
            <label className="wide">Descripción<textarea required value={String(form.description)} onChange={(e) => field("description", e.target.value)} /></label>
            <label className="wide">Seguimiento<textarea value={String(form.follow_up)} onChange={(e) => field("follow_up", e.target.value)} /></label>
            <label>Resuelta en<input type="datetime-local" value={String(form.resolved_at)} onChange={(e) => field("resolved_at", e.target.value)} /></label>
          </>}
          {module === "payments" && <>
            <label>Cliente<select required value={String(form.customer)} onChange={(e) => field("customer", e.target.value)}><option value="">Seleccione</option>{resources.customers.map((item) => <option key={String(item.id)} value={String(item.id)}>{rowLabel(item, 0)}</option>)}</select></label>
            <label>Monto<input required type="number" min="0.01" step="0.01" value={String(form.amount)} onChange={(e) => field("amount", e.target.value)} /></label>
            <label>Moneda<select value={String(form.currency)} onChange={(e) => field("currency", e.target.value)}><option value="CRC">CRC</option><option value="USD">USD</option></select></label>
            <label>Método<select value={String(form.method)} onChange={(e) => field("method", e.target.value)}><option value="sinpe">SINPE</option><option value="cash">Efectivo</option><option value="transfer">Transferencia</option><option value="card">Tarjeta</option><option value="other">Otro</option></select></label>
            <label>Fecha de pago<input required type="date" value={String(form.paid_at)} onChange={(e) => field("paid_at", e.target.value)} /></label>
            <label>Referencia<input value={String(form.reference)} onChange={(e) => field("reference", e.target.value)} /></label>
          </>}
          {module === "expenses" && <>
            <label>Categoría<select value={String(form.category)} onChange={(e) => field("category", e.target.value)}><option value="supplies">Insumos</option><option value="transport">Transporte</option><option value="payroll">Remuneraciones</option><option value="contractor">Honorarios</option><option value="equipment">Equipo</option><option value="other">Otro</option></select></label>
            <label>Descripción<input required value={String(form.description)} onChange={(e) => field("description", e.target.value)} /></label>
            <label>Monto<input required type="number" min="0.01" step="0.01" value={String(form.amount)} onChange={(e) => field("amount", e.target.value)} /></label>
            <label>Moneda<select value={String(form.currency)} onChange={(e) => field("currency", e.target.value)}><option value="CRC">CRC</option><option value="USD">USD</option></select></label>
            <label>Fecha<input required type="date" value={String(form.incurred_at)} onChange={(e) => field("incurred_at", e.target.value)} /></label>
            <label>Proveedor<input value={String(form.vendor)} onChange={(e) => field("vendor", e.target.value)} /></label>
          </>}
          {module === "campaigns" && <>
            <label>Nombre<input required value={String(form.name)} onChange={(e) => field("name", e.target.value)} /></label>
            <label>Canal<input required value={String(form.channel)} onChange={(e) => field("channel", e.target.value)} placeholder="email, social, whatsapp" /></label>
            <label>Inicio<input required type="date" value={String(form.starts_at)} onChange={(e) => field("starts_at", e.target.value)} /></label>
            <label>Fin<input type="date" value={String(form.ends_at)} onChange={(e) => field("ends_at", e.target.value)} /></label>
            <label>Presupuesto<input type="number" min="0" step="0.01" value={String(form.budget)} onChange={(e) => field("budget", e.target.value)} /></label>
            <label>Fuente UTM<input value={String(form.utm_source)} onChange={(e) => field("utm_source", e.target.value)} /></label>
            <label>Campaña UTM<input value={String(form.utm_campaign)} onChange={(e) => field("utm_campaign", e.target.value)} /></label>
            <label className="check"><input type="checkbox" checked={Boolean(form.consent_required)} onChange={(e) => field("consent_required", e.target.checked)} /> Requiere consentimiento</label>
          </>}
          {module === "coupons" && <>
            <label>Código<input required value={String(form.code)} onChange={(e) => field("code", e.target.value.toUpperCase())} /></label>
            <label>Descripción<input required value={String(form.description)} onChange={(e) => field("description", e.target.value)} /></label>
            <label>Descuento fijo<input type="number" min="0" step="0.01" value={String(form.discount_amount)} onChange={(e) => field("discount_amount", e.target.value)} /></label>
            <label>Descuento porcentual (0–1)<input type="number" min="0" max="1" step="0.0001" value={String(form.discount_percent)} onChange={(e) => field("discount_percent", e.target.value)} /></label>
            <label>Usos máximos<input type="number" min="1" value={String(form.max_uses)} onChange={(e) => field("max_uses", e.target.value)} /></label>
            <label>Válido hasta<input required type="date" value={String(form.valid_until)} onChange={(e) => field("valid_until", e.target.value)} /></label>
            <label className="check"><input type="checkbox" checked={Boolean(form.active)} onChange={(e) => field("active", e.target.checked)} /> Cupón activo</label>
          </>}
          {module === "notification-templates" && <>
            <label>Clave<input required pattern="[a-z0-9-]+" value={String(form.key)} onChange={(e) => field("key", e.target.value.toLowerCase().replace(/\s+/g, "-"))} /></label>
            <label>Canal<select value={String(form.channel)} onChange={(e) => field("channel", e.target.value)}><option value="email">Correo</option><option value="whatsapp">WhatsApp</option><option value="internal">Interna</option></select></label>
            <label className="wide">Asunto<input value={String(form.subject)} onChange={(e) => field("subject", e.target.value)} /></label>
            <label className="wide">Mensaje en español<textarea required value={String(form.body_es)} onChange={(e) => field("body_es", e.target.value)} /></label>
            <label className="wide">Mensaje en inglés<textarea value={String(form.body_en)} onChange={(e) => field("body_en", e.target.value)} /></label>
            <label className="check"><input type="checkbox" checked={Boolean(form.active)} onChange={(e) => field("active", e.target.checked)} /> Plantilla activa</label>
          </>}
          {module === "inventory-items" && <>
            <label>Nombre<input required value={String(form.name)} onChange={(e) => field("name", e.target.value)} /></label>
            <label>Categoría<input required value={String(form.category)} onChange={(e) => field("category", e.target.value)} /></label>
            <label>Unidad<input required value={String(form.unit)} onChange={(e) => field("unit", e.target.value)} /></label>
            <label>Existencia inicial<input disabled={Boolean(row)} type="number" min="0" step="0.01" value={String(form.stock_on_hand)} onChange={(e) => field("stock_on_hand", e.target.value)} /></label>
            <label>Existencia mínima<input type="number" min="0" step="0.01" value={String(form.minimum_stock)} onChange={(e) => field("minimum_stock", e.target.value)} /></label>
            <label>Costo unitario<input type="number" min="0" step="0.01" value={String(form.unit_cost)} onChange={(e) => field("unit_cost", e.target.value)} /></label>
            <label>Lote<input value={String(form.lot)} onChange={(e) => field("lot", e.target.value)} /></label>
            <label>Vencimiento<input type="date" value={String(form.expires_at)} onChange={(e) => field("expires_at", e.target.value)} /></label>
            <label className="wide">Proveedor<input value={String(form.supplier)} onChange={(e) => field("supplier", e.target.value)} /></label>
            {row && <p className="wide">La existencia se modifica mediante movimientos de inventario, no editando directamente el artículo.</p>}
            {row && <fieldset className="wide stock-movement-fields">
              <legend>Registrar movimiento</legend>
              <label>Tipo<select value={String(form.movement_type)} onChange={(e) => field("movement_type", e.target.value)}><option value="in">Entrada</option><option value="out">Salida</option><option value="loss">Pérdida o daño</option></select></label>
              <label>Cantidad<input type="number" min="0.01" step="0.01" value={String(form.movement_quantity)} onChange={(e) => field("movement_quantity", e.target.value)} /></label>
              <label className="wide">Notas<input value={String(form.movement_notes)} onChange={(e) => field("movement_notes", e.target.value)} /></label>
              <button className="ghost" type="button" disabled={saving || Number(form.movement_quantity) <= 0} onClick={registerStockMovement}>Registrar movimiento</button>
            </fieldset>}
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
            {row?.id && module === "quotes" && <a className="ghost" href={`/api/v1/quotes/${row.id}/pdf/`} target="_blank" rel="noreferrer">Descargar PDF</a>}
          </div>
        </form>
      </section>
    </div>
  );
}

export function Agenda({ workers, canEdit, onChanged }: { workers: ResourceRow[]; canEdit: boolean; onChanged: () => Promise<void> }) {
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
    try { await resourceAction("work-orders", row.id, "transition", { status }); await loadAgenda(); await onChanged(); }
    catch (caught) { setError(apiErrorMessage(caught)); }
  }

  async function saveAssignment() {
    if (!assigning?.id) return;
    try { await resourceAction("work-orders", assigning.id, "assign", { worker_ids: selectedWorkers }); setAssigning(null); await loadAgenda(); await onChanged(); }
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
      {rescheduling && <RescheduleDialog row={rescheduling} onClose={() => setRescheduling(null)} onSaved={async () => { setRescheduling(null); await loadAgenda(); await onChanged(); }} />}
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
  if (module === "contacts") return { customer: value("customer"), full_name: value("full_name"), email: value("email"), phone: value("phone"), role: value("role"), is_primary: Boolean(row?.is_primary) };
  if (module === "properties") return { customer: value("customer"), name: value("name"), address: value("address"), zone: value("zone"), property_type: value("property_type", "home"), bedrooms: value("bedrooms", "0"), bathrooms: value("bathrooms", "0"), area_m2: value("area_m2"), frequency: value("frequency"), operational_notes: value("operational_notes"), access_instructions: value("access_instructions") };
  if (module === "services") return { name_es: value("name_es"), name_en: value("name_en"), slug: value("slug"), description_es: value("description_es"), description_en: value("description_en"), pricing_mode: value("pricing_mode", "fixed"), is_active: Boolean(row?.is_active ?? true) };
  if (module === "price-versions") return { service: value("service"), currency: value("currency", "CRC"), fixed_price: value("fixed_price", "0"), hourly_rate: value("hourly_rate", "0"), minimum_fee: value("minimum_fee", "0"), tax_rate: value("tax_rate", "0.13"), expected_margin: value("expected_margin", "0.35"), valid_from: value("valid_from", new Date().toISOString().slice(0, 10)), valid_to: value("valid_to"), notes: value("notes") };
  if (module === "workers") return { full_name: value("full_name"), phone: value("phone"), email: value("email"), worker_type: value("worker_type", "employee"), status: value("status", "active"), start_date: value("start_date"), zones: Array.isArray(row?.zones) ? row.zones.join(", ") : "", skills: Array.isArray(row?.skills) ? row.skills.join(", ") : "", contractor_exclusivity: Boolean(row?.contractor_exclusivity), contractor_fixed_schedule: Boolean(row?.contractor_fixed_schedule), contractor_direct_supervision: Boolean(row?.contractor_direct_supervision), contractor_company_tools_required: Boolean(row?.contractor_company_tools_required) };
  if (module === "quality-reviews") return { work_order: value("work_order"), score: value("score", "5"), nps: value("nps"), observations: value("observations"), claim: value("claim"), rework_required: Boolean(row?.rework_required), rework_cost: value("rework_cost", "0") };
  if (module === "incidents") return { work_order: value("work_order"), severity: value("severity", "low"), description: value("description"), follow_up: value("follow_up"), resolved_at: value("resolved_at").slice(0, 16) };
  if (module === "payments") return { customer: value("customer"), amount: value("amount", "0"), currency: value("currency", "CRC"), method: value("method", "sinpe"), paid_at: value("paid_at", new Date().toISOString().slice(0, 10)), reference: value("reference") };
  if (module === "expenses") return { category: value("category", "supplies"), description: value("description"), amount: value("amount", "0"), currency: value("currency", "CRC"), incurred_at: value("incurred_at", new Date().toISOString().slice(0, 10)), vendor: value("vendor") };
  if (module === "campaigns") return { name: value("name"), channel: value("channel"), starts_at: value("starts_at", new Date().toISOString().slice(0, 10)), ends_at: value("ends_at"), budget: value("budget", "0"), consent_required: Boolean(row?.consent_required ?? true), utm_source: value("utm_source"), utm_campaign: value("utm_campaign") };
  if (module === "coupons") return { code: value("code"), description: value("description"), discount_amount: value("discount_amount", "0"), discount_percent: value("discount_percent", "0"), max_uses: value("max_uses", "1"), valid_until: value("valid_until", new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)), active: Boolean(row?.active ?? true) };
  if (module === "notification-templates") return { key: value("key"), channel: value("channel", "email"), subject: value("subject"), body_es: value("body_es"), body_en: value("body_en"), active: Boolean(row?.active ?? true) };
  if (module === "inventory-items") return { name: value("name"), category: value("category"), unit: value("unit", "unidad"), stock_on_hand: value("stock_on_hand", "0"), minimum_stock: value("minimum_stock", "0"), unit_cost: value("unit_cost", "0"), lot: value("lot"), expires_at: value("expires_at"), supplier: value("supplier"), movement_type: "in", movement_quantity: "0", movement_notes: "" };
  const line = Array.isArray(row?.lines) ? row.lines[0] as Record<string, unknown> | undefined : undefined;
  return { customer: value("customer"), property: value("property"), service: String(line?.service ?? ""), description: String(line?.description ?? ""), quantity: String(line?.quantity ?? "1"), unit_price: String(line?.unit_price ?? "0"), discount: value("discount", "0"), tax_rate: String(line?.tax_rate ?? "0.13"), valid_until: value("valid_until", new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)), terms: value("terms"), scheduled_start: "", scheduled_end: "" };
}

function editorPayload(module: ModuleKey, form: Record<string, string | boolean>, isEditing = false): unknown {
  if (module === "leads") return { ...form, assigned_to: form.assigned_to || null };
  if (module === "customers") return { ...form, tags: String(form.tags).split(",").map((tag) => tag.trim()).filter(Boolean) };
  if (module === "properties") return { ...form, bedrooms: Number(form.bedrooms), bathrooms: String(form.bathrooms), area_m2: form.area_m2 ? Number(form.area_m2) : null };
  if (module === "workers") return { ...form, start_date: form.start_date || null, zones: String(form.zones).split(",").map((item) => item.trim()).filter(Boolean), skills: String(form.skills).split(",").map((item) => item.trim()).filter(Boolean) };
  if (module === "quality-reviews") return { ...form, score: Number(form.score), nps: form.nps === "" ? null : Number(form.nps), rework_cost: String(form.rework_cost) };
  if (module === "incidents") return { ...form, resolved_at: form.resolved_at || null };
  if (module === "price-versions") return { ...form, valid_to: form.valid_to || null };
  if (module === "payments" || module === "expenses") return { ...form, amount: String(form.amount) };
  if (module === "campaigns") return { ...form, ends_at: form.ends_at || null, budget: String(form.budget) };
  if (module === "coupons") return { ...form, max_uses: Number(form.max_uses), discount_amount: String(form.discount_amount), discount_percent: String(form.discount_percent) };
  if (module === "inventory-items") {
    const payload = { name: form.name, category: form.category, unit: form.unit, stock_on_hand: String(form.stock_on_hand), minimum_stock: String(form.minimum_stock), unit_cost: String(form.unit_cost), lot: form.lot, expires_at: form.expires_at || null, supplier: form.supplier };
    if (isEditing) delete (payload as Partial<typeof payload>).stock_on_hand;
    return payload;
  }
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

export function formatMoney(value: string) {
  return new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(Number(value));
}

export function rowLabel(row: ResourceRow, index: number) {
  return String(row.full_name ?? row.display_name ?? row.property_name ?? row.customer_name ?? row.name_es ?? row.name ?? row.title ?? row.code ?? row.key ?? row.id ?? `Registro ${index + 1}`);
}

export function formatFieldName(field: string) {
  return field.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
