import express from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../middleware/auth.js";
import { assistWriting } from "../controllers/aiController.js";

const router = express.Router();

// AI calls cost real money, so this gets a tighter limit than the general
// API rate limit in server.js.
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many AI requests. Wait a few minutes and try again." },
});

router.post("/writing", protect, aiLimiter, assistWriting);

export default router;
