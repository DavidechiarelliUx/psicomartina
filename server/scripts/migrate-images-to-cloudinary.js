import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { loadEnv } from "../env.js";
import cloudinary, { extractPublicId } from "../lib/cloudinary.js";

loadEnv();

const { PrismaClient } = prismaPkg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL mancante.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function migrate() {
  console.log("Inizio migrazione immagini blog su Cloudinary...");

  const posts = await prisma.blogPost.findMany({
    where: {
      deletedAt: null,
      coverImage: { not: null },
    },
    select: {
      id: true,
      title: true,
      coverImage: true,
      coverImagePublicId: true,
    },
  });

  let migrated = 0;
  let linked = 0;
  let skipped = 0;

  for (const post of posts) {
    try {
      if (post.coverImagePublicId) {
        skipped += 1;
        continue;
      }

      const existingPublicId = extractPublicId(post.coverImage);
      if (existingPublicId) {
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { coverImagePublicId: existingPublicId },
        });
        linked += 1;
        continue;
      }

      if (!post.coverImage?.startsWith("data:")) {
        skipped += 1;
        continue;
      }

      const result = await cloudinary.uploader.upload(post.coverImage, {
        folder: "psicomartina/blog",
        transformation: [{ width: 1200, height: 630, crop: "fill", quality: "auto", fetch_format: "auto" }],
      });

      await prisma.blogPost.update({
        where: { id: post.id },
        data: {
          coverImage: result.secure_url,
          coverImagePublicId: result.public_id,
        },
      });

      migrated += 1;
      console.log(`Migrato "${post.title}" -> ${result.secure_url}`);
    } catch (error) {
      console.error(`Errore migrazione post ${post.id}:`, error.message);
    }
  }

  console.log(`Migrazione completata. Migrati: ${migrated}, collegati: ${linked}, saltati: ${skipped}.`);
}

migrate()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
