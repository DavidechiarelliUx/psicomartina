/**
 * Bonifica una-tantum: rende PRIVATI i moduli di consenso già caricati su Cloudinary
 * come "raw/upload" (pubblicamente accessibili). Li converte a type "authenticated",
 * così diventano raggiungibili solo tramite URL firmato.
 *
 * USO (dalla root del progetto, con le env Cloudinary configurate in .env):
 *   node server/scripts/secure-existing-consents.js          # dry-run (mostra cosa farebbe)
 *   node server/scripts/secure-existing-consents.js --apply  # esegue la conversione
 *
 * Dopo l'esecuzione, gli URL pubblici precedenti restituiranno 401.
 * NOTA: gli URL salvati nel DB (pdfUrl) non sono usati dal frontend, quindi non serve aggiornarli.
 */
import { v2 as cloudinary } from "cloudinary";
import { loadEnv } from "../env.js";

loadEnv();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const APPLY = process.argv.includes("--apply");
const FOLDER = "psicomartina/consensi";

async function listAllRawAssets() {
  const assets = [];
  let nextCursor;
  do {
    const res = await cloudinary.api.resources({
      resource_type: "raw",
      type: "upload",
      prefix: FOLDER,
      max_results: 100,
      next_cursor: nextCursor,
    });
    assets.push(...res.resources);
    nextCursor = res.next_cursor;
  } while (nextCursor);
  return assets;
}

async function main() {
  console.log(`\n[secure-existing-consents] cartella: ${FOLDER}`);
  console.log(`[secure-existing-consents] modalità: ${APPLY ? "APPLY (modifica reale)" : "DRY-RUN (nessuna modifica)"}\n`);

  const assets = await listAllRawAssets();
  if (!assets.length) {
    console.log("Nessun asset 'raw/upload' pubblico trovato. Niente da fare.");
    return;
  }

  console.log(`Trovati ${assets.length} consensi pubblici da rendere privati:\n`);
  let done = 0;
  for (const asset of assets) {
    console.log(` - ${asset.public_id}`);
    if (APPLY) {
      try {
        await cloudinary.uploader.rename(asset.public_id, asset.public_id, {
          resource_type: "raw",
          to_type: "authenticated",
          overwrite: true,
        });
        done += 1;
      } catch (err) {
        console.error(`   ! Errore su ${asset.public_id}:`, err.message || err);
      }
    }
  }

  if (APPLY) {
    console.log(`\nFatto. Convertiti a 'authenticated': ${done}/${assets.length}.`);
  } else {
    console.log(`\nDry-run completato. Riesegui con --apply per rendere privati questi ${assets.length} file.`);
  }
}

main().catch((err) => {
  console.error("Errore inatteso:", err);
  process.exit(1);
});
