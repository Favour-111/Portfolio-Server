import mongoose from "mongoose";

const CATEGORIES = ["Frontend", "Backend", "Mobile", "Database", "AI & Automation", "Infrastructure", "Design", "Tools"];

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, enum: CATEGORIES, required: true },
    icon: { type: String, default: "" }, // icon key used by the frontend icon map
    level: { type: Number, min: 0, max: 100, default: 80 },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SKILL_CATEGORIES = CATEGORIES;
export default mongoose.model("Skill", skillSchema);
