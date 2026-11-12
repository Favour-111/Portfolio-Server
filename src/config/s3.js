import { S3Client } from "@aws-sdk/client-s3";

// Shared S3 client. Credentials come from the environment only — never
// hard-code them. S3_ENDPOINT is optional (for S3-compatible providers).
export const S3_BUCKET = process.env.S3_BUCKET;
export const CDN_URL = (process.env.CDN_URL || "").replace(/\/+$/, "");

export const s3 = new S3Client({
  region: process.env.S3_REGION,
  ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

// Every stored filename is `${timestamp}-${random}${ext}` and never reused,
// so objects can be cached forever.
export const CACHE_CONTROL = "public, max-age=31536000, immutable";
