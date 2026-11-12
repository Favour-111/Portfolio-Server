import express from "express";
import { protect } from "../middleware/auth.js";
import { upload } from "../config/storage.js";
import { getAbout, updateAbout } from "../controllers/aboutController.js";

const router = express.Router();

router.get("/", getAbout);
router.put("/", protect, upload.single("profileImage"),updateAbout);

export default router;
