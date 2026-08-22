import jwt from "jsonwebtoken";

export const generateToken = (adminId) =>
  jwt.sign({ id: adminId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// Sets the auth token as an httpOnly cookie. `remember` controls the cookie
// lifetime: unchecked, it becomes a session cookie that dies with the browser.
export const sendTokenCookie = (res, token, remember) => {
  const maxAge = remember ? 7 * 24 * 60 * 60 * 1000 : undefined; // 7 days or session
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    ...(maxAge ? { maxAge } : {}),
  });
};
