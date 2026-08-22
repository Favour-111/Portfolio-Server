import asyncHandler from "express-async-handler";
import Experience from "../models/Experience.js";
import ActivityLog from "../models/ActivityLog.js";
import { fileUrl, deleteStoredFile } from "../config/storage.js";
import { recordMedia } from "../utils/recordMedia.js";

// @route GET /api/experience
export const getExperience = asyncHandler(async (req, res) => {
  const filter = req.query.all === "true" && req.admin ? {} : { published: true };
  const experience = await Experience.find(filter).sort({ order: 1, startDate: -1 });
  res.json({ success: true, count: experience.length, experience });
});

// @route POST /api/experience (admin, optional multipart "logo")
export const createExperience = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.responsibilities) body.responsibilities = String(body.responsibilities).split("\n").filter(Boolean);
  if (body.technologies) body.technologies = String(body.technologies).split(",").map((t) => t.trim()).filter(Boolean);

  if (req.file) {
    body.logo = { url: fileUrl(req, "images", req.file.filename), publicId: req.file.filename };
    await recordMedia(req, req.file, { usedIn: "experience", uploadedBy: req.admin._id });
  }

  const experience = await Experience.create(body);
  await ActivityLog.log("experience.created", `Experience added — ${experience.company}`, req.admin._id);
  res.status(201).json({ success: true, experience });
});

// @route PUT /api/experience/:id (admin)
export const updateExperience = asyncHandler(async (req, res) => {
  const experience = await Experience.findById(req.params.id);
  if (!experience) {
    res.status(404);
    throw new Error("Experience entry not found.");
  }

  const body = { ...req.body };
  if (body.responsibilities) body.responsibilities = String(body.responsibilities).split("\n").filter(Boolean);
  if (body.technologies) body.technologies = String(body.technologies).split(",").map((t) => t.trim()).filter(Boolean);

  if (req.file) {
    if (experience.logo?.publicId) deleteStoredFile("images", experience.logo.publicId);
    body.logo = { url: fileUrl(req, "images", req.file.filename), publicId: req.file.filename };
    await recordMedia(req, req.file, { usedIn: "experience", refId: experience._id, uploadedBy: req.admin._id });
  }

  Object.assign(experience, body);
  await experience.save();
  await ActivityLog.log("experience.updated", `Experience updated — ${experience.company}`, req.admin._id);

  res.json({ success: true, experience });
});

// @route DELETE /api/experience/:id (admin)
export const deleteExperience = asyncHandler(async (req, res) => {
  const experience = await Experience.findByIdAndDelete(req.params.id);
  if (!experience) {
    res.status(404);
    throw new Error("Experience entry not found.");
  }
  await ActivityLog.log("experience.deleted", `Experience deleted — ${experience.company}`, req.admin._id);
  res.json({ success: true, message: "Experience deleted." });
});

// @route PATCH /api/experience/reorder (admin)
export const reorderExperience = asyncHandler(async (req, res) => {
  const { items } = req.body;
  await Promise.all(items.map((i) => Experience.findByIdAndUpdate(i.id, { order: i.order })));
  res.json({ success: true });
});
