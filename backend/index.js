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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

// Middleware - Order is important!
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://givetzy-frontend-469569820136.us-central1.run.app",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/public", express.static(path.join(path.resolve(), "public")));

// Create public/images directory if it doesn't exist
const publicDir = path.join(__dirname, "public");
const imagesDir = path.join(publicDir, "images");

[publicDir, imagesDir].forEach((dir) => {
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

// Synchronize database and start server
(async () => {
  try {
    await db.sync(); // This will create tables if they don't exist
    console.log("Database synchronized successfully.");

    // Start the server only after successful synchronization
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Unable to synchronize the database:", error);
  }
})();

// Test route to check if server is running
app.get("/api-status", (req, res) => {
  res.json({ status: "Server is running", timestamp: new Date() });
});
