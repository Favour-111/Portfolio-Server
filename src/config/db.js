import dns from "dns";
import mongoose from "mongoose";

// Some networks (mobile hotspots, certain VPNs/routers) hand Node's DNS
// resolver a response it rejects with "querySrv EBADRESP" for the
// mongodb+srv:// SRV lookup, even though the OS resolver handles it fine.
// Pointing Node at public resolvers first works around it.
dns.setServers(["8.8.8.8", "1.1.1.1", ...dns.getServers()]);

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI in environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};
