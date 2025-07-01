import asyncHandler from "express-async-handler";
import Memo from "../models/Memo.js";
import MemoField from "../models/MemoField.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/email.js";
import { paraphraseText } from "../utils/paraphrase.js";

// Create and send memo
const createMemo = asyncHandler(async (req, res) => {
  const { recipients, department, content } = req.body;

  // Validate content against defined memo fields
  const fields = await MemoField.find();
  const contentKeys = Object.keys(content);
  for (const field of fields) {
    if (field.required && !contentKeys.includes(field.name)) {
      res.status(400);
      throw new Error(`Missing required field: ${field.name}`);
    }
  }

  // Validate recipients or department
  let recipientIds = [];
  if (recipients) {
    // Support both emails and IDs in recipients
    recipientIds = await Promise.all(
      recipients.map(async (recipient) => {
        if (typeof recipient === "string" && recipient.includes("@")) {
          const user = await User.findOne({ email: recipient });
          if (!user) {
            res.status(400);
            throw new Error(`Recipient email not found: ${recipient}`);
          }
          return user._id;
        }
        return recipient; // Assume it's already a user ID
      }),
    );
  } else if (department) {
    const users = await User.find({ department });
    recipientIds = users.map((user) => user._id);
  } else {
    res.status(400);
    throw new Error("Must specify recipients or department");
  }

  // Create status map for recipients
  const status = new Map();
  recipientIds.forEach((id) => {
    status.set(id.toString(), { status: "sent", timestamp: new Date() });
  });

  const memo = await Memo.create({
    sender: req.user._id,
    recipients: recipientIds,
    department,
    content,
    status,
  });

  // Send email notifications
  // const recipientUsers = await User.find({ _id: { $in: recipientIds } });
  // for (const user of recipientUsers) {
  //   await sendEmail({
  //     to: user.email,
  //     subject: "New Memo Received",
  //     text: `You have received a new memo from ${req.user.name}. Log in to view details.`,
  //   });
  // }

  res.status(201).json({
    success: true,
    data: memo,
    message: "Memo created successfully",
  });
});

// Get memos for user
const getMemos = asyncHandler(async (req, res) => {
  const memos = await Memo.find({
    $or: [
      { sender: req.user._id },
      { recipients: req.user._id },
      { department: req.user.department },
    ],
  })
    .populate("sender", "name email department")
    .populate("recipients", "name email department"); // Populate recipients with name, email, department

  res.json({
    success: true,
    data: memos,
    message: "Memos retrieved successfully",
  });
});

// Update memo status (e.g., read, acknowledged)
const updateMemoStatus = asyncHandler(async (req, res) => {
  const { memoId, status } = req.body;
  const memo = await Memo.findById(memoId);

  if (!memo) {
    res.status(404);
    throw new Error("Memo not found");
  }

  if (
    !memo.recipients.includes(req.user._id) &&
    memo.department !== req.user.department
  ) {
    res.status(403);
    throw new Error("Not authorized to update this memo");
  }

  memo.status.set(req.user._id.toString(), { status, timestamp: new Date() });
  memo.updatedAt = new Date();
  await memo.save();

  res.json({
    success: true,
    data: memo,
    message: "Memo status updated successfully",
  });
});

// Archive memo
const archiveMemo = asyncHandler(async (req, res) => {
  const { memoId } = req.params;
  const memo = await Memo.findById(memoId);

  if (!memo) {
    res.status(404);
    throw new Error("Memo not found");
  }

  if (
    memo.sender.toString() !== req.user._id.toString() &&
    req.user.role !== "Admin"
  ) {
    res.status(403);
    throw new Error("Not authorized to archive this memo");
  }

  memo.status.set("archived", { status: "archived", timestamp: new Date() });
  await memo.save();

  res.json({
    success: true,
    data: memo,
    message: "Memo archived successfully",
  });
});

// Update reply and approval for a memo (per recipient)
const updateMemoResponse = asyncHandler(async (req, res) => {
  const { memoId } = req.params;
  // Accept both 'approved' and 'approval' from request body
  const approved =
    req.body.approved !== undefined ? req.body.approved : req.body.approval;
  const { reply } = req.body;
  const userId = req.user._id.toString();

  const memo = await Memo.findById(memoId);
  if (!memo) {
    res.status(404);
    throw new Error("Memo not found");
  }

  // Check if user is a recipient
  if (!memo.recipients.map((id) => id.toString()).includes(userId)) {
    res.status(403);
    throw new Error("Not authorized to respond to this memo");
  }

  // Ensure responses is a Map
  if (!memo.responses || typeof memo.responses.set !== "function") {
    memo.responses = new Map();
  }

  // Update or create response for this user
  memo.responses.set(userId, {
    reply: reply || "",
    approved: approved === true,
    timestamp: new Date(),
  });
  memo.updatedAt = new Date();
  await memo.save();

  res.json({
    success: true,
    data: memo,
    message: "Response updated successfully",
  });
});

/**
 * Forward a memo to new recipients (simple approach: add to recipients array)
 * PUT /api/memos/:memoId/forward
 * Body: { recipients: [userId or email, ...] }
 */
const forwardMemo = asyncHandler(async (req, res) => {
  const { memoId } = req.params;
  const { recipients } = req.body;
  const userId = req.user._id;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    res.status(400);
    throw new Error("Recipients are required for forwarding");
  }

  const memo = await Memo.findById(memoId);
  if (!memo) {
    res.status(404);
    throw new Error("Memo not found");
  }

  // Only allow forwarding if user is a recipient or sender
  if (
    memo.sender.toString() !== userId.toString() &&
    !memo.recipients.map((id) => id.toString()).includes(userId.toString())
  ) {
    res.status(403);
    throw new Error("Not authorized to forward this memo");
  }

  // Resolve recipient IDs (support both emails and IDs)
  const newRecipientIds = await Promise.all(
    recipients.map(async (recipient) => {
      if (typeof recipient === "string" && recipient.includes("@")) {
        const user = await User.findOne({ email: recipient });
        if (!user) {
          res.status(400);
          throw new Error(`Recipient email not found: ${recipient}`);
        }
        return user._id;
      }
      return recipient;
    }),
  );

  // Add new recipients if not already present
  let added = 0;
  newRecipientIds.forEach((id) => {
    const idStr = id.toString();
    if (!memo.recipients.map((r) => r.toString()).includes(idStr)) {
      memo.recipients.push(id);
      memo.status.set(idStr, { status: "sent", timestamp: new Date() });
      added++;
    }
  });

  if (added === 0) {
    return res.status(200).json({
      success: true,
      message: "No new recipients were added (all already present)",
      data: memo,
    });
  }

  memo.updatedAt = new Date();
  await memo.save();

  res.status(200).json({
    success: true,
    message: `Memo forwarded to ${added} new recipient(s)`,
    data: memo,
  });
});

//AI Addition
const paraphraseMemoContent = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content || typeof content !== "string") {
    res.status(400);
    throw new Error("Content must be a string");
  }
  const rewritten = await paraphraseText(content);
  res.json({ success: true, rewritten });
});

export {
  createMemo,
  getMemos,
  updateMemoStatus,
  archiveMemo,
  updateMemoResponse,
  forwardMemo,
  paraphraseMemoContent
};