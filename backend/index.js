import express from "express";
import db from "./config/Database.js";
import UserRoute from "./routes/UserRoute.js";
import AuthRoute from "./routes/AuthRoute.js";
import BarangRoute from "./routes/BarangRoute.js";
import TransaksiRoute from "./routes/TransaksiRoute.js";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware - Order is important!
app.use(
  cors({
    origin: process.env._CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// For JSON and URL-encoded data (non-multipart)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files - Images will be accessible via /images/... URLs
app.use("/images", express.static(path.join(__dirname, "public/images")));
app.use("/public", express.static(path.join(__dirname, "public")));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Create public/images directory if it doesn't exist
const publicDir = path.join(__dirname, "public");
const imagesDir = path.join(publicDir, "images");
const productsDir = path.join(imagesDir, "products");
const profilesDir = path.join(imagesDir, "profiles");

[publicDir, imagesDir, productsDir, profilesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Routes
app.use("/auth", AuthRoute);
app.use("/api", UserRoute);
app.use("/api", BarangRoute);
app.use("/api", TransaksiRoute);

// Test route to check if server is running
app.get("/api-status", (req, res) => {
  res.json({ status: "Server is running", timestamp: new Date() });
});

// Add route to test image access
app.get("/test-static", (req, res) => {
  res.send(`
    <h1>Static File Test</h1>
    <h2>Upload Directories:</h2>
    <ul>
      <li>Uploads Root: ${path.join(__dirname, "uploads")}</li>
      <li>Products: ${path.join(__dirname, "uploads/products")}</li>
      <li>Profiles: ${path.join(__dirname, "uploads/profiles")}</li>
    </ul>
    <h2>Uploads Directory Content:</h2>
    <pre>${JSON.stringify(
      fs.readdirSync(path.join(__dirname, "uploads")),
      null,
      2
    )}</pre>
    <h2>Products Directory Content:</h2>
    <pre>${
      fs.existsSync(path.join(__dirname, "uploads/products"))
        ? JSON.stringify(
            fs.readdirSync(path.join(__dirname, "uploads/products")),
            null,
            2
          )
        : "Directory does not exist"
    }</pre>
    <h2>Profiles Directory Content:</h2>
    <pre>${
      fs.existsSync(path.join(__dirname, "uploads/profiles"))
        ? JSON.stringify(
            fs.readdirSync(path.join(__dirname, "uploads/profiles")),
            null,
            2
          )
        : "Directory does not exist"
    }</pre>
  `);
});

const startServer = async () => {
  try {
    await db.authenticate();
    console.log("Database connection established.");

    await db.sync({ alter: true });
    console.log("Database synchronized.");

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
