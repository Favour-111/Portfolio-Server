import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";

import { connectDB } from "./src/config/db.js";
import { STORAGE_ROOT } from "./src/config/storage.js";
import { notFound, errorHandler } from "./src/middleware/errorHandler.js";

import authRoutes from "./src/routes/auth.routes.js";
import projectRoutes from "./src/routes/projects.routes.js";
import galleryRoutes from "./src/routes/gallery.routes.js";
import skillRoutes from "./src/routes/skills.routes.js";
import experienceRoutes from "./src/routes/experience.routes.js";
import serviceRoutes from "./src/routes/services.routes.js";
import aboutRoutes from "./src/routes/about.routes.js";
import messageRoutes from "./src/routes/messages.routes.js";
import mediaRoutes from "./src/routes/media.routes.js";
import settingsRoutes from "./src/routes/settings.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";

await connectDB();

const app = express();

app.set("trust proxy", 1);
app.use(
  cors({
    origin: process.env.CLIENT_URL?.split(",") || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());

// Generic rate limit across the API; the login route gets a tighter one below.
app.use(
  "/api",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false })
);
app.use(
  "/api/auth/login",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { success: false, message: "Too many login attempts. Try again later." } })
);

// Uploaded images/documents live on disk under backend/storage and are
// served directly — e.g. /storage/images/169..-abc.webp
app.use("/storage", express.static(STORAGE_ROOT));

app.get("/api/health", (req, res) => res.json({ success: true, message: "API is running." }));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/experience", experienceRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/about", aboutRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Portfolio API listening on port ${PORT}`));
