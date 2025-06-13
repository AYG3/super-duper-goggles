import express from "express";
import {
  createMemoField,
  getMemoFields,
} from "../controllers/field.controller.js";
import { protect, restrictTo } from "../middlewares/auth.js";

const router = express.Router();

// All field routes require authentication
router.use(protect);

// Create field (admin only)
router.post("/", restrictTo("Admin"), createMemoField);

// Get all fields (all authenticated users)
router.get("/", getMemoFields);

export default router;
