import mongoose from "mongoose";

// Simple audit trail shown on the admin Dashboard (Section 42).
const activityLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // e.g. "project.created"
    label: { type: String, required: true }, // human readable, e.g. "New project added — TradeMind AI"
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

activityLogSchema.statics.log = function (action, label, adminId) {
  return this.create({ action, label, admin: adminId });
};

export default mongoose.model("ActivityLog", activityLogSchema);
