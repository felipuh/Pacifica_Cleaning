export const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");

export const whatsappText = "Hola Pacífica Cleaning, quiero solicitar una cotización";

export const whatsappUrl = whatsappNumber
  ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}`
  : "#cotizar";

export const services = [
  {
    title: "Limpieza residencial",
    detail: "Rutinas claras para casas familiares, condominios y espacios ocupados, con atención a preferencias e instrucciones especiales."
  },
  {
    title: "Limpieza profunda",
    detail: "Servicio detallado para reinicios, mudanzas, temporadas altas o propiedades que necesitan un nivel superior de cuidado."
  },
  {
    title: "Limpieza recurrente",
    detail: "Planes semanales, quincenales o mensuales para mantener su espacio limpio, fresco y siempre presentable."
  },
  {
    title: "Limpieza para Airbnb",
    detail: "Preparación entre reservas, apoyo antes del check-in y revisión visual básica para anfitriones y administradores."
  },
  {
    title: "Limpieza post-evento",
    detail: "Recuperamos el orden después de reuniones, celebraciones familiares o actividades en propiedades vacacionales."
  },
  {
    title: "Oficinas y locales pequeños",
    detail: "Limpieza discreta, puntual y ordenada para espacios de trabajo, consultorios y negocios de baja o media ocupación."
  }
];

export const coverageZones = ["Tempate", "Brasilito", "Flamingo", "Potrero", "Huacas", "Tamarindo", "Playas del Coco"];

export const benefits = [
  "Puntualidad y coordinación clara",
  "Personal confiable y trato respetuoso",
  "Atención rápida por WhatsApp",
  "Limpieza detallada y consistente",
  "Ideal para propiedades vacacionales",
  "Planes recurrentes y flexibles",
  "Servicio local en Guanacaste",
  "Cotización simple y sin complicaciones"
];

export const processSteps = [
  "El cliente escribe por WhatsApp o envía el formulario.",
  "Recopilamos información del espacio, ubicación y tipo de limpieza.",
  "Enviamos una cotización clara según alcance, frecuencia y necesidades.",
  "Agendamos el servicio con fecha, hora e instrucciones de acceso.",
  "Realizamos la limpieza con checklist y atención al detalle.",
  "Damos seguimiento para confirmar satisfacción y próximos servicios."
];

export const faqs = [
  ["¿Llevan productos?", "Se confirma según el servicio, inventario disponible y preferencias del cliente."],
  ["¿Puedo solicitar inspección?", "Sí. El formulario permite pedir una visita o revisión previa antes de cotizar."],
  ["¿Trabajan con Airbnb?", "Sí. El sistema contempla horarios de check-in, check-out, incidencias y evidencias autorizadas."],
  ["¿Las fotos son obligatorias?", "No. Solo se toman y almacenan con autorización expresa."]
];
