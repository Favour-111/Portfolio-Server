import express from "express";
import { protect } from "../middleware/auth.js";
import {
  createMessage,
  getMessages,
  updateMessageStatus,
  deleteMessage,
} from "../controllers/messageController.js";

const router = express.Router();

router.post("/", createMessage); // public contact form
router.get("/", protect, getMessages);
router.patch("/:id/status", protect, updateMessageStatus);
router.delete("/:id", protect, deleteMessage);

export default router;
