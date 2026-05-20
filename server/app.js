import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { loadEnv } from "./env.js";

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
    "Access-Control-Allow-Headers": "Content-Type",
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

function mapAppointment(appointment) {
  return {
    id: appointment.id,
    client_name: appointment.client.fullName,
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
  return {
    id: message.id,
    name: message.name,
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

    if (req.method === "GET" && url.pathname === "/api/dashboard") {
      return sendJson(res, 200, await getDashboard());
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
      return sendJson(res, 201, await createAppointment(payload));
    }

    return sendJson(res, 404, { error: "Endpoint non trovato" });
  } catch (error) {
    console.error(error);
    sendJson(res, error.statusCode || 500, { error: error.message || "Errore server" });
  }
}
