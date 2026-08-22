import mongoose from "mongoose";

// Central record of every image uploaded through the admin panel (Section 34).
// Any upload endpoint (project images, gallery images, avatar, logo...) should
// also write one of these so the Media Library can list/search/filter them.
const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    filename: { type: String, default: "" },
    format: { type: String, default: "" },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    bytes: { type: Number, default: 0 },
    usedIn: {
      type: String,
      enum: ["project", "gallery", "profile", "settings", "experience", "other"],
      default: "other",
    },
    refId: { type: mongoose.Schema.Types.ObjectId, default: null }, // id of the project/gallery item using it
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

export default mongoose.model("Media", mediaSchema);
