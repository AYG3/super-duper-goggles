import express from "express";
import { getUserStats } from "../controllers/stats.controller.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

// All stats routes require authentication
router.use(protect);

// Get user statistics
router.get("/user", getUserStats);

export default router;
