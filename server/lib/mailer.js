import nodemailer from "nodemailer";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function plainTextToHtml(value = "") {
  return String(value)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br/>")}</p>`)
    .join("\n");
}

function getTransporter() {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_PASS === "APP_PASSWORD_QUI") {
    throw new Error("Configurazione SMTP incompleta. Imposta EMAIL_HOST, EMAIL_USER e EMAIL_PASS in .env.");
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: Number(process.env.EMAIL_PORT || 587) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

function sender() {
  return `"Studio Psicomartina" <${process.env.EMAIL_USER}>`;
}

export async function sendBookingNotificationToStudio({ cliente, data, ora, servizio, messaggio }) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: sender(),
    to: process.env.EMAIL_STUDIO,
    subject: `Nuova prenotazione da ${cliente.nome} ${cliente.cognome || ""}`.trim(),
    html: `
      <h2>Nuova richiesta di prenotazione</h2>
      <p><strong>Nome:</strong> ${escapeHtml(cliente.nome)} ${escapeHtml(cliente.cognome || "")}</p>
      <p><strong>Email:</strong> ${escapeHtml(cliente.email)}</p>
      <p><strong>Telefono:</strong> ${escapeHtml(cliente.telefono || "non fornito")}</p>
      <p><strong>Servizio:</strong> ${escapeHtml(servizio)}</p>
      <p><strong>Data richiesta:</strong> ${escapeHtml(data)} alle ${escapeHtml(ora)}</p>
      <p><strong>Messaggio:</strong> ${escapeHtml(messaggio || "-")}</p>
    `,
  });
}

export async function sendBookingConfirmationToClient({ cliente, data, ora, servizio }) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: sender(),
    to: cliente.email,
    subject: "Richiesta di appuntamento ricevuta - Studio Psicomartina",
    html: `
      <h2>Grazie ${escapeHtml(cliente.nome)},</h2>
      <p>Abbiamo ricevuto la tua richiesta di appuntamento.</p>
      <p><strong>Servizio:</strong> ${escapeHtml(servizio)}</p>
      <p><strong>Data:</strong> ${escapeHtml(data)} alle ${escapeHtml(ora)}</p>
      <p>Ti contatteremo entro 24 ore lavorative per confermare la disponibilita.</p>
      <br/>
      <p>A presto,<br/>Studio Psicomartina</p>
    `,
  });
}

export async function sendCustomEmailToClient({ toEmail, toNome, subject, body }) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: sender(),
    to: toEmail,
    subject,
    html: `
      ${plainTextToHtml(body || `Gentile ${toNome || ""},`)}
      <br/>
      <p>A presto,<br/>Studio Psicomartina</p>
    `,
  });
}
