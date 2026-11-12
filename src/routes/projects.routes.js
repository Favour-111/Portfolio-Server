import express from "express";
import { protect, optionalAuth } from "../middleware/auth.js";
import { upload } from "../config/storage.js";
import {
  getProjects,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject,
  reorderProjects,
  uploadThumbnail,
  uploadProjectImages,
  deleteProjectImage,
} from "../controllers/projectController.js";

const router = express.Router();

router.get("/", optionalAuth, getProjects);
router.patch("/reorder", protect, reorderProjects);
router.get("/:slug", optionalAuth, getProjectBySlug);

router.post("/", protect, createProject);
router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);

router.post("/:id/thumbnail", protect, upload.single("image"), uploadThumbnail);
router.post("/:id/images", protect, upload.array("images", 20),uploadProjectImages);
router.delete("/:id/images/:imageId", protect, deleteProjectImage);

export default router;
