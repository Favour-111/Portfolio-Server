import express from "express";
import { protect } from "../middleware/auth.js";
import { upload, uploadDoc } from "../config/storage.js";
import { getSettings, updateSettings, uploadSettingsImage, uploadResume } from "../controllers/settingsController.js";

const router = express.Router();

router.get("/", getSettings);
router.put("/", protect, updateSettings);
router.post("/upload", protect, upload.single("image"), uploadSettingsImage);
router.post("/resume", protect, uploadDoc.single("cv"), uploadResume);

export default router;
