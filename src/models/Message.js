import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, default: "" },
    projectType: { type: String, default: "" },
    message: { type: String, required: true },
    status: { type: String, enum: ["New", "Read", "Replied", "Archived"], default: "New" },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
