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

router.use(protect);
router.post("/", createMemo);
router.get("/", getMemos);
router.get("/:id", getMemoById);
router.put("/status", updateMemoStatus);
router.put("/archive/:memoId", archiveMemo);

export default router;
