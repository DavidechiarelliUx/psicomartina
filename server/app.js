import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { loadEnv } from "./env.js";
import { createDashboardToken, requireDashboardAuth } from "./lib/auth.js";
import { deleteImage, deleteRawFile, extractPublicId, uploadBlog, uploadConsentPdf } from "./lib/cloudinary.js";
import { sendAppointmentConfirmedToClient, sendBookingNotificationToStudio, sendBookingRequestReceivedToClient, sendCustomEmailToClient, sendReviewRequestToClient } from "./lib/mailer.js";

loadEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONSENT_TEMPLATE_PATH = join(__dirname, "assets", "modulo-consenso-informato.pdf");

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
    confirmation_email_sent: appointment.confirmationEmailSent,
    confirmation_email_sent_at: appointment.confirmationEmailSentAt?.toISOString() || null,
    confirmation_email_count: appointment.confirmationEmailCount,
    review_request_sent: appointment.reviewRequestSent,
    review_request_sent_at: appointment.reviewRequestSentAt?.toISOString() || null,
    review_request_count: appointment.reviewRequestCount,
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
    compensation_amount: consent.compensationAmount,
    tax_regime: consent.taxRegime,
    payment_method: consent.paymentMethod,
    signature_box: consent.signatureBox,
    personal_data_consent_choice: consent.personalDataConsentChoice,
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

function normalizeConsentPayload(payload, appointmentPayload, options = {}) {
  const { preview = false } = options;
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
    compensationAmount: sanitizeText(consent.compensation_amount || "45") || "45",
    taxRegime: sanitizeText(consent.tax_regime || "Operazione esente IVA ex art.10, comma 1, n.18 del D.P.R. n.633/1972") || null,
    paymentMethod: sanitizeText(consent.payment_method || "Bonifico bancario, carta/bancomat o altro metodo tracciabile concordato con lo studio.") || null,
    signatureBox: ["adult", "minor", "protected_person"].includes(consent.signature_box) ? consent.signature_box : subjectType,
    personalDataConsentChoice: consent.personal_data_consent_choice === "denied" ? "denied" : "granted",
    privacyConsent: Boolean(consent.privacy_consent),
    termsAccepted: Boolean(consent.terms_accepted),
    signedName: sanitizeText(consent.signed_name || appointmentPayload.client_name),
  };

  // In modalità anteprima si genera il PDF con i dati disponibili, senza obblighi:
  // serve a controllare il modulo PRIMA di accettare il consenso e firmare.
  if (!preview) {
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
    if (subjectType === "minor" && (!normalized.minorFullName || !normalized.tutorFullName || !normalized.secondTutorFullName)) {
      const error = new Error("Per un minore servono nome del minore, genitore/tutore e secondo genitore/tutore.");
      error.statusCode = 400;
      throw error;
    }
    if (subjectType === "protected_person" && !normalized.tutorFullName) {
      const error = new Error("Per una persona sotto tutela serve il nome del tutore.");
      error.statusCode = 400;
      throw error;
    }
  }

  return normalized;
}

function addWrappedText(doc, text, x, y, maxWidth, lineHeight = 6) {
  const lines = doc.splitTextToSize(String(text || ""), maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function addKeyValueRow(doc, label, value, y) {
  const lines = doc.splitTextToSize(String(value || "-"), 126);
  const rowHeight = Math.max(8, lines.length * 6 + 2);
  y = ensurePdfSpace(doc, y, rowHeight + 3);
  doc.setFont("helvetica", "bold");
  doc.text(`${label}:`, 18, y);
  doc.setFont("helvetica", "normal");
  doc.text(lines, 64, y);
  return y + rowHeight;
}

function ensurePdfSpace(doc, y, needed = 26) {
  if (y + needed <= 280) return y;
  doc.addPage();
  return 18;
}

async function generateConsentPdf({ consent, appointmentPayload }) {
  const templateBytes = readFileSync(CONSENT_TEMPLATE_PATH);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();
  const textColor = rgb(0.08, 0.12, 0.12);
  const accentColor = rgb(0.18, 0.38, 0.38);
  const write = (pageIndex, text, x, yFromTop, options = {}) => {
    if (!text) return;
    const page = pages[pageIndex];
    const height = page.getHeight();
    page.drawText(String(text).slice(0, options.maxChars || 90), {
      x,
      y: height - yFromTop,
      size: options.size || 9,
      font: options.bold ? boldFont : font,
      color: options.color || textColor,
    });
  };
  const cover = (pageIndex, x, yFromTop, width, height) => {
    const page = pages[pageIndex];
    page.drawRectangle({
      x,
      y: page.getHeight() - yFromTop - height + 3,
      width,
      height,
      color: rgb(1, 1, 1),
    });
  };
  // Posiziona i valori sulla baseline delle righe pre-stampate del template.
  // Le coordinate Y derivano dal yMax (bordo inferiore del glifo) di ogni riga,
  // estratto dal template con `pdftotext -bbox`, meno un piccolo offset di baseline.
  const BL = 4; // scarto baseline (pt) rispetto al yMax della riga del template (testo leggermente più alto)
  const line = (pageIndex, text, x, yMaxTemplate, options = {}) => write(pageIndex, text, x, yMaxTemplate - BL, options);
  const check = (pageIndex, x, yMaxTemplate) => write(pageIndex, "X", x, yMaxTemplate - BL, { size: 10, bold: true, color: accentColor });
  const dateText = (value) => {
    if (!value) return "";
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("it-IT"); // gg/mm/aaaa
  };
  // Normalizza una data in gg/mm/aaaa (accetta Date, ISO yyyy-mm-dd o già gg/mm/aaaa).
  const toItalianDate = (value) => {
    if (!value) return "";
    if (value instanceof Date) return dateText(value);
    const s = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) { const [y, m, d] = s.slice(0, 10).split("-"); return `${d}/${m}/${y}`; }
    return s;
  };
  // Scrive una data gg/mm/aaaa nelle tre caselle pre-stampate "__/__/____"
  // senza ridisegnare le barre, così non si sovrappongono a quelle del template.
  const dateSlots = (pageIndex, value, xDay, xMonth, xYear, yMaxTemplate, size = 9) => {
    const t = value instanceof Date ? dateText(value) : toItalianDate(value);
    if (!t) return;
    const [d = "", m = "", y = ""] = t.split("/");
    line(pageIndex, d, xDay, yMaxTemplate, { size, maxChars: 2 });
    line(pageIndex, m, xMonth, yMaxTemplate, { size, maxChars: 2 });
    line(pageIndex, y, xYear, yMaxTemplate, { size, maxChars: 4 });
  };
  const todayText = new Date().toLocaleDateString("it-IT");
  const colloquioDate = toItalianDate(appointmentPayload?.date) || todayText;
  const paymentText = consent.paymentMethod || "Metodo tracciabile concordato con lo studio";
  const consentGranted = consent.personalDataConsentChoice !== "denied";
  const numberX = 488; // posizione della "n." civico sulle righe "in via/piazza"

  // ----- PAGINA 1: dati anagrafici nel riquadro appropriato -----
  if (consent.subjectType === "minor") {
    line(0, consent.minorFullName, 120, 410.9, { maxChars: 78 });          // Minorenne ...
    line(0, consent.birthPlace, 105, 425.58, { maxChars: 72 });            // nat... a ...
    dateSlots(0, consent.birthDate, 81, 105, 124, 440.23);    // il __/__/__
    line(0, consent.fiscalCode, 140, 454.88, { maxChars: 60 });            // codice fiscale ...
    line(0, consent.residenceCity, 140, 469.53, { maxChars: 60 });         // residente a ...
    line(0, consent.residenceAddress, 128, 484.18, { maxChars: 60 });      // in via/piazza ...
    line(0, consent.residenceNumber, numberX, 484.18, { maxChars: 8 });
  } else if (consent.subjectType === "protected_person") {
    line(0, consent.clientFullName, 95, 535.96, { maxChars: 80 });         // Sig ...
    line(0, consent.birthPlace, 105, 550.61, { maxChars: 72 });            // nat... a ...
    dateSlots(0, consent.birthDate, 81, 105, 124, 565.26);    // il __/__/__
    line(0, consent.fiscalCode, 140, 579.91, { maxChars: 60 });            // codice fiscale ...
    line(0, consent.residenceCity, 140, 594.56, { maxChars: 60 });         // residente a ...
    line(0, consent.residenceAddress, 128, 609.20, { maxChars: 60 });      // in via/piazza ...
    line(0, consent.residenceNumber, numberX, 609.20, { maxChars: 8 });
  } else {
    line(0, consent.clientFullName, 118, 271.26, { maxChars: 78 });        // Sig/Sig.ra ...
    line(0, consent.birthPlace, 105, 285.91, { maxChars: 72 });            // nat... a ...
    dateSlots(0, consent.birthDate, 81, 105, 124, 300.56);    // il __/__/__
    line(0, consent.fiscalCode, 140, 315.20, { maxChars: 60 });            // codice fiscale ...
    line(0, consent.residenceCity, 140, 329.85, { maxChars: 60 });         // residente a ...
    line(0, consent.residenceAddress, 128, 344.50, { maxChars: 60 });      // in via/piazza ...
    line(0, consent.residenceNumber, numberX, 344.50, { maxChars: 8 });
  }

  // Prestazione scelta: marca con X il punto elenco corrispondente.
  const serviceMarkY = consent.serviceKind === "sostegno_psicologico" ? 723 : consent.serviceKind === "altro" ? 742 : 704;
  check(0, 92, serviceMarkY);

  // ----- PAGINA 2: modalità di pagamento (riga "Il pagamento avverrà ...") -----
  line(1, paymentText, 218, 398.06, { maxChars: 78 });
  // Compenso: il template riporta già "45 €"; sovrascrivi solo se diverso dal default.
  if (consent.compensationAmount && String(consent.compensationAmount).trim() !== "45") {
    cover(1, 128, 333, 16, 13);
    line(1, String(consent.compensationAmount), 130, 342.38, { maxChars: 6, bold: true });
  }

  // ----- PAGINA 5: data del colloquio ("avvenuto in data __/__/__") -----
  dateSlots(4, colloquioDate, 410, 436, 462, 724.31, 8);

  // ----- Pagine firma: scegli il riquadro in base al tipo di soggetto -----
  const finalBox = consent.signatureBox || consent.subjectType;
  if (finalBox === "minor") {
    // MADRE (pagina 6)
    line(5, consent.tutorFullName, 112, 409.31, { maxChars: 60 });         // La Sig.ra ...
    line(5, consent.minorFullName, 185, 423.96, { maxChars: 54 });         // madre del minorenne ...
    line(5, consent.birthPlace, 125, 438.61, { maxChars: 56 });            // nata a ...
    dateSlots(5, consent.birthDate, 81, 105, 124, 453.26);    // il __/__/__
    line(5, consent.residenceCity, 125, 467.91, { maxChars: 60 });         // residente a ...
    line(5, consent.residenceAddress, 128, 482.55, { maxChars: 60 });      // in via/piazza ...
    line(5, consent.residenceNumber, numberX, 482.55, { maxChars: 8 });
    check(5, consentGranted ? 73.5 : 207, 561.32);                         // FORNISCE / NON FORNISCE (madre)
    line(5, todayText, 130, 624.34);                                       // Luogo e data
    line(5, consent.tutorFullName, 425, 624.34, { maxChars: 30 });         // Firma della madre
    // PADRE (pagina 6 -> pagina 7)
    line(5, consent.secondTutorFullName, 100, 712.23, { maxChars: 60 });   // Il Sig. ...
    line(5, consent.minorFullName, 180, 726.88, { maxChars: 54 });         // padre del minorenne ...
    line(5, consent.birthPlace, 125, 741.53, { maxChars: 56 });            // nato a ...
    dateSlots(5, consent.birthDate, 81, 105, 124, 756.18);    // il __/__/__
    line(6, consent.residenceCity, 125, 84.21, { maxChars: 60 });          // residente a ...
    line(6, consent.residenceAddress, 128, 98.86, { maxChars: 60 });       // in via/piazza ...
    line(6, consent.residenceNumber, numberX, 98.86, { maxChars: 8 });
    check(6, consentGranted ? 73.5 : 207, 177.62);
    line(6, todayText, 130, 240.64);
    line(6, consent.secondTutorFullName, 418, 240.64, { maxChars: 28 });
  } else if (finalBox === "protected_person") {
    // PERSONE SOTTO TUTELA (pagina 7)
    line(6, consent.tutorFullName || consent.signedName, 150, 352.93, { maxChars: 54 }); // La Sig.ra/Il Sig. (tutore)
    line(6, consent.birthPlace, 120, 367.58, { maxChars: 52 });            // nata/o a ...
    dateSlots(6, consent.birthDate, 449, 473, 492, 367.58, 8); // il __/__/__
    line(6, consent.clientFullName, 192, 382.23, { maxChars: 46 });        // Tutore del Sig. ... (assistito)
    line(6, consent.residenceCity, 125, 426.17, { maxChars: 60 });         // residente a ...
    line(6, consent.residenceAddress, 128, 440.82, { maxChars: 60 });      // in via/piazza ...
    line(6, consent.residenceNumber, numberX, 440.82, { maxChars: 8 });
    check(6, consentGranted ? 73.5 : 207, 519.59);
    line(6, todayText, 130, 582.61);
    line(6, consent.tutorFullName || consent.signedName, 405, 582.61, { maxChars: 34 });
  } else {
    // ADULTI (pagina 6)
    line(5, consent.signedName || consent.clientFullName, 140, 153.33, { maxChars: 50 }); // La Sig.ra/Il Sig. ...
    check(5, consentGranted ? 73.5 : 207, 217.44);
    line(5, todayText, 130, 280.46);
    line(5, consent.signedName || consent.clientFullName, 405, 280.46, { maxChars: 34 });
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
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

  const pdfBuffer = await generateConsentPdf({ consent, appointmentPayload: payload });
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
          compensationAmount: consent.compensationAmount,
          taxRegime: consent.taxRegime,
          paymentMethod: consent.paymentMethod,
          signatureBox: consent.signatureBox,
          personalDataConsentChoice: consent.personalDataConsentChoice,
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

  return {
    ...mapAppointment(appointment),
    consent_pdf_url: uploadResult.secure_url,
    consent_pdf_filename: `consenso-${slugify(fullName || "cliente")}-${payload.date}.pdf`,
    consent_pdf_buffer: pdfBuffer,
  };
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

async function sendBookingEmails({ payload, appointment, consensoPdf }) {
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
      consensoPdf,
    });
  } catch (error) {
    console.error("Email notifica studio non inviata:", error.message);
  }

  try {
    await sendBookingRequestReceivedToClient({
      cliente,
      data: payload.date,
      ora: payload.time_slot,
      servizio: serviceName,
    });
  } catch (error) {
    console.error("Email ricevuta richiesta cliente non inviata:", error.message);
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

async function sendGeneratedConsentPdf(res, consentId) {
  const record = await prisma.informedConsent.findFirst({
    where: { id: consentId, deletedAt: null },
    include: {
      appointment: true,
    },
  });

  if (!record) {
    return sendJson(res, 404, { error: "Consenso informato non trovato." });
  }

  const pdfBuffer = await generateConsentPdf({
    consent: {
      subjectType: record.subjectType,
      clientFullName: record.clientFullName,
      clientEmail: record.clientEmail,
      phone: record.phone,
      fiscalCode: record.fiscalCode,
      birthPlace: record.birthPlace,
      birthDate: record.birthDate,
      residenceCity: record.residenceCity,
      residenceAddress: record.residenceAddress,
      residenceNumber: record.residenceNumber,
      serviceKind: record.serviceKind,
      serviceOther: record.serviceOther,
      minorFullName: record.minorFullName,
      tutorFullName: record.tutorFullName,
      secondTutorFullName: record.secondTutorFullName,
      compensationAmount: record.compensationAmount,
      taxRegime: record.taxRegime,
      paymentMethod: record.paymentMethod,
      signatureBox: record.signatureBox,
      personalDataConsentChoice: record.personalDataConsentChoice,
      privacyConsent: record.privacyConsent,
      termsAccepted: record.termsAccepted,
      signedName: record.signedName,
    },
    appointmentPayload: {
      date: formatDate(record.appointment.scheduledDate),
      time_slot: record.appointment.timeSlot,
    },
  });

  const filename = `consenso-${slugify(record.clientFullName || "cliente")}-${formatDate(record.createdAt)}.pdf`;
  res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "private, max-age=0, no-store",
  });
  res.end(pdfBuffer);
}

async function sendPreviewConsentPdf(res, payload) {
  const email = String(payload.client_email || "").trim().toLowerCase();
  const fullName = String(payload.client_name || "").trim();
  const consent = normalizeConsentPayload(payload, { ...payload, client_email: email, client_name: fullName }, { preview: true });
  const pdfBuffer = await generateConsentPdf({ consent, appointmentPayload: payload });
  const filename = `anteprima-consenso-${slugify(fullName || consent.clientFullName || "cliente")}.pdf`;
  res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${filename}"`,
    "Cache-Control": "private, max-age=0, no-store",
  });
  res.end(pdfBuffer);
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

function getPublicBaseUrl(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:5173";
  const proto = req.headers["x-forwarded-proto"] || (String(host).includes("localhost") || String(host).startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

function clientFromAppointment(appointment) {
  const nameParts = splitFullName(appointment.client.fullName);
  return {
    nome: nameParts.nome || appointment.client.fullName,
    cognome: nameParts.cognome,
    email: appointment.client.email,
    telefono: appointment.client.phone,
  };
}

async function sendConfirmationEmailForAppointment(id) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { client: true, service: true },
  });
  if (!appointment || appointment.deletedAt) {
    const error = new Error("Appuntamento non trovato.");
    error.statusCode = 404;
    throw error;
  }

  const cliente = clientFromAppointment(appointment);
  const serviceName = appointment.service?.title || serviceLabels[appointment.serviceType] || appointment.serviceType;
  await sendAppointmentConfirmedToClient({
    cliente,
    data: formatDate(appointment.scheduledDate),
    ora: appointment.timeSlot,
    servizio: serviceName,
  });

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      confirmationEmailSent: true,
      confirmationEmailSentAt: new Date(),
      confirmationEmailCount: { increment: 1 },
    },
    include: { client: true, service: true },
  });

  return mapAppointment(updated);
}

async function sendReviewEmailForAppointment(id, req) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { client: true, service: true },
  });
  if (!appointment || appointment.deletedAt) {
    const error = new Error("Appuntamento non trovato.");
    error.statusCode = 404;
    throw error;
  }
  if (appointment.status !== "completed") {
    const error = new Error("La richiesta recensione si può inviare solo per appuntamenti conclusi.");
    error.statusCode = 400;
    throw error;
  }

  const cliente = clientFromAppointment(appointment);
  const serviceName = appointment.service?.title || serviceLabels[appointment.serviceType] || appointment.serviceType;
  await sendReviewRequestToClient({
    cliente,
    servizio: serviceName,
    reviewUrl: `${getPublicBaseUrl(req)}/recensione/${appointment.reviewToken}`,
  });

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      reviewRequestSent: true,
      reviewRequestSentAt: new Date(),
      reviewRequestCount: { increment: 1 },
    },
    include: { client: true, service: true },
  });

  return mapAppointment(updated);
}

async function getReviewContext(token) {
  const appointment = await prisma.appointment.findUnique({
    where: { reviewToken: token },
    include: { client: true, service: true },
  });
  if (!appointment || appointment.deletedAt || appointment.status !== "completed") {
    const error = new Error("Link recensione non valido o non ancora disponibile.");
    error.statusCode = 404;
    throw error;
  }
  const nameParts = splitFullName(appointment.client.fullName);
  return {
    client_name: appointment.client.fullName,
    nome: nameParts.nome || appointment.client.fullName,
    service_label: appointment.service?.title || serviceLabels[appointment.serviceType] || appointment.serviceType,
    date: formatDate(appointment.scheduledDate),
  };
}

async function submitPublicReview(token, payload) {
  const appointment = await prisma.appointment.findUnique({
    where: { reviewToken: token },
    include: { client: true, service: true },
  });
  if (!appointment || appointment.deletedAt || appointment.status !== "completed") {
    const error = new Error("Link recensione non valido o non ancora disponibile.");
    error.statusCode = 404;
    throw error;
  }

  const name = sanitizeText(payload.name || appointment.client.fullName);
  const text = sanitizeText(payload.text);
  const rating = Math.min(5, Math.max(1, Number(payload.rating || 5)));
  if (!name || !text) {
    const error = new Error("Nome e testo recensione sono obbligatori.");
    error.statusCode = 400;
    throw error;
  }

  await prisma.testimonial.create({
    data: {
      name,
      text,
      rating,
      visible: false,
      displayOrder: 0,
    },
  });

  return { ok: true };
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

    const publicReviewMatch = url.pathname.match(/^\/api\/reviews\/([^/]+)$/);
    if (publicReviewMatch && req.method === "GET") {
      return sendJson(res, 200, await getReviewContext(publicReviewMatch[1]));
    }
    if (publicReviewMatch && req.method === "POST") {
      return sendJson(res, 201, await submitPublicReview(publicReviewMatch[1], await readJson(req)));
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
      const downloadId = url.searchParams.get("download");
      if (downloadId) return sendGeneratedConsentPdf(res, downloadId);
      return sendJson(res, 200, { consents: await getInformedConsents(url.searchParams.get("q") || "") });
    }

    if (req.method === "POST" && url.pathname === "/api/consents/preview") {
      return await sendPreviewConsentPdf(res, await readJson(req));
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

    if (req.method === "POST" && url.pathname === "/api/booking-action") {
      if (!requireDashboardAuth(req, res, sendJson)) return;
      const { id, action } = await readJson(req);
      if (!id || !["send-confirmation", "send-review-request"].includes(action)) {
        return sendJson(res, 400, { error: "Azione appuntamento non valida." });
      }
      const updated = action === "send-confirmation" ? await sendConfirmationEmailForAppointment(id) : await sendReviewEmailForAppointment(id, req);
      return sendJson(res, 200, updated);
    }

    const bookingActionMatch = url.pathname.match(/^\/api\/bookings\/([^/]+)\/(send-confirmation|send-review-request)$/);
    if (req.method === "POST" && bookingActionMatch) {
      if (!requireDashboardAuth(req, res, sendJson)) return;
      const [, id, action] = bookingActionMatch;
      const updated = action === "send-confirmation" ? await sendConfirmationEmailForAppointment(id) : await sendReviewEmailForAppointment(id, req);
      return sendJson(res, 200, updated);
    }

    const statusMatch = url.pathname.match(/^\/api\/bookings\/([^/]+)\/stato$/);
    const queryStatusId = url.pathname === "/api/bookings/stato" ? url.searchParams.get("id") : null;
    const statusId = statusMatch?.[1] || queryStatusId;
    if (req.method === "PATCH" && statusId) {
      if (!requireDashboardAuth(req, res, sendJson)) return;
      const { stato, send_confirmation_email } = await readJson(req);
      const status = appointmentStatusToDb[stato];
      if (!status) return sendJson(res, 400, { error: "Stato prenotazione non valido." });
      const updated = await prisma.appointment.update({
        where: { id: statusId },
        data: { status },
        include: { client: true, service: true },
      });
      if (status === "confirmed" && send_confirmation_email) {
        return sendJson(res, 200, await sendConfirmationEmailForAppointment(statusId));
      }
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
      await sendBookingEmails({
        payload,
        appointment: { ...appointment, client: { fullName: appointment.client_name, email: appointment.client_email, phone: appointment.client_phone }, service: { title: appointment.service_label }, serviceType: appointment.service_type },
        consensoPdf: {
          filename: appointment.consent_pdf_filename,
          content: appointment.consent_pdf_buffer,
          url: appointment.consent_pdf_url,
        },
      });
      const { consent_pdf_buffer, ...responseAppointment } = appointment;
      return sendJson(res, 201, responseAppointment);
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
