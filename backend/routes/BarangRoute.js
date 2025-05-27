import express from "express";
import {
  getBarang,
  getBarangById,
  createBarang,
  updateBarang,
  deleteBarang,
  getMyBarang
} from "../controllers/BarangController.js";
import { verifyToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

// Public routes
router.get("/barang", getBarang);
router.get("/barang/:item_id", getBarangById);

// Protected routes
router.post("/barang", verifyToken, createBarang);
router.put("/barang/:item_id", verifyToken, updateBarang);
router.delete("/barang/:item_id", verifyToken, deleteBarang);
router.get("/my-barang", verifyToken, getMyBarang);

export default router;