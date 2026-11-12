import sharp from "sharp";

const MAX_DIMENSION = 1920;

// Shrinks oversized images and re-compresses them in the same format so a
// 4MB phone screenshot doesn't ship to every visitor. Called by the S3
// storage engine (src/config/storage.js) before the upload. Returns the
// original buffer if re-compressing wouldn't make it smaller.
export const optimizeImageBuffer = async (buffer, mimetype) => {
  const image = sharp(buffer).resize({
    width: MAX_DIMENSION,
    height: MAX_DIMENSION,
    fit: "inside",
    withoutEnlargement: true,
  });

  const format = mimetype.split("/")[1];
  if (format === "png") image.png({ compressionLevel: 9, palette: true });
  else if (format === "webp") image.webp({ quality: 82 });
  else image.jpeg({ quality: 82, mozjpeg: true });

  const optimized = await image.toBuffer();
  return optimized.length < buffer.length ? optimized : buffer;
};
