export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  // Multer file-size / file-type errors arrive without a statusCode set.
  const isMulterError = err.name === "MulterError";

  res.status(isMulterError ? 400 : statusCode).json({
    success: false,
    message: err.message || "Something went wrong on the server.",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
