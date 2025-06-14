import express from "express";
import {
  createMemo,
  getMemos,
  updateMemoStatus,
  archiveMemo,
  updateMemoResponse,
} from "../controllers/memo.controller.js";
import { protect } from "../middlewares/auth.js";
import { validateMemoResponse } from "../middlewares/validate.js";

const router = express.Router();

router.use(protect);
router.post("/", createMemo);
router.get("/", getMemos);
router.put("/status", updateMemoStatus);
router.put("/archive/:memoId", archiveMemo);
router.put("/:memoId/response", validateMemoResponse, updateMemoResponse);

export default router;