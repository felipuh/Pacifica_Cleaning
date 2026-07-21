export const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");

export const whatsappText = "Hola Pacífica Cleaning, quiero solicitar una cotización";

export const whatsappUrl = whatsappNumber
  ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}`
  : "#cotizar";

export const publicNavigation = [
  { label: "Hogares", href: "/#necesidades" },
  { label: "Propiedades vacacionales", href: "/#propiedades-vacacionales" },
  { label: "Cómo trabajamos", href: "/#como-trabajamos" },
  { label: "Cobertura", href: "/#cobertura" },
] as const;

export const needOptions = [
  "Mi hogar",
  "Entre reservas",
  "Plan recurrente o pequeño comercio",
] as const;

export const processSteps = [
  "Cuéntenos qué espacio necesita atención y cómo prefiere que le contactemos.",
  "Revisamos el alcance, la ubicación, la frecuencia y las instrucciones relevantes.",
  "Preparamos una cotización según la información confirmada.",
  "Coordinamos agenda y acceso cuando la cotización sea aceptada.",
] as const;

export const services = [
  "Limpieza residencial",
  "Limpieza profunda",
  "Limpieza recurrente",
  "Limpieza para propiedades vacacionales",
  "Limpieza post-evento",
  "Oficinas y locales pequeños",
] as const;

export const trustPrinciples = [
  "Comunicación clara",
  "Respeto por la privacidad",
  "Coordinación según el alcance acordado",
  "Trazabilidad interna",
] as const;

export const coverageZones = [
  "Tempate",
  "Brasilito",
  "Flamingo",
  "Potrero",
  "Huacas",
  "Tamarindo",
  "Zonas cercanas",
] as const;

export const faqs = [
  {
    question: "¿Enviar la solicitud confirma el servicio?",
    answer: "No. Enviar la solicitud inicia la revisión. El alcance, el precio, la fecha y las instrucciones se confirman directamente antes de coordinar el servicio.",
  },
  {
    question: "¿Atienden hogares y propiedades vacacionales?",
    answer: "Sí. Revisamos solicitudes para hogares y propiedades vacacionales según la ubicación, el alcance y la disponibilidad confirmada.",
  },
  {
    question: "¿Cómo se define el precio?",
    answer: "Se define después de revisar el espacio, el tipo de servicio, la frecuencia, la ubicación y las necesidades informadas. La cotización confirma el alcance y el precio aplicables.",
  },
  {
    question: "¿Puedo coordinar por WhatsApp?",
    answer: "Sí. Puede iniciar la coordinación por WhatsApp o enviar el formulario. La conversación no confirma por sí sola una fecha ni un precio.",
  },
  {
    question: "¿En qué zonas trabajan?",
    answer: "La cobertura configurada incluye Tempate, Brasilito, Flamingo, Potrero, Huacas, Tamarindo y Playas del Coco. Cada solicitud se confirma según ubicación y agenda.",
  },
  {
    question: "¿Cómo manejan información de acceso a propiedades?",
    answer: "Solicitamos únicamente la información necesaria para coordinar el servicio. Las instrucciones de acceso se comparten solo con las personas autorizadas según el proceso operativo y los permisos del sistema.",
  },
] as const;

export const formMessages = {
  sending: "Enviando solicitud…",
  success: "Recibimos su solicitud. Revisaremos la información y coordinaremos el siguiente paso por el medio indicado.",
  error: "No pudimos enviar la solicitud. Revise los datos e inténtelo nuevamente.",
  contact: "Ingresa al menos un correo electrónico o un teléfono.",
  privacy: "Debe aceptar el tratamiento de datos para enviar la solicitud.",
} as const;
