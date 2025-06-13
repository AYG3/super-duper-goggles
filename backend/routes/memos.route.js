import express from "express";
import {
  createMemo,
  getMemos,
  getMemoById,
  updateMemoStatus,
  archiveMemo,
} from "../controllers/memo.controller.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

// All memo routes require authentication
router.use(protect);

// Memo CRUD operations
router.post("/", createMemo);
router.get("/", getMemos);
router.get("/:id", getMemoById);

// Memo status operations
router.put("/status", updateMemoStatus);
router.patch("/:memoId/status", updateMemoStatus);

// Archive operations
router.put("/archive/:memoId", archiveMemo);
router.patch("/:memoId/archive", archiveMemo);

export default router;
