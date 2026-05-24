import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { loadEnv } from "./env.js";
import { createDashboardToken, requireDashboardAuth } from "./lib/auth.js";
import { deleteImage, extractPublicId, uploadBlog } from "./lib/cloudinary.js";
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
  relazioni: "relazioni",
  autostima: "autostima",
  traumi: "traumi",
};

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
  const serviceType = payload.service_type || "primo_colloquio";
  const service = await prisma.service.findUnique({ where: { code: serviceType } });
  const email = String(payload.client_email || "").trim().toLowerCase();
  const fullName = String(payload.client_name || "").trim();

  if (!fullName || !email || !payload.date || !payload.time_slot || !payload.privacy_accepted) {
    const error = new Error("Compila nome, email, data, orario e consenso privacy.");
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

async function getPublicAvailability(monthValue) {
  const month = /^\d{4}-\d{2}$/.test(monthValue || "") ? monthValue : new Date().toISOString().slice(0, 7);
  const [year, monthIndex] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthIndex - 1, 1));
  const end = new Date(Date.UTC(year, monthIndex, 1));
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

  return { month, booked };
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
    if (req.method === "PATCH" && statusMatch) {
      if (!requireDashboardAuth(req, res, sendJson)) return;
      const { stato } = await readJson(req);
      const status = appointmentStatusToDb[stato];
      if (!status) return sendJson(res, 400, { error: "Stato prenotazione non valido." });
      const updated = await prisma.appointment.update({
        where: { id: statusMatch[1] },
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
