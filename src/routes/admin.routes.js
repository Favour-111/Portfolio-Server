import express from "express";
import { protect } from "../middleware/auth.js";
import { upload, uploadDoc } from "../config/storage.js";
import { getDashboard, globalSearch } from "../controllers/dashboardController.js";
import { updateProfile, uploadAvatar, uploadCV } from "../controllers/profileController.js";

const router = express.Router();

router.use(protect); // everything under /api/admin requires a signed-in admin

router.get("/dashboard", getDashboard);
router.get("/search", globalSearch);

router.put("/profile", updateProfile);
router.post("/profile/avatar", upload.single("image"), uploadAvatar);
router.post("/profile/cv", uploadDoc.single("cv"), uploadCV);

export default router;
