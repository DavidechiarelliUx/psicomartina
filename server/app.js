import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { loadEnv } from "./env.js";
import {
  createDashboardToken,
  requireDashboardAuth,
  verifyDashboardCredentials,
  checkLoginRateLimit,
  registerFailedLogin,
  clearLoginAttempts,
} from "./lib/auth.js";
import { deleteImage, deleteRawFile, extractPublicId, uploadBlog, uploadConsentPdf } from "./lib/cloudinary.js";
import { sendAppointmentConfirmedToClient, sendBookingNotificationToStudio, sendBookingRequestReceivedToClient, sendCustomEmailToClient, sendReviewRequestToClient } from "./lib/mailer.js";

loadEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONSENT_TEMPLATE_PATH = join(__dirname, "assets", "modulo-consenso-informato-v2.pdf");

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

// Sedi gestibili (codici stabili). Le etichette sono mappate lato frontend dalle env.
const VALID_LOCATIONS = ["sede1", "sede2", "online"];
const DEFAULT_LOCATION = "sede1";

function normalizeLocation(loc) {
  return VALID_LOCATIONS.includes(loc) ? loc : DEFAULT_LOCATION;
}

// Default per sede: la sede principale è aperta Lun-Ven; le altre sono chiuse
// finché l'amministratore non le configura.
function defaultBookingScheduleFor(location) {
  if (location === DEFAULT_LOCATION) return defaultBookingSchedule;
  return defaultBookingSchedule.map((day) => ({ ...day, isOpen: false }));
}

// Etichetta completa della sede (per email/consenso), dalle env del sito.
function locationFullLabel(code) {
  const c = normalizeLocation(code);
  if (c === "online") return "Online";
  if (c === "sede2") return process.env.VITE_STUDIO_ADDRESS_2 || "Sede secondaria";
  return process.env.VITE_STUDIO_ADDRESS || "Studio";
}

function getConfiguredServiceLocations() {
  const studioAddresses = [process.env.VITE_STUDIO_ADDRESS, process.env.VITE_STUDIO_ADDRESS_2]
    .map((value) => sanitizeText(value))
    .filter(Boolean);
  return [...studioAddresses, "Online"];
}

function slugify(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getAllowedOrigins() {
  // Allowlist configurabile via env (CSV). Default: domini di produzione del sito.
  const fromEnv = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (fromEnv.length) return fromEnv;
  return [
    "https://psicomartina.it",
    "https://www.psicomartina.it",
    "https://psicomartina.vercel.app",
  ];
}

// Imposta CORS (con controllo origin) e header di sicurezza su ogni risposta API.
function applyBaseHeaders(req, res) {
  const origin = req.headers?.origin;
  if (origin && getAllowedOrigins().includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Max-Age", "86400");
  }
  // Header di sicurezza per le risposte API.
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cache-Control", "no-store");
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function getClientIp(req) {
  return (
    (req.headers?.["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

// Rate limiter in-memory per i form pubblici (best-effort su serverless, completo su server long-running).
const publicFormHits = new Map();
function checkPublicRateLimit(ip, { max = 10, windowMs = 10 * 60 * 1000 } = {}) {
  const key = ip || "unknown";
  const now = Date.now();
  const entry = publicFormHits.get(key);
  if (!entry || now - entry.first > windowMs) {
    publicFormHits.set(key, { count: 1, first: now });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}

// Registro dei consensi cookie: salva la scelta come prova (GDPR). L'IP non viene
// memorizzato in chiaro ma come hash (pseudonimizzazione), per minimizzazione dei dati.
async function recordCookieConsent(body, req) {
  const allowed = new Set(["accept_all", "reject_all", "custom"]);
  const choice = allowed.has(body?.choice) ? body.choice : "custom";
  const ip = getClientIp(req);
  const ipHash = ip && ip !== "unknown" ? createHash("sha256").update(ip).digest("hex").slice(0, 32) : null;
  const userAgent = String(req.headers?.["user-agent"] || "").slice(0, 255) || null;
  try {
    await prisma.cookieConsentLog.create({
      data: {
        choice,
        analytics: Boolean(body?.analytics),
        policyVersion: Number(body?.policyVersion) || 1,
        userAgent,
        ipHash,
      },
    });
  } catch (error) {
    // Non bloccare l'esperienza utente se il log fallisce.
    console.error("Cookie consent log error:", error?.message || error);
  }
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

function mapBookingSchedule(schedule, location) {
  return {
    location: schedule.location || location || DEFAULT_LOCATION,
    day_of_week: schedule.dayOfWeek,
    is_open: schedule.isOpen,
    opens_at: schedule.opensAt,
    closes_at: schedule.closesAt,
    slot_minutes: schedule.slotMinutes,
    slots: generateTimeSlots(schedule),
  };
}

async function getBookingSchedules(locationInput) {
  const location = normalizeLocation(locationInput);
  const rows = await prisma.bookingSchedule.findMany({ where: { location }, orderBy: { dayOfWeek: "asc" } });
  const byDay = new Map(rows.map((row) => [row.dayOfWeek, row]));
  return defaultBookingScheduleFor(location).map((fallback) => mapBookingSchedule(byDay.get(fallback.dayOfWeek) || fallback, location));
}

async function updateBookingSchedules(payload) {
  const location = normalizeLocation(payload?.location);
  const schedules = Array.isArray(payload?.schedules) ? payload.schedules : [];
  const validDays = new Set([0, 1, 2, 3, 4, 5, 6]);
  const updates = schedules
    .map((item) => ({
      location,
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
        where: { location_dayOfWeek: { location: item.location, dayOfWeek: item.dayOfWeek } },
        update: item,
        create: item,
      })
    )
  );

  return getBookingSchedules(location);
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
    gender: ["M", "F"].includes(consent.gender) ? consent.gender : null,
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
    serviceLocation: sanitizeText(consent.service_location) || getConfiguredServiceLocations()[0],
    minorFullName: sanitizeText(consent.minor_full_name) || null,
    tutorFullName: sanitizeText(consent.tutor_full_name) || null,
    tutorBirthPlace: sanitizeText(consent.tutor_birth_place) || null,
    tutorBirthDate: parseDateOnly(consent.tutor_birth_date),
    tutorResidenceCity: sanitizeText(consent.tutor_residence_city) || null,
    tutorResidenceAddress: sanitizeText(consent.tutor_residence_address) || null,
    tutorResidenceNumber: sanitizeText(consent.tutor_residence_number) || null,
    secondTutorFullName: sanitizeText(consent.second_tutor_full_name) || null,
    secondTutorBirthPlace: sanitizeText(consent.second_tutor_birth_place) || null,
    secondTutorBirthDate: parseDateOnly(consent.second_tutor_birth_date),
    secondTutorResidenceCity: sanitizeText(consent.second_tutor_residence_city) || null,
    secondTutorResidenceAddress: sanitizeText(consent.second_tutor_residence_address) || null,
    secondTutorResidenceNumber: sanitizeText(consent.second_tutor_residence_number) || null,
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
  const consentGranted = consent.personalDataConsentChoice !== "denied";
  const isOnline = String(consent.serviceLocation || "").trim().toLowerCase() === "online";
  // X nelle caselle "FORNISCE / NON FORNISCE IL CONSENSO".
  const consentCheck = (pageIndex, yMax) => check(pageIndex, consentGranted ? 74 : 207, yMax);
  // Desinenza "Nat[o/a]" SOLO se è stato indicato il sesso (M -> o, F -> a).
  const natEnding = consent.gender === "M" ? "o" : consent.gender === "F" ? "a" : "";

  // ===== PAGINA 1: dati anagrafici nel riquadro appropriato (coordinate template V2) =====
  if (consent.subjectType === "minor") {
    line(0, consent.minorFullName, 122, 391.0, { maxChars: 68 });          // Minorenne ...
    line(0, natEnding, 86, 407.5, { maxChars: 1 });                        // nat[o/a]
    line(0, consent.birthPlace, 112, 407.5, { maxChars: 46 });             // nat... a ...
    dateSlots(0, consent.birthDate, 376, 392, 405, 407.5, 7);             // il __/__/__
    line(0, consent.fiscalCode, 140, 421.2, { maxChars: 40 });             // codice fiscale ...
    line(0, consent.residenceCity, 122, 437.0, { maxChars: 52 });          // residente a ...
    line(0, consent.residenceAddress, 132, 452.9, { maxChars: 40 });       // in via/piazza ...
    line(0, consent.residenceNumber, 400, 452.9, { maxChars: 6 });         // n. civico
  } else if (consent.subjectType === "protected_person") {
    line(0, consent.clientFullName, 92, 531.0, { maxChars: 70 });          // Sig ...
    line(0, natEnding, 86, 549.8, { maxChars: 1 });                        // nat[o/a]
    line(0, consent.birthPlace, 106, 549.8, { maxChars: 48 });             // nat... a ...
    dateSlots(0, consent.birthDate, 371, 388, 401, 549.8, 7);
    line(0, consent.fiscalCode, 140, 565.7, { maxChars: 40 });
    line(0, consent.residenceCity, 124, 581.6, { maxChars: 52 });
    line(0, consent.residenceAddress, 132, 597.5, { maxChars: 40 });
    line(0, consent.residenceNumber, 400, 597.5, { maxChars: 6 });
  } else {
    line(0, consent.clientFullName, 113, 266.8, { maxChars: 70 });         // Sig/Sig.ra ...
    line(0, natEnding, 87, 285.5, { maxChars: 1 });                        // Nat[o/a]
    line(0, consent.birthPlace, 110, 285.5, { maxChars: 48 });             // Nat..... a ...
    dateSlots(0, consent.birthDate, 368, 385, 398, 285.5, 7);
    line(0, consent.fiscalCode, 140, 301.4, { maxChars: 40 });
    line(0, consent.residenceCity, 122, 317.3, { maxChars: 52 });
    line(0, consent.residenceAddress, 132, 333.2, { maxChars: 40 });
    line(0, consent.residenceNumber, 455, 333.2, { maxChars: 6 });
  }

  // Prestazione scelta: X accanto al punto elenco corrispondente.
  const serviceMarkY = consent.serviceKind === "sostegno_psicologico" ? 723.8 : consent.serviceKind === "altro" ? 743.4 : 704.3;
  check(0, 89, serviceMarkY);

  // ===== PAGINA 2: sede ("presso ___" oppure "in modalità telematica") =====
  if (isOnline) {
    check(1, 89, 122.9);
  } else {
    check(1, 89, 109.3);
    line(1, consent.serviceLocation, 142, 109.3, { maxChars: 60 });
  }
  // Durata, frequenza, compenso e modalità di pagamento: lasciati in bianco
  // (compilati a mano dall'amministrazione sul PDF stampato).

  // PAGINA 5: la data del colloquio ("avvenuto in data __/__/__") resta in bianco
  // (compilata a mano in fase di firma, insieme a luogo/data/firma).

  // ===== Pagine firma: riquadro in base al soggetto (solo nomi + casella consenso;
  // gli altri dati anagrafici di genitori/tutore si completano a mano in fase di firma) =====
  const finalBox = consent.signatureBox || consent.subjectType;
  if (finalBox === "minor") {
    // MADRE (pagina 6)
    line(5, consent.tutorFullName, 115, 408.5, { maxChars: 60 });          // La Sig.ra ...
    line(5, consent.minorFullName, 255, 424.5, { maxChars: 38 });          // madre del minorenne ...
    line(5, consent.tutorBirthPlace, 82, 440.4, { maxChars: 46 });         // nata a ...
    dateSlots(5, consent.tutorBirthDate, 375, 392, 405, 440.4, 7);         // il __/__/__
    line(5, consent.tutorResidenceCity, 142, 456.3, { maxChars: 52 });     // residente a ...
    line(5, consent.tutorResidenceAddress, 148, 472.3, { maxChars: 44 });  // in via/piazza ...
    line(5, consent.tutorResidenceNumber, 466, 472.3, { maxChars: 6 });    // n.
    consentCheck(5, 557.3);
    // PADRE (pagina 6 -> pagina 7)
    line(5, consent.secondTutorFullName, 110, 718.2, { maxChars: 60 });    // Il Sig. ...
    line(5, consent.minorFullName, 190, 734.3, { maxChars: 40 });          // padre del minorenne ...
    line(5, consent.secondTutorBirthPlace, 106, 752.6, { maxChars: 46 });  // Nat.. a ...
    dateSlots(5, consent.secondTutorBirthDate, 392, 410, 428, 752.6, 7);   // il __/__/__
    line(6, consent.secondTutorResidenceCity, 142, 84.6, { maxChars: 52 }); // residente a ... (pag.7)
    line(6, consent.secondTutorResidenceAddress, 153, 98.3, { maxChars: 44 }); // in via/piazza ...
    line(6, consent.secondTutorResidenceNumber, 466, 98.3, { maxChars: 6 });
    consentCheck(6, 183.8);
  } else if (finalBox === "protected_person") {
    // PERSONE SOTTO TUTELA (pagina 7)
    line(6, consent.tutorFullName || consent.signedName, 140, 372.2, { maxChars: 58 }); // La Sig.ra/Il Sig. (tutore)
    line(6, consent.tutorBirthPlace, 108, 387.7, { maxChars: 44 });        // nata/o a ...
    dateSlots(6, consent.tutorBirthDate, 448, 472, 490, 387.7, 7);         // il __/__/__
    line(6, consent.clientFullName, 175, 403.3, { maxChars: 48 });         // Tutore del Sig. ... (assistito)
    line(6, consent.tutorResidenceCity, 142, 449.9, { maxChars: 52 });     // residente a ...
    line(6, consent.tutorResidenceAddress, 148, 465.8, { maxChars: 44 });  // in via/piazza ...
    line(6, consent.tutorResidenceNumber, 466, 465.8, { maxChars: 6 });    // n.
    consentCheck(6, 551.4);
  } else {
    // ADULTI (pagina 6)
    line(5, consent.signedName || consent.clientFullName, 140, 154.7, { maxChars: 55 }); // La Sig.ra/Il Sig. ...
    consentCheck(5, 225.1);
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
  // Honeypot anti-spam: il campo deve restare vuoto. Se valorizzato, scartiamo la richiesta.
  if (payload.contact_time_pref) {
    const error = new Error("Richiesta non valida.");
    error.statusCode = 400;
    throw error;
  }
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

  // La sede selezionata dev'essere aperta in quel giorno e lo slot dev'essere valido per essa.
  const location = normalizeLocation(payload.location);
  const locationSchedules = await getBookingSchedules(location);
  const weekday = new Date(`${payload.date}T00:00:00.000Z`).getUTCDay();
  const daySchedule = locationSchedules.find((s) => s.day_of_week === weekday);
  if (!daySchedule || !daySchedule.is_open || !daySchedule.slots.includes(payload.time_slot)) {
    const error = new Error("La sede selezionata non è disponibile in questo giorno o orario.");
    error.statusCode = 400;
    throw error;
  }

  const closure = await prisma.bookingClosure.findUnique({ where: { date: new Date(`${payload.date}T00:00:00.000Z`) } });
  if (closure) {
    const error = new Error("La data selezionata non è disponibile (giorno di chiusura).");
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
          location,
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
          gender: consent.gender,
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
          tutorBirthPlace: consent.tutorBirthPlace,
          tutorBirthDate: consent.tutorBirthDate,
          tutorResidenceCity: consent.tutorResidenceCity,
          tutorResidenceAddress: consent.tutorResidenceAddress,
          tutorResidenceNumber: consent.tutorResidenceNumber,
          secondTutorFullName: consent.secondTutorFullName,
          secondTutorBirthPlace: consent.secondTutorBirthPlace,
          secondTutorBirthDate: consent.secondTutorBirthDate,
          secondTutorResidenceCity: consent.secondTutorResidenceCity,
          secondTutorResidenceAddress: consent.secondTutorResidenceAddress,
          secondTutorResidenceNumber: consent.secondTutorResidenceNumber,
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

async function getPublicAvailability(monthValue, locationInput) {
  const month = /^\d{4}-\d{2}$/.test(monthValue || "") ? monthValue : new Date().toISOString().slice(0, 7);
  const location = normalizeLocation(locationInput);
  const [year, monthIndex] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthIndex - 1, 1));
  const end = new Date(Date.UTC(year, monthIndex, 1));
  // Orari della SEDE selezionata; gli slot prenotati sono GLOBALI (una sola professionista).
  const schedules = await getBookingSchedules(location);
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

  // Chiusure straordinarie (valide per tutte le sedi).
  const closureRows = await prisma.bookingClosure.findMany({
    where: { date: { gte: start, lt: end } },
    select: { date: true },
  });
  const closures = new Set(closureRows.map((c) => formatDate(c.date)));

  const days = {};
  for (let cursor = new Date(start); cursor < end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const date = formatDate(cursor);
    const schedule = scheduleByDay.get(cursor.getUTCDay());
    const isClosed = closures.has(date);
    days[date] = {
      open: Boolean(schedule?.is_open) && !isClosed,
      closed: isClosed,
      slots: isClosed ? [] : schedule?.slots || [],
      booked: booked[date] || [],
    };
  }

  return { month, location, booked, days, closures: [...closures], schedule: schedules };
}

async function getClosures() {
  const rows = await prisma.bookingClosure.findMany({ orderBy: { date: "asc" }, select: { date: true, reason: true } });
  return rows.map((r) => ({ date: formatDate(r.date), reason: r.reason || null }));
}

async function addClosure(payload) {
  const date = String(payload?.date || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const error = new Error("Data non valida.");
    error.statusCode = 400;
    throw error;
  }
  const reason = payload?.reason ? sanitizeText(payload.reason).slice(0, 120) : null;
  await prisma.bookingClosure.upsert({
    where: { date: new Date(`${date}T00:00:00.000Z`) },
    update: { reason },
    create: { date: new Date(`${date}T00:00:00.000Z`), reason },
  });
  return getClosures();
}

async function removeClosure(dateInput) {
  const date = String(dateInput || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const error = new Error("Data non valida.");
    error.statusCode = 400;
    throw error;
  }
  await prisma.bookingClosure.deleteMany({ where: { date: new Date(`${date}T00:00:00.000Z`) } });
  return getClosures();
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
  const sede = locationFullLabel(payload.location);

  try {
    await sendBookingNotificationToStudio({
      cliente,
      data: payload.date,
      ora: payload.time_slot,
      servizio: serviceName,
      sede,
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
      sede,
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
      gender: record.gender,
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
      tutorBirthPlace: record.tutorBirthPlace,
      tutorBirthDate: record.tutorBirthDate,
      tutorResidenceCity: record.tutorResidenceCity,
      tutorResidenceAddress: record.tutorResidenceAddress,
      tutorResidenceNumber: record.tutorResidenceNumber,
      secondTutorFullName: record.secondTutorFullName,
      secondTutorBirthPlace: record.secondTutorBirthPlace,
      secondTutorBirthDate: record.secondTutorBirthDate,
      secondTutorResidenceCity: record.secondTutorResidenceCity,
      secondTutorResidenceAddress: record.secondTutorResidenceAddress,
      secondTutorResidenceNumber: record.secondTutorResidenceNumber,
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

  const name = sanitizeText(payload.name || appointment.client.fullName).slice(0, 120);
  const text = sanitizeText(payload.text).slice(0, 2000);
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

    applyBaseHeaders(req, res);

    if (req.method === "OPTIONS") {
      return sendJson(res, 204, {});
    }

    if (req.method === "GET" && url.pathname === "/api/health") {
      await prisma.$queryRaw`select 1`;
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "GET" && url.pathname === "/api/availability") {
      return sendJson(res, 200, await getPublicAvailability(url.searchParams.get("month"), url.searchParams.get("location")));
    }

    const publicReviewMatch = url.pathname.match(/^\/api\/reviews\/([^/]+)$/);
    if (publicReviewMatch && req.method === "GET") {
      return sendJson(res, 200, await getReviewContext(publicReviewMatch[1]));
    }
    if (publicReviewMatch && req.method === "POST") {
      if (!checkPublicRateLimit(getClientIp(req), { max: 15 })) {
        return sendJson(res, 429, { error: "Troppe richieste. Riprova più tardi." });
      }
      return sendJson(res, 201, await submitPublicReview(publicReviewMatch[1], await readJson(req)));
    }

    if (req.method === "POST" && url.pathname === "/api/auth/login") {
      const clientIp =
        (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
        req.socket?.remoteAddress ||
        "unknown";

      const rate = checkLoginRateLimit(clientIp);
      if (!rate.allowed) {
        res.setHeader?.("Retry-After", String(rate.retryAfter));
        return sendJson(res, 429, {
          error: `Troppi tentativi di accesso. Riprova tra ${Math.ceil(rate.retryAfter / 60)} minuti.`,
        });
      }

      const { username, password } = await readJson(req);
      if (verifyDashboardCredentials(username, password)) {
        clearLoginAttempts(clientIp);
        return sendJson(res, 200, { token: createDashboardToken(username) });
      }

      registerFailedLogin(clientIp);
      // Piccolo ritardo per rallentare il brute-force automatizzato.
      await new Promise((r) => setTimeout(r, 400));
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

    if (req.method === "POST" && url.pathname === "/api/cookie-consent") {
      if (!checkPublicRateLimit(getClientIp(req), { max: 30 })) {
        return sendJson(res, 429, { error: "Troppe richieste." });
      }
      const body = await readJson(req);
      await recordCookieConsent(body, req);
      return sendJson(res, 201, { ok: true });
    }

    if (req.method === "POST" && url.pathname === "/api/consents/preview") {
      if (!checkPublicRateLimit(getClientIp(req), { max: 20 })) {
        return sendJson(res, 429, { error: "Troppe richieste. Riprova più tardi." });
      }
      return await sendPreviewConsentPdf(res, await readJson(req));
    }

    if (req.method === "GET" && url.pathname === "/api/booking-schedules") {
      if (!requireDashboardAuth(req, res, sendJson)) return;
      const location = url.searchParams.get("location");
      return sendJson(res, 200, { location: normalizeLocation(location), schedules: await getBookingSchedules(location) });
    }

    if (req.method === "PUT" && url.pathname === "/api/booking-schedules") {
      if (!requireDashboardAuth(req, res, sendJson)) return;
      return sendJson(res, 200, { schedules: await updateBookingSchedules(await readJson(req)) });
    }

    if (url.pathname === "/api/booking-closures") {
      if (!requireDashboardAuth(req, res, sendJson)) return;
      if (req.method === "GET") return sendJson(res, 200, { closures: await getClosures() });
      if (req.method === "POST") return sendJson(res, 201, { closures: await addClosure(await readJson(req)) });
      if (req.method === "DELETE") return sendJson(res, 200, { closures: await removeClosure(url.searchParams.get("date")) });
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
      if (!checkPublicRateLimit(getClientIp(req))) {
        return sendJson(res, 429, { error: "Troppe richieste. Riprova più tardi." });
      }
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
      // Non esporre al browser del cliente né il buffer né l'URL del consenso (dati sanitari/minori).
      const { consent_pdf_buffer, consent_pdf_url, consent_pdf_filename, ...responseAppointment } = appointment;
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
    const status = error.statusCode || 500;
    // Gli errori 5xx non previsti non devono esporre dettagli interni al client (info leak).
    if (status >= 500) {
      console.error(error);
      return sendJson(res, status, { error: "Errore interno del server. Riprova più tardi." });
    }
    // Errori "attesi" (4xx): messaggio utile e sicuro per l'utente.
    return sendJson(res, status, { error: error.message || "Richiesta non valida." });
  }
}
