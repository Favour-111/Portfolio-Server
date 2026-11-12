import express from "express";
import { protect, optionalAuth } from "../middleware/auth.js";
import { upload } from "../config/storage.js";
import {
  getGalleryItems,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  reorderGallery,
} from "../controllers/galleryController.js";

const router = express.Router();

router.get("/", optionalAuth, getGalleryItems);
router.patch("/reorder", protect, reorderGallery);
router.post("/", protect, upload.single("image"),createGalleryItem);
router.put("/:id", protect, upload.single("image"),updateGalleryItem);
router.delete("/:id", protect, deleteGalleryItem);

export default router;
