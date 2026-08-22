import asyncHandler from "express-async-handler";
import Admin from "../models/Admin.js";
import ActivityLog from "../models/ActivityLog.js";
import { fileUrl, deleteStoredFile } from "../config/storage.js";
import { recordMedia } from "../utils/recordMedia.js";

// @route PUT /api/admin/profile (admin) — Section 30 profile settings
export const updateProfile = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id);
  const { name, title, email, phone, location, shortBio, longBio, socials, password } = req.body;

  if (name) admin.name = name;
  if (title) admin.title = title;
  if (email) admin.email = email.toLowerCase();
  if (phone !== undefined) admin.phone = phone;
  if (location !== undefined) admin.location = location;
  if (shortBio !== undefined) admin.shortBio = shortBio;
  if (longBio !== undefined) admin.longBio = longBio;
  if (socials) admin.socials = { ...admin.socials.toObject(), ...socials };
  if (password) admin.passwordHash = await Admin.hashPassword(password);

  await admin.save();
  await ActivityLog.log("admin.profile_updated", "Profile settings updated", admin._id);

  const { passwordHash, ...safe } = admin.toObject();
  res.json({ success: true, admin: safe });
});

// @route POST /api/admin/profile/avatar (admin, multipart "image")
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No image uploaded.");
  }
  const admin = await Admin.findById(req.admin._id);
  const previousFilename = admin.avatar?.split("/").pop();
  admin.avatar = fileUrl(req, "images", req.file.filename);
  await admin.save();
  if (previousFilename) deleteStoredFile("images", previousFilename);
  await recordMedia(req, req.file, { usedIn: "profile", uploadedBy: admin._id });
  res.json({ success: true, avatar: admin.avatar });
});

// @route POST /api/admin/profile/cv (admin, multipart "cv" — PDF)
export const uploadCV = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded.");
  }
  const admin = await Admin.findById(req.admin._id);
  const previousFilename = admin.cvUrl?.split("/").pop();
  if (previousFilename) deleteStoredFile("documents", previousFilename);

  admin.cvUrl = fileUrl(req, "documents", req.file.filename);
  await admin.save();
  res.json({ success: true, cvUrl: admin.cvUrl });
});
