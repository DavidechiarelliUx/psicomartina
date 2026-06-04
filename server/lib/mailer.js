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

function emailShell({ eyebrow, title, intro, content, footerNote }) {
  return `
    <!doctype html>
    <html lang="it">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style="margin:0;padding:0;background:#F6F2E4;font-family:Arial,Helvetica,sans-serif;color:#2D2D2D;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F6F2E4;padding:28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#FFFFFF;border:1px solid #E8E1D3;border-radius:20px;overflow:hidden;box-shadow:0 18px 48px rgba(45,45,45,0.08);">
                <tr>
                  <td style="padding:30px 32px 22px;background:#FDFBF6;border-bottom:1px solid #EEE7DB;">
                    <p style="margin:0 0 8px;font-size:12px;letter-spacing:1.8px;text-transform:uppercase;color:#C47F64;font-weight:700;">${escapeHtml(eyebrow)}</p>
                    <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.18;color:#2E463A;">${escapeHtml(title)}</h1>
                    ${intro ? `<p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:#5C6A63;">${escapeHtml(intro)}</p>` : ""}
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 32px;">
                    ${content}
                  </td>
                </tr>
                <tr>
                  <td style="padding:22px 32px;background:#FDFBF6;border-top:1px solid #EEE7DB;">
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#6B756F;">${footerNote || "Studio Psicomartina · Dott.ssa Martina Giovinazzo"}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function infoRow(label, value) {
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #EFE8DC;font-size:13px;color:#7A6B60;width:38%;">${escapeHtml(label)}</td>
      <td style="padding:12px 0;border-bottom:1px solid #EFE8DC;font-size:15px;color:#2D2D2D;font-weight:700;">${escapeHtml(value || "-")}</td>
    </tr>
  `;
}

export async function sendBookingNotificationToStudio({ cliente, data, ora, servizio, messaggio, consensoPdf }) {
  const transporter = getTransporter();
  const fullName = `${cliente.nome} ${cliente.cognome || ""}`.trim();
  await transporter.sendMail({
    from: sender(),
    to: process.env.EMAIL_STUDIO,
    subject: `Nuova richiesta appuntamento - ${fullName}`,
    attachments: consensoPdf
      ? [
          {
            filename: consensoPdf.filename || "consenso-informato.pdf",
            content: consensoPdf.content,
            contentType: "application/pdf",
          },
        ]
      : [],
    html: emailShell({
      eyebrow: "Nuova prenotazione",
      title: "Richiesta appuntamento ricevuta",
      intro: "È arrivata una nuova richiesta dal sito. Il consenso informato è allegato a questa email e resta disponibile anche in dashboard.",
      content: `
        <div style="border:1px solid #E9DDCF;border-radius:16px;padding:18px 20px;background:#FFFDF9;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            ${infoRow("Cliente", fullName)}
            ${infoRow("Email", cliente.email)}
            ${infoRow("Telefono", cliente.telefono || "non fornito")}
            ${infoRow("Servizio", servizio)}
            ${infoRow("Data e ora", `${data} alle ${ora}`)}
          </table>
        </div>
        <div style="margin-top:18px;border-left:4px solid #9DBA8B;background:#F5F8F1;border-radius:12px;padding:16px 18px;">
          <p style="margin:0 0 6px;font-size:13px;color:#587064;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Messaggio</p>
          <p style="margin:0;font-size:15px;line-height:1.7;color:#2D2D2D;">${escapeHtml(messaggio || "Nessun messaggio aggiuntivo.")}</p>
        </div>
        <div style="margin-top:18px;padding:14px 16px;border-radius:12px;background:#F8EEE5;color:#7A4F35;font-size:14px;line-height:1.6;">
          <strong>Consenso informato:</strong> PDF allegato alla mail. ${consensoPdf?.url ? "Il documento è stato anche archiviato su Cloudinary e nella dashboard." : ""}
        </div>
      `,
      footerNote: "Promemoria operativo: verifica disponibilità, conferma l'appuntamento dalla dashboard e conserva il consenso informato.",
    }),
  });
}

export async function sendBookingConfirmationToClient({ cliente, data, ora, servizio }) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: sender(),
    to: cliente.email,
    subject: "Richiesta di appuntamento ricevuta - Studio Psicomartina",
    html: emailShell({
      eyebrow: "Richiesta ricevuta",
      title: `Grazie ${cliente.nome}`,
      intro: "Abbiamo ricevuto la tua richiesta di appuntamento. Ti ricontatteremo entro 24 ore lavorative per confermare la disponibilità.",
      content: `
        <div style="border:1px solid #E9DDCF;border-radius:16px;padding:18px 20px;background:#FFFDF9;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            ${infoRow("Servizio", servizio)}
            ${infoRow("Data richiesta", data)}
            ${infoRow("Orario", ora)}
          </table>
        </div>
        <div style="margin-top:20px;padding:18px 20px;border-radius:16px;background:#F5F8F1;border:1px solid #DCE8D4;">
          <p style="margin:0;font-size:15px;line-height:1.7;color:#40594D;">
            La richiesta non conferma ancora automaticamente l'appuntamento: riceverai una risposta dallo studio con la conferma definitiva o una proposta alternativa.
          </p>
        </div>
        <p style="margin:22px 0 0;font-size:15px;line-height:1.7;color:#5C6A63;">
          A presto,<br/>
          <strong style="color:#2E463A;">Studio Psicomartina</strong>
        </p>
      `,
      footerNote: "Se hai inviato questa richiesta per errore, puoi rispondere direttamente a questa email.",
    }),
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
