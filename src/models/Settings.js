import mongoose from "mongoose";

// Singleton document holding global website settings (Section 31).
const settingsSchema = new mongoose.Schema(
  {
    branding: {
      siteName: { type: String, default: "O.O.F Portfolio" },
      logoText: { type: String, default: "O.O.F" },
      logo: { url: { type: String, default: "" }, publicId: { type: String, default: "" } },
      favicon: { url: { type: String, default: "" }, publicId: { type: String, default: "" } },
      primaryColor: { type: String, default: "#3B82F6" },
      secondaryColor: { type: String, default: "#0F172A" },
    },
    hero: {
      badge: { type: String, default: "FULL-STACK DEVELOPER • AI • PRODUCT BUILDER" },
      headline: { type: String, default: "I Build Digital Products That Turn Ideas Into Reality." },
      subtitle: {
        type: String,
        default:
          "Full-Stack Web & Mobile Developer building scalable applications, AI-powered systems, automation tools, and digital products.",
      },
      ctaPrimary: { type: String, default: "View My Work" },
      ctaSecondary: { type: String, default: "Let's Work Together" },
      heroImage: { url: { type: String, default: "" }, publicId: { type: String, default: "" } },
      availableForProjects: { type: Boolean, default: true },
      resumeUrl: { type: String, default: "" },
    },
    seo: {
      pageTitle: { type: String, default: "Omojola Obaloluwa Favour — Full-Stack Developer & AI Automation Builder" },
      metaDescription: {
        type: String,
        default:
          "Full-Stack Web & Mobile Developer specializing in AI automation, product development, and scalable digital products.",
      },
      keywords: { type: String, default: "full-stack developer, AI automation, product builder, mobile developer" },
      ogImage: { url: { type: String, default: "" }, publicId: { type: String, default: "" } },
    },
    contact: {
      email: { type: String, default: "omojolaobaloluwa@gmail.com" },
      phone: { type: String, default: "+234 806 998 9705" },
      location: { type: String, default: "Nigeria" },
      availability: { type: String, default: "Open for new projects" },
      socials: {
        github: { type: String, default: "" },
        linkedin: { type: String, default: "" },
        whatsapp: { type: String, default: "" },
        telegram: { type: String, default: "" },
        email: { type: String, default: "omojolaobaloluwa@gmail.com" },
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", settingsSchema);
