import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { loadEnv } from "../env.js";

loadEnv();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const blogStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "psicomartina/blog",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 630, crop: "fill", quality: "auto", fetch_format: "auto" }],
  },
});

const serviziStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "psicomartina/servizi",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "svg"],
    transformation: [{ width: 800, height: 600, crop: "fill", quality: "auto", fetch_format: "auto" }],
  },
});

const genericStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "psicomartina/misc",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "svg"],
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  },
});

export const uploadBlog = multer({ storage: blogStorage });
export const uploadServizi = multer({ storage: serviziStorage });
export const uploadGeneric = multer({ storage: genericStorage });

export function uploadConsentPdf(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "psicomartina/consensi",
        public_id: publicId,
        resource_type: "raw",
        format: "pdf",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    stream.end(buffer);
  });
}

export async function deleteImage(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
  }
}

export async function deleteRawFile(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
  } catch (error) {
    console.error("Cloudinary raw delete error:", error);
  }
}

export function extractPublicId(url) {
  if (!url || !url.includes("cloudinary.com")) return null;
  const parts = url.split("/");
  const uploadIndex = parts.indexOf("upload");
  if (uploadIndex === -1) return null;
  const afterUpload = parts.slice(uploadIndex + 1);
  const start = afterUpload[0]?.startsWith("v") ? 1 : 0;
  return afterUpload.slice(start).join("/").replace(/\.[^.]+$/, "");
}

export default cloudinary;
