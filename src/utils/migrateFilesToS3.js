import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, S3_BUCKET, CDN_URL, CACHE_CONTROL } from "../config/s3.js";
import { STORAGE_ROOT } from "../config/storage.js";

// One-off copy of everything under storage/images and storage/documents to
// S3, keyed by the same path (storage/images/<file>) so only the URL host
// changes. Read-only on the local disk. Safe to re-run: files already in S3
// with a matching MD5 are skipped. Writes a JSON report to migration-reports/.
const FOLDERS = ["images", "documents"];
const MAX_ATTEMPTS = 3;
const CONTENT_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

const md5 = (buf) => crypto.createHash("md5").update(buf).digest("hex");

const remoteMd5 = async (Key) => {
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key }));
    return { etag: head.ETag?.replaceAll('"', ""), size: head.ContentLength };
  } catch (err) {
    if (err.$metadata?.httpStatusCode === 404 || err.name === "NotFound") return null;
    throw err;
  }
};

const uploadOne = async (file) => {
  const body = await fs.readFile(file.localPath);
  const hash = md5(body);

  const existing = await remoteMd5(file.key);
  if (existing?.etag === hash && existing.size === body.length) return { status: "skipped", md5: hash };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: file.key,
          Body: body,
          ContentType: file.contentType,
          CacheControl: CACHE_CONTROL,
          ContentMD5: Buffer.from(hash, "hex").toString("base64"), // S3 rejects corrupted uploads
        })
      );
      const after = await remoteMd5(file.key);
      if (after?.etag !== hash || after.size !== body.length) throw new Error("Verification failed: checksum/size mismatch");
      return { status: "uploaded", md5: hash, attempts: attempt };
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) return { status: "failed", md5: hash, error: err.message, attempts: attempt };
    }
  }
};

const checkCdn = async (key) => {
  if (!CDN_URL) return null;
  try {
    const res = await fetch(`${CDN_URL}/${key}`, { method: "HEAD" });
    return res.status;
  } catch (err) {
    return `error: ${err.message}`;
  }
};

const run = async () => {
  if (!S3_BUCKET) throw new Error("S3_BUCKET is not set.");

  const inventory = [];
  for (const folder of FOLDERS) {
    const dir = path.join(STORAGE_ROOT, folder);
    for (const name of await fs.readdir(dir)) {
      if (name.startsWith(".")) continue; // .gitkeep etc.
      const localPath = path.join(dir, name);
      const stat = await fs.stat(localPath);
      if (!stat.isFile()) continue;
      inventory.push({
        localPath,
        key: `storage/${folder}/${name}`,
        bytes: stat.size,
        contentType: CONTENT_TYPES[path.extname(name).toLowerCase()] || "application/octet-stream",
      });
    }
  }
  const totalBytes = inventory.reduce((s, f) => s + f.bytes, 0);
  console.log(`Discovered ${inventory.length} files (${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);

  const results = [];
  for (const file of inventory) {
    const r = await uploadOne(file);
    const cdnStatus = r.status === "failed" ? null : await checkCdn(file.key);
    results.push({ key: file.key, bytes: file.bytes, contentType: file.contentType, ...r, cdnStatus });
    console.log(`${r.status.padEnd(8)} ${file.key}${cdnStatus ? `  cdn=${cdnStatus}` : ""}${r.error ? `  ${r.error}` : ""}`);
  }

  const count = (s) => results.filter((r) => r.status === s).length;
  const summary = {
    finishedAt: new Date().toISOString(),
    bucket: S3_BUCKET,
    cdn: CDN_URL || null,
    discovered: inventory.length,
    totalBytes,
    uploaded: count("uploaded"),
    skippedAlreadyPresent: count("skipped"),
    failed: count("failed"),
    cdnNot200: results.filter((r) => r.cdnStatus !== null && r.cdnStatus !== 200).length,
  };

  const reportDir = path.join(STORAGE_ROOT, "..", "migration-reports");
  await fs.mkdir(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `files-to-s3-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify({ summary, results }, null, 2));

  console.log("\n", summary, `\nReport: ${reportPath}`);
  if (summary.failed || summary.cdnNot200) process.exitCode = 1;
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
