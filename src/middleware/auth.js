import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import Admin from "../models/Admin.js";

// Reads the JWT from either the httpOnly cookie ("Remember session") or the
// Authorization header, verifies it, and attaches req.admin.
export const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authenticated. Please sign in.");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("-passwordHash");
    if (!admin) {
      res.status(401);
      throw new Error("Admin account no longer exists.");
    }
    req.admin = admin;
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Session expired or invalid. Please sign in again.");
  }
});

// Attaches req.admin when a valid token is present, but never blocks the
// request — used on public GET routes that show extra data to admins
// (e.g. drafts) while still working for anonymous visitors.
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = await Admin.findById(decoded.id).select("-passwordHash");
    } catch (err) {
      req.admin = null;
    }
  }

  next();
});
