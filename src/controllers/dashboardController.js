import asyncHandler from "express-async-handler";
import Project from "../models/Project.js";
import Gallery from "../models/Gallery.js";
import Skill from "../models/Skill.js";
import Service from "../models/Service.js";
import Experience from "../models/Experience.js";
import Message from "../models/Message.js";
import ActivityLog from "../models/ActivityLog.js";

// @route GET /api/admin/dashboard (admin) — overview cards + recent activity
export const getDashboard = asyncHandler(async (req, res) => {
  const [projects, gallery, skills, services, experience, messages, newMessages, activity] = await Promise.all([
    Project.countDocuments(),
    Gallery.countDocuments(),
    Skill.countDocuments(),
    Service.countDocuments(),
    Experience.countDocuments(),
    Message.countDocuments(),
    Message.countDocuments({ status: "New" }),
    ActivityLog.find().sort({ createdAt: -1 }).limit(15).populate("admin", "name"),
  ]);

  res.json({
    success: true,
    stats: {
      totalProjects: projects,
      galleryImages: gallery,
      skills,
      services,
      experienceEntries: experience,
      messages,
      newMessages,
    },
    recentActivity: activity,
  });
});

// @route GET /api/admin/search?q=react (admin) — global search (Section 33)
export const globalSearch = asyncHandler(async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return res.json({ success: true, results: {} });

  const regex = new RegExp(q, "i");

  const [projects, gallery, skills, experience, services, messages] = await Promise.all([
    Project.find({ $or: [{ title: regex }, { technologies: regex }, { category: regex }] }).limit(10),
    Gallery.find({ $or: [{ title: regex }, { tags: regex }] }).limit(10),
    Skill.find({ name: regex }).limit(10),
    Experience.find({ $or: [{ company: regex }, { position: regex }, { technologies: regex }] }).limit(10),
    Service.find({ title: regex }).limit(10),
    Message.find({ $or: [{ name: regex }, { email: regex }, { subject: regex }] }).limit(10),
  ]);

  res.json({
    success: true,
    results: { projects, gallery, skills, experience, services, messages },
  });
});
