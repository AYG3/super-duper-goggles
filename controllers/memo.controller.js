import asyncHandler from "express-async-handler";
import Memo from "../models/Memo.js";
import MemoField from "../models/MemoField.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/email.js";

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
    recipientIds = recipients;
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
  const recipientUsers = await User.find({ _id: { $in: recipientIds } });
  for (const user of recipientUsers) {
    await sendEmail({
      to: user.email,
      subject: "New Memo Received",
      text: `You have received a new memo from ${req.user.name}. Log in to view details.`,
    });
  }

  res.status(201).json({
    success: true,
    data: memo,
    message: "Memo created successfully"
  });
});

// Get memos for user
const getMemos = asyncHandler(async (req, res) => {
  const memos = await Memo.find({
    $or: [{ recipients: req.user._id }, { department: req.user.department }],
  }).populate("sender", "name email");

  res.json({
    success: true,
    data: memos,
    message: "Memos retrieved successfully"
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
    message: "Memo status updated successfully"
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
    message: "Memo archived successfully"
  });
});

export { createMemo, getMemos, updateMemoStatus, archiveMemo };
