import express from "express";
import { protect, optionalAuth } from "../middleware/auth.js";
import { upload } from "../config/storage.js";
import {
  getExperience,
  createExperience,
  updateExperience,
  deleteExperience,
  reorderExperience,
} from "../controllers/experienceController.js";

const router = express.Router();

router.get("/", optionalAuth, getExperience);
router.patch("/reorder", protect, reorderExperience);
router.post("/", protect, upload.single("logo"),createExperience);
router.put("/:id", protect, upload.single("logo"),updateExperience);
router.delete("/:id", protect, deleteExperience);

export default router;
