import express from "express";
import { getUsers, createUser, updateUser, deleteUser, getMyProfile, updateMyProfile, getAllUsers, deleteUserById, deleteAccount } from "../controllers/UserController.js";
import { verifyToken } from "../middleware/AuthMiddleware.js";

const router = express.Router();

// Public routes
router.get("/users", getUsers);
router.post("/users", createUser);
router.put("/users/:user_id", updateUser);
router.delete("/users/:user_id", deleteUser);

// Protected routes
router.get("/profile", verifyToken, getMyProfile);
router.put("/profile", verifyToken, updateMyProfile);
router.delete("/deleteAccount", verifyToken, deleteAccount);

// Admin routes (if needed)
router.get("/admin/users", verifyToken, getAllUsers);
router.delete("/admin/users/:user_id", verifyToken, deleteUserById);

export default router;
