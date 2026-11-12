import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import multer from "multer";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3, S3_BUCKET, CDN_URL, CACHE_CONTROL } from "./s3.js";
import { optimizeImageBuffer } from "../middleware/optimizeImage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Uploads are stored in S3 (private bucket) under storage/<kind>/<filename>
// and served through CloudFront at `${CDN_URL}/storage/<kind>/<filename>`.
// Every route just imports `upload`/`uploadDoc` and every controller calls
// `fileUrl()` / `deleteStoredFile()`.
//
// The local storage/ folder is no longer written to. It's kept only for the
// one-off migration scripts and so the VPS can still serve old /storage URLs.
export const STORAGE_ROOT = path.join(__dirname, "..", "..", "storage");
export const IMAGES_DIR = path.join(STORAGE_ROOT, "images");
export const DOCUMENTS_DIR = path.join(STORAGE_ROOT, "documents");

if (!S3_BUCKET || !CDN_URL) {
  console.error("Missing S3_BUCKET or CDN_URL in environment variables.");
  process.exit(1);
}

const objectKey = (kind, filename) => `storage/${kind}/${filename}`;

const uniqueFilename = (originalname) => {
  const ext = path.extname(originalname).toLowerCase();
  return `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
};

// Multer storage engine: buffers the upload, optionally transforms it (image
// compression), then puts it in S3. Sets file.filename/size like diskStorage
// did, so controllers work unchanged.
const s3Storage = (kind, transform) => ({
  _handleFile(req, file, cb) {
    const chunks = [];
    file.stream.on("data", (chunk) => chunks.push(chunk));
    file.stream.on("error", cb);
    file.stream.on("end", async () => {
      // Multer reports LIMIT_FILE_SIZE itself; don't upload the truncated file.
      if (file.stream.truncated) return cb(null, {});
      try {
        let body = Buffer.concat(chunks);
        if (transform) body = await transform(body, file.mimetype);
        const filename = uniqueFilename(file.originalname);
        await s3.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: objectKey(kind, filename),
            Body: body,
            ContentType: file.mimetype,
            CacheControl: CACHE_CONTROL,
          })
        );
        cb(null, { filename, size: body.length });
      } catch (err) {
        console.error(`S3 upload failed (${file.originalname}):`, err.message);
        const friendly = new Error("File upload failed. Please try again.");
        friendly.statusCode = 502;
        cb(friendly);
      }
    });
  },
  _removeFile(req, file, cb) {
    if (!file.filename) return cb(null);
    deleteStoredFile(kind, file.filename);
    cb(null);
  },
});

const imageFileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(Object.assign(new Error("Only JPG, PNG and WEBP images are allowed."), { statusCode: 400 }), false);
};

export const upload = multer({
  storage: s3Storage("images", optimizeImageBuffer),
  fileFilter: imageFileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB per image
});

const docFileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(Object.assign(new Error("Only PDF files are allowed."), { statusCode: 400 }), false);
};

export const uploadDoc = multer({
  storage: s3Storage("documents"),
  fileFilter: docFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Public CDN URL for a stored file. `req` is unused but kept so existing
// callers don't change.
export const fileUrl = (req, kind, filename) => `${CDN_URL}/${objectKey(kind, filename)}`;

export const deleteStoredFile = (kind, filename) => {
  if (!filename) return;
  // Best effort — S3 delete is idempotent, failures are only logged.
  s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: objectKey(kind, filename) })).catch((err) =>
    console.error(`S3 delete failed (${kind}/${filename}):`, err.message)
  );
};
