import asyncHandler from "express-async-handler";
import About from "../models/About.js";
import ActivityLog from "../models/ActivityLog.js";
import { fileUrl, deleteStoredFile } from "../config/storage.js";
import { recordMedia } from "../utils/recordMedia.js";

const getOrCreateAbout = async () => {
  let about = await About.findOne();
  if (!about) about = await About.create({});
  return about;
};

// @route GET /api/about
export const getAbout = asyncHandler(async (req, res) => {
  const about = await getOrCreateAbout();
  res.json({ success: true, about });
});

// @route PUT /api/about (admin, optional multipart "profileImage")
export const updateAbout = asyncHandler(async (req, res) => {
  const about = await getOrCreateAbout();
  const body = { ...req.body };

  if (body.stats && typeof body.stats === "string") body.stats = JSON.parse(body.stats);
  if (body.timeline && typeof body.timeline === "string") body.timeline = JSON.parse(body.timeline);

  if (req.file) {
    if (about.profileImage?.publicId) deleteStoredFile("images", about.profileImage.publicId);
    body.profileImage = { url: fileUrl(req, "images", req.file.filename), publicId: req.file.filename };
    await recordMedia(req, req.file, { usedIn: "profile", uploadedBy: req.admin._id });
  }

  Object.assign(about, body);
  await about.save();
  await ActivityLog.log("about.updated", "About section updated", req.admin._id);

  res.json({ success: true, about });
});
