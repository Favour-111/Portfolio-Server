import Media from "../models/Media.js";
import { fileUrl } from "../config/storage.js";

// Called after any local image upload so the Media Library (Section 34)
// always has a searchable record of every image, regardless of which
// feature (project, gallery, profile...) uploaded it.
export const recordMedia = async (req, file, { usedIn = "other", refId = null, uploadedBy } = {}) => {
  if (!file) return null;

  return Media.create({
    url: fileUrl(req, "images", file.filename),
    publicId: file.filename,
    filename: file.originalname,
    format: file.mimetype?.split("/")[1] || "",
    bytes: file.size || 0,
    usedIn,
    refId,
    uploadedBy,
  });
};
