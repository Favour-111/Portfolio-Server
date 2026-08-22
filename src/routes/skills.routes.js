import express from "express";
import { protect, optionalAuth } from "../middleware/auth.js";
import { getSkills, createSkill, updateSkill, deleteSkill, reorderSkills } from "../controllers/skillController.js";

const router = express.Router();

router.get("/", optionalAuth, getSkills);
router.patch("/reorder", protect, reorderSkills);
router.post("/", protect, createSkill);
router.put("/:id", protect, updateSkill);
router.delete("/:id", protect, deleteSkill);

export default router;
