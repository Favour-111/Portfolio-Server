import asyncHandler from "express-async-handler";
import Settings from "../models/Settings.js";
import ActivityLog from "../models/ActivityLog.js";
import { fileUrl, deleteStoredFile } from "../config/storage.js";
import { recordMedia } from "../utils/recordMedia.js";

const getOrCreateSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  return settings;
};

// @route GET /api/settings (public — the frontend reads branding/hero/seo/contact from here)
export const getSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  res.json({ success: true, settings });
});

// @route PUT /api/settings (admin) body: partial deep-merge of branding/hero/seo/contact
export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  const { branding, hero, seo, contact } = req.body;

  if (branding) Object.assign(settings.branding, branding);
  if (hero) Object.assign(settings.hero, hero);
  if (seo) Object.assign(settings.seo, seo);
  if (contact) Object.assign(settings.contact, contact);

  await settings.save();
  await ActivityLog.log("settings.updated", "Website settings updated", req.admin._id);

  res.json({ success: true, settings });
});

// @route POST /api/settings/upload (admin) body field: "target" = logo|favicon|heroImage|ogImage, file: "image"
export const uploadSettingsImage = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  const { target } = req.body;
  if (!req.file) {
    res.status(400);
    throw new Error("No image uploaded.");
  }

  const map = {
    logo: ["branding", "logo"],
    favicon: ["branding", "favicon"],
    heroImage: ["hero", "heroImage"],
    ogImage: ["seo", "ogImage"],
  };
  const path = map[target];
  if (!path) {
    res.status(400);
    throw new Error("Invalid upload target.");
  }

  const [section, field] = path;
  const old = settings[section][field];
  if (old?.publicId) deleteStoredFile("images", old.publicId);

  settings[section][field] = { url: fileUrl(req, "images", req.file.filename), publicId: req.file.filename };
  await settings.save();
  await recordMedia(req, req.file, { usedIn: "settings", uploadedBy: req.admin._id });

  res.json({ success: true, settings });
});

// @route POST /api/settings/resume (admin, multipart "cv" — PDF) — powers the public "Download CV" button
export const uploadResume = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded.");
  }

  const previousFilename = settings.hero.resumeUrl?.split("/").pop();
  if (previousFilename) deleteStoredFile("documents", previousFilename);

  settings.hero.resumeUrl = fileUrl(req, "documents", req.file.filename);
  await settings.save();
  await ActivityLog.log("settings.updated", "CV/resume updated", req.admin._id);

  res.json({ success: true, settings });
});
