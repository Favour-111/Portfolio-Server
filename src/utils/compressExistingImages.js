import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { IMAGES_DIR } from "../config/storage.js";

// One-off cleanup for images uploaded before auto-compression (see
// src/middleware/optimizeImage.js) existed. Re-run anytime to re-pass
// everything in storage/images — already-small files are left untouched.
const MAX_DIMENSION = 1920;

const run = async () => {
  const files = await fs.readdir(IMAGES_DIR);
  let totalBefore = 0;
  let totalAfter = 0;

  for (const filename of files) {
    const ext = path.extname(filename).toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) continue;

    const filePath = path.join(IMAGES_DIR, filename);

    try {
      const before = (await fs.stat(filePath)).size;

      const image = sharp(filePath).resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      });
      if (ext === ".png") image.png({ compressionLevel: 9, palette: true });
      else if (ext === ".webp") image.webp({ quality: 82 });
      else image.jpeg({ quality: 82, mozjpeg: true });

      const optimized = await image.toBuffer();
      totalBefore += before;

      if (optimized.length < before) {
        await fs.writeFile(filePath, optimized);
        totalAfter += optimized.length;
        console.log(`${filename}: ${(before / 1024).toFixed(0)}KB -> ${(optimized.length / 1024).toFixed(0)}KB`);
      } else {
        totalAfter += before;
        console.log(`${filename}: already optimal, left alone`);
      }
    } catch (err) {
      console.error(`${filename}: FAILED (${err.code || err.message}) — skipped`);
    }
  }

  console.log(`\nTotal: ${(totalBefore / 1024 / 1024).toFixed(1)}MB -> ${(totalAfter / 1024 / 1024).toFixed(1)}MB`);
};

run().then(() => process.exit(0));
