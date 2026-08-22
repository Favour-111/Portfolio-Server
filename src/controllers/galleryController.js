import asyncHandler from "express-async-handler";
import Gallery from "../models/Gallery.js";
import ActivityLog from "../models/ActivityLog.js";
import { recordMedia } from "../utils/recordMedia.js";
import { fileUrl, deleteStoredFile } from "../config/storage.js";

// @route GET /api/gallery
export const getGalleryItems = asyncHandler(async (req, res) => {
  const { category, all } = req.query;
  const filter = {};
  if (!(all === "true" && req.admin)) filter.published = true;
  if (category && category !== "All") filter.category = category;

  const items = await Gallery.find(filter).sort({ order: 1, createdAt: -1 }).populate("project", "title slug");
  res.json({ success: true, count: items.length, items });
});

// @route POST /api/gallery (admin, multipart "image")
export const createGalleryItem = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("An image is required.");
  }

  const item = await Gallery.create({
    ...req.body,
    tags: req.body.tags ? String(req.body.tags).split(",").map((t) => t.trim()) : [],
    image: { url: fileUrl(req, "images", req.file.filename), publicId: req.file.filename },
  });

  await recordMedia(req, req.file, { usedIn: "gallery", refId: item._id, uploadedBy: req.admin._id });
  await ActivityLog.log("gallery.created", `Gallery image uploaded — ${item.title}`, req.admin._id);

  res.status(201).json({ success: true, item });
});

// @route PUT /api/gallery/:id (admin)
export const updateGalleryItem = asyncHandler(async (req, res) => {
  const item = await Gallery.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error("Gallery item not found.");
  }

  const updates = { ...req.body };
  if (updates.tags) updates.tags = String(updates.tags).split(",").map((t) => t.trim());

  if (req.file) {
    if (item.image?.publicId) deleteStoredFile("images", item.image.publicId);
    updates.image = { url: fileUrl(req, "images", req.file.filename), publicId: req.file.filename };
    await recordMedia(req, req.file, { usedIn: "gallery", refId: item._id, uploadedBy: req.admin._id });
  }

  Object.assign(item, updates);
  await item.save();
  await ActivityLog.log("gallery.updated", `Gallery item updated — ${item.title}`, req.admin._id);

  res.json({ success: true, item });
});

// @route DELETE /api/gallery/:id (admin)
export const deleteGalleryItem = asyncHandler(async (req, res) => {
  const item = await Gallery.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error("Gallery item not found.");
  }
  if (item.image?.publicId) deleteStoredFile("images", item.image.publicId);
  await item.deleteOne();
  await ActivityLog.log("gallery.deleted", `Gallery image deleted — ${item.title}`, req.admin._id);

  res.json({ success: true, message: "Gallery item deleted." });
});

// @route PATCH /api/gallery/reorder (admin) body: [{id, order}]
export const reorderGallery = asyncHandler(async (req, res) => {
  const { items } = req.body;
  await Promise.all(items.map((i) => Gallery.findByIdAndUpdate(i.id, { order: i.order })));
  res.json({ success: true });
});
