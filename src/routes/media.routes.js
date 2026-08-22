import express from "express";
import { protect } from "../middleware/auth.js";
import { getMedia, getMediaUsage, deleteMedia } from "../controllers/mediaController.js";

const router = express.Router();

router.get("/", protect, getMedia);
router.get("/:id/usage", protect, getMediaUsage);
router.delete("/:id", protect, deleteMedia);

export default router;
