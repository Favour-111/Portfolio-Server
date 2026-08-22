import express from "express";
import { protect, optionalAuth } from "../middleware/auth.js";
import {
  getServices,
  createService,
  updateService,
  deleteService,
  reorderServices,
} from "../controllers/serviceController.js";

const router = express.Router();

router.get("/", optionalAuth, getServices);
router.patch("/reorder", protect, reorderServices);
router.post("/", protect, createService);
router.put("/:id", protect, updateService);
router.delete("/:id", protect, deleteService);

export default router;
