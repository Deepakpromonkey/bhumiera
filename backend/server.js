import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import bcrypt from "bcryptjs";


import propertyRoutes from "./routes/propertyRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import mapLayerRoutes from "./routes/mapLayerRoutes.js";
import User from "./models/User.js";
import { log } from "./logger.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  log("==========================");
  log("Request:", req.method, req.originalUrl);
  log("Body:", req.body);
  log("Mongo ReadyState:", mongoose.connection.readyState);
  next();
});

// Static Folder
if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}
app.use("/uploads", express.static("uploads"));

// Health check - always available, doesn't depend on Mongo being up
app.get("/ping", (req, res) => {
  res.json({
    status: "ok",
    mongo: mongoose.connection.readyState, // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    db: mongoose.connection.name || null,
    time: new Date().toISOString()
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/map-layers", mapLayerRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  log("Unhandled Error:", err.message);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// Mongo Events
mongoose.connection.on("connecting", () => log("🟡 Mongo Connecting"));
mongoose.connection.on("connected", () => log("🟢 Mongo Connected"));
mongoose.connection.on("open", () => log("✅ Mongo Open"));
mongoose.connection.on("error", err => log("🔴 Mongo Error:", err.message));
mongoose.connection.on("disconnected", () => log("⚫ Mongo Disconnected"));

// Seed Admin
const seedAdmin = async () => {
  try {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      log("Skipping admin seed: ADMIN_EMAIL/ADMIN_PASSWORD not set");
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL.toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;

    const existing = await User.findOne({ email: adminEmail });

    if (existing) {
      log("Admin already exists");
      return;
    }

    const hash = await bcrypt.hash(adminPassword, 10);

    await User.create({
      email: adminEmail,
      password: hash
    });

    log("Admin Seeded");
  } catch (err) {
    log("Seed Error:", err.message);
  }
};

// Start Server
const startServer = async () => {
  // Start listening immediately so /ping and other routes are reachable
  // even if Mongo is slow or fails to connect.
  app.listen(PORT, () => {
    log(`Server Running on ${PORT}`);
  });

  try {
    log("Connecting to Mongo...");

    await mongoose.connect(process.env.MONGO_URI);

    log("Mongo ReadyState:", mongoose.connection.readyState);
    log("Database:", mongoose.connection.name);

    await seedAdmin();

  } catch (err) {
    log("Mongo Startup Error:", err.message);
  }
}; 

startServer();