import asyncHandler from "express-async-handler";
import Service from "../models/Service.js";
import ActivityLog from "../models/ActivityLog.js";

// @route GET /api/services
export const getServices = asyncHandler(async (req, res) => {
  const filter = req.query.all === "true" && req.admin ? {} : { active: true };
  const services = await Service.find(filter).sort({ order: 1 });
  res.json({ success: true, count: services.length, services });
});

// @route POST /api/services (admin)
export const createService = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.features && !Array.isArray(body.features)) {
    body.features = String(body.features).split("\n").filter(Boolean);
  }
  const service = await Service.create(body);
  await ActivityLog.log("service.created", `Service added — ${service.title}`, req.admin._id);
  res.status(201).json({ success: true, service });
});

// @route PUT /api/services/:id (admin)
export const updateService = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.features && !Array.isArray(body.features)) {
    body.features = String(body.features).split("\n").filter(Boolean);
  }
  const service = await Service.findByIdAndUpdate(req.params.id, body, { new: true });
  if (!service) {
    res.status(404);
    throw new Error("Service not found.");
  }
  await ActivityLog.log("service.updated", `Service updated — ${service.title}`, req.admin._id);
  res.json({ success: true, service });
});

// @route DELETE /api/services/:id (admin)
export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) {
    res.status(404);
    throw new Error("Service not found.");
  }
  await ActivityLog.log("service.deleted", `Service deleted — ${service.title}`, req.admin._id);
  res.json({ success: true, message: "Service deleted." });
});

// @route PATCH /api/services/reorder (admin)
export const reorderServices = asyncHandler(async (req, res) => {
  const { items } = req.body;
  await Promise.all(items.map((i) => Service.findByIdAndUpdate(i.id, { order: i.order })));
  res.json({ success: true });
});
