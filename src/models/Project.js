import mongoose from "mongoose";

const CATEGORIES = ["Web", "Mobile", "AI", "Automation", "UI/UX", "E-Commerce", "Dashboard", "Other"];

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: [String], enum: CATEGORIES, default: ["Web"] },

    thumbnail: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: "" },
        caption: { type: String, default: "" },
        order: { type: Number, default: 0 },
      },
    ],

    technologies: [{ type: String }],
    features: [{ type: String }],

    // Case study fields
    problem: { type: String, default: "" },
    solution: { type: String, default: "" },
    process: [{ type: String }], // e.g. Research, Planning, UI/UX, Development, Testing, Deployment
    results: { type: String, default: "" },

    projectUrl: { type: String, default: "" },
    githubUrl: { type: String, default: "" },
    caseStudyUrl: { type: String, default: "" },

    status: { type: String, enum: ["Completed", "In Progress", "Maintenance"], default: "Completed" },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

projectSchema.index({ title: "text", shortDescription: "text", technologies: "text" });

export const PROJECT_CATEGORIES = CATEGORIES;
export default mongoose.model("Project", projectSchema);
