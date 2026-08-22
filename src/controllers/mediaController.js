import asyncHandler from "express-async-handler";
import Media from "../models/Media.js";
import Project from "../models/Project.js";
import Gallery from "../models/Gallery.js";
import { deleteStoredFile } from "../config/storage.js";

// @route GET /api/media (admin) ?usedIn=project&search=
export const getMedia = asyncHandler(async (req, res) => {
  const { usedIn, search } = req.query;
  const filter = {};
  if (usedIn && usedIn !== "All") filter.usedIn = usedIn;
  if (search) filter.filename = new RegExp(search, "i");

  const media = await Media.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: media.length, media });
});

// @route GET /api/media/:id/usage (admin) — where is this image used right now
export const getMediaUsage = asyncHandler(async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (!media) {
    res.status(404);
    throw new Error("Media item not found.");
  }

  const [usedInProjects, usedInGallery] = await Promise.all([
    Project.find({ $or: [{ "thumbnail.publicId": media.publicId }, { "images.publicId": media.publicId }] }).select(
      "title slug"
    ),
    Gallery.find({ "image.publicId": media.publicId }).select("title"),
  ]);

  res.json({ success: true, media, usedInProjects, usedInGallery });
});

// @route DELETE /api/media/:id (admin) — deletes the file from disk + the library record
export const deleteMedia = asyncHandler(async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (!media) {
    res.status(404);
    throw new Error("Media item not found.");
  }
  deleteStoredFile("images", media.publicId);
  await media.deleteOne();
  res.json({ success: true, message: "Media deleted." });
});
