import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    image: {
      url: { type: String, required: true },
      publicId: { type: String, default: "" },
    },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
    category: {
      type: String,
      enum: ["Web", "Mobile", "AI", "Automation", "UI/UX", "E-Commerce", "Dashboard", "Other"],
      default: "Web",
    },
    tags: [{ type: String }],
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Gallery", gallerySchema);
