import mongoose from "mongoose";

// Singleton document holding the editable "About Me" content (Section 29).
const aboutSchema = new mongoose.Schema(
  {
    headline: { type: String, default: "Building Products, Not Just Websites." },
    biography: { type: String, default: "" },
    profileImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    professionalTitle: { type: String, default: "Full-Stack Developer • AI Automation • Product Builder" },
    location: { type: String, default: "Nigeria" },
    yearsOfExperience: { type: Number, default: 5 },
    stats: [
      {
        label: { type: String },
        value: { type: String },
      },
    ],
    timeline: [
      {
        label: { type: String },
        year: { type: String },
        icon: { type: String, default: "rocket" },
        order: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("About", aboutSchema);
