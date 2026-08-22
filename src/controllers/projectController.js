import asyncHandler from "express-async-handler";
import slugify from "slugify";
import Project from "../models/Project.js";
import ActivityLog from "../models/ActivityLog.js";
import { recordMedia } from "../utils/recordMedia.js";
import { fileUrl, deleteStoredFile } from "../config/storage.js";

const buildUniqueSlug = async (title, excludeId) => {
  const base = slugify(title, { lower: true, strict: true });
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Project.findOne({ slug, _id: { $ne: excludeId } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
};

// @route GET /api/projects  (public: only published; admin: all via ?all=true)
export const getProjects = asyncHandler(async (req, res) => {
  const { category, featured, search, all } = req.query;
  const filter = {};

  if (!(all === "true" && req.admin)) filter.published = true;
  if (category && category !== "All") filter.category = category;
  if (featured === "true") filter.featured = true;
  if (search) filter.$text = { $search: search };

  const projects = await Project.find(filter).sort({ order: 1, createdAt: -1 });
  res.json({ success: true, count: projects.length, projects });
});

// @route GET /api/projects/:slug
export const getProjectBySlug = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ slug: req.params.slug });
  if (!project || (!project.published && !req.admin)) {
    res.status(404);
    throw new Error("Project not found.");
  }
  res.json({ success: true, project });
});

// @route POST /api/projects  (admin)
export const createProject = asyncHandler(async (req, res) => {
  const body = req.body;
  const slug = await buildUniqueSlug(body.title);

  const project = await Project.create({ ...body, slug });
  await ActivityLog.log("project.created", `New project added — ${project.title}`, req.admin._id);

  res.status(201).json({ success: true, project });
});

// @route PUT /api/projects/:id  (admin)
export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found.");
  }

  if (req.body.title && req.body.title !== project.title) {
    req.body.slug = await buildUniqueSlug(req.body.title, project._id);
  }

  Object.assign(project, req.body);
  await project.save();
  await ActivityLog.log("project.updated", `Project updated — ${project.title}`, req.admin._id);

  res.json({ success: true, project });
});

// @route DELETE /api/projects/:id  (admin)
export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found.");
  }

  // Clean up stored image files tied to this project.
  const publicIds = [project.thumbnail?.publicId, ...project.images.map((i) => i.publicId)].filter(Boolean);
  publicIds.forEach((id) => deleteStoredFile("images", id));

  await project.deleteOne();
  await ActivityLog.log("project.deleted", `Project deleted — ${project.title}`, req.admin._id);

  res.json({ success: true, message: "Project deleted." });
});

// @route PATCH /api/projects/reorder  (admin) body: [{id, order}]
export const reorderProjects = asyncHandler(async (req, res) => {
  const { items } = req.body; // [{id, order}]
  await Promise.all(items.map((i) => Project.findByIdAndUpdate(i.id, { order: i.order })));
  res.json({ success: true });
});

// @route POST /api/projects/:id/thumbnail  (admin, multipart "image")
export const uploadThumbnail = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found.");
  }
  if (!req.file) {
    res.status(400);
    throw new Error("No image uploaded.");
  }

  if (project.thumbnail?.publicId) {
    deleteStoredFile("images", project.thumbnail.publicId);
  }

  project.thumbnail = { url: fileUrl(req, "images", req.file.filename), publicId: req.file.filename };
  await project.save();
  await recordMedia(req, req.file, { usedIn: "project", refId: project._id, uploadedBy: req.admin._id });

  res.json({ success: true, thumbnail: project.thumbnail });
});

// @route POST /api/projects/:id/images  (admin, multipart "images" array)
export const uploadProjectImages = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found.");
  }
  if (!req.files?.length) {
    res.status(400);
    throw new Error("No images uploaded.");
  }

  const startOrder = project.images.length;
  const newImages = req.files.map((f, idx) => ({
    url: fileUrl(req, "images", f.filename),
    publicId: f.filename,
    order: startOrder + idx,
  }));

  project.images.push(...newImages);
  await project.save();

  await Promise.all(
    req.files.map((f) => recordMedia(req, f, { usedIn: "project", refId: project._id, uploadedBy: req.admin._id }))
  );

  res.json({ success: true, images: project.images });
});

// @route DELETE /api/projects/:id/images/:imageId (admin)
export const deleteProjectImage = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found.");
  }
  const image = project.images.id(req.params.imageId);
  if (!image) {
    res.status(404);
    throw new Error("Image not found.");
  }

  if (image.publicId) deleteStoredFile("images", image.publicId);
  image.deleteOne();
  await project.save();

  res.json({ success: true, images: project.images });
});
