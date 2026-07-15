import type { View } from "../routing";
import { usePublicLanguage } from "./i18n";

export function Policies() {
  const { pick } = usePublicLanguage();
  return (
    <main className="section legal">
      <h1>{pick("Políticas y términos", "Policies and terms")}</h1>
      <h2>{pick("Privacidad y consentimiento", "Privacy and consent")}</h2>
      <p>{pick("Pacífica Cleaning recopila únicamente los datos necesarios para responder solicitudes, cotizar, agendar y ejecutar servicios. El tratamiento requiere consentimiento y puede revocarse.", "Pacifica Cleaning collects only the data required to answer requests, quote, schedule and perform services. Processing requires consent and may be revoked.")}</p>
      <h2>{pick("Cancelaciones", "Cancellations")}</h2>
      <p>{pick("Las cancelaciones y reprogramaciones se gestionan según la anticipación, disponibilidad y costos ya incurridos.", "Cancellations and rescheduling are handled according to notice, availability and costs already incurred.")}</p>
      <h2>Cookies</h2>
      <p>{pick("La analítica y los píxeles comerciales se activarán solo cuando exista consentimiento aplicable.", "Analytics and marketing pixels will be enabled only when the applicable consent exists.")}</p>
      <h2>{pick("Trabajo con nosotros", "Working with us")}</h2>
      <p>{pick("Los expedientes de personal laboral y prestadores independientes se mantienen separados para evitar mezclar obligaciones y controles.", "Employee and independent-contractor records are kept separate to avoid mixing obligations and controls.")}</p>
    </main>
  );
}

export function NotFound({ setView }: { setView: (view: View) => void }) {
  const { pick } = usePublicLanguage();
  return <main className="section legal"><p className="eyebrow">404</p><h1>{pick("Página no encontrada", "Page not found")}</h1><p>{pick("La ruta solicitada no existe.", "The requested route does not exist.")}</p><button className="primary" onClick={() => setView("public")}>{pick("Volver al inicio", "Back to home")}</button></main>;
}
