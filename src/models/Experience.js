import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema(
  {
    company: { type: String, required: true },
    position: { type: String, required: true },
    startDate: { type: String, required: true }, // stored as "YYYY-MM" for simple display
    endDate: { type: String, default: "" },
    current: { type: Boolean, default: false },
    description: { type: String, default: "" },
    responsibilities: [{ type: String }],
    technologies: [{ type: String }],
    logo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Experience", experienceSchema);
