import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { jsPDF } from "jspdf";
import { loadEnv } from "./env.js";
import { createDashboardToken, requireDashboardAuth } from "./lib/auth.js";
import { deleteImage, deleteRawFile, extractPublicId, uploadBlog, uploadConsentPdf } from "./lib/cloudinary.js";
import { sendBookingConfirmationToClient, sendBookingNotificationToStudio, sendCustomEmailToClient } from "./lib/mailer.js";

loadEnv();

const { PrismaClient } = prismaPkg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL mancante. Configura la variabile d'ambiente del database.");
}

const globalForPrisma = globalThis;
const adapter = globalForPrisma.__psicomartinaPrismaAdapter || new PrismaPg({ connectionString: databaseUrl });
const prisma = globalForPrisma.__psicomartinaPrisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__psicomartinaPrismaAdapter = adapter;
  globalForPrisma.__psicomartinaPrisma = prisma;
}

const serviceLabels = {
  primo_colloquio: "Primo colloquio",
  sostegno_psicologico: "Sostegno psicologico",
  potenziamento_cognitivo: "Potenziamento cognitivo",
  screening_dsa: "Screening DSA",
  ansia: "Ansia e stress",
  eta_evolutiva: "Età evolutiva",
  genitorialita: "Genitorialità",
  relazioni: "Relazioni",
  autostima: "Autostima",
  traumi: "Traumi",
};

const consentSubjectLabels = {
  adult: "Adulto",
  minor: "Minorenne",
  protected_person: "Persona sotto tutela",
};

const consentServiceLabels = {
  consulenza: "Consulenza",
  sostegno_psicologico: "Sostegno psicologico",
  altro: "Altro",
};

const appointmentStatusToDb = {
  in_attesa: "pending",
  confermata: "confirmed",
  conclusa: "completed",
  annullata: "cancelled",
  pending: "pending",
  confirmed: "confirmed",
  completed: "completed",
  cancelled: "cancelled",
};

const appointmentStatusToClient = {
  pending: "in_attesa",
  confirmed: "confermata",
  completed: "conclusa",
  cancelled: "annullata",
};

const blogCategoryToDb = {
  ansia: "ansia",
  eta_evolutiva: "eta_evolutiva",
  genitorialita: "genitorialita",
  relazioni: "relazioni",
  autostima: "autostima",
  traumi: "traumi",
};

const defaultBookingSchedule = [
  { dayOfWeek: 0, isOpen: false, opensAt: "09:00", closesAt: "19:00", slotMinutes: 60 },
  { dayOfWeek: 1, isOpen: true, opensAt: "09:00", closesAt: "19:00", slotMinutes: 60 },
  { dayOfWeek: 2, isOpen: true, opensAt: "09:00", closesAt: "19:00", slotMinutes: 60 },
  { dayOfWeek: 3, isOpen: true, opensAt: "09:00", closesAt: "19:00", slotMinutes: 60 },
  { dayOfWeek: 4, isOpen: true, opensAt: "09:00", closesAt: "19:00", slotMinutes: 60 },
  { dayOfWeek: 5, isOpen: true, opensAt: "09:00", closesAt: "19:00", slotMinutes: 60 },
  { dayOfWeek: 6, isOpen: false, opensAt: "09:00", closesAt: "19:00", slotMinutes: 60 },
];

function slugify(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return req.body ? JSON.parse(req.body) : {};

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString("utf8");
  return body ? JSON.parse(body) : {};
}

function isMultipartRequest(req) {
  return String(req.headers["content-type"] || "").includes("multipart/form-data");
}

function runUpload(req, res, upload) {
  return new Promise((resolve, reject) => {
    upload.single("immagine")(req, res, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function readPayload(req, res, type) {
  if (type === "blog" && isMultipartRequest(req)) {
    await runUpload(req, res, uploadBlog);
    return {
      payload: req.body || {},
      uploadedImage: req.file
        ? {
            url: req.file.path,
            publicId: req.file.filename,
          }
        : null,
    };
  }

  return { payload: await readJson(req), uploadedImage: null };
}

function parseBoolean(value, fallback = false) {
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  return fallback;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function timeToMinutes(value = "00:00") {
  const [hours, minutes] = String(value).split(":").map(Number);
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
}

function minutesToTime(value) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function generateTimeSlots(schedule) {
  if (!schedule?.isOpen) return [];
  const start = timeToMinutes(schedule.opensAt);
  const end = timeToMinutes(schedule.closesAt);
  const interval = Number(schedule.slotMinutes || 60);
  if (end <= start || ![30, 45, 60, 90].includes(interval)) return [];
  const slots = [];
  for (let cursor = start; cursor + interval <= end; cursor += interval) {
    slots.push(minutesToTime(cursor));
  }
  return slots;
}

function mapBookingSchedule(schedule) {
  return {
    day_of_week: schedule.dayOfWeek,
    is_open: schedule.isOpen,
    opens_at: schedule.opensAt,
    closes_at: schedule.closesAt,
    slot_minutes: schedule.slotMinutes,
    slots: generateTimeSlots(schedule),
  };
}

async function getBookingSchedules() {
  const rows = await prisma.bookingSchedule.findMany({ orderBy: { dayOfWeek: "asc" } });
  const byDay = new Map(rows.map((row) => [row.dayOfWeek, row]));
  return defaultBookingSchedule.map((fallback) => mapBookingSchedule(byDay.get(fallback.dayOfWeek) || fallback));
}

async function updateBookingSchedules(payload) {
  const schedules = Array.isArray(payload?.schedules) ? payload.schedules : [];
  const validDays = new Set([0, 1, 2, 3, 4, 5, 6]);
  const updates = schedules
    .map((item) => ({
      dayOfWeek: Number(item.day_of_week),
      isOpen: Boolean(item.is_open),
      opensAt: String(item.opens_at || "09:00"),
      closesAt: String(item.closes_at || "19:00"),
      slotMinutes: Number(item.slot_minutes || 60),
    }))
    .filter((item) => validDays.has(item.dayOfWeek) && /^\d{2}:\d{2}$/.test(item.opensAt) && /^\d{2}:\d{2}$/.test(item.closesAt) && [30, 45, 60, 90].includes(item.slotMinutes));

  if (updates.length !== 7) {
    const error = new Error("Configura tutti i 7 giorni della settimana.");
    error.statusCode = 400;
    throw error;
  }

  await prisma.$transaction(
    updates.map((item) =>
      prisma.bookingSchedule.upsert({
        where: { dayOfWeek: item.dayOfWeek },
        update: item,
        create: item,
      })
    )
  );

  return getBookingSchedules();
}

function splitFullName(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  return {
    nome: parts[0] || "",
    cognome: parts.slice(1).join(" "),
  };
}

function mapAppointment(appointment) {
  const nameParts = splitFullName(appointment.client.fullName);
  return {
    id: appointment.id,
    client_name: appointment.client.fullName,
    nome: nameParts.nome,
    cognome: nameParts.cognome,
    client_email: appointment.client.email,
    client_phone: appointment.client.phone,
    service_type: appointment.serviceType,
    service_label: appointment.service?.title || serviceLabels[appointment.serviceType] || appointment.serviceType,
    date: formatDate(appointment.scheduledDate),
    time_slot: appointment.timeSlot,
    status: appointment.status,
    stato: appointmentStatusToClient[appointment.status] || appointment.status,
    notes: appointment.notes,
    informed_consent_accepted: appointment.informedConsentAccepted,
  };
}

function mapContact(message) {
  const nameParts = splitFullName(message.name);
  return {
    id: message.id,
    name: message.name,
    nome: nameParts.nome,
    cognome: nameParts.cognome,
    email: message.email,
    phone: message.phone,
    message: message.message,
    status: message.status,
    created_at: message.createdAt.toISOString(),
  };
}

function parseDateOnly(value) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00.000Z`) : null;
}

function sanitizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function mapConsent(consent) {
  return {
    id: consent.id,
    appointment_id: consent.appointmentId,
    client_id: consent.clientId,
    subject_type: consent.subjectType,
    subject_label: consentSubjectLabels[consent.subjectType] || consent.subjectType,
    client_name: consent.clientFullName,
    client_email: consent.clientEmail,
    phone: consent.phone,
    fiscal_code: consent.fiscalCode,
    birth_place: consent.birthPlace,
    birth_date: consent.birthDate ? formatDate(consent.birthDate) : null,
    residence_city: consent.residenceCity,
    residence_address: consent.residenceAddress,
    residence_number: consent.residenceNumber,
    service_kind: consent.serviceKind,
    service_label: consentServiceLabels[consent.serviceKind] || consent.serviceKind,
    service_other: consent.serviceOther,
    minor_full_name: consent.minorFullName,
    tutor_full_name: consent.tutorFullName,
    second_tutor_full_name: consent.secondTutorFullName,
    signed_name: consent.signedName,
    privacy_consent: consent.privacyConsent,
    terms_accepted: consent.termsAccepted,
    pdf_url: consent.pdfUrl,
    pdf_public_id: consent.pdfPublicId,
    created_at: consent.createdAt.toISOString(),
    appointment: consent.appointment
      ? {
          date: formatDate(consent.appointment.scheduledDate),
          time_slot: consent.appointment.timeSlot,
          status: consent.appointment.status,
          service_label: consent.appointment.service?.title || serviceLabels[consent.appointment.serviceType] || consent.appointment.serviceType,
        }
      : null,
  };
}

function normalizeConsentPayload(payload, appointmentPayload) {
  const consent = payload?.consent || {};
  const subjectType = ["adult", "minor", "protected_person"].includes(consent.subject_type) ? consent.subject_type : "adult";
  const normalized = {
    subjectType,
    clientFullName: sanitizeText(consent.client_full_name || appointmentPayload.client_name),
    clientEmail: sanitizeText(consent.client_email || appointmentPayload.client_email).toLowerCase(),
    phone: sanitizeText(consent.phone || appointmentPayload.client_phone) || null,
    fiscalCode: sanitizeText(consent.fiscal_code).toUpperCase() || null,
    birthPlace: sanitizeText(consent.birth_place) || null,
    birthDate: parseDateOnly(consent.birth_date),
    residenceCity: sanitizeText(consent.residence_city) || null,
    residenceAddress: sanitizeText(consent.residence_address) || null,
    residenceNumber: sanitizeText(consent.residence_number) || null,
    serviceKind: ["consulenza", "sostegno_psicologico", "altro"].includes(consent.service_kind) ? consent.service_kind : "consulenza",
    serviceOther: sanitizeText(consent.service_other) || null,
    minorFullName: sanitizeText(consent.minor_full_name) || null,
    tutorFullName: sanitizeText(consent.tutor_full_name) || null,
    secondTutorFullName: sanitizeText(consent.second_tutor_full_name) || null,
    privacyConsent: Boolean(consent.privacy_consent),
    termsAccepted: Boolean(consent.terms_accepted),
    signedName: sanitizeText(consent.signed_name || appointmentPayload.client_name),
  };

  if (!normalized.clientFullName || !normalized.clientEmail || !normalized.fiscalCode || !normalized.birthPlace || !normalized.birthDate) {
    const error = new Error("Compila i dati obbligatori del consenso informato: nome, email, codice fiscale, luogo e data di nascita.");
    error.statusCode = 400;
    throw error;
  }
  if (!normalized.residenceCity || !normalized.residenceAddress) {
    const error = new Error("Compila residenza e indirizzo nel consenso informato.");
    error.statusCode = 400;
    throw error;
  }
  if (!normalized.privacyConsent || !normalized.termsAccepted || !normalized.signedName) {
    const error = new Error("Accetta il consenso informato e inserisci il nome per la firma.");
    error.statusCode = 400;
    throw error;
  }
  if (subjectType === "minor" && (!normalized.minorFullName || !normalized.tutorFullName)) {
    const error = new Error("Per un minore servono nome del minore e almeno un genitore/tutore.");
    error.statusCode = 400;
    throw error;
  }
  if (subjectType === "protected_person" && !normalized.tutorFullName) {
    const error = new Error("Per una persona sotto tutela serve il nome del tutore.");
    error.statusCode = 400;
    throw error;
  }

  return normalized;
}

function addWrappedText(doc, text, x, y, maxWidth, lineHeight = 6) {
  const lines = doc.splitTextToSize(String(text || ""), maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function ensurePdfSpace(doc, y, needed = 26) {
  if (y + needed <= 280) return y;
  doc.addPage();
  return 18;
}

function generateConsentPdf({ consent, appointmentPayload }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const studioName = "Studio Psicomartina - Dott.ssa Martina Giovinazzo";
  const address = process.env.VITE_STUDIO_ADDRESS || "Via Cairo Montenotte 55, Roma";
  const albo = process.env.VITE_STUDIO_ALBO_NUMBER || "32977";
  const alboRegion = process.env.VITE_STUDIO_ALBO_REGION || "Lazio";
  const email = process.env.EMAIL_STUDIO || process.env.VITE_STUDIO_EMAIL || "";
  const phone = process.env.VITE_STUDIO_PHONE || "";
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  y = addWrappedText(doc, "Contratto e consenso informato per prestazioni di consulenza e/o sostegno psicologico", 18, y, 174, 7) + 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y = addWrappedText(doc, `${studioName} - iscrizione Ordine Psicologi ${alboRegion} n. ${albo}`, 18, y, 174);
  y = addWrappedText(doc, `Contatti: ${email}${phone ? ` - ${phone}` : ""} - Sede: ${address}`, 18, y, 174) + 4;

  const rows = [
    ["Tipologia", consentSubjectLabels[consent.subjectType] || consent.subjectType],
    ["Assistito/a", consent.clientFullName],
    ["Email", consent.clientEmail],
    ["Telefono", consent.phone || "-"],
    ["Codice fiscale", consent.fiscalCode],
    ["Nato/a a", `${consent.birthPlace} il ${formatDate(consent.birthDate)}`],
    ["Residenza", `${consent.residenceCity}, ${consent.residenceAddress}${consent.residenceNumber ? ` ${consent.residenceNumber}` : ""}`],
    ["Prestazione richiesta", consent.serviceKind === "altro" ? consent.serviceOther || "Altro" : consentServiceLabels[consent.serviceKind]],
    ["Appuntamento richiesto", `${appointmentPayload.date} alle ${appointmentPayload.time_slot}`],
  ];

  if (consent.subjectType === "minor") {
    rows.splice(2, 0, ["Minore", consent.minorFullName || "-"], ["Genitore/Tutore", consent.tutorFullName || "-"], ["Secondo genitore/tutore", consent.secondTutorFullName || "-"]);
  }
  if (consent.subjectType === "protected_person") {
    rows.splice(2, 0, ["Tutore", consent.tutorFullName || "-"]);
  }

  doc.setFontSize(11);
  rows.forEach(([label, value]) => {
    y = ensurePdfSpace(doc, y, 12);
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 18, y);
    doc.setFont("helvetica", "normal");
    y = addWrappedText(doc, value, 60, y, 130) + 2;
  });

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Informazioni essenziali", 18, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const paragraphs = [
    "La prestazione psicologica richiesta potrà consistere in colloqui di consulenza, sostegno psicologico, valutazione e orientamento, secondo quanto emergerà in sede di primo colloquio.",
    "La dott.ssa Martina Giovinazzo opera nel rispetto del Codice Deontologico degli Psicologi Italiani, del segreto professionale e della normativa vigente in materia di trattamento dei dati personali.",
    "La durata del percorso non è quantificabile a priori e sarà concordata in base agli obiettivi, ai bisogni emersi e all'andamento del lavoro clinico.",
    "Gli incontri hanno durata indicativa di 45 minuti. Costi, modalità di pagamento e aspetti organizzativi saranno confermati direttamente dallo studio.",
    "Il consenso può essere revocato e il percorso può essere interrotto in qualsiasi momento, nel rispetto degli accordi presi e delle norme professionali.",
    "I dati personali e sanitari sono trattati ai sensi del GDPR per finalità connesse alla gestione della richiesta, all'erogazione della prestazione e agli obblighi fiscali e professionali.",
  ];

  paragraphs.forEach((paragraph) => {
    y = ensurePdfSpace(doc, y, 26);
    y = addWrappedText(doc, paragraph, 18, y, 174) + 4;
  });

  y = ensurePdfSpace(doc, y, 48);
  doc.setFont("helvetica", "bold");
  doc.text("Dichiarazioni e consenso", 18, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  y = addWrappedText(
    doc,
    `Il/la sottoscritto/a ${consent.signedName} dichiara di aver letto, compreso e accettato le informazioni riportate nel presente consenso informato e di prestare il consenso al trattamento dei dati personali per le finalità indicate.`,
    18,
    y,
    174
  ) + 8;
  doc.text(`Consenso privacy: ${consent.privacyConsent ? "prestato" : "non prestato"}`, 18, y);
  y += 7;
  doc.text(`Accettazione condizioni: ${consent.termsAccepted ? "sì" : "no"}`, 18, y);
  y += 14;
  doc.text(`Data invio: ${new Date().toLocaleDateString("it-IT")}`, 18, y);
  doc.text(`Firma digitata: ${consent.signedName}`, 90, y);

  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  doc.text("Documento generato automaticamente dal sito al momento della richiesta di prenotazione.", 18, 292);

  return Buffer.from(doc.output("arraybuffer"));
}

function mapPost(post) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    category: post.category,
    cover_image: post.coverImage,
    cover_image_public_id: post.coverImagePublicId,
    published: post.published,
    reading_time: post.readingTime,
    created_date: (post.publishedAt || post.createdAt).toISOString(),
  };
}

function mapCmsService(service) {
  return {
    id: service.id,
    code: service.code,
    title: service.title,
    name: service.title,
    subtitle: service.subtitle,
    short_description: service.subtitle || "",
    description: service.description,
    long_description: service.description,
    icon: service.iconLabel || "",
    price: service.priceLabel || "",
    content_type: service.contentType || "servizio",
    display_order: service.displayOrder,
    active: service.active,
    created_at: service.createdAt?.toISOString(),
    updated_at: service.updatedAt?.toISOString(),
  };
}

function mapCmsTestimonial(testimonial) {
  return {
    id: testimonial.id,
    name: testimonial.name,
    text: testimonial.text,
    rating: testimonial.rating,
    visible: testimonial.visible,
    date: formatDate(testimonial.createdAt),
    display_order: testimonial.displayOrder,
    created_at: testimonial.createdAt.toISOString(),
  };
}

async function getDashboard() {
  const [appointments, contacts] = await Promise.all([
    prisma.appointment.findMany({
      where: { deletedAt: null },
      include: { client: true, service: true },
      orderBy: [{ scheduledDate: "asc" }, { timeSlot: "asc" }],
    }),
    prisma.contactMessage.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return {
    appointments: appointments.map(mapAppointment),
    contacts: contacts.map(mapContact),
  };
}

async function createAppointment(payload) {
  const serviceType = serviceLabels[payload.service_type] ? payload.service_type : "primo_colloquio";
  const service = await prisma.service.findUnique({ where: { code: serviceType } });
  const email = String(payload.client_email || "").trim().toLowerCase();
  const fullName = String(payload.client_name || "").trim();
  const consent = normalizeConsentPayload(payload, { ...payload, client_email: email, client_name: fullName });

  if (!fullName || !email || !payload.date || !payload.time_slot || !payload.privacy_accepted || !payload.informed_consent_accepted) {
    const error = new Error("Compila nome, email, data, orario, consenso privacy e consenso informato.");
    error.statusCode = 400;
    throw error;
  }

  const confirmedConflict = await prisma.appointment.findFirst({
    where: {
      deletedAt: null,
      status: "confirmed",
      scheduledDate: new Date(`${payload.date}T00:00:00.000Z`),
      timeSlot: payload.time_slot,
    },
  });

  if (confirmedConflict) {
    const error = new Error("Questa fascia oraria è già confermata. Scegli un altro orario.");
    error.statusCode = 409;
    throw error;
  }

  const pdfBuffer = generateConsentPdf({ consent, appointmentPayload: payload });
  const publicId = `consenso-${Date.now()}-${slugify(fullName || "cliente")}`;
  const uploadResult = await uploadConsentPdf(pdfBuffer, publicId);

  let appointment;
  try {
    appointment = await prisma.$transaction(async (tx) => {
      const client = await tx.client.upsert({
        where: { email },
        update: {
          fullName,
          phone: payload.client_phone || null,
        },
        create: {
          fullName,
          email,
          phone: payload.client_phone || null,
        },
      });

      const createdAppointment = await tx.appointment.create({
        data: {
          clientId: client.id,
          serviceId: service?.id || null,
          serviceType,
          scheduledDate: new Date(`${payload.date}T00:00:00.000Z`),
          timeSlot: payload.time_slot,
          status: "pending",
          notes: payload.notes || null,
          privacyAccepted: true,
          informedConsentAccepted: true,
          source: "website",
        },
        include: { client: true, service: true },
      });

      await tx.informedConsent.create({
        data: {
          appointmentId: createdAppointment.id,
          clientId: client.id,
          subjectType: consent.subjectType,
          clientFullName: consent.clientFullName,
          clientEmail: consent.clientEmail,
          phone: consent.phone,
          fiscalCode: consent.fiscalCode,
          birthPlace: consent.birthPlace,
          birthDate: consent.birthDate,
          residenceCity: consent.residenceCity,
          residenceAddress: consent.residenceAddress,
          residenceNumber: consent.residenceNumber,
          serviceKind: consent.serviceKind,
          serviceOther: consent.serviceOther,
          minorFullName: consent.minorFullName,
          tutorFullName: consent.tutorFullName,
          secondTutorFullName: consent.secondTutorFullName,
          privacyConsent: consent.privacyConsent,
          termsAccepted: consent.termsAccepted,
          signedName: consent.signedName,
          pdfUrl: uploadResult.secure_url,
          pdfPublicId: uploadResult.public_id,
        },
      });

      if (payload.notes) {
        await tx.contactMessage.create({
          data: {
            clientId: client.id,
            serviceId: service?.id || null,
            name: fullName,
            email,
            phone: payload.client_phone || null,
            message: payload.notes,
            status: "new",
            privacyAccepted: true,
          },
        });
      }

      return createdAppointment;
    });
  } catch (error) {
    await deleteRawFile(uploadResult.public_id);
    throw error;
  }

  return mapAppointment(appointment);
}

async function getPublicAvailability(monthValue) {
  const month = /^\d{4}-\d{2}$/.test(monthValue || "") ? monthValue : new Date().toISOString().slice(0, 7);
  const [year, monthIndex] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthIndex - 1, 1));
  const end = new Date(Date.UTC(year, monthIndex, 1));
  const schedules = await getBookingSchedules();
  const scheduleByDay = new Map(schedules.map((schedule) => [schedule.day_of_week, schedule]));
  const appointments = await prisma.appointment.findMany({
    where: {
      deletedAt: null,
      status: "confirmed",
      scheduledDate: { gte: start, lt: end },
    },
    select: { scheduledDate: true, timeSlot: true },
    orderBy: [{ scheduledDate: "asc" }, { timeSlot: "asc" }],
  });

  const booked = appointments.reduce((acc, appointment) => {
    const date = formatDate(appointment.scheduledDate);
    acc[date] = [...(acc[date] || []), appointment.timeSlot];
    return acc;
  }, {});

  const days = {};
  for (let cursor = new Date(start); cursor < end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const date = formatDate(cursor);
    const schedule = scheduleByDay.get(cursor.getUTCDay());
    days[date] = {
      open: Boolean(schedule?.is_open),
      slots: schedule?.slots || [],
      booked: booked[date] || [],
    };
  }

  return { month, booked, days, schedule: schedules };
}

async function sendBookingEmails({ payload, appointment }) {
  const nameParts = splitFullName(appointment.client.fullName);
  const cliente = {
    nome: nameParts.nome || appointment.client.fullName,
    cognome: nameParts.cognome,
    email: appointment.client.email,
    telefono: appointment.client.phone,
  };
  const serviceName = appointment.service?.title || serviceLabels[appointment.serviceType] || appointment.serviceType;

  try {
    await sendBookingNotificationToStudio({
      cliente,
      data: payload.date,
      ora: payload.time_slot,
      servizio: serviceName,
      messaggio: payload.notes,
    });
  } catch (error) {
    console.error("Email notifica studio non inviata:", error.message);
  }

  try {
    await sendBookingConfirmationToClient({
      cliente,
      data: payload.date,
      ora: payload.time_slot,
      servizio: serviceName,
    });
  } catch (error) {
    console.error("Email conferma cliente non inviata:", error.message);
  }
}

async function getBookingStats(period) {
  const appointments = await prisma.appointment.findMany({
    where: { deletedAt: null },
    select: { scheduledDate: true, timeSlot: true },
  });
  const now = new Date();

  if (period === "day") {
    return Array.from({ length: 13 }, (_, index) => {
      const hour = index + 8;
      const label = `${String(hour).padStart(2, "0")}:00`;
      const count = appointments.filter((appointment) => {
        const sameDay = formatDate(appointment.scheduledDate) === formatDate(now);
        const appointmentHour = Number(String(appointment.timeSlot || "0").split(":")[0]);
        return sameDay && appointmentHour === hour;
      }).length;
      return { label, count };
    });
  }

  if (period === "month") {
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: lastDay }, (_, index) => {
      const day = index + 1;
      const label = String(day);
      const count = appointments.filter((appointment) => {
        const date = appointment.scheduledDate;
        return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
      }).length;
      return { label, count };
    });
  }

  return Array.from({ length: 8 }, (_, index) => {
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - 7 * (7 - index));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const count = appointments.filter((appointment) => appointment.scheduledDate >= weekStart && appointment.scheduledDate < weekEnd).length;
    return { label: `Sett. ${index + 1}`, count };
  });
}

async function getInformedConsents(query = "") {
  const q = sanitizeText(query);
  const where = {
    deletedAt: null,
    ...(q
      ? {
          OR: [
            { clientFullName: { contains: q, mode: "insensitive" } },
            { clientEmail: { contains: q, mode: "insensitive" } },
            { fiscalCode: { contains: q.toUpperCase(), mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const consents = await prisma.informedConsent.findMany({
    where,
    include: {
      appointment: {
        include: { service: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return consents.map(mapConsent);
}

async function autoCompletePastAppointments() {
  const now = new Date();
  const today = formatDate(now);
  const currentTime = now.toTimeString().slice(0, 5);

  const result = await prisma.appointment.updateMany({
    where: {
      status: "confirmed",
      deletedAt: null,
      OR: [
        { scheduledDate: { lt: new Date(`${today}T00:00:00.000Z`) } },
        { scheduledDate: new Date(`${today}T00:00:00.000Z`), timeSlot: { lt: currentTime } },
      ],
    },
    data: { status: "completed" },
  });

  return result.count;
}

async function getCmsList(type, { publicOnly = false } = {}) {
  if (type === "blog") {
    const now = new Date();
    const posts = await prisma.blogPost.findMany({
      where: {
        deletedAt: null,
        ...(publicOnly
          ? {
              published: true,
              OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
            }
          : {}),
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });
    return posts.map(mapPost);
  }

  if (type === "servizi") {
    const services = await prisma.service.findMany({
      where: { deletedAt: null, ...(publicOnly ? { active: true } : {}) },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    });
    return services.map(mapCmsService);
  }

  if (type === "recensioni") {
    const testimonials = await prisma.testimonial.findMany({
      where: { deletedAt: null, ...(publicOnly ? { visible: true } : {}) },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    });
    return testimonials.map(mapCmsTestimonial);
  }

  const error = new Error("Tipo CMS non valido.");
  error.statusCode = 404;
  throw error;
}

async function createCmsItem(type, payload, uploadedImage = null) {
  if (type === "blog") {
    const title = String(payload.title || "").trim();
    if (!title) {
      await deleteImage(uploadedImage?.publicId);
      const error = new Error("Il titolo è obbligatorio.");
      error.statusCode = 400;
      throw error;
    }
    const slug = slugify(payload.slug || title);
    const publishedAt = payload.published_at || payload.date || new Date().toISOString().slice(0, 10);
    const published = parseBoolean(payload.published, true);
    try {
      return mapPost(
        await prisma.blogPost.create({
          data: {
            title,
            slug,
            excerpt: payload.excerpt || String(payload.content || "").slice(0, 150) || title,
            content: payload.content || "",
            category: blogCategoryToDb[payload.category] || null,
            coverImage: uploadedImage?.url || payload.cover_image || null,
            coverImagePublicId: uploadedImage?.publicId || extractPublicId(payload.cover_image),
            published,
            readingTime: Math.max(1, Math.ceil(String(payload.content || "").split(/\s+/).filter(Boolean).length / 180)),
            publishedAt: published ? new Date(`${publishedAt}T09:00:00.000Z`) : null,
          },
        })
      );
    } catch (error) {
      await deleteImage(uploadedImage?.publicId);
      throw error;
    }
  }

  if (type === "servizi") {
    const title = String(payload.title || payload.name || "").trim();
    if (!title) {
      const error = new Error("Il nome servizio è obbligatorio.");
      error.statusCode = 400;
      throw error;
    }
    return mapCmsService(
      await prisma.service.create({
        data: {
          code: slugify(payload.code || title),
          title,
          subtitle: payload.short_description || payload.subtitle || null,
          description: payload.description || payload.long_description || "",
          iconLabel: payload.icon || null,
          priceLabel: payload.price || null,
          contentType: payload.content_type === "ambito" ? "ambito" : "servizio",
          displayOrder: Number(payload.display_order || 0),
          active: payload.active !== false,
        },
      })
    );
  }

  if (type === "recensioni") {
    if (!payload.name || !payload.text) {
      const error = new Error("Nome e testo recensione sono obbligatori.");
      error.statusCode = 400;
      throw error;
    }
    return mapCmsTestimonial(
      await prisma.testimonial.create({
        data: {
          name: payload.name,
          text: payload.text,
          rating: Number(payload.rating || 5),
          visible: payload.visible !== false,
          createdAt: payload.date ? new Date(`${payload.date}T12:00:00.000Z`) : undefined,
        },
      })
    );
  }

  const error = new Error("Tipo CMS non valido.");
  error.statusCode = 404;
  throw error;
}

async function updateCmsItem(type, id, payload, uploadedImage = null) {
  if (type === "blog") {
    const existing = uploadedImage ? await prisma.blogPost.findUnique({ where: { id } }) : null;
    try {
      const hasPublished = payload.published !== undefined;
      const published = hasPublished ? parseBoolean(payload.published) : undefined;
      const updated = await prisma.blogPost.update({
        where: { id },
        data: {
          title: payload.title,
          slug: payload.slug ? slugify(payload.slug) : undefined,
          excerpt: payload.excerpt,
          content: payload.content,
          category: payload.category ? blogCategoryToDb[payload.category] || null : undefined,
          coverImage: uploadedImage ? uploadedImage.url : undefined,
          coverImagePublicId: uploadedImage ? uploadedImage.publicId : undefined,
          published,
          publishedAt: hasPublished && published ? new Date(`${payload.published_at || payload.date || new Date().toISOString().slice(0, 10)}T09:00:00.000Z`) : hasPublished ? null : undefined,
        },
      });
      if (uploadedImage) await deleteImage(existing?.coverImagePublicId || extractPublicId(existing?.coverImage));
      return mapPost(updated);
    } catch (error) {
      await deleteImage(uploadedImage?.publicId);
      throw error;
    }
  }

  if (type === "servizi") {
    return mapCmsService(
      await prisma.service.update({
        where: { id },
        data: {
          title: payload.title || payload.name,
          subtitle: payload.short_description || payload.subtitle,
          description: payload.description || payload.long_description,
          iconLabel: payload.icon,
          priceLabel: payload.price,
          contentType: payload.content_type === undefined ? undefined : payload.content_type === "ambito" ? "ambito" : "servizio",
          displayOrder: payload.display_order === undefined ? undefined : Number(payload.display_order),
          active: typeof payload.active === "boolean" ? payload.active : undefined,
        },
      })
    );
  }

  if (type === "recensioni") {
    return mapCmsTestimonial(
      await prisma.testimonial.update({
        where: { id },
        data: {
          name: payload.name,
          text: payload.text,
          rating: payload.rating === undefined ? undefined : Number(payload.rating),
          visible: typeof payload.visible === "boolean" ? payload.visible : undefined,
          createdAt: payload.date ? new Date(`${payload.date}T12:00:00.000Z`) : undefined,
        },
      })
    );
  }

  const error = new Error("Tipo CMS non valido.");
  error.statusCode = 404;
  throw error;
}

async function deleteCmsItem(type, id) {
  const data = { deletedAt: new Date() };
  if (type === "blog") {
    const post = await prisma.blogPost.findUnique({ where: { id } });
    await deleteImage(post?.coverImagePublicId || extractPublicId(post?.coverImage));
    return prisma.blogPost.update({ where: { id }, data });
  }
  if (type === "servizi") return prisma.service.update({ where: { id }, data });
  if (type === "recensioni") return prisma.testimonial.update({ where: { id }, data });
  const error = new Error("Tipo CMS non valido.");
  error.statusCode = 404;
  throw error;
}

export async function handleApiRequest(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (req.method === "OPTIONS") {
      return sendJson(res, 204, {});
    }

    if (req.method === "GET" && url.pathname === "/api/health") {
      await prisma.$queryRaw`select 1`;
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "GET" && url.pathname === "/api/availability") {
      return sendJson(res, 200, await getPublicAvailability(url.searchParams.get("month")));
    }

    if (req.method === "POST" && url.pathname === "/api/auth/login") {
      const { username, password } = await readJson(req);
      if (username === process.env.DASHBOARD_USERNAME && password === process.env.DASHBOARD_PASSWORD) {
        return sendJson(res, 200, { token: createDashboardToken(username) });
      }
      return sendJson(res, 401, { error: "Credenziali non valide" });
    }

    if (req.method === "GET" && url.pathname === "/api/dashboard") {
      if (!requireDashboardAuth(req, res, sendJson)) return;
      return sendJson(res, 200, await getDashboard());
    }

    if (req.method === "GET" && url.pathname === "/api/consents") {
      if (!requireDashboardAuth(req, res, sendJson)) return;
      return sendJson(res, 200, { consents: await getInformedConsents(url.searchParams.get("q") || "") });
    }

    if (req.method === "GET" && url.pathname === "/api/booking-schedules") {
      if (!requireDashboardAuth(req, res, sendJson)) return;
      return sendJson(res, 200, { schedules: await getBookingSchedules() });
    }

    if (req.method === "PUT" && url.pathname === "/api/booking-schedules") {
      if (!requireDashboardAuth(req, res, sendJson)) return;
      return sendJson(res, 200, { schedules: await updateBookingSchedules(await readJson(req)) });
    }

    if (req.method === "GET" && url.pathname === "/api/bookings/stats") {
      if (!requireDashboardAuth(req, res, sendJson)) return;
      const period = url.searchParams.get("period") || "week";
      return sendJson(res, 200, { period, data: await getBookingStats(period) });
    }

    if (req.method === "POST" && url.pathname === "/api/bookings/auto-concludi") {
      if (!requireDashboardAuth(req, res, sendJson)) return;
      return sendJson(res, 200, { updated: await autoCompletePastAppointments() });
    }

    const statusMatch = url.pathname.match(/^\/api\/bookings\/([^/]+)\/stato$/);
    const queryStatusId = url.pathname === "/api/bookings/stato" ? url.searchParams.get("id") : null;
    const statusId = statusMatch?.[1] || queryStatusId;
    if (req.method === "PATCH" && statusId) {
      if (!requireDashboardAuth(req, res, sendJson)) return;
      const { stato } = await readJson(req);
      const status = appointmentStatusToDb[stato];
      if (!status) return sendJson(res, 400, { error: "Stato prenotazione non valido." });
      const updated = await prisma.appointment.update({
        where: { id: statusId },
        data: { status },
        include: { client: true, service: true },
      });
      return sendJson(res, 200, mapAppointment(updated));
    }

    const cmsListMatch = url.pathname.match(/^\/api\/cms\/(blog|servizi|recensioni)$/);
    if (cmsListMatch && req.method === "GET") {
      const wantsAll = url.searchParams.get("all") === "1";
      if (wantsAll && !requireDashboardAuth(req, res, sendJson)) return;
      const publicOnly = !wantsAll;
      return sendJson(res, 200, await getCmsList(cmsListMatch[1], { publicOnly }));
    }
    if (cmsListMatch && req.method === "POST") {
      if (!requireDashboardAuth(req, res, sendJson)) return;
      const { payload, uploadedImage } = await readPayload(req, res, cmsListMatch[1]);
      return sendJson(res, 201, await createCmsItem(cmsListMatch[1], payload, uploadedImage));
    }
    if (cmsListMatch && req.method === "PUT") {
      if (!requireDashboardAuth(req, res, sendJson)) return;
      const id = url.searchParams.get("id");
      if (!id) return sendJson(res, 400, { error: "ID elemento CMS mancante." });
      const { payload, uploadedImage } = await readPayload(req, res, cmsListMatch[1]);
      return sendJson(res, 200, await updateCmsItem(cmsListMatch[1], id, payload, uploadedImage));
    }
    if (cmsListMatch && req.method === "DELETE") {
      if (!requireDashboardAuth(req, res, sendJson)) return;
      const id = url.searchParams.get("id");
      if (!id) return sendJson(res, 400, { error: "ID elemento CMS mancante." });
      await deleteCmsItem(cmsListMatch[1], id);
      return sendJson(res, 200, { ok: true });
    }

    const cmsItemMatch = url.pathname.match(/^\/api\/cms\/(blog|servizi|recensioni)\/([^/]+)$/);
    if (cmsItemMatch && req.method === "PUT") {
      if (!requireDashboardAuth(req, res, sendJson)) return;
      const { payload, uploadedImage } = await readPayload(req, res, cmsItemMatch[1]);
      return sendJson(res, 200, await updateCmsItem(cmsItemMatch[1], cmsItemMatch[2], payload, uploadedImage));
    }
    if (cmsItemMatch && req.method === "DELETE") {
      if (!requireDashboardAuth(req, res, sendJson)) return;
      await deleteCmsItem(cmsItemMatch[1], cmsItemMatch[2]);
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "GET" && url.pathname === "/api/services") {
      return sendJson(res, 200, await getCmsList("servizi", { publicOnly: true }));
    }

    if (req.method === "GET" && url.pathname === "/api/testimonials") {
      return sendJson(res, 200, await getCmsList("recensioni", { publicOnly: true }));
    }

    if (req.method === "GET" && url.pathname === "/api/blog-posts") {
      return sendJson(res, 200, await getCmsList("blog", { publicOnly: true }));
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/blog-posts/")) {
      const slug = decodeURIComponent(url.pathname.replace("/api/blog-posts/", ""));
      const post = await prisma.blogPost.findUnique({ where: { slug } });
      const isScheduled = post?.publishedAt && post.publishedAt > new Date();
      if (!post || !post.published || post.deletedAt || isScheduled) return sendJson(res, 404, { error: "Articolo non trovato" });
      return sendJson(res, 200, mapPost(post));
    }

    if (req.method === "POST" && url.pathname === "/api/appointments") {
      const payload = await readJson(req);
      const appointment = await createAppointment(payload);
      await sendBookingEmails({ payload, appointment: { ...appointment, client: { fullName: appointment.client_name, email: appointment.client_email, phone: appointment.client_phone }, service: { title: appointment.service_label }, serviceType: appointment.service_type } });
      return sendJson(res, 201, appointment);
    }

    if (req.method === "POST" && url.pathname === "/api/email/send-to-client") {
      if (!requireDashboardAuth(req, res, sendJson)) return;
      const { toEmail, toNome, subject, body } = await readJson(req);
      if (!toEmail || !subject || !body) {
        return sendJson(res, 400, { error: "Email, oggetto e testo sono obbligatori." });
      }
      await sendCustomEmailToClient({ toEmail, toNome, subject, body });
      return sendJson(res, 200, { ok: true });
    }

    return sendJson(res, 404, { error: "Endpoint non trovato" });
  } catch (error) {
    console.error(error);
    sendJson(res, error.statusCode || 500, { error: error.message || "Errore server" });
  }
}
