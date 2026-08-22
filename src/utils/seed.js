import "dotenv/config";
import mongoose from "mongoose";
import slugify from "slugify";
import { connectDB } from "../config/db.js";
import Admin from "../models/Admin.js";
import Project from "../models/Project.js";
import Gallery from "../models/Gallery.js";
import Skill from "../models/Skill.js";
import Experience from "../models/Experience.js";
import Service from "../models/Service.js";
import About from "../models/About.js";
import Settings from "../models/Settings.js";

// Seeds the database with the admin account and the sample content
// described in the project brief. Images are left blank on purpose —
// the frontend renders a designed placeholder mockup until real
// screenshots are uploaded through the admin panel. Safe to re-run:
// it upserts everything by a natural key instead of duplicating.
const run = async () => {
  await connectDB();

  // ---- Admin account -------------------------------------------------
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const existingAdmin = await Admin.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await Admin.create({
      name: process.env.SEED_ADMIN_NAME || "Portfolio Admin",
      email: adminEmail,
      passwordHash: await Admin.hashPassword(process.env.SEED_ADMIN_PASSWORD || "change-me-123"),
      title: "Full-Stack Developer",
      shortBio: "Full-Stack Developer, Mobile App Developer, AI Automation Developer, and Product Builder.",
    });
    console.log(`Created admin account: ${adminEmail}`);
  } else {
    console.log(`Admin account already exists: ${adminEmail}`);
  }

  // ---- Projects --------------------------------------------------------
  const projects = [
    {
      title: "TradeMind AI",
      shortDescription: "An AI-powered trading platform that analyzes markets and automates trading decisions.",
      description:
        "TradeMind AI ingests live market data, applies machine learning models to spot patterns, and executes or recommends trades automatically through a clean analytics dashboard.",
      category: ["AI", "Automation"],
      technologies: ["Python", "AI/ML", "React", "REST APIs"],
      features: ["Market analysis", "Automated trading", "Trading signals", "AI-powered analysis", "Trading automation", "Dashboard"],
      problem: "Retail traders struggle to monitor markets 24/7 and react fast enough to profitable signals.",
      solution: "An always-on AI engine that scans markets continuously and surfaces or executes high-confidence trades.",
      process: ["Research", "Planning", "UI/UX", "Development", "Testing", "Deployment"],
      results: "Reduced manual chart-watching time and delivered consistent, data-backed trade signals to users.",
      status: "Completed",
      featured: true,
      published: true,
      order: 0,
    },
    {
      title: "University Food Delivery Platform",
      shortDescription: "A full-stack food delivery ecosystem built for university students.",
      description:
        "A complete campus food delivery ecosystem with dedicated student, vendor, rider, admin, manager, and super admin dashboards, covering ordering through to delivery.",
      category: ["Web", "E-Commerce"],
      technologies: ["React", "Node.js", "Express", "MongoDB"],
      features: ["Student platform", "Vendor dashboard", "Rider dashboard", "Admin dashboard", "Manager dashboard", "Super Admin dashboard", "Order management", "Delivery management"],
      problem: "Students on campus had no reliable, centralized way to order food from multiple campus vendors.",
      solution: "A multi-role platform connecting students, vendors and riders with real-time order and delivery tracking.",
      process: ["Research", "Planning", "UI/UX", "Development", "Testing", "Deployment"],
      results: "Streamlined ordering across multiple vendors with clear role-based dashboards for every stakeholder.",
      status: "Completed",
      featured: true,
      published: true,
      order: 1,
    },
    {
      title: "Betting Recommendation Platform",
      shortDescription: "A betting recommendation platform with an admin system and Telegram automation.",
      description:
        "A subscription-based recommendation platform pairing a web admin system with a Telegram bot that links accounts and pushes automated notifications in real time.",
      category: ["Web", "Automation"],
      technologies: ["Node.js", "Telegram Bot API", "MongoDB", "React"],
      features: ["User accounts", "Recommendation system", "Admin dashboard", "Purchase system", "Telegram bot", "Telegram account linking", "Automated notifications", "Real-time updates"],
      problem: "Bettors wanted trustworthy, timely recommendations without manually checking a website.",
      solution: "A linked Telegram bot delivers purchased recommendations and updates directly to users in real time.",
      process: ["Research", "Planning", "UI/UX", "Development", "Testing", "Deployment"],
      results: "Automated delivery of recommendations increased engagement and cut manual admin follow-up.",
      status: "Completed",
      featured: true,
      published: true,
      order: 2,
    },
    {
      title: "Hand Tracking PC Controller",
      shortDescription: "A computer vision app that lets users control a PC using hand gestures.",
      description:
        "Uses real-time hand tracking and finger detection through a webcam feed to translate hand gestures into computer control actions.",
      category: ["AI"],
      technologies: ["Python", "OpenCV", "MediaPipe", "Computer Vision"],
      features: ["Hand tracking", "Finger detection", "Gesture recognition", "Camera interaction", "PC control"],
      problem: "Traditional input devices limit hands-free and gesture-based computer interaction.",
      solution: "A computer-vision pipeline that maps tracked hand landmarks to real-time PC control actions.",
      process: ["Research", "Planning", "Development", "Testing"],
      results: "Demonstrated reliable real-time gesture recognition for touchless computer control.",
      status: "Completed",
      featured: true,
      published: true,
      order: 3,
    },
    {
      title: "Worldwide Delivery Platform",
      shortDescription: "A logistics platform for transporting goods worldwide.",
      description: "A web platform coordinating the transport and delivery of goods across international routes.",
      category: ["Web", "E-Commerce"],
      technologies: ["React", "Node.js", "MongoDB"],
      features: ["Shipment tracking", "Logistics management", "Order management"],
      problem: "Coordinating cross-border goods transport needed a centralized, trackable system.",
      solution: "A logistics web platform for managing shipments and tracking goods end-to-end.",
      process: ["Research", "Planning", "UI/UX", "Development", "Deployment"],
      results: "Gave logistics operators a single platform to manage worldwide deliveries.",
      status: "Completed",
      featured: true,
      published: true,
      order: 4,
    },
    {
      title: "Jewelry E-Commerce Platform",
      shortDescription: "An e-commerce store for jewelry with booking and advertising features.",
      description: "A jewelry e-commerce storefront combining a product catalog, an ad system, and booking sessions for customer consultations.",
      category: ["E-Commerce"],
      technologies: ["React", "Node.js", "MongoDB"],
      features: ["Product catalog", "E-commerce", "Advertisement system", "Booking sessions", "Customer interaction"],
      problem: "Jewelry sellers needed both an online store and a way to book personal customer consultations.",
      solution: "A combined storefront and booking system with built-in advertisement placements.",
      process: ["Research", "Planning", "UI/UX", "Development", "Deployment"],
      results: "Unified sales and customer booking into a single jewelry e-commerce experience.",
      status: "Completed",
      featured: true,
      published: true,
      order: 5,
    },
    {
      title: "Mobile E-Commerce Application",
      shortDescription: "A cross-platform mobile shopping application.",
      description: "A mobile-first shopping app covering browsing, cart, checkout and order tracking.",
      category: ["Mobile", "E-Commerce"],
      technologies: ["React Native", "Firebase"],
      features: ["Product browsing", "Cart & checkout", "Order tracking"],
      problem: "Users wanted a fast, native-feeling shopping experience on mobile.",
      solution: "A cross-platform React Native app delivering a smooth mobile shopping flow.",
      process: ["Research", "Planning", "UI/UX", "Development", "Testing", "Deployment"],
      results: "Delivered a consistent shopping experience across iOS and Android from one codebase.",
      status: "Completed",
      featured: false,
      published: true,
      order: 6,
    },
  ];

  for (const p of projects) {
    const slug = slugify(p.title, { lower: true, strict: true });
    // eslint-disable-next-line no-await-in-loop
    await Project.findOneAndUpdate({ slug }, { ...p, slug }, { upsert: true, new: true, setDefaultsOnInsert: true });
  }
  console.log(`Seeded ${projects.length} projects.`);

  // ---- Skills ------------------------------------------------------------
  const skillGroups = {
    Frontend: ["HTML", "CSS", "JavaScript", "React", "Redux", "Next.js", "Vite.js", "Bootstrap"],
    Backend: ["Node.js", "Express", "PHP", "CakePHP", "Python"],
    Mobile: ["React Native", "Flutter"],
    Database: ["MongoDB", "MySQL", "Firebase"],
    "AI & Automation": ["AI Automation", "AI/ML", "Bot Automation", "Computer Vision", "Trading Automation"],
    Infrastructure: ["Web Hosting", "Mobile App Hosting", "Database Management", "Website Management", "Deployment"],
    Design: ["UI/UX", "Responsive Design", "Product Design"],
    Tools: ["Git", "GitHub"],
  };

  let skillOrder = 0;
  for (const [category, names] of Object.entries(skillGroups)) {
    // eslint-disable-next-line no-restricted-syntax
    for (const name of names) {
      // eslint-disable-next-line no-await-in-loop
      await Skill.findOneAndUpdate(
        { name, category },
        { name, category, order: skillOrder++, level: 85, visible: true },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }
  console.log("Seeded skills.");

  // ---- Experience ----------------------------------------------------
  const experiences = [
    {
      company: "Strictly Dev",
      position: "Product Developer & Solution Builder",
      startDate: "2023-01",
      current: true,
      responsibilities: [
        "Built and contributed to web and mobile applications",
        "Developed digital solutions for clients worldwide",
        "Worked on Pharmalliance",
        "Contributed to CBT examination software for PEP",
        "Worked with development teams",
        "Built product solutions for clients",
      ],
      technologies: ["React", "Node.js", "MongoDB"],
      order: 0,
    },
    {
      company: "Pharmalliance",
      position: "Product Manager",
      startDate: "2022-01",
      endDate: "2023-01",
      responsibilities: [
        "Managed product development and planning",
        "Coordinated between technical and product requirements",
        "Ensured successful delivery of product teams",
      ],
      technologies: [],
      order: 1,
    },
    {
      company: "Horbah's Tech",
      position: "Web Developer & Mobile App Developer",
      startDate: "2020-01",
      endDate: "2022-01",
      responsibilities: [
        "Full-stack development",
        "Mobile development",
        "Website development",
        "Hosting, deployment and maintenance",
        "Led and mentored a team of developers",
      ],
      technologies: ["React", "React Native", "Node.js"],
      order: 2,
    },
  ];

  for (const e of experiences) {
    // eslint-disable-next-line no-await-in-loop
    await Experience.findOneAndUpdate(
      { company: e.company, position: e.position },
      e,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log("Seeded experience.");

  // ---- Services --------------------------------------------------------
  const services = [
    { title: "Full-Stack Web Development", description: "Build scalable, responsive and modern web applications.", icon: "code", features: ["Custom web apps", "API development", "Performance optimization"], order: 0 },
    { title: "Mobile App Development", description: "Build cross-platform mobile applications.", icon: "smartphone", features: ["React Native apps", "Flutter apps", "App store deployment"], order: 1 },
    { title: "AI Automation", description: "Integrate AI into businesses and automate repetitive workflows.", icon: "brain", features: ["Workflow automation", "AI model integration", "Custom automation tools"], order: 2 },
    { title: "Bot Automation", description: "Build automated bots and communication systems.", icon: "bot", features: ["Telegram bots", "Notification systems", "Chat automation"], order: 3 },
    { title: "Web & App Hosting", description: "Deploy, host and maintain applications.", icon: "server", features: ["Deployment", "Uptime monitoring", "Maintenance"], order: 4 },
    { title: "Database Management", description: "Design, maintain and manage application databases.", icon: "database", features: ["Schema design", "Optimization", "Backups"], order: 5 },
    { title: "UI/UX Design", description: "Design intuitive and user-focused interfaces.", icon: "palette", features: ["Wireframing", "Prototyping", "Design systems"], order: 6 },
    { title: "Website Management", description: "Maintain, update and optimize existing websites.", icon: "settings", features: ["Content updates", "Security patches", "Performance audits"], order: 7 },
    { title: "Product Development", description: "Transform ideas into complete digital products.", icon: "rocket", features: ["Product strategy", "MVP development", "Iteration & scaling"], order: 8 },
  ];

  for (const s of services) {
    // eslint-disable-next-line no-await-in-loop
    await Service.findOneAndUpdate({ title: s.title }, s, { upsert: true, new: true, setDefaultsOnInsert: true });
  }
  console.log("Seeded services.");

  // ---- About -------------------------------------------------------------
  const bio =
    "I'm Omojola Obaloluwa Favour, a versatile Full-Stack Developer, Mobile App Developer, AI Automation Developer, and Product Builder. I specialize in transforming ideas into functional, scalable, and user-focused digital products. My experience spans web development, mobile application development, UI/UX, databases, hosting, AI automation, bot automation, and product management. I've worked on platforms ranging from e-commerce and food delivery systems to trading platforms, recommendation systems, automation tools, and computer-vision applications, and I have experience leading, mentoring, and managing developer teams.";

  await About.findOneAndUpdate(
    {},
    {
      headline: "Building Products, Not Just Websites.",
      biography: bio,
      professionalTitle: "Full-Stack Developer • AI Automation • Product Builder",
      location: "Nigeria",
      yearsOfExperience: 5,
      stats: [
        { label: "Projects Completed", value: "10+" },
        { label: "Full-Stack", value: "Development" },
        { label: "Web + Mobile", value: "Solutions" },
        { label: "AI & Automation", value: "Expertise" },
      ],
      timeline: [
        { label: "Development", year: "2018", icon: "rocket", order: 0 },
        { label: "Product Building", year: "2020", icon: "layout", order: 1 },
        { label: "Leadership", year: "2022", icon: "users", order: 2 },
        { label: "AI & Automation", year: "2024", icon: "cpu", order: 3 },
      ],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log("Seeded About content.");

  // ---- Settings ------------------------------------------------------
  await Settings.findOneAndUpdate({}, {}, { upsert: true, new: true, setDefaultsOnInsert: true });
  console.log("Ensured Settings document exists.");

  console.log("\nSeed complete.");
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
