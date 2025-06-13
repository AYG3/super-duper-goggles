import express from "express";
import { registerUser, loginUser, registerPublicUser, getCurrentUser } from "../controllers/auth.controller.js";
import { protect, restrictTo } from "../middlewares/auth.js";

const router = express.Router();

// Public registration route (no authentication required)
router.post("/register", registerPublicUser);

// Admin-only user creation route (requires authentication)
router.post("/admin/register", protect, restrictTo("Admin"), registerUser);

// Login route (no authentication required)
router.post("/login", loginUser);

// Get current user (requires authentication)
router.get("/me", protect, getCurrentUser);

export default router;
