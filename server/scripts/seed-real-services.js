/**
 * Allinea la tabella "services" del DB al catalogo reale (DEFAULT_SERVICES).
 * - Upsert per "code" di servizi e ambiti con titoli/descrizioni/icone aggiornati.
 * - Soft-delete dei servizi non più previsti (es. vecchi "traumi").
 *
 * USO:  node server/scripts/seed-real-services.js
 */
import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { loadEnv } from "../env.js";
import { DEFAULT_SERVICES } from "../../src/config/servicesCatalog.js";

loadEnv();

const { PrismaClient } = prismaPkg;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const canonicalCodes = DEFAULT_SERVICES.map((s) => s.code);

  for (let i = 0; i < DEFAULT_SERVICES.length; i++) {
    const s = DEFAULT_SERVICES[i];
    const data = {
      title: s.title,
      subtitle: s.subtitle || null,
      description: s.description,
      iconLabel: s.icon || null,
      contentType: s.content_type || "servizio",
      displayOrder: i,
      active: true,
      deletedAt: null,
    };
    const existing = await prisma.service.findUnique({ where: { code: s.code } });
    if (existing) {
      await prisma.service.update({ where: { code: s.code }, data });
      console.log(`aggiornato: ${s.code}`);
    } else {
      await prisma.service.create({ data: { code: s.code, ...data } });
      console.log(`creato:     ${s.code}`);
    }
  }

  // Soft-delete dei servizi non più nel catalogo.
  const obsolete = await prisma.service.findMany({
    where: { code: { notIn: canonicalCodes }, deletedAt: null },
    select: { id: true, code: true },
  });
  for (const o of obsolete) {
    await prisma.service.update({ where: { id: o.id }, data: { deletedAt: new Date(), active: false } });
    console.log(`rimosso:    ${o.code}`);
  }

  console.log("\nFatto.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
