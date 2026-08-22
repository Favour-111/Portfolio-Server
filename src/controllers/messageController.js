import asyncHandler from "express-async-handler";
import Message from "../models/Message.js";
import ActivityLog from "../models/ActivityLog.js";

// @route POST /api/messages (public — the contact form)
export const createMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, projectType, message } = req.body;
  if (!name || !email || !message) {
    res.status(400);
    throw new Error("Name, email, and message are required.");
  }

  const doc = await Message.create({ name, email, subject, projectType, message });
  await ActivityLog.log("message.received", `New contact message from ${name}`, null);

  res.status(201).json({ success: true, message: "Message sent. Thank you for reaching out!", data: doc });
});

// @route GET /api/messages (admin)
export const getMessages = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const filter = {};
  if (status && status !== "All") filter.status = status;
  if (search) {
    filter.$or = [
      { name: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
      { subject: new RegExp(search, "i") },
      { message: new RegExp(search, "i") },
    ];
  }
  const messages = await Message.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: messages.length, messages });
});

// @route PATCH /api/messages/:id/status (admin) body: {status}
export const updateMessageStatus = asyncHandler(async (req, res) => {
  const message = await Message.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!message) {
    res.status(404);
    throw new Error("Message not found.");
  }
  res.json({ success: true, message });
});

// @route DELETE /api/messages/:id (admin)
export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findByIdAndDelete(req.params.id);
  if (!message) {
    res.status(404);
    throw new Error("Message not found.");
  }
  res.json({ success: true, message: "Message deleted." });
});
