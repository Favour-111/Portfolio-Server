import asyncHandler from "express-async-handler";
import Admin from "../models/Admin.js";
import ActivityLog from "../models/ActivityLog.js";
import { generateToken, sendTokenCookie } from "../utils/generateToken.js";

// @route  POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password, remember } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required.");
  }

  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin || !(await admin.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password.");
  }

  const token = generateToken(admin._id);
  sendTokenCookie(res, token, Boolean(remember));

  await ActivityLog.log("admin.login", `${admin.name} signed in`, admin._id);

  res.json({
    success: true,
    token, // also returned so a non-cookie (e.g. mobile/SPA header) client can use it
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      title: admin.title,
      avatar: admin.avatar,
    },
  });
});

// @route  POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out." });
});

// @route  GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, admin: req.admin });
});
