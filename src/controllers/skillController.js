import asyncHandler from "express-async-handler";
import Skill from "../models/Skill.js";
import ActivityLog from "../models/ActivityLog.js";

// @route GET /api/skills
export const getSkills = asyncHandler(async (req, res) => {
  const { all } = req.query;
  const filter = all === "true" && req.admin ? {} : { visible: true };
  const skills = await Skill.find(filter).sort({ category: 1, order: 1 });
  res.json({ success: true, count: skills.length, skills });
});

// @route POST /api/skills (admin)
export const createSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.create(req.body);
  await ActivityLog.log("skill.created", `Skill added — ${skill.name}`, req.admin._id);
  res.status(201).json({ success: true, skill });
});

// @route PUT /api/skills/:id (admin)
export const updateSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!skill) {
    res.status(404);
    throw new Error("Skill not found.");
  }
  await ActivityLog.log("skill.updated", `Skill updated — ${skill.name}`, req.admin._id);
  res.json({ success: true, skill });
});

// @route DELETE /api/skills/:id (admin)
export const deleteSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.findByIdAndDelete(req.params.id);
  if (!skill) {
    res.status(404);
    throw new Error("Skill not found.");
  }
  await ActivityLog.log("skill.deleted", `Skill deleted — ${skill.name}`, req.admin._id);
  res.json({ success: true, message: "Skill deleted." });
});

// @route PATCH /api/skills/reorder (admin) body: [{id, order}]
export const reorderSkills = asyncHandler(async (req, res) => {
  const { items } = req.body;
  await Promise.all(items.map((i) => Skill.findByIdAndUpdate(i.id, { order: i.order })));
  res.json({ success: true });
});
