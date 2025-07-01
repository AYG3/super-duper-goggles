import express from "express";
import {
  createMemo,
  getMemos,
  updateMemoStatus,
  archiveMemo,
  updateMemoResponse,
  forwardMemo,
} from "../controllers/memo.controller.js";
import { protect } from "../middlewares/auth.js";
import { validateMemoResponse } from "../middlewares/validate.js";
import { paraphraseMemoContent } from "../controllers/memo.controller.js";


const router = express.Router();

router.use(protect);
router.post("/", createMemo);
router.get("/", getMemos);
router.put("/status", updateMemoStatus);
router.put("/archive/:memoId", archiveMemo);
router.put("/:memoId/response", validateMemoResponse, updateMemoResponse);

// Forward memo to new recipients (simple approach)
router.put("/:memoId/forward", forwardMemo);

//AI-Paraphraser

router.post("/paraphrase", paraphraseMemoContent);
export default router;
