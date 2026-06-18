/**
 * Cancellazione dei dati personali in base ai criteri di retention (art. 5.1.e GDPR).
 *
 * Comportamento PRUDENTE per impostazione predefinita:
 *  - DRY-RUN se non si passa --apply (mostra solo cosa verrebbe cancellato).
 *  - Cancella i MESSAGGI DI CONTATTO più vecchi di CONTACT_RETENTION_MONTHS (default 24).
 *  - I DATI CLINICI (appuntamenti, consensi, relativi PDF e clienti collegati) vengono
 *    cancellati SOLO se si passa esplicitamente --include-clinical, e solo oltre la soglia
 *    CLINICAL_RETENTION_MONTHS (default 120 mesi = 10 anni). La conservazione clinica
 *    risponde anche a obblighi deontologici/legali: valutare con il proprio consulente.
 *
 * USO (dalla root, con .env configurato):
 *   node server/scripts/data-retention.js                          # dry-run, solo contatti
 *   node server/scripts/data-retention.js --apply                  # cancella contatti scaduti
 *   node server/scripts/data-retention.js --include-clinical       # dry-run anche clinici
 *   node server/scripts/data-retention.js --include-clinical --apply
 *
 * Variabili opzionali:
 *   CONTACT_RETENTION_MONTHS, CLINICAL_RETENTION_MONTHS
 */
import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { loadEnv } from "../env.js";
import { deleteRawFile } from "../lib/cloudinary.js";

loadEnv();

const APPLY = process.argv.includes("--apply");
const INCLUDE_CLINICAL = process.argv.includes("--include-clinical");
const CONTACT_MONTHS = Number(process.env.CONTACT_RETENTION_MONTHS || 24);
const CLINICAL_MONTHS = Number(process.env.CLINICAL_RETENTION_MONTHS || 120);

const { PrismaClient } = prismaPkg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL mancante.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

function monthsAgo(months) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
}

async function purgeContactMessages(cutoff) {
  const targets = await prisma.contactMessage.findMany({
    where: { createdAt: { lt: cutoff } },
    select: { id: true, email: true, createdAt: true },
  });
  console.log(`\n[Messaggi di contatto] oltre ${CONTACT_MONTHS} mesi: ${targets.length}`);
  for (const t of targets) console.log(`  - ${t.email} (${t.createdAt.toISOString().slice(0, 10)})`);
  if (APPLY && targets.length) {
    const { count } = await prisma.contactMessage.deleteMany({ where: { createdAt: { lt: cutoff } } });
    console.log(`  -> cancellati: ${count}`);
  }
}

async function purgeClinical(cutoff) {
  // Consensi più vecchi della soglia: cancella PDF Cloudinary + record (cascade su appointment).
  const consents = await prisma.informedConsent.findMany({
    where: { createdAt: { lt: cutoff } },
    select: { id: true, appointmentId: true, clientId: true, pdfPublicId: true, clientEmail: true, createdAt: true },
  });
  console.log(`\n[Dati clinici] consensi oltre ${CLINICAL_MONTHS} mesi: ${consents.length}`);
  for (const c of consents) console.log(`  - ${c.clientEmail} (${c.createdAt.toISOString().slice(0, 10)})`);

  if (!APPLY) return;

  for (const c of consents) {
    if (c.pdfPublicId) await deleteRawFile(c.pdfPublicId); // rimuove il PDF sensibile da Cloudinary
    // Eliminando l'appuntamento si elimina in cascata il consenso (onDelete: Cascade).
    await prisma.appointment.delete({ where: { id: c.appointmentId } }).catch(async () => {
      await prisma.informedConsent.delete({ where: { id: c.id } }).catch(() => {});
    });
  }
  console.log(`  -> consensi/appuntamenti clinici cancellati: ${consents.length}`);

  // Clienti senza più appuntamenti, consensi o messaggi associati: orfani, cancellabili.
  const orphans = await prisma.client.findMany({
    where: { appointments: { none: {} }, informedConsents: { none: {} }, messages: { none: {} } },
    select: { id: true, email: true },
  });
  if (orphans.length) {
    await prisma.client.deleteMany({ where: { id: { in: orphans.map((o) => o.id) } } });
    console.log(`  -> clienti orfani cancellati: ${orphans.length}`);
  }
}

async function main() {
  console.log(`Retention — modalità: ${APPLY ? "APPLY (cancellazione reale)" : "DRY-RUN"}`);
  await purgeContactMessages(monthsAgo(CONTACT_MONTHS));
  if (INCLUDE_CLINICAL) {
    await purgeClinical(monthsAgo(CLINICAL_MONTHS));
  } else {
    console.log("\n[Dati clinici] saltati (usa --include-clinical per includerli).");
  }
  console.log("\nFatto.");
}

main()
  .catch((err) => {
    console.error("Errore:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
