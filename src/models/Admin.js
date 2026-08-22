import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "owner"], default: "owner" },

    // Profile settings (Section 30)
    title: { type: String, default: "Full-Stack Developer" },
    phone: { type: String, default: "" },
    avatar: { type: String, default: "" }, // cloudinary URL
    location: { type: String, default: "Nigeria" },
    shortBio: { type: String, default: "" },
    longBio: { type: String, default: "" },
    cvUrl: { type: String, default: "" }, // cloudinary URL to uploaded PDF
    socials: {
      github: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
      telegram: { type: String, default: "" },
      other: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

adminSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

adminSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 12);
};

export default mongoose.model("Admin", adminSchema);
