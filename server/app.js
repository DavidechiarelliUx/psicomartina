import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { loadEnv } from "./env.js";
import { createDashboardToken, requireDashboardAuth } from "./lib/auth.js";
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
  primo_colloquio: "Primo Colloquio",
  ansia: "Ansia",
  relazioni: "Relazioni",
  autostima: "Autostima",
  traumi: "Traumi",
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
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

function formatDate(date) {
  return date.toISOString().slice(0, 10);
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
    notes: appointment.notes,
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

function mapPost(post) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    category: post.category,
    cover_image: post.coverImage,
    published: post.published,
    reading_time: post.readingTime,
    created_date: (post.publishedAt || post.createdAt).toISOString(),
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
  const serviceType = payload.service_type || "primo_colloquio";
  const service = await prisma.service.findUnique({ where: { code: serviceType } });
  const email = String(payload.client_email || "").trim().toLowerCase();
  const fullName = String(payload.client_name || "").trim();

  if (!fullName || !email || !payload.date || !payload.time_slot || !payload.privacy_accepted) {
    const error = new Error("Compila nome, email, data, orario e consenso privacy.");
    error.statusCode = 400;
    throw error;
  }

  const client = await prisma.client.upsert({
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

  const appointment = await prisma.appointment.create({
    data: {
      clientId: client.id,
      serviceId: service?.id || null,
      serviceType,
      scheduledDate: new Date(`${payload.date}T00:00:00.000Z`),
      timeSlot: payload.time_slot,
      status: "pending",
      notes: payload.notes || null,
      privacyAccepted: true,
      source: "website",
    },
    include: { client: true, service: true },
  });

  if (payload.notes) {
    await prisma.contactMessage.create({
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

  return mapAppointment(appointment);
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

    if (req.method === "GET" && url.pathname === "/api/bookings/stats") {
      if (!requireDashboardAuth(req, res, sendJson)) return;
      const period = url.searchParams.get("period") || "week";
      return sendJson(res, 200, { period, data: await getBookingStats(period) });
    }

    if (req.method === "GET" && url.pathname === "/api/services") {
      const services = await prisma.service.findMany({
        where: { active: true, deletedAt: null },
        include: { benefits: { orderBy: { displayOrder: "asc" } } },
        orderBy: { displayOrder: "asc" },
      });
      return sendJson(res, 200, services);
    }

    if (req.method === "GET" && url.pathname === "/api/testimonials") {
      const testimonials = await prisma.testimonial.findMany({
        where: { visible: true, deletedAt: null },
        orderBy: { displayOrder: "asc" },
      });
      return sendJson(res, 200, testimonials);
    }

    if (req.method === "GET" && url.pathname === "/api/blog-posts") {
      const posts = await prisma.blogPost.findMany({
        where: { published: true, deletedAt: null },
        orderBy: { publishedAt: "desc" },
      });
      return sendJson(res, 200, posts.map(mapPost));
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/blog-posts/")) {
      const slug = decodeURIComponent(url.pathname.replace("/api/blog-posts/", ""));
      const post = await prisma.blogPost.findUnique({ where: { slug } });
      if (!post || !post.published || post.deletedAt) return sendJson(res, 404, { error: "Articolo non trovato" });
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
