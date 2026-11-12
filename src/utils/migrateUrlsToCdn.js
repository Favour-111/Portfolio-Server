import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import { EJSON } from "bson";
import { connectDB } from "../config/db.js";
import { CDN_URL } from "../config/s3.js";
import { STORAGE_ROOT } from "../config/storage.js";

// Rewrites stored file URLs from the old VPS hosts to CDN_URL, keeping the
// /storage/<kind>/<file> path. Dry-run by default; pass --apply to write.
//
//   https://169-58-14-67.sslip.io/storage/images/a.png -> ${CDN_URL}/storage/images/a.png
//   /storage/images/a.png                              -> ${CDN_URL}/storage/images/a.png
//
// Only strings whose path starts with /storage/images/ or /storage/documents/
// on one of the hosts below (or with no host) are touched, so external links
// (GitHub, Vercel...) are never changed. Each change is a targeted $set on
// that exact field, filtered on its old value. Already-migrated values no
// longer match, so re-running is a no-op.
const OLD_HOSTS = (process.env.OLD_MEDIA_HOSTS || "169-58-14-67.sslip.io,brake-reason-rob-compaq.trycloudflare.com,169.58.14.67")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

const APPLY = process.argv.includes("--apply");
const STORAGE_PATH = /^\/storage\/(images|documents)\/[^/?#]+$/;

const newUrlFor = (value) => {
  if (typeof value !== "string") return null;
  if (value.startsWith("/storage/")) return STORAGE_PATH.test(value) ? `${CDN_URL}${value}` : null;
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (!OLD_HOSTS.includes(url.host.toLowerCase())) return null;
  if (!STORAGE_PATH.test(url.pathname)) return null;
  return `${CDN_URL}${url.pathname}`;
};

// Yields [dottedPath, value] for every string in a document (array indices included).
function* strings(val, p = "") {
  if (typeof val === "string") yield [p, val];
  else if (Array.isArray(val)) for (let i = 0; i < val.length; i++) yield* strings(val[i], `${p}.${i}`);
  else if (val && typeof val === "object" && !(val instanceof Date) && !val._bsontype)
    for (const [k, v] of Object.entries(val)) yield* strings(v, p ? `${p}.${k}` : k);
}

const run = async () => {
  if (!/^https:\/\//.test(CDN_URL)) throw new Error("CDN_URL must be set to an https:// URL.");
  await connectDB();
  const db = mongoose.connection.db;
  const collections = (await db.listCollections().toArray()).map((c) => c.name);

  // 1. Find every change.
  const changes = [];
  for (const col of collections) {
    for await (const doc of db.collection(col).find()) {
      for (const [field, oldValue] of strings(doc)) {
        const newValue = newUrlFor(oldValue);
        if (newValue && newValue !== oldValue) changes.push({ collection: col, _id: doc._id, field, oldValue, newValue });
      }
    }
  }
  const affected = [...new Set(changes.map((c) => c.collection))];
  console.log(`Found ${changes.length} URL(s) to rewrite across: ${affected.join(", ") || "none"}`);

  const reportDir = path.join(STORAGE_ROOT, "..", "migration-reports");
  await fs.mkdir(reportDir, { recursive: true });
  const stamp = Date.now();

  if (!APPLY) {
    const preview = path.join(reportDir, `urls-dry-run-${stamp}.json`);
    await fs.writeFile(preview, EJSON.stringify(changes, null, 2, { relaxed: false }));
    console.log(`Dry run only — nothing written. Preview: ${preview}\nRe-run with --apply to update the database.`);
    return;
  }
  if (!changes.length) return console.log("Nothing to do.");

  // 2. Back up every affected collection in full and verify the backup reads back.
  const backupPath = path.join(reportDir, `db-backup-${stamp}.json`);
  const backup = {};
  for (const col of affected) backup[col] = await db.collection(col).find().toArray();
  await fs.writeFile(backupPath, EJSON.stringify(backup, null, 0, { relaxed: false }));
  const reread = EJSON.parse(await fs.readFile(backupPath, "utf8"), { relaxed: false });
  for (const col of affected) {
    const live = await db.collection(col).countDocuments();
    if (reread[col]?.length !== live) throw new Error(`Backup verification failed for ${col}; nothing modified.`);
  }
  console.log(`Backup verified: ${backupPath}`);

  // 3. Apply each change as a targeted $set guarded by the old value.
  const log = [];
  for (const c of changes) {
    const res = await db
      .collection(c.collection)
      .updateOne({ _id: c._id, [c.field]: c.oldValue }, { $set: { [c.field]: c.newValue } });
    log.push({ ...c, modified: res.modifiedCount });
  }
  const modified = log.filter((l) => l.modified).length;

  // 4. Check every new URL actually resolves through the CDN.
  const distinct = [...new Set(changes.map((c) => c.newValue))];
  const broken = [];
  for (const url of distinct) {
    const status = (await fetch(url, { method: "HEAD" }).catch(() => ({ status: "error" }))).status;
    if (status !== 200) broken.push({ url, status, usedBy: changes.filter((c) => c.newValue === url).map((c) => `${c.collection}:${c._id}:${c.field}`) });
  }

  const summary = { finishedAt: new Date().toISOString(), cdn: CDN_URL, oldHosts: OLD_HOSTS, found: changes.length, modified, distinctUrls: distinct.length, notResolving: broken.length, backupPath };
  const reportPath = path.join(reportDir, `urls-applied-${stamp}.json`);
  await fs.writeFile(reportPath, EJSON.stringify({ summary, broken, log }, null, 2, { relaxed: false }));
  console.log(summary);
  broken.forEach((b) => console.log(`  NOT 200 (${b.status}) ${b.url} <- ${b.usedBy.join(", ")}`));
  console.log(`Report: ${reportPath}`);
};

run()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
