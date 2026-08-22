import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import multer from "multer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Local disk storage — images/documents live under backend/storage and are
// served statically by server.js. Swapping to S3/Cloudinary/etc. later only
// means replacing this file: every route just imports `upload`/`uploadDoc`
// and every controller calls `fileUrl()` / `deleteStoredFile()`.
export const STORAGE_ROOT = path.join(__dirname, "..", "..", "storage");
export const IMAGES_DIR = path.join(STORAGE_ROOT, "images");
export const DOCUMENTS_DIR = path.join(STORAGE_ROOT, "documents");

[IMAGES_DIR, DOCUMENTS_DIR].forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

const uniqueFilename = (originalname) => {
  const ext = path.extname(originalname).toLowerCase();
  return `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
};

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGES_DIR),
  filename: (req, file, cb) => cb(null, uniqueFilename(file.originalname)),
});

const imageFileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPG, PNG and WEBP images are allowed."), false);
};

export const upload = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB per image
});

const docStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DOCUMENTS_DIR),
  filename: (req, file, cb) => cb(null, uniqueFilename(file.originalname)),
});

const docFileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Only PDF files are allowed."), false);
};

export const uploadDoc = multer({
  storage: docStorage,
  fileFilter: docFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Builds the public URL for a stored file. Honors X-Forwarded-* headers
// (server.js sets `trust proxy`) so this resolves correctly behind a
// reverse proxy on the VPS, not just in local dev.
export const fileUrl = (req, kind, filename) => `${req.protocol}://${req.get("host")}/storage/${kind}/${filename}`;

export const deleteStoredFile = (kind, filename) => {
  if (!filename) return;
  const dir = kind === "documents" ? DOCUMENTS_DIR : IMAGES_DIR;
  fs.unlink(path.join(dir, filename), () => {}); // best effort — ignore if already gone
};
